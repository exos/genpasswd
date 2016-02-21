
"use strict";

/**
 * Password generation
 * @module password
 */ 

var crypto  = require('crypto'),
    _       = require('underscore');

var CHARS_ALPHA = 'abcdefghijlmnopqrstuvwxyz';
var CHARS_NUMBERS = '0123456789';
var CHARS_SYMBOLS = '][?/<~#`!@$%^&*()+=}|:";\',>{';

var TYPE_ALPHA = 0x01; // 0001
var TYPE_NUMERIC = 0x02; // 0010
var TYPE_SYMBOLS = 0x04; // 0100

var TYPE_ALPHANUMERIC = TYPE_ALPHA | TYPE_NUMERIC; // 0011
var TYPE_COMPLEX = TYPE_ALPHA | TYPE_NUMERIC | TYPE_SYMBOLS; // 0111
var TYPE_CUSTOM = 0x08; // 1000

/** @constant {number} */
module.exports.TYPE_ALPHA = TYPE_ALPHA;

/** @constant {number} */
module.exports.TYPE_NUMERIC = TYPE_NUMERIC;

/** @constant {number} */
module.exports.TYPE_SYMBOLS = TYPE_SYMBOLS;

/** @constant {number} */
module.exports.TYPE_ALPHANUMERIC = TYPE_ALPHANUMERIC;

/** @constant {number} */
module.exports.TYPE_COMPLEX = TYPE_COMPLEX;

/** @constant {number} */
module.exports.TYPE_CUSTOM = TYPE_CUSTOM;

/**
 * Rotate buffer into a chars availables
 * @param {Buffer|string} password              - Password block 
 * @param {object} [options]                    - Options 
 * @param {number} [options.type]               - Password type 
 * @param {bool} [options.lower]                - Include lowercase letters
 * @param {bool} [options.upper]                - Include uppercase letters
 * @param {Array:<string>|string} [options.chars] - Chars for custom format
 * @return {string}
 */

var rotate = function (password, options) {

    options = _.defaults(options || {}, {
        lower: true,
        upper: true,
        chars: null,
        type: TYPE_COMPLEX 
    });

    var habchars = [];

    if (!Buffer.isBuffer(password)) {
        password = new Buffer(password, 'ascii');
    }

    if (options.type & TYPE_NUMERIC) {
        habchars = habchars.concat(CHARS_NUMBERS.split(''));
    }

    if (options.type & TYPE_ALPHA) {
        if (options.lower) {
            habchars = habchars.concat(CHARS_ALPHA.split(''));
        }

        if (options.upper) {
            habchars = habchars.concat(CHARS_ALPHA.toUpperCase().split(''));
        }
        
    }

    if (options.type & TYPE_SYMBOLS) {
        habchars = habchars.concat(CHARS_SYMBOLS.split(''));
    }

    if (options.type & TYPE_CUSTOM) {

        if (!_.isArray(options.chars)) {

            if (!_.isString(options.chars))
                options.chars = "";

            options.chars = options.chars.split('');
        }

        habchars = habchars.concat(options.chars);
    }

    var i, p, result = "", c = password.length, charEntropy = habchars.length;

    for (i =0; i < c; i++) {
        p = password[i] % charEntropy;
        result += habchars[p];
    }

    return result;

};

/**
 * Like generate, but sync 
 */

var generateSync = function (options) {
    var bytes = crypto.randomBytes(options.passwordLength);
    return rotate(bytes, options);
};

/**
 * Generate a password
 * @param {object} [options]                    - Options
 *
 * @param {number} [options.passwordlength]     - Password Length
 * @param {number} [options.type]               - Password type 
 * @param {bool} [options.lower]                - Include lowercase letters
 * @param {bool} [options.upper]                - Include uppercase letters
 * @param {Array:<string>|string} [options.chars] - Chars for custom format
 * @param {function} [cb]                       - Callback
 */

var generate = function (options, cb) {

    if (typeof options === "function") {
        cb = options;
        options = undefined;
    }

    options = _.defaults(options || {}, {
        passwordLength: 40,
        lower: true,
        upper: true,
        chars: null,
        type: TYPE_COMPLEX 
    });

    if (!cb) {
        return generateSync(options);
    }

    crypto.randomBytes(options.passwordLength, function (err, bytes) {
        if (err) {
            return cb(err);
        }

        cb (null, rotate(bytes, options));

    });

};

/**
 * Generate a password bassed on a secret phrasepass and salt 
 *
 * @param {object} options                      - Options
 * @param {number} [options.passwordlength]     - Password Length
 * @param {number} [options.type]               - Password type 
 * @param {bool} [options.lower]                - Include lowercase letters
 * @param {bool} [options.upper]                - Include uppercase letters
 * @param {Array:<string>|string} [options.chars] - Chars for custom format
 * @param {string} options.phrasepass           - Phrasepass sed 
 * @param {string} [options.salt]               - Salt
 * @param {integer} [options.iterations]        - Number of PBKD2 iterations
 * @param {function} [cb]                       - Callback
 */
var generateDeterministic = function(options, cb) {

    options = _.defaults(options || {}, {
        passwordLength: 40,
        lower: true,
        upper: true,
        chars: null,
        type: TYPE_COMPLEX,
        phrasepass: null,
        salt: null,
        interations: 1000
    });


    if (!options.phrasepass) {
        return cb(new Error("Phrasepass is required"));
    }

    if (!options.salt) {
        options.salt = options.phrasepass;
    }

    crypto.pbkdf2(
        options.phrasepass,
        options.salt,
        parseInt(options.iterations),
        parseInt(options.passwordLength),
        function(err, res) {
            if (err) return cb(err);
            return cb(null, rotate(res, options));
        }
    );
    
};

module.exports.rotate = rotate;
module.exports.generate = generate;
module.exports.generateDeterministic = generateDeterministic;
