/**
 * CI gate for one project (api, chromium, firefox or webkit) after its shards have run.
 *
 * The shard jobs only upload blob reports. The "Tests (<project>)" job merges them into one
 * JSON report and runs this script, which fails the job when:
 *   1. a shard is missing (it crashed or was cancelled before uploading its blob report), or
 *   2. any test failed on every attempt ("unexpected" in Playwright's JSON stats).
 * A test that passed on a retry counts as flaky, not failed, exactly as in an unsharded run.
 *
 * Usage (Node 24 runs TypeScript files directly):
 *   node src/ci/check-merged-results.mts <blob-report-dir> <expected-shards> <results.json>
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';

/** The part of Playwright's JSON report this script reads. */
interface JsonReportStats {
  expected: number;
  unexpected: number;
  flaky: number;
  skipped: number;
}

const [blobDir, expectedShardsText, resultsFile] = process.argv.slice(2);
if (!blobDir || !expectedShardsText || !resultsFile) {
  console.error('usage: check-merged-results.mts <blob-report-dir> <expected-shards> <results.json>');
  process.exit(2);
}

const problems: string[] = [];

// 1. Every shard uploaded a blob report (one .zip per shard).
const expectedShards = Number(expectedShardsText);
const blobs = existsSync(blobDir) ? readdirSync(blobDir).filter((name) => name.endsWith('.zip')) : [];
console.log(`blob reports: ${blobs.length} of ${expectedShards} (${blobs.join(', ') || 'none'})`);
if (blobs.length !== expectedShards) {
  problems.push(`expected ${expectedShards} blob reports, found ${blobs.length}: a shard did not finish`);
}

// 2. No test failed. Without any blob report there is no results file either.
if (existsSync(resultsFile)) {
  const { stats } = JSON.parse(readFileSync(resultsFile, 'utf8')) as { stats: JsonReportStats };
  console.log(
    `tests: ${stats.expected} passed, ${stats.flaky} flaky, ${stats.skipped} skipped, ${stats.unexpected} failed`,
  );
  if (stats.unexpected > 0) {
    problems.push(`${stats.unexpected} test(s) failed (details in the merged HTML report)`);
  }
} else {
  problems.push(`no merged results at ${resultsFile}`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`FAILED: ${problem}`);
  process.exit(1);
}
console.log('OK: all shards finished and no test failed');
