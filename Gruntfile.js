module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		dirs: {
			bower_src: 'bower_components',
			sass_src: 'src/scss',
			css_src: 'src/css',
			css_dest: 'build/css',
			js_src: 'src/javascript',
			js_dest: 'javascript'
		},
		sass: {
			app: {
				options: {
					style: 'expanded'
				},
				files: {
					'<%=dirs.css_src %>/sour.css': ['<%=dirs.sass_src %>/sour.scss']
				}
			}
		},
		concat: {
			options: {
				stripBanners: true
			},
			css: {
				src: [
					'<%= dirs.css_src %>/*.css'
				],
				dest: '<%= dirs.css_dest %>/sour.css'
			},
			js: {
				src: [
					'<%= dirs.js_src %>/core.js',
					'<%= dirs.js_src %>/*.js'
				],
				dest: '<%= dirs.js_dest %>/sour.js'
			}
		},
		jshint: {
			app: ['<%= dirs.js_dest %>/sour.js']
		},
		cssmin: {
			options: {
				banner: ''
			},
			app: {
				files: {
					'<%= dirs.css_dest %>/sour.min.css': ['<%= dirs.css_dest %>/sour.css']
				}
			}
		},
		uglify: {
			options: {
				banner: ''
			},
			app: {
				files: {
					'<%= dirs.js_dest %>/sour.min.js': ['<%= dirs.js_dest %>/sour.js']
				}
			}
		},
		watch: {
			sass: {
				files: '<%=sass_src %>/*.scss',
				tasks: ['sass']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('build', 'Does full production build, including setting version if supplied.', function(version) {
		var tasks = ['sass', 'concat', 'jshint', 'cssmin', 'uglify'];
		if(version) {
			tasks.push('version:' + version);
		}
		grunt.task.run(tasks);
	});

	grunt.registerTask('version', 'Updates the official version number.', function(version) {
		var pkgPath = 'package.json',
			pkg,
			pkgRaw = '';

		pkg = grunt.file.readJSON(pkgPath);
		if(!pkg) {
			grunt.log.error('Couldn\'t read package file.');
			return;
		}

		if(!version) {
			grunt.log.writeln(pkg.version);
			return;
		}

		pkg.version = version;

		pkgRaw = JSON.stringify(pkg, null, '  ');

		grunt.file.write(pkgPath, pkgRaw);

		grunt.log.ok('Version set to ' + version);
	});
};