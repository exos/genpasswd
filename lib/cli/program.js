const commander = require('commander');
const CliProgram = require('./app');
const package = require('../../package.json');
const debug = require('debug')('genpasswd:cli:program');

module.exports = new commander.Command();

const type = new commander.Option('-t, --type <type>', 'Type ')
    .choices(Object.keys(CliProgram.typesLabels))
    .default('complex')
;

const parseIntTen = (v) => parseInt(v, 10);

module.exports
    .version(package.version)
    .option('--types', "Show available passwords types")
    .option('-l, --length <n>', "Password length (by default is 15)", parseIntTen)
    .addOption(type)
    .option('-o, --output <file>', "Output file")
    .option('--lower', "Use only lower case")
    .option('--upper', "Use only upper case")
    .option('--numeric', "For custom type, use numeric chars")
    .option('--alpha', "For custom type, use alphabetical chars")
    .option('--symbols', "For custom type, use symbols")
    .option('--chars <chars>', "For custom type, use own chars (not separated)")
    .option('-d, --deterministic', "Generate a deterministic password")
    .option('-i, --input <file>', "For deterministic, input source")
    .option('--salt <salt>', "For deterministic, pbkdf2 salt")
    .option('--iterations <i>', "For deterministic, pbkdf2 iterations", parseIntTen, 1)
    .option('--100k', "Alias of --iterations 100000")
    .option('--1m', "Alias of --iterations 1000000")
    .option('--stdin', "Alias of --input /dev/stdin")
    .option('-n, --nonewline', "Do not output the trailing newline")
    .option('-b, --binary', "Alias of --type binary")
    .option('-a, --alphanumeric', "Alias of --type alphanumeric")
    .option('--profiler', 'Profile generation time')
    .hook('preAction', (cmd) => {
        if (cmd.opts().profiler) console.time(`Executed`);
    })
    .hook('postAction', (cmd) => {
        if (cmd.opts().profiler) console.timeEnd(`Executed`);
    })
    .action(async (opts) => {
        if (opts['1m']) {
            opts.iterations = 1000000;
        }

        if (opts['100k']) {
            opts.iterations = 100000;
        }

        if (opts.stdin) {
            opts.input = '/dev/stdin';
        }

        if (opts.binary) {
            opts.type = "binary";
        }

        if (opts.alphanumeric) {
            opts.type = "alphanumeric"; 
        }

        debug(`Running with `, opts);

        const app = new CliProgram(opts);

        return new Promise((resolve, reject) => {
            app.run((err) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    })
;
