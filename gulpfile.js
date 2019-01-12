'use strict';

const browserSync  = require('browser-sync').create(),
      gulp         = require('gulp'),
      pug          = require('gulp-pug'),
      sass         = require('gulp-sass'),
      cleancss     = require('gulp-clean-css'),
      autoprefixer = require('gulp-autoprefixer'),
      imagemin     = require('gulp-imagemin'),
      notify       = require('gulp-notify'),
      rename       = require('gulp-rename'),
      del          = require('del'),
      sourcemaps   = require('gulp-sourcemaps'),
      uglify       = require('gulp-uglify'),
      wait         = require('gulp-wait');

const path = {
	build: {
		pug   : 'build/',
		js    : 'build/js/',
		style : 'build/style/',
		image : 'build/img/',
		font  : 'build/fonts/',
		jslib : 'build/js/lib/',
		csslib: 'build/style/lib/'
	},
	src: {
		pug  : 'src/pug/*.pug',
		js   : 'src/js/*.js',
		style: 'src/sass/**/*.{sass,scss}',
		image: 'src/img/**/*.{jpg,jpeg,png,gif,svg,ico}',
		font : 'src/font/**/*'
	},
	watch: {
		pug   : 'src/pug/**/*.pug',
		js    : 'src/js/app.js',
		style : 'src/sass/**/*.{sass,scss}',
		image : 'src/img/**/*.{jpg,jpeg,png,gif,svg,ico}',
		font  : 'src/font/**/*'
	}
};

function browserSyncServer(done) {
	browserSync.init({
		server: {
			baseDir: path.build.pug
		},
		notify: true
	});
	done();
}

function reload(done) {
	browserSync.reload();
	done();
}

function jsLoad() {
	return gulp
		.src([path.src.js])
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'SCRIPTS'
		}))
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.build.js))
		.pipe(browserSync.stream());
}

function sassLoad() {
	return gulp
		.src([path.src.style])
		.pipe(wait(200))
		.pipe(sass())
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'SASS'
		}))
		.pipe(sourcemaps.init())
		.pipe(autoprefixer({
			browsers: ['last 4 versions']
		}))
		.pipe(cleancss())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.build.style))
		.pipe(browserSync.stream());
}

function pugLoad() {
	return gulp
		.src([path.src.pug])
		.pipe(pug({
			pretty: true
		}))
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'TEMPLATE'
		}))
		.pipe(gulp.dest(path.build.pug))
		.pipe(browserSync.stream());
}

function imageLoad() {
	return gulp
		.src([path.src.image])
		// uncomment next in build
		// .pipe(imagemin({
		// 	optimizationLevel: 5,
		// 	progressive: true,
		// 	interlaced: true,
		// 	svgoPlugins: [{
		// 		removeViewBox: true
		// 	}]
		// }))
		.pipe(gulp.dest(path.build.image))
		.pipe(browserSync.stream());
}

function fontLoad() {
	return gulp
		.src([
			path.src.font,
			'./node_modules/slick-carousel/slick/fonts/*'
		])
		.pipe(gulp.dest(path.build.font))
		.pipe(browserSync.stream());
};

function jsLibLoad() {
	return gulp
		.src([
			'./node_modules/jquery/dist/jquery.min.js',
			'./node_modules/slick-carousel/slick/slick.min.js'
		])
		.pipe(gulp.dest(path.build.jslib))
		.pipe(browserSync.stream());
}

function cssLibLoad() {
	return gulp
		.src([
			'./node_modules/normalize.css/normalize.css',
			'./node_modules/slick-carousel/slick/slick.css',
			'./node_modules/slick-carousel/slick/slick-theme.css'
		])
		.pipe(gulp.dest(path.build.csslib))
		.pipe(browserSync.stream());
}

function watcher() {
	gulp.watch(path.watch.pug, gulp.series(pugLoad, reload));
	gulp.watch(path.watch.style, gulp.series(sassLoad, reload));
	gulp.watch(path.watch.js, gulp.series(jsLoad, reload));
	gulp.watch(path.watch.image, gulp.series(imageLoad, reload));
	gulp.watch(path.watch.font, gulp.series(fontLoad, reload));
	gulp.watch(path.build.jslib, gulp.series(jsLibLoad, reload));
	gulp.watch(path.build.csslib, gulp.series(cssLibLoad, reload));
}

function clean() {
	return del([path.build.pug]);
}

gulp.task('default', gulp.series(clean, pugLoad, jsLoad, sassLoad, jsLibLoad, cssLibLoad, imageLoad, fontLoad, browserSyncServer, watcher));
gulp.task('build', gulp.series(clean, pugLoad, jsLoad, sassLoad, imageLoad, fontLoad));
