'use strict';

var buffo = require('../lib/index');
var original = require('../lib/original');

var subject = new Buffer(1024 * 1024);

module.exports = {
	name: 'Encode package.json',
	tests: {
		'original': function () {
			original.encode(subject);
		},
		'current': function () {
			buffo.encode(subject);
		}
	}
};
