# cursor-notify

Native OS notifications for Cursor agent events. Get notified when the agent finishes a task, encounters an error, or needs your input — no audio, no LLM, no TTS servers required.

## Install

```bash
cd cursor-notify
npm install
node src/cli.js install
```

Or install globally:

```bash
npm install -g .
cursor-notify install
```

## Usage

### Register hooks

```bash
cursor-notify install
```

This adds entries to `~/.cursor/hooks.json` so Cursor calls `cursor-notify hook` on agent events.

### Remove hooks

```bash
cursor-notify uninstall
```

### Send a test notification

```bash
cursor-notify test
```

### Check status

```bash
cursor-notify status
```

## Events

| Cursor event         | Category         | Example notification              |
|----------------------|------------------|-----------------------------------|
| `stop`               | task.complete    | "Agent is ready for input"        |
| `sessionStart`       | session.start    | "Session started"                 |
| `sessionEnd`         | session.end      | "Session ended"                   |
| `postToolUseFailure` | task.error       | "A tool execution failed"         |
| `preCompact`         | resource.limit   | "Context is getting large"        |

## Configuration

Config lives at `~/.cursor-notify/config.json`. Created automatically on first `install`.

```json
{
  "enabled": true,
  "categories": {
    "session.start": true,
    "session.end": true,
    "task.complete": true,
    "task.error": true,
    "resource.limit": true
  }
}
```

Set any category to `false` to suppress those notifications.

## How it works

Cursor's hook system pipes a JSON payload to stdin when agent events fire. `cursor-notify hook` reads that payload, maps the event to a category, picks a phrase, and sends a native OS notification.

Notifications use platform-native tools with zero npm dependencies:
- **macOS**: `osascript` (AppleScript `display notification`)
- **Linux**: `notify-send`
- **Windows**: PowerShell toast notifications

## Acknowledgements

Inspired by [voxlert](https://github.com/settinghead/voxlert), which provides LLM-generated voice notifications for coding agents using game character voices. cursor-notify takes a simpler approach — just native OS notifications, no audio or TTS required.
