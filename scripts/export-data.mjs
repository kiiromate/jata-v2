import {
  buildExportBundle,
  defaultExportDir,
  fetchOptionalTableRows,
  fetchTableRows,
  getRequiredEnv,
  writeExportFiles,
} from './data-durability.mjs';

async function main() {
  const exportedAt = new Date().toISOString();
  const { supabaseUrl, supabaseKey, userId } = getRequiredEnv();
  const exportDir = process.env.JATA_EXPORT_DIR || defaultExportDir(exportedAt);

  const applications = await fetchTableRows({
    supabaseUrl,
    supabaseKey,
    table: 'applications',
    userId,
  });
  const resumes = await fetchTableRows({
    supabaseUrl,
    supabaseKey,
    table: 'resumes',
    userId,
    select: 'id,user_id,filename,content,created_at,updated_at',
  });
  const aiOutputs = await fetchOptionalTableRows({
    supabaseUrl,
    supabaseKey,
    table: 'ai_outputs',
    userId,
  });

  const bundle = buildExportBundle({
    userId,
    exportedAt,
    applications,
    resumes,
    aiOutputs: aiOutputs.rows,
  });
  const files = await writeExportFiles(exportDir, bundle);

  console.log(`Exported JATA backup for user ${userId} to ${exportDir}`);
  for (const file of files) console.log(`- ${file}`);
  if (aiOutputs.warning) {
    console.warn(`AI output metadata skipped: ${aiOutputs.warning}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
