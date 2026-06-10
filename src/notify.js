import { execFile, execFileSync } from "child_process";
import { basename } from "path";
import { loadConfig, CURSOR_EVENT_MAP, CLAUDE_EVENT_MAP, pickPhrase } from "./config.js";

const CLAUDE_HOST_APP = "Ghostty";

function getBranch(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf-8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

function getTmuxSessionName() {
  if (!process.env.TMUX) return null;
  try {
    const pane = process.env.TMUX_PANE;
    const args = ["display-message", "-p", ...(pane ? ["-t", pane] : []), "#S"];
    const name = execFileSync("tmux", args, {
      encoding: "utf-8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    // Auto-assigned session names are numeric; treat those as unset so the
    // title falls back to the cwd, matching the tmux set-titles-string rule.
    return name && !/^\d+$/.test(name) ? name : null;
  } catch {
    return null;
  }
}

function escapeAppleScript(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function sendNotification(title, message, subtitle, options = {}) {
  if (process.platform === "darwin") {
    const parts = [`display notification "${escapeAppleScript(message)}"`, `with title "${escapeAppleScript(title)}"`];
    if (subtitle) {
      parts.push(`subtitle "${escapeAppleScript(subtitle)}"`);
    }
    parts.push(`sound name "Pop"`);
    const stmt = parts.join(" ");
    const script = options.app
      ? `tell application "${escapeAppleScript(options.app)}" to ${stmt}`
      : stmt;
    execFile("osascript", ["-e", script], () => {});
  } else if (process.platform === "win32") {
    const ps = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      $template = @"
      <toast><visual><binding template='ToastGeneric'><text>${title}</text>${subtitle ? `<text>${subtitle}</text>` : ""}<text>${message}</text></binding></visual></toast>
"@
      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml($template)
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('cursor-notify').Show($toast)
    `.trim();
    execFile("powershell", ["-Command", ps], () => {});
  } else {
    const body = subtitle ? `${subtitle}\n${message}` : message;
    execFile("notify-send", [title, body], () => {});
  }
}

export function processEvent(payload) {
  const config = loadConfig();
  if (config.enabled === false) return;

  const event = payload.hook_event_name || "";
  const claudeCategory = CLAUDE_EVENT_MAP[event];
  const category = claudeCategory || CURSOR_EVENT_MAP[event];
  if (!category) return;

  const categories = config.categories || {};
  if (categories[category] === false) return;

  const workspaceRoots = payload.workspace_roots;
  const cwd =
    (Array.isArray(workspaceRoots) && workspaceRoots[0]) ||
    payload.cwd ||
    "";
  const branch = cwd ? getBranch(cwd) : null;
  const cwdName = cwd ? basename(cwd) : "";
  const title = getTmuxSessionName() || cwdName || branch || (claudeCategory ? "Claude Code" : "Cursor");
  const subtitle = branch && branch !== title ? branch : undefined;

  const phrase = pickPhrase(category);
  const app = claudeCategory ? CLAUDE_HOST_APP : undefined;

  sendNotification(title, phrase, subtitle, { app });
}
