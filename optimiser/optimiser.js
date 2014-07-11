/* jshint -W003 */
'use strict';

var colors = require('ansicolors');

var tools = require('./tools');
var helper = require('../lib/helper');

function getFuncName(f) {
	if (f.name) {
		return f.name;
	}
	var match = f.toString().match(/function+\s{1,}([a-zA-Z_0-9]*)/);
	if (match) {
		return match[1];
	}
	return null;
}

function create(name) {
	var suites = [];

	var handle = {
		suite: function (name, test) {
			var suite = getSuite(name, test);
			suites.push(suite);
			return suite;
		},
		optimise: function () {
			suites.forEach(function (s) {
				s.optimise();
			});
		},
		run: function () {
			suites.forEach(function (s) {
				s.run();
			});

			var report = handle.report();
			process.stdout.write(report.output);
			if (!report.success) {
				process.exit(1);
			}
		},
		report: function () {
			var ret = name + '\n---\n';
			var success = true;
			suites.forEach(function (s) {
				var report = s.report();
				ret += report.output;
				success = success && report.success;
				ret += '\n';
			});
			return {
				output: ret,
				success: success
			};
		}
	};
	return handle;
}

function getSuite(name, test) {
	var funcs = [];
	var suite = {
		add: function (func, name) {
			if (Array.isArray(func)) {
				func.forEach(function (f) {
					suite.add(f, name);
				});
			}
			else {
				funcs.push({func: func, case: name});
			}
		},
		optimise: function (f) {
			if (f) {
				tools.optimise(f);
			}
			else {
				funcs.forEach(function (f) {
					tools.optimise(f.func);
				});
			}
		},
		run: function () {
			test({
				add: suite.add,
				optimise: suite.optimise
			});
		},
		getStatus: function () {
			var ret = [];
			funcs.forEach(function (f) {
				var status = tools.getStatus(f.func);
				status.name = getFuncName(f.func) || '<anon>';
				status.case = f.case;
				ret.push(status);
			});
			return ret;
		},
		report: function () {
			var statuses = suite.getStatus();
			var success = true;

			var nameLen = 0;
			var caseLen = 0;
			var labelLen = 0;

			var failure = 0;
			var ret = '';

			statuses.forEach(function (status) {
				nameLen = Math.max(nameLen, status.name.length);
				caseLen = Math.max(caseLen, (status.case ? status.case.length : ''));
				labelLen = Math.max(labelLen, status.label.length);
			});

			ret += 'Suite "' + name + '"' + '\n';
			ret += '\n';

			statuses.forEach(function (status) {
				ret += (status.ok ? colors.green('>>') : colors.red('>>')) + ' ';
				ret += helper.pad(status.name, nameLen);
				if (status.case) {
					ret += (status.ok ? colors.green('  >  ') : colors.red('  >  '));
					ret += helper.pad(status.case, caseLen);
				}
				ret += '  ' + (status.ok ? colors.green('OK ') : colors.red('NOT'));
				ret += '  ' + helper.pad(status.label, labelLen);
				ret += '\n';
				success = success && status.ok;
				if (!status.ok) {
					failure++;
				}
			});
			ret += '\n';
			if (failure > 0) {
				ret += colors.red(failure + ' slow');
				ret +=  ' of ' + colors.yellow(statuses.length + ' tested');
			}
			else {
				ret += colors.green('all optimal');
				ret +=  ' of ' + colors.cyan(statuses.length + ' tested');
			}
			ret += '\n';
			return {
				output: ret,
				success: success
			};
		}
	};

	return suite;
}

module.exports = create;

