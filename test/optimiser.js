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
	'uint8array': new Uint8Array([1, 2, 3, 4, 5]),
	'buffer': new Buffer('abc', 'utf8'),
	'nan': NaN,
	'infPos': Number.POSITIVE_INFINITY,
	'infNeg': Number.NEGATIVE_INFINITY
};

var optimiser = createOptimiser('optimiser');

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

optimiser.suite('writeValue', function (suite) {
	Object.keys(data).forEach(function (name) {
		var value = data[name];
		suite.add(buffo.writeValue, name);

		var chunks;

		chunks = buffo.getWriteStream();
		buffo.writeValue(value, chunks.push);
		suite.optimise(buffo.writeValue);
		chunks = buffo.getWriteStream();
		buffo.writeValue(value, chunks.push);
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

		var dummy = function () {

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

optimiser.suite('array object helper', function (suite) {
	var arr = [1, 2, 3, 4, 5, 6, 7, 8];
	var obj = {a: 1, b: 2, c: [1, 2, 3]};
	suite.add(buffo.writeObject);
	suite.add(buffo.writeArray);
	buffo.encode(arr);
	buffo.encode(obj);
	suite.optimise();
	buffo.encode(arr);
	buffo.encode(obj);
});

optimiser.suite('buffer', function (suite) {
	var arr = new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]);

	suite.add(buffo.toBuffer);
	suite.add(buffo.toArrayBuffer);

	buffo.toArrayBuffer(buffo.toBuffer(arr.buffer));
	suite.optimise();
	buffo.toArrayBuffer(buffo.toBuffer(arr.buffer));

});

optimiser.run();
