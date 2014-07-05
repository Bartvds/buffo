'use strict';

exports.getNums = function (amount) {
	var num = [];
	for (var i = 0; i < amount; i++) {
		num.push(i);
	}
	return num;
};

exports.getNumQuare = function (first, second) {
	var num = [];
	for (var i = 0; i < first; i++) {
		var arr = [];
		for (var j = i; j < i + second; j++) {
			arr.push(j);
		}
		num.push(arr);
	}
	return num;
};

exports.getBuffers = function (size, amount) {
	amount = amount || 1;
	var num = [];
	for (var i = 0; i < amount; i++) {
		num.push(i);
	}
	return num;
};

var long = '        ';

exports.pad = function (str, len) {
	var add = len - str.length;
	if (long.length < add) {
		for (var i = 0; i < add + 8; i += 4) {
			long += '    ';
		}
	}
	return str + long.substr(0, add);
};
