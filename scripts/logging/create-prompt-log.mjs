#!/usr/bin/env node
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

function printHelp() {
  console.log(`Usage: node scripts/logging/create-prompt-log.mjs --id <prompt-id> [options]

Options:
  --id <prompt-id>           Prompt identifier (e.g. prompt-0001)
  --epoch <epoch-id>         Epoch identifier to record in the log front-matter
  --status <status>          Completion status summary (default: pending)
  --summary <text>           One-line summary of the work performed
  --pr <number>              Pull request number
  --branch <name>            Branch name associated with the work
  --output <path>            Destination directory (default: docs/LOGS/PROMPTS)
  --force                    Overwrite an existing log file if it already exists
  --help                     Display this message
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    if (key === '--help') {
      args.help = true;
      continue;
    }
    if (key === '--force') {
      args.force = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Expected value after ${key}`);
    }
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

try {
  const args = parseArgs(process.argv);
  if (args.help || !args.id) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const issuedAt = new Date().toISOString().replace(/\..+/, 'Z');
  const fileName = `${issuedAt}-${args.id}.md`;
  const outputDir = resolve(process.cwd(), args.output ?? 'docs/LOGS/PROMPTS');
  const filePath = resolve(outputDir, fileName);

  if (existsSync(filePath) && !args.force) {
    console.error(`Log already exists at ${filePath}. Use --force to overwrite.`);
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(dirname(filePath), { recursive: true });

  const frontMatter = [
    '---',
    `id: ${args.id}`,
    `epoch: ${args.epoch ?? ''}`,
    `issued_at: ${issuedAt}`,
    `accepted_at: null`,
    `completed_at: null`,
    `status: ${args.status ?? 'pending'}`,
    `branch: ${args.branch ?? ''}`,
    `pr: ${args.pr ?? ''}`,
    'validation_checks: []',
    '---',
    '',
    (args.summary ?? '## Summary\n- _Fill in details about the change._'),
    '',
    '## Notes',
    '- Follow-up actions:',
    '  - ',
    '',
    '## Validation',
    '- command: TODO',
    '  outcome: pending',
    '  notes: ""',
    '',
  ].join('\n');

  writeFileSync(filePath, frontMatter, { encoding: 'utf8' });
  console.log(`Created prompt log scaffold at ${filePath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
