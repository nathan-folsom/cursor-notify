import { processEvent } from "./notify.js";

export async function hookCommand() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.stdout.write("{}\n");
    return;
  }

  try {
    processEvent(payload);
  } catch {
    // best-effort: still return {} so Cursor doesn't error
  }

  process.stdout.write("{}\n");
}
