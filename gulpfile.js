import browserSync from 'browser-sync'

import gulp from 'gulp'
import pug from 'gulp-pug'
import gulpSass from 'gulp-sass'
import babel from 'gulp-babel'
import postcss from 'gulp-postcss'
import imagemin from 'gulp-imagemin'
import notify from 'gulp-notify'
import rename from 'gulp-rename'
import sourcemaps from 'gulp-sourcemaps'
import gulpUglify from 'gulp-uglify-es'
import concat from 'gulp-concat'

import del from 'del'
import autoprefixer from 'autoprefixer'
import mqpacker from 'css-mqpacker'
import cssnano from 'cssnano'
import sassPkg from 'sass'

import gifsicle from 'imagemin-gifsicle'
import mozjpeg from 'imagemin-jpegtran'
import optipng from 'imagemin-optipng'
import svgo from 'imagemin-svgo'

const { task, series, watch, src, dest } = gulp

const sass = gulpSass(sassPkg)
const uglify = gulpUglify.default

cssnano({
	preset: [
		'default', {
			discardComments: {
				removeAll: true
			}
		}
	]
})

const path = {
	build: {
		pug   : 'build/',
		js    : 'build/js/',
		style : 'build/style/',
		image : 'build/img/',
		font  : 'build/font/'
	},
	src: {
		pug  : {
			watch: 'src/templates/**/*.pug',
			prod: 'src/templates/*.pug'
		},
		js   : 'src/js/**/*.js',
		style: 'src/sass/**/*.{sass,scss}',
		image: 'src/img/**/*.{jpg,jpeg,png,gif,svg,ico}',
		font : 'src/font/**/*.{eot,ttf,woff,woff2}',
		jslib: [
			'./node_modules/selectize/dist/js/standalone/selectize.min.js',
			'./node_modules/@babel/polyfill/dist/polyfill.min.js',
			'src/lib/js/*.js',
		],
		csslib: [
			'./node_modules/selectize/dist/css/selectize.default.css',
			'src/lib/css/*.css',
		]
	}
};

const postcssPlugins = [
	autoprefixer(),
	cssnano,
	mqpacker()
];

task('browserSyncServer', (done) => {
	browserSync.init({
		server: {
			baseDir: path.build.pug,
		},
		notify: true
	});
	done();
});

task('reload', (done) => {
	browserSync.reload();
	done();
});

task('js:dev', () => {
	return src(path.src.js)
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'JS'
		}))
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/preset-env']
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

task('js:build', () => {
	return src(path.src.js)
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(concat('bundle.js'))
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
});

task('sass:dev', () => {
	return src(path.src.style)
		.pipe(sass())
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'SASS'
		}))
		.pipe(sourcemaps.init())
		.pipe(postcss(postcssPlugins))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('sass:build', () => {
	return src(path.src.style)
		.pipe(sass())
		.pipe(postcss(postcssPlugins))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('pug:dev', () => {
	return src(path.src.pug.prod)
		.pipe(pug({
			pretty: true
		}))
		.on('error', notify.onError({
			message: '\n<%= error.message %>',
			title: 'PUG'
		}))
		.pipe(dest(path.build.pug))
		.pipe(browserSync.stream());
});

task('pug:build', () => {
	return src(path.src.pug.prod)
		.pipe(pug({
			pretty: true
		}))
		.pipe(dest(path.build.pug))
		.pipe(browserSync.stream());
});

task('image:dev', () => {
	return src(path.src.image)
		.pipe(dest(path.build.image))
		.pipe(browserSync.stream());
});

task('image:build', () => {
	return src(path.src.image)
		.pipe(imagemin([
			gifsicle({
				interlaced: true
			}),
			mozjpeg({
				quality: 75,
				progressive: true
			}),
			optipng({
				optimizationLevel: 5
			}),
			svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }
				]
			})
		]))
		.pipe(dest(path.build.image))
		.pipe(browserSync.stream());
});

task('font', () => {
	return src(path.src.font)
		.pipe(dest(path.build.font))
		.pipe(browserSync.stream());
});

task('jslib', () => {
	return src(path.src.jslib)
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
});

task('csslib', () => {
	return src(path.src.csslib)
		.pipe(dest(path.build.style))
		.pipe(browserSync.stream());
});

task('watcher', () => {
	watch(path.src.pug.watch, series('pug:dev', 'reload'));
	watch(path.src.style, series('sass:dev', 'reload'));
	watch(path.src.js, series('js:dev', 'reload'));
	watch(path.src.image, series('image:dev', 'reload'));
	watch(path.src.font, series('font', 'reload'));
	watch(path.src.jslib, series('jslib', 'reload'));
	watch(path.src.csslib, series('csslib', 'reload'));
});

task('clean', () => del(path.build.pug));

task('dev', series('pug:dev', 'js:dev', 'sass:dev', 'image:dev', 'csslib', 'jslib', 'font', 'browserSyncServer', 'watcher'));
task('build', series('clean', 'pug:build', 'js:build', 'sass:build', 'image:build', 'csslib', 'jslib', 'font'));
task('image', series('clean', 'image:build'));
