import { execFile, execFileSync } from "child_process";
import { basename } from "path";
import { loadConfig, CURSOR_EVENT_MAP, pickPhrase } from "./config.js";

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

export function sendNotification(title, message) {
  if (process.platform === "darwin") {
    const script = `display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}" sound name "Pop"`;
    execFile("osascript", ["-e", script], () => {});
  } else if (process.platform === "win32") {
    const ps = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      $template = @"
      <toast><visual><binding template='ToastGeneric'><text>${title}</text><text>${message}</text></binding></visual></toast>
"@
      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml($template)
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('cursor-notify').Show($toast)
    `.trim();
    execFile("powershell", ["-Command", ps], () => {});
  } else {
    execFile("notify-send", [title, message], () => {});
  }
}

export function processEvent(payload) {
  const config = loadConfig();
  if (config.enabled === false) return;

  const cursorEvent = payload.hook_event_name || "";
  const category = CURSOR_EVENT_MAP[cursorEvent];
  if (!category) return;

  const categories = config.categories || {};
  if (categories[category] === false) return;

  const workspaceRoots = payload.workspace_roots;
  const cwd = Array.isArray(workspaceRoots) && workspaceRoots[0] ? workspaceRoots[0] : "";
  const branch = cwd ? getBranch(cwd) : null;
  const label = branch || (cwd ? basename(cwd) : "");

  const phrase = pickPhrase(category);
  const title = label ? `Cursor — ${label}` : "Cursor";

  sendNotification(title, phrase);
}
