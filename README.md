# buffo

[![Build Status](https://secure.travis-ci.org/Bartvds/buffo.svg?branch=master)](http://travis-ci.org/Bartvds/buffo) [![NPM version](https://badge.fury.io/js/buffo.svg)](http://badge.fury.io/js/buffo) [![Dependency Status](https://david-dm.org/Bartvds/buffo.svg)](https://david-dm.org/Bartvds/buffo) [![devDependency Status](https://david-dm.org/Bartvds/buffo/dev-status.svg)](https://david-dm.org/Bartvds/buffo#info=devDependencies)

> Binary encoding for Javascript objects.

Transcode all types of JSON values to and from a binary format, including Buffer, Date, RegExp and more. Originally created to stream worker commands over pipes between processes.

:warning: Early release, handle with care :sunglasses:

## Supported types

- String (utf8)
- Boolean
- Number (incl NaN, Infinity)
- Object
- Array
- Buffer (fastest)
- TypedArray (all types, very fast)
- Date
- RegExp
- null
- undefined
- arguments (arrives as Array)

Array and Object can hold any of the other types. Serialisation of Object reads enumerable properties, but ignores functions.

Next:

- Error (needs special case)
- Set (like Array)
- Map (keys would be tricky)


## Install

````bash
$ npm install buffo
````


## Usage

### Single value

Write a value to a Buffer, later decode the Buffer back to a value.

````js
var buffo = require('buffo');

var buffer = buffo.encode(sourceValue);
var outputValue = buffo.parse(buffer);
````

### Stream

Create encoder and decoder Transform streams and connect them over some binary pipe. Then write or pipe JavaScript objects and they magically reappear at the other end.

Keep in mind that due to the nature of node's object-streams you cannot send `null` or `undefined` as root value as they will terminate the Transform stream (they work fine nested in Arrays or Objects).

````js
var buffo = require('buffo');

// sender
var encoding = buffo.encodeStream();
encoding.pipe(process.stdout);
encoding.write(myValue);

// receiver
var decoding = buffo.decodeStream();
process.stdin.pipe(decoding).on('data', function(data) {
    // received a value
});
````

(note this stdin/stdout example is blocking on Linux, so from inter-process stream better use net or file-descriptor streams)

## Speed & reliability

Performance fair but unclear, varies a lot per data type. Reliability unproven but hopeful.

If you need maximum speed and don't need the fancy types use good ol' line separated JSON.


## Todo

- Look into statemachine for decoder.
- Verify and expand more v8 optimisations.
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

- 0.1.0 - First main release.
- 0.0.x - Dev releases.


## License

Copyright (c) 2014 Bart van der Schoor @ [Bartvds](https://github.com/Bartvds)

Licensed under the MIT license.
