'use strict';

const browserSync                                 = require('browser-sync').create(),
      { task, parallel, series, watch, src, dest} = require('gulp'),
      pug                                         = require('gulp-pug'),
      sass                                        = require('gulp-sass'),
      babel                                       = require('gulp-babel'),
      eslint                                      = require('gulp-eslint'),
      imagemin                                    = require('gulp-imagemin'),
      notify                                      = require('gulp-notify'),
      postcss                                     = require('gulp-postcss'),
      rename                                      = require('gulp-rename'),
      sourcemaps                                  = require('gulp-sourcemaps'),
      uglify                                      = require('gulp-uglify-es').default,
      concat                                      = require('gulp-concat'),
      del                                         = require('del');

const path = {
	build: {
		pug  : 'build/',
		js   : 'build/js/',
		style: 'build/style/',
		image: 'build/img/',
		font : 'build/font/'
	},
	src: {
		pug  : {
			watch: 'src/pug/**/*.pug',
			prod: 'src/pug/*.pug'
		},
		js    : 'src/js/**/*.js',
		style : 'src/sass/**/*.{sass,scss}',
		image : 'src/img/**/*.{jpg,jpeg,png,gif,svg,ico}',
		font  : 'src/font/**/*.{eot,ttf,woff,woff2}',
		jslib : [
			'src/lib/js/*.js',
		],
		csslib: [
			'./node_modules/normalize.css/normalize.css',
			'src/lib/css/*.css',
		]
	}
};

task('browserSyncServer', function(done) {
	browserSync.init({
		server: {
			baseDir: path.build.pug
		},
		notify: true
	});
	done();
});

task('reload', function(done) {
	browserSync.reload();
	done();
});

task('lint', function() {
	return src([path.src.js, '!node_modules/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

task('js:dev', function() {
	return src(path.src.js)
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'JS'
		}))
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('bundle.js'))
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
});

task('js:build', function() {
	return src(path.src.js)
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('bundle.js'))
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
});

task('sass:dev', function() {
	return src(path.src.style)
		.pipe(sass())
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'SASS'
		}))
		.pipe(sourcemaps.init())
		.pipe(postcss())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('sass:build', function() {
	return src(path.src.style)
		.pipe(sass())
		.pipe(postcss())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('pug:dev', function() {
	return src(path.src.pug.prod)
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'PUG'
		}))
		.pipe(pug())
		.pipe(dest(path.build.pug))
		.pipe(browserSync.stream());
});

task('pug:build', function() {
	return src(path.src.pug.prod)
		.pipe(pug({
			pretty: true
		}))
		.pipe(dest(path.build.pug))
		.pipe(browserSync.stream());
});

task('image:dev', function() {
	return src(path.src.image)
		.pipe(dest(path.build.image))
		.pipe(browserSync.stream());
});

task('image:build', function () {
	return src(path.src.image)
		.pipe(imagemin([
			imagemin.gifsicle({
				interlaced: true
			}),
			imagemin.jpegtran({
				progressive: true
			}),
			imagemin.optipng({
				optimizationLevel: 5
			}),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			})
		]))
		.pipe(dest(path.build.image))
		.pipe(browserSync.stream());
});

task('font', function() {
	return src(path.src.font)
		.pipe(dest(path.build.font))
		.pipe(browserSync.stream());
});

task('jslib', function() {
	return src(path.src.jslib)
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
});

task('csslib', function() {
	return src(path.src.csslib)
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('watcher', function() {
	watch(path.src.pug.watch, series('pug:dev', 'reload'));
	watch(path.src.style, series('sass:dev', 'reload'));
	watch(path.src.js, series('js:dev', 'reload'));
	watch(path.src.image, series('image:dev', 'reload'));
	watch(path.src.font, series('font', 'reload'));
	watch(path.src.jslib, series('jslib', 'reload'));
	watch(path.src.csslib, series('csslib', 'reload'));
});

task('clear', function() {
	return del(path.build.pug);
});

task('dev', parallel('lint', 'pug:dev', 'js:dev', 'sass:dev', 'csslib', 'jslib', 'image:dev', 'font', 'browserSyncServer', 'watcher'));
task('build', series('clear', 'pug:build', 'js:build', 'sass:build', 'csslib', 'jslib', 'image:build', 'font'));
