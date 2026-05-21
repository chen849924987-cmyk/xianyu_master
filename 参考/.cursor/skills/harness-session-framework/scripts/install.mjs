#!/usr/bin/env node
/**
 * Harness Framework Installer
 * Copies harness scaffolding to a new project
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdir, cp, writeFile, readFile, access, constants } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_HARNESS = resolve(__dirname, '../../../harness');

async function detectPackageManager(targetDir) {
  try {
    await access(join(targetDir, 'package-lock.json'), constants.F_OK);
    return 'npm';
  } catch {
    try {
      await access(join(targetDir, 'yarn.lock'), constants.F_OK);
      return 'yarn';
    } catch {
      try {
        await access(join(targetDir, 'pnpm-lock.yaml'), constants.F_OK);
        return 'pnpm';
      } catch {
        return 'npm'; // default
      }
    }
  }
}

async function copyHarnessFiles(targetDir) {
  const targetHarness = join(targetDir, 'harness');

  // Copy entire harness directory
  await cp(SOURCE_HARNESS, targetHarness, { recursive: true, force: true });

  console.log(`✓ Copied harness/ to ${targetHarness}`);
  return targetHarness;
}

async function setupCursorHooks(targetDir) {
  const cursorDir = join(targetDir, '.cursor');
  const hooksFile = join(cursorDir, 'hooks.json');

  await mkdir(cursorDir, { recursive: true });

  const hooksConfig = {
    "version": 1,
    "hooks": {
      "beforeSubmitPrompt": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs beforeSubmitPrompt harness/hooks/prompt-session-end.mjs",
          "timeout": 120
        }
      ],
      "sessionStart": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs sessionStart harness/hooks/session-start-context.mjs",
          "timeout": 30
        }
      ],
      "afterAgentResponse": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs afterAgentResponse harness/hooks/after-agent-response.mjs",
          "timeout": 30
        }
      ],
      "stop": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs stop harness/hooks/agent-stop.mjs",
          "timeout": 120,
          "loop_limit": 5
        }
      ],
      "beforeShellExecution": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs beforeShellExecution harness/hooks/before-shell-safety.mjs",
          "timeout": 30
        }
      ],
      "preToolUse": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs preToolUse harness/hooks/pre-tool-safety.mjs",
          "timeout": 30,
          "matcher": "Shell"
        }
      ],
      "afterFileEdit": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs afterFileEdit harness/hooks/after-file-standards.mjs",
          "matcher": "Write|StrReplace",
          "timeout": 60
        },
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs afterFileEdit harness/hooks/after-file-verify.mjs",
          "matcher": "Write",
          "timeout": 300
        },
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs afterFileEdit harness/hooks/after-file-readme-features.mjs",
          "matcher": "Write",
          "timeout": 60
        }
      ],
      "postToolUse": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUse harness/hooks/post-tool-runtime.mjs",
          "timeout": 15
        }
      ],
      "postToolUseFailure": [
        {
          "command": "node --import ./harness/lib/load-harness-env.mjs harness/lib/run-hook.mjs postToolUseFailure harness/hooks/post-tool-failure-runtime.mjs",
          "timeout": 15
        }
      ]
    }
  };

  await writeFile(hooksFile, JSON.stringify(hooksConfig, null, 2));
  console.log(`✓ Created .cursor/hooks.json`);
}

async function updatePackageJson(targetDir, pm) {
  const pkgFile = join(targetDir, 'package.json');

  try {
    const pkg = JSON.parse(await readFile(pkgFile, 'utf-8'));

    pkg.scripts = pkg.scripts || {};
    pkg.scripts['harness:end'] = 'node harness/cli/end-session.mjs';
    pkg.scripts['harness:end:full'] = 'HARNESS_HANDOFF_FULL=1 node harness/cli/end-session.mjs';
    pkg.scripts['post-commit:run'] = 'node harness/git/run-post-commit.mjs';

    // Add git hook if husky or simple-git-hooks is present
    if (pkg.devDependencies?.['husky'] || pkg.devDependencies?.['simple-git-hooks']) {
      pkg['simple-git-hooks'] = pkg['simple-git-hooks'] || {};
      pkg['simple-git-hooks']['post-commit'] = 'node harness/git/run-post-commit.mjs';
    }

    await writeFile(pkgFile, JSON.stringify(pkg, null, 2));
    console.log(`✓ Updated package.json with harness scripts`);
  } catch (err) {
    console.log(`! No package.json found, skipping script updates`);
  }
}

async function createDataDir(targetDir) {
  const dataDir = join(targetDir, '.data');
  await mkdir(dataDir, { recursive: true });

  // Create .gitignore for .data
  const gitignoreFile = join(targetDir, '.gitignore');
  let gitignore = '';

  try {
    gitignore = await readFile(gitignoreFile, 'utf-8');
  } catch {
    // File doesn't exist, will create
  }

  if (!gitignore.includes('.data/')) {
    gitignore += '\n# Harness runtime data\n.data/\n';
    await writeFile(gitignoreFile, gitignore);
    console.log(`✓ Updated .gitignore with .data/`);
  }
}

async function createInitialFiles(targetDir) {
  const now = new Date().toISOString();
  const nowLocal = new Date().toLocaleString('zh-CN');

  // Create HANDOFF.json
  const handoff = {
    version: 1,
    schema: 'project-handoff',
    handoff_tier: 'fast',
    updated_at: now,
    updated_at_local: nowLocal,
    conversation_id: null,
    git: {
      head: '',
      head_short: '',
      anchor_before: ''
    },
    todolist: {
      task_ids_in_prompt: [],
      updated: [],
      skipped: []
    },
    files_touched: [],
    next_suggested: [
      'Read harness/README.md for full documentation',
      'Edit harness/harness.env to customize defaults',
      'Run npm run harness:end to test handoff'
    ],
    git_digest_markdown: '#### Initial harness setup\n\nFramework installed.\n'
  };

  await writeFile(join(targetDir, 'HANDOFF.json'), JSON.stringify(handoff, null, 2));
  console.log(`✓ Created HANDOFF.json`);

  // Create AGENT_TASK_PROTOCOL.md
  const protocol = `# Agent Task Protocol

> Hot state for current session. **Do not index in RAG.**

<!-- harness:intent:start -->

## Current Feature

Initial setup - harness framework installed.

## Completed

- [x] Installed harness framework

## Next Steps

1. Customize harness/harness.env for project needs
2. Test session handoff with \\`npm run harness:end\\`
3. Begin actual feature work

## Blocked

None

## Notes

<!-- harness:intent:end -->

---

## Commit Log (Auto-generated)

<!-- harness:commit-log:start -->
<!-- harness:commit-log:end -->

## Commit Details (Auto-generated)

<!-- harness:commit-detail:start -->
<!-- harness:commit-detail:end -->

## Last Handoff (Auto-generated)

<!-- harness:last-handoff:start -->
*No handoff recorded yet.*
<!-- harness:last-handoff:end -->
`;

  await writeFile(join(targetDir, 'AGENT_TASK_PROTOCOL.md'), protocol);
  console.log(`✓ Created AGENT_TASK_PROTOCOL.md`);
}

async function main() {
  const targetDir = resolve(process.argv[2] || '.');

  console.log(`\n🚀 Installing Harness Framework to: ${targetDir}\n`);

  try {
    const pm = await detectPackageManager(targetDir);
    console.log(`Detected package manager: ${pm}\n`);

    await copyHarnessFiles(targetDir);
    await setupCursorHooks(targetDir);
    await updatePackageJson(targetDir, pm);
    await createDataDir(targetDir);
    await createInitialFiles(targetDir);

    console.log(`\n✅ Harness Framework installed successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  1. Review and customize: harness/harness.env`);
    console.log(`  2. Run: ${pm} run harness:end (to test)`);
    console.log(`  3. Read: harness/README.md (for full docs)`);
    console.log(`\n`);
  } catch (err) {
    console.error(`\n❌ Installation failed:`, err.message);
    process.exit(1);
  }
}

main();
