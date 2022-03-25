import log from 'npmlog'

log.enableColor()
log.heading = 'coffee-converter'
log.level = 'info'

interface LogFixedPrefix {
    silly(message: string, ...args: any[]): void;
    verbose(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    timing(message: string, ...args: any[]): void;
    http(message: string, ...args: any[]): void;
    notice(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    silent(message: string, ...args: any[]): void;
}

export function logFixedPrefix(prefix: string): LogFixedPrefix {
    function logPrefix(level: string, message: string, ...args: any[]) {
        log.log(level, prefix, message, ...args);
    }

    return {
        silly: (message, ...args) =>
            logPrefix('silly', message, ...args),
        verbose: (message, ...args) =>
            logPrefix('verbose', message, ...args),
        info: (message, ...args) =>
            logPrefix('info', message, ...args),
        timing: (message, ...args) =>
            logPrefix('timing', message, ...args),
        http: (message, ...args) =>
            logPrefix('http', message, ...args),
        notice: (message, ...args) =>
            logPrefix('notice', message, ...args),
        warn: (message, ...args) =>
            logPrefix('warn', message, ...args),
        error: (message, ...args) =>
            logPrefix('error', message, ...args),
        silent: (message, ...args) =>
            logPrefix('silent', message, ...args),
    }
}

export default log;