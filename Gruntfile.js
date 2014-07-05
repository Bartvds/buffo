module.exports = function (grunt) {
	'use strict';

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-benchmark');
	grunt.loadNpmTasks('grunt-shell');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: grunt.util._.extend(grunt.file.readJSON('.jshintrc'), {
				reporter: './node_modules/jshint-path-reporter'
			}),
			support: {
				options: {
					node: true
				},
				src: ['Gruntfile.js', 'tasks/**/*.js']
			},
			src: {
				options: {
					node: true
				},
				src: ['lib/**/*.js']
			},
			test: {
				options: {
					node: true
				},
				src: ['test/**/*.js']
			}
		},
		clean: {
			cruft: [
				'tscommand-*.tmp.txt',
				'dist/.baseDir*',
				'test/tmp/.baseDir*',
				'test/src/.baseDir*'
			],
			dist: [
				'dist/**/*'
			],
			tmp: [
				'tmp/**/*'
			],
			test: [
				'test/tmp/**/*'
			]
		},
		mochaTest: {
			options: {
				reporter: 'mocha-unfunk-reporter',
				timeout: 8000
			},
			all: {
				src: 'test/*.test.js'
			},
			stream: {
				src: 'test/writeBuffer.test.js'
			}
		},
		shell: {
			optimise: {
				options: {},
				command: 'node --allow-natives-syntax test/optimiser.js'
			},
			stream: {
				options: {},
				command: 'node scratch/stream.js'
			}
		},
		benchmark: {
			all: {
				src: ['benchmarks/*.js']
			},
			buffer: {
				src: ['benchmarks/buffer*.js']
			},
			arr50: {
				src: ['benchmarks/50*.js']
			},
			package: {
				src: ['benchmarks/package*.js']
			},
			encode: {
				src: ['benchmarks/*Encode.js']
			},
			decode: {
				src: ['benchmarks/*Decode.js']
			}
		}
	});

	grunt.registerTask('prep', [
		'clean',
		'jshint:support',
		'jshint:src',
	]);

	grunt.registerTask('build', [
		'prep'
	]);

	grunt.registerTask('test', [
		'build',
		'mochaTest:all'
	]);

	grunt.registerTask('run', [
		'mochaTest:stream'
	]);

	grunt.registerTask('dev', [
		'shell:optimise'
	]);

	grunt.registerTask('edit_01', [
		'shell:stream'
	]);

	grunt.registerTask('edit_02', [
		'benchmark:all'
	]);

	grunt.registerTask('edit_03', [
		'benchmark:buffer'
	]);

	grunt.registerTask('edit_04', [
		'benchmark:arr50'
	]);

	grunt.registerTask('edit_05', [
		'benchmark:package'
	]);

	grunt.registerTask('edit_06', [
		'benchmark:encode'
	]);

	grunt.registerTask('edit_07', [
		'benchmark:decode'
	]);

	grunt.registerTask('prepublish', [
		'build',
		'clean:tmp',
		'clean:test'
	]);

	grunt.registerTask('default', ['build']);
};
