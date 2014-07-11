/* jshint -W098 */
/* jshint -W003 */

'use strict';

var stream = require('stream');
var assert = require('assert');

var BufferList = require('bl');

function parseRegex(str) {
	var match = str.match(/^\/(.+?)\/([a-z]*)$/);
	return new RegExp(match[1], (match[2] || ''));
}

function getWriteStream() {
	var stream = {
		chunks: [],
		push: function (chunk) {
			stream.chunks.push(chunk);
		},
		join: function () {
			return Buffer.concat(stream.chunks);
		}
	};
	return stream;
}

var typeArr = [];
var writeArr = [];
var readArr = [];
var constArr = [];
var typeMap = Object.create(null);

function createType(name, cons, write, read) {
	var type = typeArr.length;
	typeMap[name] = type;
	typeArr[type] = name;
	constArr[type] = cons;
	writeArr[type] = write;
	readArr[type] = read;
	return type;
}

function writeArray(arr, len, push) {
	for (var i = 0; i < len; i++) {
		var v = arr[i];
		writeArr[typeOf(v)](v, push);
	}
}

function writeObject(obj, keys, push) {
	for (var i = 0, ii = keys.length; i < ii; i++) {
		var key = keys[i];
		var buffer = new Buffer(4);
		var tmp = new Buffer(key, 'utf8');
		buffer.writeUInt32BE(tmp.length, 0);
		push(buffer);
		push(tmp);
		var v = obj[key];
		writeArr[typeOf(v)](v, push);
	}
}

var _true = new Buffer(1);
var _false = new Buffer(1);
var _null = new Buffer(1);
var _undefined = new Buffer(1);
var _unknown = new Buffer(1);
var _nan = new Buffer(1);
var _infPos = new Buffer(1);
var _infNeg = new Buffer(1);

// 0
var DUMMY = createType('dummy',
	function () {
	},
	getConstReader('<dummy>')
);
var NULL = createType('null', true, getConstWrite(_null), getConstReader(null));
var TRUE = createType('true', true, getConstWrite(_true), getConstReader(true));
var FALSE = createType('false', true, getConstWrite(_false), getConstReader(false));
var NAN = createType('nan', true, getConstWrite(_nan), getConstReader(NaN));
var INF_POS = createType('infPos', true, getConstWrite(_infPos), getConstReader(Number.POSITIVE_INFINITY));
var INF_NEG = createType('infNeg', true, getConstWrite(_infNeg), getConstReader(Number.NEGATIVE_INFINITY));
var UNDEFINED = createType('undefined', true, getConstWrite(_undefined), getConstReader(undefined));

var UNKNOWN = createType('unknown', false, function () {
}, getConstReader(undefined));
var STRING = createType('string', false, stringWrite, stringReader);
var NUMBER = createType('number', false, numberWrite, numberReader);

var ARRAY = createType('array', false, arrayWrite, arrayReader);
var ARGUMENTS = createType('arguments', false, writeArr[ARRAY], readArr[ARRAY]);
var BUFFER = createType('buffer', false, bufferWrite, bufferReader);
var OBJECT = createType('object', false, objectWrite, objectReader);
var DATE = createType('date', false, dateWrite, dateReader);
var REGEXP = createType('regexp', false, regexWrite, regexReader);

var INT8ARRAY = createType('int8array', false, null, null);
var UINT8ARRAY = createType('uint8array', false, null, null);
var INT16ARRAY = createType('int16array', false, null, null);
var UINT16ARRAY = createType('uint16array', false, null, null);

var INT32ARRAY = createType('int32array', false, null, null);
var UINT32ARRAY = createType('uint32array', false, null, null);
var FLOAT32ARRAY = createType('float32array', false, null, null);
var FLOAT64ARRAY = createType('float64array', false, null, null);

var UINT8CLAMPEDARRAY = createType('uint8clampedarray', false, null, null);

setTypeArr(INT8ARRAY, Int8Array);
setTypeArr(UINT8ARRAY, Uint8Array);
setTypeArr(INT16ARRAY, Int16Array);
setTypeArr(UINT16ARRAY, Uint16Array);

setTypeArr(INT32ARRAY, Int32Array);
setTypeArr(UINT32ARRAY, Uint32Array);
setTypeArr(FLOAT32ARRAY, Float32Array);
setTypeArr(FLOAT64ARRAY, Float64Array);

setTypeArr(UINT8CLAMPEDARRAY, Uint8ClampedArray || UINT8ARRAY);

_true.writeUInt8(TRUE, 0);
_false.writeUInt8(FALSE, 0);
_null.writeUInt8(NULL, 0);
_undefined.writeUInt8(UNDEFINED, 0);
_unknown.writeUInt8(UNKNOWN, 0);
_nan.writeUInt8(NAN, 0);
_infPos.writeUInt8(INF_POS, 0);
_infNeg.writeUInt8(INF_NEG, 0);

function getConstWrite(buffer) {
	return function (value, push) {
		push(buffer);
	};
}

function toArrayBuffer(buffer) {
	return new Uint8Array(buffer).buffer;
}

function toBuffer(ab) {
	return new Buffer(new Uint8Array(ab));
}

function setTypeArr(type, Constr) {
	writeArr[type] = function (value, push) {
		var b = toBuffer(value.buffer);
		var buffer = new Buffer(1 + 4);
		buffer.writeUInt8(type, 0);
		buffer.writeUInt32BE(b.length, 1);
		push(buffer);
		push(b);
	};
	readArr[type] = function (mill, source, callback) {
		var length = 0;
		return function () {
			if (length === 0) {
				if (source.length >= 4) {
					length = source.readUInt32BE(0);
					source.consume(4);
					if (length === 0) {
						callback('');
						return;
					}
				}
			}
			if (length > 0 && source.length >= length) {
				var buffer = source.slice(0, length);
				var ab = toArrayBuffer(buffer);
				var value = new Constr(ab);
				source.consume(length);
				callback(value);
			}
		};
	};
}

function stringWrite(value, push) {
	var tmp = new Buffer(value, 'utf8');
	var buffer = new Buffer(1 + 2);
	buffer.writeUInt8(STRING, 0);
	buffer.writeUInt16BE(tmp.length, 1);
	push(buffer);
	push(tmp);
}

function numberWrite(value, push) {
	var buffer = new Buffer(1 + 8);
	buffer.writeUInt8(NUMBER, 0);
	buffer.writeDoubleBE(value, 1);
	push(buffer);
}

function bufferWrite(value, push) {
	var buffer = new Buffer(1 + 4);
	buffer.writeUInt8(BUFFER, 0);
	buffer.writeUInt32BE(value.length, 1);
	push(buffer);
	push(value);
}

function arrayWrite(value, push) {
	var buffer = new Buffer(1 + 4);
	buffer.writeUInt8(ARRAY, 0);
	buffer.writeUInt32BE(value.length, 1);
	push(buffer);
	writeArray(value, value.length, push);
}

function objectWrite(value, push) {
	var keys = Object.keys(value);
	var buffer = new Buffer(1 + 4);
	buffer.writeUInt8(OBJECT, 0);
	buffer.writeUInt32BE(keys.length, 1);
	push(buffer);
	writeObject(value, keys, push);
}

function dateWrite(value, push) {
	var buffer = new Buffer(1 + 8);
	buffer.writeUInt8(DATE, 0);
	buffer.writeDoubleBE(value.getTime(), 1);
	push(buffer);
}

function regexWrite(value, push) {
	var buffer = new Buffer(1 + 2);
	buffer.writeUInt8(REGEXP, 0);
	var tmp = new Buffer(String(value), 'utf8');
	buffer.writeUInt16BE(tmp.length, 1);
	push(buffer);
	push(tmp);
}

var natives = Object.create(null);

natives['[object Array]'] = ARRAY;
natives['[object RegExp]'] = REGEXP;
// natives['[object Function]'] = FUNCTION;
natives['[object Arguments]'] = ARGUMENTS;
natives['[object Date]'] = DATE;

natives['[object Uint8ClampedArray]'] = UINT8CLAMPEDARRAY;

natives['[object Int8Array]'] = INT8ARRAY;
natives['[object Uint8Array]'] = UINT8ARRAY;
natives['[object Int16Array]'] = INT16ARRAY;
natives['[object Uint16Array]'] = UINT16ARRAY;

natives['[object Int32Array]'] = INT32ARRAY;
natives['[object Uint32Array]'] = UINT32ARRAY;
natives['[object Float32Array]'] = FLOAT32ARRAY;
natives['[object Float64Array]'] = FLOAT64ARRAY;

var toString = Object.prototype.toString;

function typeOf(value) {
	var key = typeof value;
	switch (key) {
		case 'string':
			return STRING;
		case 'number':
			if (isNaN(value)) {
				return NAN;
			}
			if (value === Number.POSITIVE_INFINITY) {
				return INF_POS;
			}
			if (value === Number.NEGATIVE_INFINITY) {
				return INF_NEG;
			}
			return NUMBER;
		case 'boolean':
			return value ? TRUE : FALSE;
		case 'undefined':
			return UNDEFINED;
		case 'object':
			if (value === null) {
				return NULL;
			}
			if (Buffer.isBuffer(value)) {
				return BUFFER;
			}
			key = toString.call(value);
			if (key in natives) {
				return natives[key];
			}
			return OBJECT;
		default:
			return UNKNOWN;
	}
}

function writeValue(value, push) {
	writeArr[typeOf(value)](value, push);
}

function encode(value) {
	var stream = getWriteStream();
	writeValue(value, stream.push);
	return stream.join();
}

function parse(source) {
	var ret = null;
	var reader = getChunkReader(function (value) {
		ret = value;
	});
	reader(source);
	return ret;
}

function getName(type) {
	if (type >= 0 && type < typeArr.length) {
		return typeArr[type];
	}
	return typeArr[UNKNOWN];
}

function isConst(type) {
	if (type >= 0 && type < typeArr.length && constArr[type]) {
		return true;
	}
	return false;
}

function getType(name) {
	if (name in typeMap) {
		return typeMap[name];
	}
	return UNKNOWN;
}

function peekInfo(source, pointer) {
	return getName(source.readUInt8(pointer));
}

function getWriteFunc(type) {
	return writeArr[type];
}

function getReadFunc(type) {
	return readArr[type];
}

function getConstReader(value) {
	return function (mill, source, callback) {
		return function () {
			callback(value);
		};
	};
}

function numberReader(mill, source, callback) {
	return function () {
		if (source.length >= 8) {
			var value = source.readDoubleBE(0);
			source.consume(8);
			callback(value);
		}
	};
}

function stringReader(mill, source, callback) {
	var length = 0;
	return function () {
		if (length === 0) {
			if (source.length >= 2) {
				length = source.readUInt16BE(0);
				source.consume(2);
				if (length === 0) {
					callback('');
					return;
				}
			}
		}
		if (length > 0 && source.length >= length) {
			var value = source.toString('utf8', 0, length);
			source.consume(length);
			length = 0;
			callback(value);
		}
	};
}

function arrayReader(mill, source, callback) {
	var length = 0;
	var assemble = [];
	var valueRead = valueReader(mill, source, function (value) {
		assemble.push(value);
		if (assemble.length === length) {
			length = 0;
			callback(assemble);
			return;
		}
		mill.push(valueRead);
		//valueRead();
	});
	return function () {
		if (length === 0) {
			if (source.length >= 4) {
				length = source.readUInt32BE(0);
				source.consume(4);
				if (length === 0) {
					callback(assemble);
					return;
				}
				mill.push(valueRead);
			}
		}
		else {
			mill.push(valueRead);
		}
	};
}

function objectReader(mill, source, callback) {
	var length = 0;
	var i = 0;
	var assemble = {};
	var key = null;
	var keyLen = 0;
	var keyRead = function () {
		if (keyLen === 0 && source.length >= 4) {
			keyLen = source.readUInt32BE(0);
			source.consume(4);
		}
		if (keyLen > 0 && source.length >= keyLen) {
			key = source.toString('utf8', 0, keyLen);
			source.consume(keyLen);
			nextRead = valueRead;
			keyLen = 0;
			mill.push(nextRead);
		}
	};
	var valueRead = valueReader(mill, source, function (value) {
		assemble[key] = value;
		i++;
		if (i === length) {
			callback(assemble);
		}
		else {
			nextRead = keyRead;
			mill.push(nextRead);
		}
	});
	var nextRead = keyRead;
	return function () {
		if (length === 0) {
			if (source.length >= 4) {
				length = source.readUInt32BE(0);
				source.consume(4);
				if (length === 0) {
					callback(assemble);
					return;
				}
				mill.push(nextRead);
			}
		}
		else {
			mill.push(nextRead);
		}
	};
}

function bufferReader(mill, source, callback) {
	var length = 0;
	return function () {
		if (length === 0) {
			if (source.length >= 4) {
				length = source.readUInt32BE(0);
				source.consume(4);
				if (length === 0) {
					callback(new Buffer(0));
					return;
				}
			}
		}
		if (length > 0 && source.length >= length) {
			var value = source.slice(0, length);
			source.consume(length);
			callback(value);
		}
	};
}

function regexReader(mill, source, callback) {
	var length = 0;
	return function () {
		if (length === 0) {
			if (source.length >= 2) {
				length = source.readUInt16BE(0);
				source.consume(2);
				if (length === 0) {
					callback('');
					return;
				}
			}
		}
		if (length > 0 && source.length >= length) {
			var value = parseRegex(source.toString('utf8', 0, length));
			source.consume(length);
			callback(value);
		}
	};
}

function dateReader(mill, source, callback) {
	return function () {
		if (source.length >= 8) {
			var value = new Date(source.readDoubleBE(0));
			source.consume(8);
			callback(value);
		}
	};
}

function valueReader(mill, source, callback) {
	var type = 0;
	var done = function (value) {
		current = typeReader;
		callback(value);
	};
	var typeReader = function () {
		if (source.length > 0) {
			type = source.readUInt8(0);
			source.consume(1);
			if (!(type in typeArr)) {
				throw new Error('unknown type ' + type);
			}
			current = readArr[type](mill, source, done);
			mill.push(current);
			// current();
		}
	};
	var current = typeReader;
	return function () {
		current();
	};
}

function getChunkReader(callback) {
	var mill = [];
	var source = new BufferList();

	var reader = valueReader(mill, source, function (value) {
		callback(value);
	});

	return function (chunk) {
		source.append(chunk);
		reader();
		while (mill.length > 0) {
			mill.pop()();
		}
	};
}

function encodeStream() {
	var transform = new stream.Transform({objectMode: true});

	function push(value) {
		transform.push(value);
	}

	transform._transform = function (chunk, encoding, done) {
		writeValue(chunk, push);
		done();
	};
	return transform;
}

function decodeStream() {
	var transform = new stream.Transform({objectMode: true});
	var chunks = getChunkReader(function (value) {
		transform.push(value);
	});
	transform._transform = function (chunk, encoding, done) {
		chunks(chunk);
		done();
	};
	return transform;
}

module.exports = {
	toArrayBuffer: toArrayBuffer,
	toBuffer: toBuffer,
	writeArray: writeArray,
	writeObject: writeObject,
	encodeStream: encodeStream,
	decodeStream: decodeStream,
	getWriteStream: getWriteStream,
	isConst: isConst,
	peekInfo: peekInfo,
	typeOf: typeOf,
	getName: getName,
	getType: getType,
	getWriteFunc: getWriteFunc,
	getReadFunc: getReadFunc,
	writeValue: writeValue,
	reader: getChunkReader,
	encode: encode,
	parse: parse
};
