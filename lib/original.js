/* jshint -W098 */
/* jshint -W003 */

'use strict';

var BufferList = require('bl');
var stream = require('stream');
var duplexer2 = require('duplexer2');

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
var typeMap = Object.create(null);

function createType(name, write, read) {
	var type = typeArr.length;
	typeMap[name] = type;
	typeArr[type] = name;
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
		buffer.writeUInt32LE(tmp.length, 0);
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
var _buffer = new Buffer(1);

// 0
var DUMMY = createType('dummy', function (value, push) {
	push(_null);
}, getConstReader('<dummy>'));

var NULL = createType('null', function (value, push) {
	push(_null);
}, getConstReader(null));
var TRUE = createType('true', function (value, push) {
	push(_true);
}, getConstReader(true));
var FALSE = createType('false', function (value, push) {
	push(_false);
}, getConstReader(false));
var UNDEFINED = createType('undefined', function (value, push) {
	push(_undefined);
}, getConstReader(undefined));

var UNKNOWN = createType('unknown', function (value, push) {
	// push(_unknown);
}, getConstReader(undefined));
var STRING = createType('string', function (value, push) {
	var buffer = new Buffer(1 + 2);
	buffer.writeUInt8(STRING, 0);
	var tmp = new Buffer(value, 'utf8');
	buffer.writeUInt16LE(tmp.length, 1);
	push(buffer);
	push(tmp);
}, stringReader);

var NUMBER = createType('number', function (value, push) {
	if (isNaN(value)) {
		bail('number', 'NaN');
	}
	if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
		bail('number', 'Infinity');
	}
	var buffer = new Buffer(1 + 8);
	buffer.writeUInt8(NUMBER, 0);
	buffer.writeDoubleLE(value, 1);
	push(buffer);
}, numberReader);

var ARRAY = createType('array', function (value, push) {
	var buffer = new Buffer(1 + 4);
	buffer.writeUInt8(ARRAY, 0);
	buffer.writeUInt32LE(value.length, 1);
	push(buffer);
	writeArray(value, value.length, push);
}, arrayReader);

var ARGUMENTS = createType('arguments', writeArr[ARRAY]);

var BUFFER = createType('buffer', function (value, push) {
	var buffer = new Buffer(1 + 4);
	_buffer.copy(buffer, 0, 0, 1);
	buffer.writeUInt32LE(value.length, 1);
	push(buffer);
	push(value);
}, bufferReader);

var OBJECT = createType('object', function (value, push) {
	var keys = Object.keys(value);
	var buffer = new Buffer(1 + 4);
	buffer.writeUInt8(OBJECT, 0);
	buffer.writeUInt32LE(keys.length, 1);
	push(buffer);
	writeObject(value, keys, push);
}, objectReader);

var DATE = createType('date', function (value, push) {
	var buffer = new Buffer(1 + 8);
	buffer.writeUInt8(DATE, 0);
	buffer.writeDoubleLE(value.getTime(), 1);
	push(buffer);
}, dateReader);
var REGEXP = createType('regexp', function (value, push) {
	var buffer = new Buffer(1 + 2);
	buffer.writeUInt8(REGEXP, 0);
	var tmp = new Buffer(String(value), 'utf8');
	buffer.writeUInt16LE(tmp.length, 1);
	push(buffer);
	push(tmp);
}, regexReader);
var FUNCTION = createType('function', function (value, push) {

});
_true.writeUInt8(TRUE);
_false.writeUInt8(FALSE);
_null.writeUInt8(NULL);
_undefined.writeUInt8(UNDEFINED);
_unknown.writeUInt8(UNKNOWN);
_buffer.writeUInt8(BUFFER);

var natives = Object.create(null);

natives['[object Array]'] = ARRAY;
natives['[object RegExp]'] = REGEXP;
natives['[object Function]'] = FUNCTION;
natives['[object Arguments]'] = ARGUMENTS;
natives['[object Date]'] = DATE;

var toString = Object.prototype.toString;

function typeOf(value) {
	var key = typeof value;
	switch (key) {
		case 'string':
			return STRING;
		case 'number':
			return NUMBER;
		case 'boolean':
			return value ? TRUE : FALSE;
		case 'undefined':
			return UNDEFINED;
		case 'object':
			if (value === null) {
				return NULL;
			}
			if (value instanceof Buffer) {
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

function bail(type, message, pointer) {
	throw new Error('bad type ' + type + ( typeof pointer === 'number' ? ' at ' + pointer : '') + ' ' + message);
}

function writeValue(value, push) {
	writeArr[typeOf(value)](value, push);
}

function encode(value) {
	var stream = getWriteStream();
	writeValue(value, stream.push);
	return stream.join();
}

function decode(source) {
	var ret = null;
	readValue(source, 0, function (value) {
		ret = value;
	});
	return ret;
}

function parseRegex(str) {
	var match = str.match(/^\/(.+?)\/([a-z]*)$/);
	return new RegExp(match[1], (match[2] || ''));
}

function getName(type) {
	if (type >= 0 && type < typeArr.length) {
		return typeArr[type];
	}
	return typeArr[UNKNOWN];
}

function getType(name) {
	if (name in typeMap) {
		return typeMap[name];
	}
	return UNKNOWN;
}

function getWriteFunc(type) {
	return writeArr[type];
}

function peekInfo(source, pointer) {
	return getName(source.readUInt8(pointer));
}

function readValue(source, pointer, push) {
	var type = source.readUInt8(pointer);
	pointer += 1;

	var length = 0;
	var i = 0;
	var func;

	switch (type) {
		case STRING:
			length = source.readUInt16LE(pointer);
			pointer += 2;
			//push(source.slice(pointer, pointer + length).toString('utf8'));
			push(source.toString('utf8', pointer, pointer + length));
			pointer += length;
			break;
		case NUMBER:
			push(source.readDoubleLE(pointer));
			pointer += 8;
			break;
		case TRUE:
			push(true);
			break;
		case FALSE:
			push(false);
			break;
		case NULL:
			push(null);
			break;
		case ARRAY:
			length = source.readUInt32LE(pointer);
			pointer += 4;
			var arr = [];
			func = function (value) {
				arr.push(value);
			};
			for (i = 0; i < length; i++) {
				pointer = readValue(source, pointer, func);
			}
			push(arr);
			break;
		case OBJECT:
			length = source.readUInt32LE(pointer);
			pointer += 4;
			var key;
			var propFunc = function (value) {
				object[key] = value;
			};
			var object = {};
			for (i = 0; i < length; i++) {
				var keyLen = source.readUInt32LE(pointer);
				pointer += 4;
				key = source.toString('utf8', pointer, pointer + keyLen);
				pointer += keyLen;
				pointer = readValue(source, pointer, propFunc);
			}
			push(object);
			break;
		case BUFFER:
			length = source.readUInt32LE(pointer);
			pointer += 4;
			push(source.slice(pointer, pointer + length));
			pointer += length;
			break;
		case DATE:
			push(new Date(source.readDoubleLE(pointer)));
			pointer += 8;
			break;
		case REGEXP:
			length = source.readUInt16LE(pointer);
			pointer += 2;
			//push(source.slice(pointer, pointer + length).toString('utf8'));
			push(parseRegex(source.toString('utf8', pointer, pointer + length)));
			pointer += length;
			break;
		case UNDEFINED:
			push(undefined);
			break;
		default:
			bail(type, 'unknown', pointer);
	}
	return pointer;
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
			var value = source.readDoubleLE(0);
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
				length = source.readUInt16LE(0);
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
				length = source.readUInt32LE(0);
				source.consume(4);
				if (length === 0) {
					callback(assemble);
					return;
				}
				// valueRead();
				mill.push(valueRead);
			}
		}
		else {
			// valueRead();
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
	var keyRead = function() {
		if (keyLen === 0 && source.length >= 4) {
			keyLen = source.readUInt32LE(0);
			source.consume(4);
		}
		if (keyLen > 0 && source.length >= keyLen) {
			key = source.toString('utf8', 0, keyLen);
			source.consume(keyLen);
			nextRead = valueRead;
			keyLen = 0;
			// nextRead();
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
			// nextRead();
			mill.push(nextRead);
		}
	});
	var nextRead = keyRead;
	return function () {
		if (length === 0) {
			if (source.length >= 4) {
				length = source.readUInt32LE(0);
				source.consume(4);
				if (length === 0) {
					callback(assemble);
					return;
				}
				nextRead();
			}
		}
		else {
			nextRead();
		}
	};
}

function bufferReader(mill, source, callback) {
	var length = 0;
	return function () {
		if (length === 0) {
			if (source.length >= 4) {
				length = source.readUInt32LE(0);
				source.consume(4);
				if (length === 0) {
					callback('');
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
				length = source.readUInt16LE(0);
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
			var value = new Date(source.readDoubleLE(0));
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
		if (mill.length > 0) {
			var len = mill.length;
			while (mill.length > 0) {
				mill.pop()();
			}
		}
	};
}

function encodeStream() {
	var writable = new stream.Writable({objectMode: true});
	var readable = new stream.Readable({objectMode: false});

	function push(value) {
		readable.push(value);
	}
	writable._write = function _write(input, encoding, done) {
		writeValue(input, push);
		done();
	};
	readable._read = function _read() {
		// no-op
	};
	return duplexer2(writable, readable);
}

function decodeStream() {
	var writable = new stream.Writable({objectMode: false});
	var readable = new stream.Readable({objectMode: true});

	var chunks = getChunkReader(function (value) {
		readable.push(value);
	});
	writable._write = function _write(input, encoding, done) {
		chunks(input);
		done();
	};
	readable._read = function _read() {
		// no-op
	};
	return duplexer2(writable, readable);
}

module.exports = {
	decodeStream: decodeStream,
	encodeStream: encodeStream,
	getChunkReader: getChunkReader,
	getWriteStream: getWriteStream,
	peekInfo: peekInfo,
	typeOf: typeOf,
	getName: getName,
	getType: getType,
	getWriteFunc: getWriteFunc,
	readValue: readValue,
	writeValue: writeValue,
	encode: encode,
	decode: decode
};
