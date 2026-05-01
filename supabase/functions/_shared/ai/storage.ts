import type { AiOutputPayload, AiProviderMode, AiTaskType } from './types.ts';

export interface AiOutputLogRecord {
  userId: string;
  provider: AiProviderMode;
  model: string;
  taskType: AiTaskType;
  inputHash: string;
  outputHash: string | null;
  promptCharCount: number;
  responseCharCount: number;
  latencyMs: number;
  status: 'success' | 'failed' | 'blocked';
  errorMessage?: string | null;
  outputPayload?: AiOutputPayload | null;
}

export interface AiUsageStore {
  findCachedOutput(userId: string, taskType: AiTaskType, inputHash: string): Promise<AiOutputPayload | null>;
  countUserOutputs(userId: string, sinceIso: string): Promise<number>;
  countRecentFailures(userId: string, sinceIso: string): Promise<number>;
  logOutput(record: AiOutputLogRecord): Promise<void>;
}

export interface CreditEntitlement {
  allowed: boolean;
  enabled: boolean;
  reason?: string;
}

export interface AiCreditsStore {
  checkEntitlement(userId: string): Promise<CreditEntitlement>;
  deductAfterSuccess(userId: string, taskType: AiTaskType): Promise<void>;
}

type SupabaseLike = {
  from(table: string): any;
};

/** Identifies missing optional credit tables without blocking the MVP. */
function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message || '';
  return error?.code === '42P01' || message.includes('does not exist') || message.includes('schema cache');
}

/** Creates an ai_outputs-backed usage store. */
export function createSupabaseUsageStore(supabase: SupabaseLike): AiUsageStore {
  return {
    async findCachedOutput(userId, taskType, inputHash) {
      const { data, error } = await supabase
        .from('ai_outputs')
        .select('output_payload')
        .eq('user_id', userId)
        .eq('task_type', taskType)
        .eq('input_hash', inputHash)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`AI cache lookup failed: ${error.message}`);
      return (data?.output_payload as AiOutputPayload | null) || null;
    },
    async countUserOutputs(userId, sinceIso) {
      const { count, error } = await supabase
        .from('ai_outputs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sinceIso);

      if (error) throw new Error(`AI usage count failed: ${error.message}`);
      return count || 0;
    },
    async countRecentFailures(userId, sinceIso) {
      const { count, error } = await supabase
        .from('ai_outputs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'failed')
        .gte('created_at', sinceIso);

      if (error) throw new Error(`AI failure count failed: ${error.message}`);
      return count || 0;
    },
    async logOutput(record) {
      const { error } = await supabase.from('ai_outputs').insert({
        user_id: record.userId,
        provider: record.provider,
        model: record.model,
        task_type: record.taskType,
        input_hash: record.inputHash,
        output_hash: record.outputHash,
        prompt_char_count: record.promptCharCount,
        response_char_count: record.responseCharCount,
        latency_ms: record.latencyMs,
        status: record.status,
        error_message: record.errorMessage || null,
        output_payload: record.outputPayload || null,
      });

      if (error) throw new Error(`AI output log failed: ${error.message}`);
    },
  };
}

/** Creates credit helpers that no-op when future credit tables are absent. */
export function createSupabaseCreditsStore(supabase: SupabaseLike): AiCreditsStore {
  return {
    async checkEntitlement(userId) {
      const { data, error } = await supabase
        .from('ai_credits')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (isMissingTableError(error)) {
        return { allowed: true, enabled: false, reason: 'Credit tables are not installed.' };
      }

      if (error) {
        throw new Error(`Credit entitlement check failed: ${error.message}`);
      }

      if (!data) {
        return { allowed: false, enabled: true, reason: 'No AI credit balance found.' };
      }

      return {
        allowed: Number(data.balance || 0) > 0,
        enabled: true,
        reason: Number(data.balance || 0) > 0 ? undefined : 'AI credit balance is empty.',
      };
    },
    async deductAfterSuccess(userId, taskType) {
      const { data, error } = await supabase
        .from('ai_credits')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (isMissingTableError(error) || !data) return;
      if (error) throw new Error(`Credit balance lookup failed: ${error.message}`);

      const nextBalance = Math.max(0, Number(data.balance || 0) - 1);
      const { error: updateError } = await supabase
        .from('ai_credits')
        .update({ balance: nextBalance })
        .eq('user_id', userId);

      if (updateError) throw new Error(`Credit deduction failed: ${updateError.message}`);

      const { error: transactionError } = await supabase.from('ai_credit_transactions').insert({
        user_id: userId,
        task_type: taskType,
        amount: -1,
        reason: 'ai_output_success',
      });

      if (transactionError && !isMissingTableError(transactionError)) {
        throw new Error(`Credit transaction insert failed: ${transactionError.message}`);
      }
    },
  };
}

/** Creates a disabled credits store for tests or offline use. */
export function createNoopCreditsStore(): AiCreditsStore {
  return {
    async checkEntitlement() {
      return { allowed: true, enabled: false };
    },
    async deductAfterSuccess() {
      return undefined;
    },
  };
}
