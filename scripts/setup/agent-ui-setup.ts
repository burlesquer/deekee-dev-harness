#!/usr/bin/env node
/**
 * dk-harness agent-ui Auto Setup v1.0.0
 *
 * Automatically configures 3D office connection:
 * 1. Auto-detect dk-harness-office path
 * 2. Set environment variables in ~/.claude/settings.json
 * 3. Register session-connect + tool-reporter hooks
 * 4. Verify setup
 *
 * Usage: node agent-ui-setup.mjs [--office-url URL] [--team-id ID] [--agent-name NAME] [--uninstall]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HOME: string = homedir();
const SETTINGS_PATH: string = join(HOME, '.claude', 'settings.json');
const CLOUD_URL = 'https://office.dk-harness.site';

// -- Parse CLI args --
const args: string[] = process.argv.slice(2);
const isUninstall: boolean = args.includes('--uninstall');
const getArg = (flag: string): string | null => {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
};

interface Settings {
  env?: Record<string, string>;
  hooks?: Record<string, HookEntry[]>;
  statusLine?: { command?: string };
  [key: string]: unknown;
}

interface HookEntry {
  matcher?: string;
  hooks?: Array<{ type: string; command: string; timeout: number }>;
}

// -- Find dk-harness-office --
function findOfficeDir(): string | null {
  // 0. Internalized copy bundled with dk-harness (preferred)
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) {
    const internal = join(pluginRoot, 'office');
    if (existsSync(join(internal, 'bin', 'agent-ui.mjs'))) return internal;
  }

  // 1. Direct path
  const direct = join(HOME, 'dk-harness-office');
  if (existsSync(join(direct, 'bin', 'agent-ui.mjs'))) return direct;

  // 2. Search in ~/Project
  const projectDir = join(HOME, 'Project');
  if (existsSync(projectDir)) {
    try {
      for (const entry of readdirSync(projectDir)) {
        const candidate = join(projectDir, entry);
        if (statSync(candidate).isDirectory()) {
          if (entry === 'dk-harness-office' || entry === 'dk-harness-office') {
            if (existsSync(join(candidate, 'bin', 'agent-ui.mjs'))) return candidate;
          }
          // One level deeper
          try {
            for (const sub of readdirSync(candidate)) {
              if (sub === 'dk-harness-office' || sub === 'dk-harness-office') {
                const subPath = join(candidate, sub);
                if (existsSync(join(subPath, 'bin', 'agent-ui.mjs'))) return subPath;
              }
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch {
      /* skip */
    }
  }

  return null;
}

// -- Read/write settings.json --
function readSettings(): Settings {
  if (!existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(settings: Settings): void {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

// -- Install --
function install(): void {
  console.log('━━━ dk-harness agent-ui Setup ━━━');
  console.log('');

  // 1. Find office directory
  const officeDir = findOfficeDir();
  if (officeDir) {
    console.log(`OK dk-harness-office: ${officeDir}`);
  } else {
    console.log('WARN bundled office not found -- configuring cloud mode.');
    console.log(
      '   The 3D office is bundled at <plugin>/office. Run its build there to enable local mode.',
    );
  }
  console.log('');

  // 2. Determine env values — always use cloud URL
  const officeUrl: string = getArg('--office-url') || CLOUD_URL;
  const teamId: string = getArg('--team-id') || 'default';
  const agentName: string = getArg('--agent-name') || process.env.USER || 'agent';

  console.log(`   DK_OFFICE_URL:  ${officeUrl}`);
  console.log(`   DK_TEAM_ID:     ${teamId}`);
  console.log(`   DK_AGENT_NAME:  ${agentName}`);
  console.log('');

  // 3. Update settings.json
  const settings = readSettings();

  // Set env vars
  if (!settings.env) settings.env = {};
  settings.env.DK_OFFICE_URL = officeUrl;
  settings.env.DK_TEAM_ID = teamId;
  settings.env.DK_AGENT_NAME = agentName;

  // Add hooks (only if office dir exists for local hooks)
  if (officeDir) {
    if (!settings.hooks) settings.hooks = {};

    const hookScripts: Record<string, { matcher: string; script: string }> = {
      SessionStart: {
        matcher: 'startup',
        script: join(officeDir, 'scripts', 'hooks', 'session-connect.mjs'),
      },
      PreToolUse: {
        matcher: '',
        script: join(officeDir, 'scripts', 'hooks', 'tool-reporter.mjs'),
      },
      PostToolUse: {
        matcher: '',
        script: join(officeDir, 'scripts', 'hooks', 'tool-done-reporter.mjs'),
      },
    };

    for (const [event, config] of Object.entries(hookScripts)) {
      if (!settings.hooks[event]) settings.hooks[event] = [];

      // Check if already registered
      const alreadyExists = settings.hooks[event].some((entry: HookEntry) =>
        entry.hooks?.some((h) => h.command?.includes(config.script)),
      );

      if (!alreadyExists) {
        const hookEntry: HookEntry = {
          hooks: [
            {
              type: 'command',
              command: `node "${config.script}"`,
              timeout: 5000,
            },
          ],
        };
        if (config.matcher) hookEntry.matcher = config.matcher;
        settings.hooks[event].push(hookEntry);
        console.log(`OK Hook registered: ${event} -> ${config.script.split('/').pop()}`);
      } else {
        console.log(`OK Hook already registered: ${event}`);
      }
    }
  } else {
    console.log('INFO Local hook registration skipped (dk-harness-office not installed)');
    console.log('   Cloud mode works without hooks -- connect via browser directly.');
  }

  console.log('');

  // 4. Write settings
  writeSettings(settings);
  console.log(`OK Settings saved: ${SETTINGS_PATH}`);
  console.log('');

  // 5. Summary
  console.log('━━━ Setup Complete ━━━');
  console.log('');
  if (officeDir) {
    console.log('  3D office will auto-connect from next session.');
    console.log('  /dk-harness agent-ui          -- open in browser');
    console.log('  /dk-harness agent-ui --status -- connection diagnostics');
  } else {
    console.log('  Cloud mode configured.');
    console.log(`  Open ${CLOUD_URL} in your browser.`);
  }
  console.log('');
}

// -- Uninstall --
function uninstall(): void {
  console.log('━━━ dk-harness agent-ui Uninstall ━━━');
  console.log('');

  const settings = readSettings();

  // Remove env vars
  if (settings.env) {
    delete settings.env.DK_OFFICE_URL;
    delete settings.env.DK_TEAM_ID;
    delete settings.env.DK_AGENT_NAME;
    if (Object.keys(settings.env).length === 0) delete settings.env;
    console.log('OK Environment variables removed');
  }

  // Remove hooks containing agent-ui related scripts
  if (settings.hooks) {
    for (const event of ['SessionStart', 'PreToolUse', 'PostToolUse']) {
      if (settings.hooks[event]) {
        const before = settings.hooks[event].length;
        settings.hooks[event] = settings.hooks[event].filter(
          (entry: HookEntry) =>
            !entry.hooks?.some(
              (h) =>
                h.command?.includes('session-connect.mjs') ||
                h.command?.includes('tool-reporter.mjs') ||
                h.command?.includes('tool-done-reporter.mjs'),
            ),
        );
        const removed = before - settings.hooks[event].length;
        if (removed > 0) console.log(`OK Hook removed: ${event} (${removed})`);
        if (settings.hooks[event].length === 0) delete settings.hooks[event];
      }
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  }

  writeSettings(settings);
  console.log(`OK Settings saved: ${SETTINGS_PATH}`);
  console.log('');
  console.log('3D office connection removed.');
  console.log('');
}

// -- Main --
if (isUninstall) {
  uninstall();
} else {
  install();
}
