'use strict';

var buffo = require('../lib/index');

var createOptimiser = require('../optimiser/optimiser');

var data = {
	'number': 123,
	'string': 'abcdefgh',
	'true': true,
	'false': false,
	'undefined': undefined,
	'null': null,
	'date': new Date(),
	'regex': /abc/g,
	'array': [1, 2, 3],
	'object': {a: 1, b: 2, c: [1, 2, 3]},
	'buffer': new Buffer('abc', 'utf8'),
	'nan': NaN,
	'infPos': Number.POSITIVE_INFINITY,
	'infNeg': Number.NEGATIVE_INFINITY
};

var optimiser = createOptimiser('optimiser');

optimiser.suite('typeOf', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		suite.add(buffo.typeOf, name);
		buffo.typeOf(value);
		suite.optimise(buffo.typeOf);
		buffo.typeOf(value);
	});
});

optimiser.suite('typeOf + getName', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		suite.add(buffo.typeOf, name);
		suite.add(buffo.getName, name);

		buffo.getName(buffo.typeOf(value));

		suite.optimise(buffo.typeOf);
		suite.optimise(buffo.getName);

		buffo.getName(buffo.typeOf(value));
	});
});

optimiser.suite('writeValue + parseValue', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		suite.add(buffo.writeValue, name);
		suite.add(buffo.parseValue, name);

		var chunks;

		chunks = buffo.getWriteStream();
		buffo.writeValue(value, chunks.push);
		suite.optimise(buffo.writeValue);
		chunks = buffo.getWriteStream();
		buffo.writeValue(value, chunks.push);

		var buffer = chunks.join();
		chunks = buffo.getWriteStream();

		buffo.parseValue(buffer, 0, chunks.push);
		suite.optimise(buffo.parseValue);
		buffo.parseValue(buffer, 0, chunks.push);
	});
});


optimiser.suite('typeOf + getName', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		suite.add(buffo.typeOf, name);
		suite.add(buffo.getName, name);

		buffo.getName(buffo.typeOf(value));

		suite.optimise(buffo.typeOf);
		suite.optimise(buffo.getName);

		buffo.getName(buffo.typeOf(value));
	});
});

optimiser.suite('funcs', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		var type = buffo.typeOf(value);
		var key = buffo.getName(type);

		var write = buffo.getWriteFunc(type);
		suite.add(write, 'write ' + key);
		var buffer = buffo.encode(value);
		suite.optimise(write);
		buffo.encode(value);

		// consts are inlined so will never be run/optimized
		if (!buffo.isConst(type)) {
			var parse = buffo.getParseFunc(type);
			suite.add(parse, 'parse ' + key);
			buffo.parse(buffer);
			suite.optimise(parse);
			buffo.parse(buffer);
		}

		var dummy = function() {

		};

		var reader = buffo.reader(dummy);
		var read = buffo.getReadFunc(type);
		suite.add(reader, 'reader ' + key);
		suite.add(read, 'read ' + key);
		reader(buffer);
		suite.optimise(reader);
		suite.optimise(read);
		reader(buffer);

		//var buffer =
	});
});

optimiser.suite('writeToBig', function (suite) {
	function writeToBig(object, push) {
		var arr = Object.keys(object);
		var big = new Buffer(2);
		big.writeUInt8(1, 0);
		big.writeUInt8(arr.length, 1);
		push(big);

		if (object.aa > 1) {
			writeToBig({aa: 1}, push);
		}
		return big;
	}

	suite.add(writeToBig);

	var chunks = buffo.getWriteStream();
	writeToBig({aa: 2}, chunks.push);
	suite.optimise(writeToBig);
	writeToBig({aa: 2}, chunks.push);
});

optimiser.run();
