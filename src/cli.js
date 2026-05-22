#!/usr/bin/env node

import { basename } from "path";
import { ensureConfig } from "./config.js";
import { registerCursorHooks, unregisterCursorHooks, hasCursorHooks } from "./cursor-hooks.js";
import { registerClaudeHooks, unregisterClaudeHooks, hasClaudeHooks } from "./claude-hooks.js";
import { sendNotification } from "./notify.js";
import { hookCommand } from "./hook.js";

const HELP = `
cursor-notify — OS notifications for Cursor agent events

Commands:
  install            Register hooks in ~/.cursor/hooks.json
  uninstall          Remove hooks from ~/.cursor/hooks.json
  install-claude     Register hooks in ~/.claude/settings.json
  uninstall-claude   Remove hooks from ~/.claude/settings.json
  status             Show installation status
  test               Send a test notification
  hook               (internal) Process a hook event from stdin
  help               Show this help message
`.trim();

function resolveHookCommand() {
  const argv0 = process.argv[1] || "";
  if (argv0.includes("node_modules/.bin") || argv0.endsWith("/cursor-notify")) {
    return "cursor-notify hook";
  }
  return `node ${argv0} hook`;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "install": {
      ensureConfig();
      const cmd = resolveHookCommand();
      const count = registerCursorHooks(cmd);
      console.log(`Registered ${count} hook events in ~/.cursor/hooks.json`);
      console.log(`Hook command: ${cmd}`);
      break;
    }

    case "uninstall": {
      const removed = unregisterCursorHooks();
      if (removed > 0) {
        console.log(`Removed ${removed} hook entries from ~/.cursor/hooks.json`);
      } else {
        console.log("No cursor-notify hooks found to remove.");
      }
      break;
    }

    case "install-claude": {
      ensureConfig();
      const cmd = resolveHookCommand();
      const count = registerClaudeHooks(cmd);
      console.log(`Registered ${count} hook events in ~/.claude/settings.json`);
      console.log(`Hook command: ${cmd}`);
      break;
    }

    case "uninstall-claude": {
      const removed = unregisterClaudeHooks();
      if (removed > 0) {
        console.log(`Removed ${removed} hook entries from ~/.claude/settings.json`);
      } else {
        console.log("No cursor-notify hooks found to remove.");
      }
      break;
    }

    case "test": {
      ensureConfig();
      sendNotification("Cursor", "Notifications are working!", basename(process.cwd()));
      console.log("Test notification sent.");
      break;
    }

    case "hook": {
      await hookCommand();
      break;
    }

    case "status": {
      const cursorInstalled = hasCursorHooks();
      const claudeInstalled = hasClaudeHooks();
      console.log(`Cursor hooks installed: ${cursorInstalled ? "yes" : "no"}`);
      console.log(`Claude Code hooks installed: ${claudeInstalled ? "yes" : "no"}`);
      break;
    }

    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
