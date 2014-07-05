'use strict';

var buffo = require('../lib/index');
var original = require('../lib/original');

var pkg = require('../package');
var subject = buffo.encode(pkg);

module.exports = {
	name: 'Decode package.json',
	tests: {
		'original': function () {
			original.decode(subject);
		},
		'current': function () {
			buffo.parse(subject);
		}
	}
};
