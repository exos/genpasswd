
/**
 * Cli module
 *
 */

"use strict";

var fs          = require('fs'),
    _           = require('underscore'),
    async       = require('async'),
    prompt      = require('prompt'),
    password    = require('./password'); 

var defOptions = {
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
    iterations: null 
};

var typesLabels = {
    alpha: password.TYPE_ALPHA,
    alphanumeric: password.TYPE_ALPHANUMERIC,
    numeric: password.TYPE_NUMERIC,
    symbols: password.TYPE_SYMBOLS,
    complex: password.TYPE_COMPLEX,
    custom: password.TYPE_CUSTOM
};

var typesDescriptions = {
    alpha: "Alphabetics chars (only letters, from a to z)",
    alphanumeric: "Alphabetics chars with numbers",
    numeric: "Numbers",
    symbols: "Symbols like #, !, etc.",
    complex: "Use a mix of Alphanumerics and symbols",
    custom: "Yo can set what groups of chars and add chars with --chars"
};

var out = {

    errout: function (msg) {
        console.error(msg);
    },

    warn: function (msg) {
        console.warn(msg);
    }

};

/**
 * Cli program
 * @class CliProgram
 * @param {Object} options  - Cli options
 */

var CliProgram = function (options) {

    this._data = {};

    this._options = _.defaults(
        _.pick(options, _.keys(defOptions)),
        defOptions);

};

module.exports.CliProgram = CliProgram;

CliProgram.prototype._deterministic = function (passOptions, cb) {
    var self = this;
    var options = this._options;

    async.waterfall([

        // If deterministic, get salt [and phrasepass]
        function (done) {
            if (options.deterministic && (!options.salt || !options.input)) {
                var pschema = {properties: {}};
                prompt.message = "genpass";
                if (!options.input) {
                    pschema.properties.phrasepass = {
                        required: true,
                        hidden: true
                    };
                }

                if (!options.salt) {
                    pschema.properties.salt = {
                        required: true,
                        hidden: true
                    };
                }

                prompt.get(pschema, function (err, result) {
                    
                    if (err) return done(err);

                    if (result.phrasepass)
                        options.phrasepass = new Buffer(result.phrasepass, 'utf8');

                    if (result.salt)
                        options.salt = result.salt;

                    done();

                });
                                
                
            } else {
                done();
            }
        },

        // If deterministic, and input, get phrasepass
        function (done) {
        
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
        function (done) {

            _.extend(passOptions, {
                phrasepass: options.phrasepass,
                salt: options.salt,
                iterations: options.iterations
            });

            password.generateDeterministic(passOptions, done);
        }
    
    ], function (err, password) {
        if (err) return cb(err);
        self.write(options.output, password, cb);
    });

};

CliProgram.prototype.showTypes = function (cb) {

    var result = [];

    _.each(typesDescriptions, function (desc, type) {
        result.push(type + ": " + desc);
    });

    this.write(this._options.output, result.join("\n"), cb);

};

CliProgram.prototype.checkParams = function (cb) {
    var self = this, options = this._options;

    if (typeof options.type === "string") {

        if (_.keys(typesLabels).indexOf(options.type) === -1) {
            return cb(new Error("Type " + options.type + " does not exists, try --types"));
        }

        options.type = typesLabels[options.type];
    }

    if (options.type === password.TYPE_CUSTOM) {
        
        if (options.numeric)
            options.type |= password.TYPE_NUMERIC;

        if (options.alpha)
            options.type |= password.TYPE_ALPHA;

        if (options.symbols)
            options.type |= password.TYPE_SYMBOLS;

        if (options.type === password.TYPE_CUSTOM && !options.chars) {
            return cb(new Error("Define chars or add types"));
        }

    } else {

        if (options.numeric) {
            out.warn("Ignored --numeric option");
        }

        if (options.alpha) {
            out.warn("Ignored --alpha option");
        }

        if (options.symbols) {
            out.warn("Ignored --symbols option");
        }

        if (options.chars) {
            out.warn("Ignored --chars option");
        }

    }

    if (options.lower && options.upper) {
        return cb(new Error("Options collition, the password has not be in upper and lower at same"));
    }


    if (!options.deterministic) {
        if (options.input) {
            out.warn("Ignored --input option");
        }

        if (options.salt) {
            out.warn("Ignored --salt option");
        }

        if (options.iterations) {
            out.warn("Ignored --interations options");
        }

    }

    return cb();

};

CliProgram.prototype.run = function (cb) {
    var self = this;
    var type;
    var options = this._options;
    var passOptions = {};

    this.checkParams(function (err) {
        if (err) return cb(err);

        if (options.types) {
            return self.showTypes(cb);
        }

        var passOptions = {
            passwordLength: options.length,
            type: options.type,
            lower: !options.upper,
            upper: !options.lower,
            chars: options.chars
        };

        if (options.deterministic) {
            return self._deterministic(passOptions, cb);
        } 

        password.generate(passOptions, function (err, res) {
            if (err) return cb(err);
            self.write(options.output, res, cb);
        });

    });

};

CliProgram.prototype.write = function(path, data, cb) {

    var output = fs.createWriteStream(path, {
        flags: 'w',
        defaultEncoding: 'ascii',
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
    output.write("\n");
    output.end();
};
