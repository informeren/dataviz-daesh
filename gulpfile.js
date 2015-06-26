var gulp = require('gulp'),
  concat = require('gulp-concat'),
  connect = require('gulp-connect'),
  fs = require('fs'),
  del = require('del'),
  less = require('gulp-less'),
  minifyCSS = require('gulp-minify-css'),
  path = require('path'),
  uglify = require('gulp-uglify');

var p = JSON.parse(fs.readFileSync('./package.json'));

var basePath = path.resolve(__dirname);
var paths = {
	assets: basePath + '/assets',
	dist: basePath + '/dist',
	vendor: basePath + '/vendor'
};
var lessPaths = [
  paths.vendor + '/jquery-ui/themes/smoothness',
  paths.vendor + '/leaflet/dist',
  paths.vendor + '/leaflet-minimap/src'
];
var lessImagePaths = [
  paths.vendor + '/jquery-ui/themes/smoothness/images/ui-bg_flat_75_ffffff_40x100.png',
  paths.vendor + '/jquery-ui/themes/smoothness/images/ui-bg_glass_65_ffffff_1x400.png',
  paths.vendor + '/jquery-ui/themes/smoothness/images/ui-bg_glass_75_dadada_1x400.png',
  paths.vendor + '/jquery-ui/themes/smoothness/images/ui-bg_glass_75_e6e6e6_1x400.png'
];

gulp.task('clean', function(cb) {
  del([paths.dist + '/*', '!' + paths.dist + '/tiles/**'], cb);
});

gulp.task('serve', ['build'], function() {
	connect.server({
	  root: 'dist'
	});
});

gulp.task('data', ['clean'], function(cb) {
  return gulp.src('./assets/data/*')
    .pipe(gulp.dest(paths.dist + '/data'));
});

gulp.task('html', ['clean'], function(cb) {
  return gulp.src('./assets/html/**/*.html')
    .pipe(gulp.dest(paths.dist));
});

gulp.task('images', ['clean'], function(cb) {
  return gulp.src('./assets/images/*')
    .pipe(gulp.dest(paths.dist + '/img'));
});

gulp.task('less', ['clean'], function(cb) {
  return gulp.src(['./assets/less/*.less', '!**/bootstrap.less'])
    .pipe(less({
      paths: lessPaths
    }))
    .pipe(minifyCSS({
      keepSpecialComments: 0
    }))
    .pipe(gulp.dest(paths.dist + '/css'));
});

gulp.task('less-images', ['clean'], function(cb) {
  return gulp.src(lessImagePaths)
    .pipe(gulp.dest(paths.dist + '/css/images'));
});

gulp.task('less-fonts', ['clean'], function(cb) {
  return gulp.src(paths.vendor + '/bootstrap/fonts/*')
    .pipe(gulp.dest(paths.dist + '/fonts'));
});

gulp.task('js', ['js-map', 'js-kobani', 'js-targets', 'js-widget', 'js-top']);

gulp.task('js-map', ['clean'], function(cb) {
  return gulp.src([
      paths.vendor + '/jquery/dist/jquery.js',
      paths.vendor + '/jquery-ui/jquery-ui.js',
      paths.vendor + '/d3/d3.js',
      paths.vendor + '/leaflet/dist/leaflet.js',
      paths.vendor + '/leaflet-minimap/src/Control.MiniMap.js',
      paths.assets + '/js/map.js'
    ])
    .pipe(concat('map.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + '/js'));
});

gulp.task('js-kobani', ['clean'], function(cb) {
  return gulp.src([
      paths.vendor + '/jquery/dist/jquery.js',
      paths.vendor + '/d3/d3.js',
      paths.assets + '/js/kobani.js'
    ])
    .pipe(concat('kobani.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + '/js'));
});

gulp.task('js-targets', ['clean'], function(cb) {
  return gulp.src([
      paths.vendor + '/jquery/dist/jquery.js',
      paths.vendor + '/d3/d3.js',
      paths.assets + '/js/targets.js'
    ])
    .pipe(concat('targets.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + '/js'));
});

gulp.task('js-top', ['clean'], function(cb) {
  return gulp.src([
      paths.vendor + '/jquery/dist/jquery.js',
      paths.vendor + '/d3/d3.js',
      paths.assets + '/js/top.js'
    ])
    .pipe(concat('top.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + '/js'));
});

gulp.task('js-widget', ['clean'], function(cb) {
  return gulp.src([
      paths.vendor + '/jquery/dist/jquery.js',
      paths.assets + '/js/widget.js'
    ])
    .pipe(concat('widget.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist + '/js'));
});

gulp.task('build', ['data', 'html', 'images', 'js', 'less', 'less-images', 'less-fonts']);

gulp.task('default', function() {
  console.log('');
  console.log('available tasks:');
  console.log('- build: compile and prepare the data vizualisations for distribution');
  console.log('- serve: compile and serve a local copy of the data vizualisations');
  console.log('- clean: remove all build artefacts from the output directory');
  console.log('');
});
