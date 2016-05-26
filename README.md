
Generate strong random passwords from CLI.

# Usage (CLI)

The usage is very simple, by default the command generate a password with 15[0]
characters length, using letters, numbers and symnbols:

    $ genpasswd 
    h8d=1Cs<;V}[Az/

You can see all options using:

    $ genpasswd --help

## Passwords types

Passwords types is a easy way to generate a specific format password, There are:

* **alpha**: Alphabetics chars (only letters, from a to z)
* **alphanumeric**: Alphabetics chars with numbers
* **numeric**: Only numbers
* **symbols**: Symbols like #, !, etc.
* **complex**: Use a mix of Alphanumerics and symbols
* **custom**: Yo can set what groups of chars and add chars with --chars
* **binary**: Binary output (for keys usages)

This list can be showed using 

    $ genpasswd --types

By default, genpasswd use _complex_, you can use custom combined with selected
types, for example:

    $ genpasswd -l 30 -t custom --numeric --symbols 
    :`:73(;%}6{=!;452?//~@$??7+1^=

This return a password generated with numbers and symbols, you can set specific
chars to, and combine:

    $ genpasswd -l 30 -t custom --chars abcDEF123
    1c2bcF2baaab2EF2F31aDFD32Ec31a
    $genpasswd -l 30 -t custom --chars abcDEF --numeric
    ac29b9863210F57Dc87Fc922ba92aa

## Deterministic passwords 

You can generate deterministic passwords based in thre variables; a 
_phrasepass_, a _salt_ and an _iterations number_, the interations are 
set on 1000 by default, but the phrasepass and salt are requried.

This funcions allow you to generate strong passwords for services based 
on two (or three) memorizables seeds.

For example, if you can set a strong password to you email account, you can 
use the addres as phrasepass and a simple password as the salt, for example:

    $ genpasswd -d -l 30
    genpass: phrasepass:  <- here you write you address (yourself@host.com)
    genpass: salt:  <- here your every day password (coldplay2012$) 
    fQz":Jib&7H,d}W6j+sA{)jnS~}u]3"

Ever you use a deterministic algorithm to generate a password (with this 
utility) the password will be identical. You can generate it whenever you need
it. The internal algorithm used to generate the password is 
[PBKDF2](https://en.wikipedia.org/wiki/PBKDF2).

The advantage of using as phrasepass the account name, is that you can have a
different password for each service.

## Symetric key generation

For symetric binary key generation, there are a _binary_ type, it works like a 
simple random generator like ```dd if=/dev/random```, but with the posibility of 
generate a deterministic binary keys.

For example, if you need to generate a
[LUKS](https://en.wikipedia.org/wiki/Linux_Unified_Key_Setup) key, you need a 
4096B binary blob. With DD it's: 
    
    $ dd if=/dev/random of=disk.key bs=1024 count=4

With genpasswd can be:

    $ genpasswd -bl 4096 -o disk.key 

Normally you need to backup this type of keys, but with the deterministic
method, you can generate it with a password/salt schema and only remember it
like a standar password.

    $ genpasswd -dbl 4096 --100k -o disk.key

This generate a deterministic key with a 100,000 iterations. 

# Install

## With npm :

    $ sudo npm install genpasswd

## From sources

    $ git clone https://github.com/exos/genpasswd.git
    $ npm install -d 

# Use (as node module)

    $ npm install --save genpasswd

In your code:

```JavaScript

var genPasswd = require('genpasswd');

var options = {
    type: genPasswd.password.TYPE_COMPLEX,
    passwordLength: 30
};

genPasswd.password.generate(options, function (err, password) {
    // password is a string
});

````

You can see more details on [the wiki](https://github.com/exos/genpasswd/wiki)

# Support

You can:

* Report bugs or ideas in [the tracker](https://github.com/exos/genpasswd/issues)
* Fork and send pull request with bug fixeds/new features
* Spellcheck (My english is horrible)
* Donate BTC:  1E9A4Jg1tckJGD8rUx1WogBEL7uPXAktNP

0- The 15 length password by default is because 15 chars is a better option
(no best), based on stadistics [makes for me](http://log.exodica.com.ar/D)
