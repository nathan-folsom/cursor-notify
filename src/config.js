import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_DIR = dirname(__dirname);

export const STATE_DIR = join(homedir(), ".cursor-notify");
const CONFIG_PATH = join(STATE_DIR, "config.json");

export const CURSOR_EVENT_MAP = {
  sessionStart: "session.start",
  sessionEnd: "session.end",
  stop: "task.complete",
  postToolUseFailure: "task.error",
  preCompact: "resource.limit",
};

export const PHRASES = {
  "session.start": "Session started",
  "session.end": "Session ended",
  "task.complete": "Agent is ready for input",
  "task.error": "A tool execution failed",
  "resource.limit": "Context is getting large",
};

export function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return { enabled: true };
  }
}

export function saveConfig(config) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export function ensureConfig() {
  if (!existsSync(CONFIG_PATH)) {
    const templatePath = join(SCRIPT_DIR, "config.default.json");
    mkdirSync(STATE_DIR, { recursive: true });
    if (existsSync(templatePath)) {
      copyFileSync(templatePath, CONFIG_PATH);
    } else {
      writeFileSync(CONFIG_PATH, JSON.stringify({ enabled: true }, null, 2) + "\n");
    }
  }
  return loadConfig();
}

export function pickPhrase(category) {
  return PHRASES[category] || "Notification";
}
