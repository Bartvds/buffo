'use strict';

var from = require('from');
var through2 = require('through2');

var buffo = require('../lib/index');
var chai = require('chai');
var assert = chai.assert;

describe('buffo', function () {
	it('exists', function () {
		assert.isObject(buffo);
	});
});

function testData(data) {
	Object.keys(data).forEach(function (key) {
		var test = data[key];
		it(key, function () {

			assert.strictEqual(buffo.getName(buffo.typeOf(test.value)), test.type, 'type');

			var buffer = buffo.encode(test.value);
			var parsed = buffo.parse(buffer);

			var type = buffo.peekInfo(buffer, 0);

			var values = buffo.getWriteStream();
			var pointer = buffo.parseValue(buffer, 0, values.push);

			if (typeof test.length === 'number') {
				assert.strictEqual(buffer.length, test.length, 'length');
				assert.strictEqual(pointer, test.length, 'pointer');
			}

			assert.strictEqual(type, test.type, 'type');

			assert.deepEqual(parsed, test.value, 'transformed');
		});
	});
}

describe('bulk', function () {
	describe('primitives', function () {
		testData({
			'true': {
				value: true,
				type: 'true',
				length: 1
			},
			'false': {
				value: false,
				type: 'false',
				length: 1
			},
			'null': {
				value: null,
				type: 'null',
				length: 1
			},
			'undefined': {
				value: undefined,
				type: 'undefined',
				length: 1
			}
		});
	});

	describe('numbers', function () {
		testData({
			'num-1': {
				value: 1,
				type: 'number',
				length: 1 + 8
			},
			'num-200': {
				value: 200,
				type: 'number',
				length: 1 + 8
			},
			'num-12345': {
				value: 12345,
				type: 'number',
				length: 1 + 8
			}
		});
	});

	describe('string', function () {
		testData({
			// 'string-empty': '',
			'string-a': {
				value: 'a',
				type: 'string',
				length: 1 + 2 + 1
			},
			'string-abc': {
				value: 'abc',
				type: 'string',
				length: 1 + 2 + 3
			},
			'string-xyz': {
				value: 'zxy wvw 321',
				type: 'string',
				length: 1 + 2 + 11
			}
		});
	});

	describe('array', function () {
		testData({
			// 'array-empty': [],
			'array-true': {
				value: [true],
				type: 'array',
				length: 1 + 4 + 1
			},
			'array-1': {
				value: [1],
				type: 'array',
				length: 1 + 4 + (1 + 8)
			},
			'array-true-false': {
				value: [true, false],
				type: 'array',
				length: 1 + 4 + 1 * 2
			},
			'array-abc': {
				value: ['abc'],
				type: 'array',
				length: 1 + 4 + (1 + 2 + 3)
			},
			'array-1,2,3': {
				value: [1, 2, 3],
				type: 'array',
				length: 1 + 4 + (1 + 8) * 3
			},
			'array-a,b': {
				value: ['a', 'b'],
				type: 'array',
				length: 1 + 4 + (1 + 2 + 1) * 2
			}
		});
	});

	describe('object', function () {
		testData({
			// 'object-empty': {},
			'object-a': {
				value: {a: 1},
				type: 'object'
			},
			'object-abc': {
				value: {aa: 1, bb: 'bbbb', cc: false, dd: null},
				type: 'object'
			},
			'object-nested': {
				value: {aa: [1, 2, 3], bb: ['b', 'bb', 'bbbb'], cc: {aa: 1, bb: 'bbbb', cc: [1, 2, 3], dd: null}},
				type: 'object'
			}
		});
	});

	describe('buffer', function () {
		testData({
			'buffer-empty': {
				value: new Buffer(0),
				type: 'buffer'
			},
			'buffer-a': {
				value: new Buffer('a', 'utf8'),
				type: 'buffer'
			},
			'buffer-abc': {
				value: new Buffer('abc', 'utf8'),
				type: 'buffer'
			},
			'buffer-xyz': {
				value: new Buffer('zxywv321', 'utf8'),
				type: 'buffer'
			}
		});
	});

	describe('specials', function () {
		testData({
			'date-now': {
				value: new Date(),
				type: 'date'
			},
			'regexp-simple': {
				value: /[a-z]+/,
				type: 'regexp'
			},
			'regexp-flags': {
				value: /0-9+/gmi,
				type: 'regexp'
			},
			'nan': {
				value: NaN,
				type: 'nan'
			},
			'infPos': {
				value: Number.POSITIVE_INFINITY,
				type: 'infPos'
			},
			'infNeg': {
				value: Number.NEGATIVE_INFINITY,
				type: 'infNeg'
			}
		});
	});

	describe('stream', function () {var numsLots = [];
		var numsLots = [];
		for (var i = 0; i < 150; i++) {
			numsLots.push(i);
		}

		var objects = [
			1,
			123,
			'abcdefg',
			true,
			false,
			[4, 3, 2, 1],
			{a: 1, b: 2},
			{a: 1, b: true, c: [9, 8, 7]},
			new Buffer(1024),
			new Date(),
			/aa/g,
			'a b c d e f g h',
			'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
			numsLots
		];
		it('encodes/parses', function (done) {
			var th1 = through2.obj(function (chunk, enc, callback) {
				var that = this;
				setTimeout(function() {
					that.push(chunk);
					callback()
				}, 1);
			});
			var th2 = through2(function (chunk, enc, callback) {
				assert(chunk instanceof Buffer, 'expected chunk top be a Buffer');
				var that = this;
				setTimeout(function() {
					that.push(chunk);
					callback()
				}, 1);
			});
			var actual = [];
			var pipe = from(objects).pipe(th1).pipe(buffo.encodeStream()).pipe(th2).pipe(buffo.decodeStream());
			pipe.on('data', function (data) {
				actual.push(data);
				if (actual.length === objects.length) {
					assert.deepEqual(actual, objects);
					done();
				}
			});
		});
	});
});
