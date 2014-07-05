'use strict';

var buffo = require('../lib/index');
var original = require('../lib/original');

var helper = require('../lib/helper');

var subject = buffo.encode(helper.getBuffers(1024 * 1024, 10));

module.exports = {
	name: 'Decode Buffers',
	tests: {
		'original': function () {
			original.decode(subject);
		},
		'current': function () {
			buffo.parse(subject);
		}
	}
};
