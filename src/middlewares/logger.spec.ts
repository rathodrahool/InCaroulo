import { createLogger, format, transports } from 'winston';
import logger from './logger';

describe('Logger', () => {
    let fileTransport: transports.FileTransportOptions;

    beforeEach(() => {
        // Spy on the winston transports
        fileTransport = createLogger({
            level: 'info',
            format: format.combine(format.splat(), format.simple()),
            transports: [
                new transports.Console(),
                new transports.File({
                    filename: `logs/logfile-${new Date().toLocaleDateString('es-CL')}.log`,
                }),
            ],
        }).transports.find((t) => t instanceof transports.File) as transports.FileTransportOptions;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Logger Initialization', () => {
        it('should initialize logger with correct settings', () => {
            expect(logger).toBeDefined();
            expect(logger.transports).toHaveLength(2);

            const consoleTransport = logger.transports.find((t) => t instanceof transports.Console);
            expect(consoleTransport).toBeDefined();
            expect(consoleTransport).toBeInstanceOf(transports.Console);

            expect(fileTransport).toBeDefined();
            expect(fileTransport.filename).toBeDefined();
        });
    });
});
