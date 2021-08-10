/**
 * Cli module
 *
 */

const fs = require('fs');
const async  = require('async');
const prompt = require('prompt');
const {pick} = require('../util');
const password = require('../password'); 
const debug = require('debug')('genpasswd:cli:app');

const defOptions = {
    length: 15,
    types: false,
    type: password.TYPE_COMPLEX,
    output: '/dev/stdout',
    lower: false,
    upper: false,
    numeric: false,
    alpha: false,
    symbols: false,
    chars: null,
    deterministic: false,
    input: null,
    phrasepass: null,
    salt: null,
    iterations: null,
    nonewline: false
};

const typesLabels = {
    alpha: password.TYPE_ALPHA,
    alphanumeric: password.TYPE_ALPHANUMERIC,
    numeric: password.TYPE_NUMERIC,
    symbols: password.TYPE_SYMBOLS,
    complex: password.TYPE_COMPLEX,
    custom: password.TYPE_CUSTOM,
    binary: password.TYPE_BINARY
};

const typesDescriptions = {
    alpha: "Alphabetics chars (only letters, from a to z)",
    alphanumeric: "Alphabetics chars with numbers",
    numeric: "Only numbers",
    symbols: "Symbols like #, !, etc.",
    complex: "Use a mix of Alphanumerics and symbols",
    custom: "Yo can set what groups of chars and add chars with --chars",
    binary: "Binary output (for keys usages)"
};

const out = {
    errout: function (msg) {
        console.error(msg);
    },

    warn: function (msg) {
        console.warn(msg);
    }
};

/**
 * Cli program
 */
class CliProgram {

    /**
     * Create new Cli instance
     * @param {Object} options  - Cli options
     */
    constructor(options) {
        this._data = {};
        this._options = { 
            ...defOptions,
            ...pick(options, Object.keys(defOptions)),
        };
        debug(`Started program with options`, this._options);
    }

    /**
     * Types labels
     * @type {object}
     */
    static get typesLabels() {
        return typesLabels;
    }

    /**
     * Options
     * @type {object}
     */
    get options() {
        return this._options;
    }

    /**
     * Output interface
     * @type {object}
     */
    get out() {
        return out;
    }

    /**
     * Get deterministic options from pront
     * @private
     * @param {function} cb
     */
    _getDeterministicOptions(cb) {
        const pschema = {
            properties: {
                ...(!this.options.input ? {
                    phrasepass: {
                        required: true,
                        hidden: true,
                    },
                } :{}),
                ...(!this.options.salt ? {
                    salt: {
                        required: true,
                        hidden: true,
                    },
                } : {})
            },
        };

        debug(`Getting deterministic options from prompt`, pschema);

        prompt.message = "genpass";
        prompt.get(pschema, (err, result) => {
            if (err) return cb(err);

            if (result.phrasepass)
                this.options.phrasepass = Buffer.from(
                    result.phrasepass, 'utf8'
                );

            if (result.salt)
                this.options.salt = result.salt;

            return cb();
        });
    }

    /**
     * Genereate deterministic password
     * @private
     * @param {object} passOptions
     * @param {function} cb
     */
    _deterministic(passOptions, cb) {
        debug(`Generate deterministic password`);
        const {options} = this;
        async.waterfall([
            (done) => {
                // If deterministic, get salt [and phrasepass]
                if (options.deterministic && (!options.salt || !options.input)) {
                    this._getDeterministicOptions(done);
                } else {
                    done();
                }
            },

            // If deterministic, and input, get phrasepass
            (done) => {
                if (options.deterministic && options.input) {
                    fs.readFile(options.input, function (err, res) {
                        if (err) return done(err);

                        options.phrasepass = res;
                        done();
                    });
                } else {
                    done();
                }
            },

            // Get password 
            (done) => password.generateDeterministic({
                ...passOptions,
                phrasepass: options.phrasepass,
                salt: options.salt,
                iterations: options.iterations
            }, done)
        
        ], (err, password) => {
            if (err) return cb(err);
            this.write(password, cb);
        });
    }

    /**
     * Show types of passwords
     * @param {function} cb
     */
    showTypes(cb) {
        const result = Object.keys(typesDescriptions)
            .map((k) => `${k}: ${typesDescriptions[k]}`)
        this.write(result.join("\n"), cb);
    }

    /**
     * Check params
     * @param {function} cb
     */
    checkParams(cb) {
        debugger;
        const {options} = this;

        if (typeof options.type === "string") {
            if (!Object.keys(typesLabels).includes(options.type)) {
                return cb(new Error(
                    `Type ${options.type} does not exists, try --types`
                ));
            }

            options.type = typesLabels[options.type];
        }

        if (options.type === password.TYPE_BINARY) {
            options.nonewline = true;
        }

        if (options.type === password.TYPE_CUSTOM) {
            
            if (options.numeric)
                options.type |= password.TYPE_NUMERIC;

            if (options.alpha)
                options.type |= password.TYPE_ALPHA;

            if (options.symbols)
                options.type |= password.TYPE_SYMBOLS;

            if (options.type === password.TYPE_CUSTOM && !options.chars) {
                return cb(new Error('Define chars or add types'));
            }

        } else {
            if (options.numeric) {
                this.out.warn("Ignored --numeric option");
            }

            if (options.alpha) {
                this.out.warn("Ignored --alpha option");
            }

            if (options.symbols) {
                this.out.warn("Ignored --symbols option");
            }

            if (options.chars) {
                this.out.warn("Ignored --chars option");
            }
        }

        if (options.lower && options.upper) {
            return cb(new Error(
                'Options collition, the password has not be in upper and lower at same'
            ));
        }

        if (!options.deterministic) {
            if (options.input) {
                this.out.warn("Ignored --input option");
            }

            if (options.salt) {
                this.out.warn("Ignored --salt option");
            }

            if (options.iterations) {
                this.out.warn("Ignored --interations options");
            }
        }

        return cb();
    }

    /**
     * Run cli command
     * @param {function} cb
     */
    run(cb) {
        let type;
        const {options} = this;

        this.checkParams((err) => {
            if (err) return cb(err);

            if (options.types) {
                return this.showTypes(cb);
            }

            const passOptions = {
                passwordLength: options.length,
                type: options.type,
                lower: !options.upper,
                upper: !options.lower,
                chars: options.chars
            };

            if (options.deterministic) {
                return this._deterministic(passOptions, cb);
            } 

            password.generate(passOptions, (err, res) => {
                if (err) return cb(err);
                this.write(res, cb);
            });
        });
    }
    
    /**
     * Write data to output
     * @param {string|Buffer} data
     * @param {function} cb
     */
    write(data, cb) {
        const output = fs.createWriteStream(this.options.output, {
            flags: 'w',
            defaultEncoding: 'binary',
            fd: null
        });

        output.on('error', function(err) {
            output.end();
            return cb(new Error("Error writing output: " + err));
        });

        output.on('finish', function() {
            return cb();
        });

        output.write(data);

        if (!this._options.nonewline) {
            output.write(`\n`);
        }

        output.end();
    }
};

module.exports = CliProgram;

