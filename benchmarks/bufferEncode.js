'use strict';

var buffo = require('../lib/index');
var original = require('../lib/original');

var helper = require('../lib/helper');

var subject = helper.getBuffers(1024 * 1024, 10);

module.exports = {
	name: 'Encode Buffers',
	tests: {
		'original': function () {
			original.encode(subject);
		},
		'current': function () {
			buffo.encode(subject);
		}
	}
};
