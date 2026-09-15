type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function logJson(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: 'silicon-nexus',
    ...extra,
  };
  const serialized = JSON.stringify(line);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}
