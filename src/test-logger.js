import { initLogger } from './log';

initLogger({ bunyanFormat: 'short', logLevel: process.env.LOG_LEVEL || 'fatal' });
