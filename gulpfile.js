// Gulp.js configuration

const // modules
  gulp = require('gulp');
  // other modules
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const browserSync = require('browser-sync').create();
const clean = require('gulp-clean');
const cleancss = require('gulp-clean-css');
const concat = require('gulp-concat');
const htmlclean = require('gulp-htmlclean');
const imagemin = require('gulp-imagemin');
const jpegRecompress = require('imagemin-jpeg-recompress');
const newer = require('gulp-newer');
const noop = require('gulp-noop');
const pngQuant = require('imagemin-pngquant');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const terser = require('gulp-terser');
const purgeCSS = require('gulp-purgecss');
// development mode?
const devBuild = process.env.NODE_ENV !== 'production';
// modules continued...
const stripdebug = devBuild ? null : require('gulp-strip-debug');
const sourcemaps = devBuild ? require('gulp-sourcemaps') : null;
// folders
const src = 'src/';
const build = 'build/';
const htmlBuild = './';

// image processing
function images() {
  const out = `${build}images/`;

  return gulp
    .src(`${src}images/**/*`)
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({
          quality: 75,
          progressive: true,
        }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo([
          {
            removeViewBox: true,
          },
          {
            cleanupIDs: false,
          },
        ]),
        pngQuant(),
        jpegRecompress(),
      ]).pipe(newer(out)),
    )
    .pipe(gulp.dest(out));
}
exports.images = images;

// fonts processing
function fonts() {
  const out = `${build}fonts/`;

  return gulp
    .src(`${src}fonts/**/*`)
    .pipe(newer(out))
    .pipe(gulp.dest(out));
}
exports.fonts = fonts;

// HTML processing
function html() {
  const out = htmlBuild;

  return gulp
    .src(`${src}/*.html`)
    .pipe(newer(out))
    .pipe(devBuild ? noop() : htmlclean())
    .pipe(gulp.dest(out));
}
exports.html = gulp.series(images, html);

// JavaScript processing
function js() {
  const out = `${build}js/`;

  return (
    gulp
      .src(`${src}js/app.js`)
      .pipe(
        babel({
          presets: ['@babel/preset-env'],
        }),
      ).pipe(uglify())
      .pipe(stripdebug ? stripdebug() : noop())
      .pipe(terser())
      .pipe(gulp.dest(out))
  );
}
exports.js = js;

// CSS processing
function css() {
  const out = `${build}css/`;

  return gulp
    .src(`${src}css/**/*`)
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(cleancss({ compatibility: 'ie8' }))
    .pipe(concat('style.css'))
    .pipe(
      purgeCSS({
        content: ['build/**/*.html'],
      }),
    )
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(out));
}
exports.css = css;

// SCSS processing
function scss() {
  const out = `${build}css/`;

  return gulp
    .src(`${src}scss/main.scss`)
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(
      sass({
        outputStyle: 'expanded',
        imagePath: '/images/',
        precision: 3,
        errLogToConsole: true,
      }).on('error', sass.logError),
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: [
          '> 1%',
          'ie >= 9',
          'edge >= 15',
          'ie_mob >= 10',
          'ff >= 45',
          'chrome >= 45',
          'safari >= 7',
          'opera >= 23',
          'ios >= 7',
          'android >= 4',
        ],
      }),
    )
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(out));
}
exports.scss = gulp.series(images, fonts, css, scss);

// Clean build
function cleanBuild() {
  return gulp.src(build).pipe(clean());
}
exports.cleanBuild = cleanBuild;

// run all tasks
exports.build = gulp.parallel(
  exports.html,
  exports.css,
  exports.scss,
  exports.js,
);

// Browsersync task
function synch(done) {
  browserSync.init({
    server: {
      baseDir: './',
      index: 'index.html',
    },
    port: 3000,
    notify: false,
  });
  done();
}

// watch for file changes
function watchFiles(done) {
  // image changes
  gulp.watch(`${src}images/**/*`, images);

  // fonts changes
  gulp.watch(`${src}fonts/**/*`, fonts);

  // css changes
  gulp.watch(`${src}css/**/*`, css);

  // html changes
  gulp.watch(`${src}*.html`, html).on('change', browserSync.reload);

  // scss changes
  gulp.watch(`${src}scss/**/*`, scss).on('change', browserSync.reload);

  // js changes
  gulp.watch(`${src}js/**/*`, js).on('change', browserSync.reload);

  done();
}

const watch = gulp.parallel(watchFiles, synch);

exports.watch = watch;

// default task
exports.default = gulp.series(exports.build, exports.watch);
