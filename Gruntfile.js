module.exports = function (grunt) {
	'use strict';

	require('source-map-support').install();

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
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
				src: ['Gruntfile.js', 'tasks/**/*.*.js']
			},
			src: {
				options: {
					node: true
				},
				src: ['lib/**/*.*.js']
			},
			test: {
				options: {
					node: true
				},
				src: ['test/**/*.*.js']
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
				src: 'test/tmp/*.test.js'
			}
		},
		shell: {
			scratch_main: {
				options: {
					stderr: false
				},
				command: 'node scratch/main.js'
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
		'mochaTest:all'
	]);

	grunt.registerTask('prepublish', [
		'build',
		'clean:tmp',
		'clean:test'
	]);

	grunt.registerTask('default', ['build']);
};
