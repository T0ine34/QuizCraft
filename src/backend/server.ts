import app from './app';

import argumentParser from 'argparse';
const { version } = require('../../package.json');

import { Logger, LEVELS } from '@gamunetwork/logger';

// Parse command line arguments
const parser = new argumentParser.ArgumentParser({
    description: 'QuizCraft backend server',
    add_help: true
});
parser.add_argument('--version', { action: 'version', version });
parser.add_argument('-p', '--port', { help: 'Port to listen on', default: 3000, type: 'int' });
parser.add_argument('-d', '--debug', { help: 'Enable debug logging', action: 'store_true' });
parser.add_argument('--log-target', { help: 'Add a log target', action: 'append', default: [] });
const args = parser.parse_args();

if (args.debug) {
    Logger.setLevel('stdout', LEVELS.DEBUG);
}

for (const target of args.log_target) {
    const [name, level] = target.includes(':') ? target.split(':') : [target, 'INFO'];
    Logger.addTarget(name, LEVELS.fromString(level));
}

const PORT = args.port;
Logger.debug(`using port ${PORT}`);

try {
    app.listen(PORT, () => {
        Logger.info(`Server is running on port ${PORT}`);
    });

    process.on('SIGINT', () => {
        Logger.info('Stopping the server...');
        process.exit();
    });
}
catch (e) {
    Logger.error(`Failed to start server: ${e}`);
}