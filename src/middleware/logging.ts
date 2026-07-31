export function logToolCall(tool: string): void {
  console.info(JSON.stringify({ tool, at: new Date().toISOString() }));
}
