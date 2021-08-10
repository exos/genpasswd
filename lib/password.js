
"use strict";

/**
 * Password generation
 * @module password
 */ 

const crypto  = require('crypto');
const _       = require('underscore');
const debug = require('debug')('genpasswd:password');

const CHARS_ALPHA = 'abcdefghijlmnopqrstuvwxyz';
const CHARS_NUMBERS = '0123456789';
const CHARS_SYMBOLS = '][?/<~#`!@$%^&*()+=}|:";\',>{';

const TYPE_ALPHA = 0x01; // 00001
const TYPE_NUMERIC = 0x02; // 00010
const TYPE_SYMBOLS = 0x04; // 00100

const TYPE_ALPHANUMERIC = TYPE_ALPHA | TYPE_NUMERIC; // 00011
const TYPE_COMPLEX = TYPE_ALPHA | TYPE_NUMERIC | TYPE_SYMBOLS; // 00111
const TYPE_CUSTOM = 0x08; // 01000
const TYPE_BINARY = 0x10; // 10000

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

/** @constant {Number} */ 
module.exports.TYPE_BINARY = TYPE_BINARY;

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

    if (options.type & TYPE_BINARY) {
        if (options.type !== TYPE_BINARY) {
            throw new Error("Binary type is not customizable");
        }

        return password;

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

    options = {
        passwordLength: 40,
        lower: true,
        upper: true,
        chars: null,
        type: TYPE_COMPLEX,
        phrasepass: null,
        salt: null,
        iterations: 1000,
        ...options,
    };

    debug(`Generate deterministic with`, options);

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
        "sha1",
        function(err, res) {
            if (err) return cb(err);
            return cb(null, rotate(res, options));
        }
    );
    
};

module.exports.rotate = rotate;
module.exports.generate = generate;
module.exports.generateSync = generateSync;
module.exports.generateDeterministic = generateDeterministic;
