import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(format.splat(), format.simple()),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: `logs/logfile-${new Date().toLocaleDateString('es-CL')}.log`,
        }),
    ],
});

export default logger;
