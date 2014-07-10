# buffo

[![Build Status](https://secure.travis-ci.org/Bartvds/buffo.svg?branch=master)](http://travis-ci.org/Bartvds/buffo) [![NPM version](https://badge.fury.io/js/buffo.svg)](http://badge.fury.io/js/buffo) [![Dependency Status](https://david-dm.org/Bartvds/buffo.svg)](https://david-dm.org/Bartvds/buffo) [![devDependency Status](https://david-dm.org/Bartvds/buffo/dev-status.svg)](https://david-dm.org/Bartvds/buffo#info=devDependencies)

> Binary encoding for Javascript objects.

Transcode all types of JSON values to and from a binary format, including Buffer, Date, RegExp and more. Originally created to stream worker commands over pipes between processes.

:warning: Early release, handle with care :sunglasses:

## Supported types

- String (utf8)
- Boolean
- Number (incl NaN, Infinity)
- Array
- Object
- Buffer
- Date
- RegExp
- null
- undefined
- arguments (transformed to array)

Next:

- Map
- Set
- TypedArray's

## Usage

### Single value

````js
var buffo = require('buffo');

var buffer = buffo.encode(sourceValue);
var outputValue = buffo.parse(buffer);
````

### Stream

Create a encoder and a decoder stream and connect them over some binary stream. Then write JavaScript objects to one end and they magically reappear at the other end of the pipeline.

````js
var buffo = require('buffo');

// sender
var encoding = buffo.encodeStream();
encoding.pipe(process.stdout);
encoding.write(myValue);

// receiver
var decoding = buffo.decodeStream();
process.stdin.pipe(encoding)).on('data', function(data) {
    // got values
});
````


## Speed & reliability

Performance unclear, varies a lot per data type. Reliability unproven but hopeful.

If you need maximum speed and don't need the fancy types use good ol' JSON.parse or if you can use native dependencies consider use msgpack.


## Todo

- Optimise more, verify more v8 acceleration.
- Review statemachine for symmetric encode/decode speed.
- Extract optimiser workbench to own project.


## Build

Install development dependencies in your git checkout:

````bash
$ npm install
````

Build and run tests using [grunt](http://gruntjs.com):

````bash
$ grunt test
````

See the `Gruntfile.js` for additional commands.


## Contributions

They are welcome but please discuss in [the issues](https://github.com/Bartvds/buffo/issues) before you commit to large changes. If you send a PR make sure you code is idiomatic and linted.


## History

- 0.0.x - First releases.


## License

Copyright (c) 2014 Bart van der Schoor @ [Bartvds](https://github.com/Bartvds)

Licensed under the MIT license.
