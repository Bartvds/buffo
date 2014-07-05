'use strict';

var buffo = require('../lib/index');
var original = require('../lib/original');

var helper = require('../lib/helper');

var subject = buffo.encode(helper.getNums(50));

module.exports = {
	name: 'Decode 50',
	tests: {
		'original': function (done) {
			original.decode(subject);
		},
		'current':function (done) {
			buffo.parse(subject);
		}
	}
};
