import { createHuggingFaceProvider } from './providers/huggingfaceProvider.ts';
import { createMockProvider } from './providers/mockProvider.ts';
import { createNoAiProvider } from './providers/noAiProvider.ts';
import { createOpenRouterProvider } from './providers/openRouterProvider.ts';
import type { AiEnv, AiProvider, AiProviderMode } from './types.ts';

export interface AiRouter {
  resolveProvider(userProvider?: string | null): AiProvider;
}

export interface AiRouterConfig {
  env: AiEnv;
  fetchFn?: typeof fetch;
  providers?: Partial<Record<AiProviderMode, AiProvider>>;
}

const PROVIDER_MODES: AiProviderMode[] = ['none', 'mock', 'huggingface', 'openrouter'];

/** Converts untrusted provider text into a supported provider mode. */
export function normalizeProviderMode(value?: string | null): AiProviderMode | null {
  if (!value) return null;
  return PROVIDER_MODES.includes(value as AiProviderMode) ? (value as AiProviderMode) : null;
}

/** Checks whether a provider has the required credentials to run. */
function providerIsConfigured(mode: AiProviderMode, env: AiEnv): boolean {
  if (mode === 'none') return true;
  if (mode === 'mock') return true;
  if (mode === 'huggingface') return Boolean(env.HUGGINGFACE_API_KEY);
  if (mode === 'openrouter') return Boolean(env.OPENROUTER_API_KEY && env.JATA_AI_MODEL_DEFAULT);
  return false;
}

/** Creates a router that chooses user setting, environment default, then mock fallback. */
export function createAiRouter(config: AiRouterConfig): AiRouter {
  const env = config.env;
  const providers: Record<AiProviderMode, AiProvider> = {
    none: config.providers?.none || createNoAiProvider(),
    mock: config.providers?.mock || createMockProvider(),
    huggingface: config.providers?.huggingface || createHuggingFaceProvider(env, config.fetchFn),
    openrouter: config.providers?.openrouter || createOpenRouterProvider(env, config.fetchFn),
  };

  return {
    resolveProvider(userProvider?: string | null) {
      const preferred = normalizeProviderMode(userProvider) || normalizeProviderMode(env.JATA_AI_PROVIDER) || 'mock';

      if (providerIsConfigured(preferred, env)) {
        return providers[preferred];
      }

      return providers.mock;
    },
  };
}
