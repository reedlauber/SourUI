module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		dirs: {
			bower_src: 'bower_components',
			sass_src: 'src/scss',
			css_src: 'src/css',
			css_dest: 'css',
			js_src: 'src/javascript',
			js_dest: 'javascript'
		},
		sass: {
			app: {
				options: {
					style: 'expanded'
				},
				files: {
					'<%=dirs.css_src %>/base.css': '<%=dirs.sass_src %>/base.scss',
					'<%=dirs.css_src %>/typography.css': '<%=dirs.sass_src %>/typography.scss',
					'<%=dirs.css_src %>/grid.css': '<%=dirs.sass_src %>/grid.scss',
					'<%=dirs.css_src %>/forms.css': '<%=dirs.sass_src %>/forms.scss',
					'<%=dirs.css_src %>/tables.css': '<%=dirs.sass_src %>/tables.scss'
				}
			}
		},
		concat: {
			options: {
				stripBanners: true
			},
			css: {
				src: [
					'<%= dirs.css_src %>/normalize.css',
					'<%= dirs.css_src %>/base.css',
					'<%= dirs.css_src %>/typography.css',
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
			bowerPath = 'bower.json',
			pkg,
			bwr,
			pkgRaw = '',
			bwrRaw = '';

		pkg = grunt.file.readJSON(pkgPath);
		if(!pkg) {
			grunt.log.error('Couldn\'t read package file.');
			return;
		}
		bwr = grunt.file.readJSON(bowerPath);
		if(!bwr) {
			grunt.log.error('Couldn\'t read bower package file.');
			return;
		}

		if(!version) {
			grunt.log.writeln(pkg.version);
			return;
		}

		pkg.version = version;
		bwr.version = version;

		pkgRaw = JSON.stringify(pkg, null, '  ');
		bwrRaw = JSON.stringify(bwr, null, '  ');

		grunt.file.write(pkgPath, pkgRaw);
		grunt.file.write(bowerPath, bwrRaw);

		grunt.log.ok('Version set to ' + version);
	});
};