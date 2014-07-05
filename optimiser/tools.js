'use strict';

function getStatus(fn) {
	var status = %GetOptimizationStatus(fn); // jshint ignore:line
	switch (status) {
		case 4:
			return {
				ok: false,
				status: status,
				label: 'never optimized'
			};
		case 2:
			return {
				ok: false,
				status: status,
				label: 'not optimized'
			};
		case 6:
			return {
				ok: false,
				status: status,
				label: 'maybe deoptimized'
			};
		case 1:
			return {
				ok: true,
				status: status,
				label: 'optimized'
			};
		case 3:
			return {
				ok: true,
				status: status,
				label: 'always optimized'
			};
	}
}

function optimise(fn) {
	%OptimizeFunctionOnNextCall(fn); // jshint ignore:line
}


module.exports = {
	optimise: optimise,
	getStatus: getStatus
};
