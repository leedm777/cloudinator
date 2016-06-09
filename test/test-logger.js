import { initLogger } from '../src/util/log';

initLogger({ bunyanFormat: 'short', logLevel: process.env.LOG_LEVEL || 'fatal' });
