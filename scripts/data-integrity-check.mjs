import {
  buildGeneratedPackMetadata,
  fetchTableRows,
  findIntegrityIssues,
  getRequiredEnv,
} from './data-durability.mjs';

async function main() {
  const { supabaseUrl, supabaseKey, userId } = getRequiredEnv();
  const applications = await fetchTableRows({
    supabaseUrl,
    supabaseKey,
    table: 'applications',
    userId,
  });
  const issues = findIntegrityIssues({
    applications,
    generatedPackMetadata: buildGeneratedPackMetadata(applications),
  });

  console.log(JSON.stringify({
    checked_at: new Date().toISOString(),
    user_id: userId,
    issue_count: issues.length,
    issues,
  }, null, 2));

  if (issues.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
