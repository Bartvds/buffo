'use strict';

var assert = require('assert');
var update = require('../lib/index');
var original = require('../lib/original');
assert.ok(original);
var helper = require('../lib/helper');

var subject = helper.getNums(50);

module.exports = {
	name: 'Encode 50',
	tests: {
		'original': function () {
			original.encode(subject);
		},
		'current': function () {
			update.encode(subject);
		}
	}
};
