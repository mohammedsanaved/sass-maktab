type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  fields?: LogFields;
}

function write(level: LogLevel, message: string, fields?: LogFields) {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(fields ? { fields } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
};
