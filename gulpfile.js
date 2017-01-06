var SRC_ROOT_DIR = 'www';
var BUILD_DIR = 'build';
var REQUIREJS_DIR = BUILD_DIR + '/requirejs';
var MINIFY_DIR = BUILD_DIR + '/minify';
var DIST_DIR = 'public';

var gulp = require('gulp');

function clean() {
    var del = require('del');
    return del([BUILD_DIR, DIST_DIR]);
}
gulp.task('clean', clean);

function less() {
    var del = require('del');
    del(SRC_ROOT_DIR + '/css/**/*.css');
    var globs = [
        SRC_ROOT_DIR + '/less/*.less',
        '!' + SRC_ROOT_DIR + '/less/lib/**/*.less',
        '!' + SRC_ROOT_DIR + '/less/base/**/*.less',
        '!' + SRC_ROOT_DIR + '/less/common/**/*.less',
        '!' + SRC_ROOT_DIR + '/less/module/**/*.less'
    ];
    var plugins = require('gulp-load-plugins')();
    return gulp.src(globs)
        .pipe(plugins.less({relativeUrls: true, compress: false}))
        .pipe(gulp.dest(SRC_ROOT_DIR + '/css/'));
}
gulp.task('less', less);

function handlebars() {
    var del = require('del');
    del(SRC_ROOT_DIR + '/js/handlebars/**/*.js');
    var defineModule = require('gulp-define-module');
    var handlebars2js = require('gulp-handlebars');
    return gulp.src(SRC_ROOT_DIR + '/handlebars/**/*.handlebars')
        .pipe(handlebars2js())
        .pipe(defineModule('amd', {
            require: {
                Handlebars: 'handlebars'
            }
        }))
        .pipe(gulp.dest(SRC_ROOT_DIR + '/js/handlebars'));
}
gulp.task('handlebars', handlebars);

function dist(){
    return gulp.src(SRC_ROOT_DIR + '/**/*')
        .pipe(gulp.dest(DIST_DIR));
}
gulp.task('dist',['clean','less','handlebars'], dist);

function watch(){
    var plugins = require('gulp-load-plugins')();
    gulp.watch(SRC_ROOT_DIR + '/less/**/*.less',function(event){
        var globs = [
            event.path,
            process.cwd() + '/' + SRC_ROOT_DIR + '/less/*.less'
        ];
        globs = globs.concat([
            '!' + SRC_ROOT_DIR + '/less/base/**/*.less',
            '!' + SRC_ROOT_DIR + '/less/common/**/*.less'
        ]);
        return gulp.src(globs, {base: process.cwd() + '/' + SRC_ROOT_DIR + '/less'})
            .pipe(plugins.less({relativeUrls: true, compress: false}))
            .pipe(gulp.dest(SRC_ROOT_DIR + '/css'));
    });

    gulp.watch(SRC_ROOT_DIR + '/handlebars/**/*.handlebars',function(event){
        var defineModule = require('gulp-define-module');
        var handlebars2js = require('gulp-handlebars');
        return gulp.src(event.path,{base: process.cwd() + '/' + SRC_ROOT_DIR + '/handlebars'})
            .pipe(handlebars2js())
            .pipe(defineModule('amd', {
                require: {
                    Handlebars: 'handlebars'
                }
            }))
            .pipe(gulp.dest(SRC_ROOT_DIR + '/js/handlebars'));
    });

    gulp.watch(SRC_ROOT_DIR + '/**/*',function(event){
        return gulp.src([event.path], {base: process.cwd() + '/' + SRC_ROOT_DIR})
            .pipe(gulp.dest(DIST_DIR));
    });
}
gulp.task('default', ['dist'], watch);

function requirejs(done) {
    var MODULES = [
        {
            name: 'js/main',
            include: ['jquery','bootstrap','util','dataService','ggGrid','pagination']
        },
        {
            name: 'js/home',
            exclude: ['js/main']
        }
    ];

    var r = require('requirejs');
    r.optimize({
        appDir: SRC_ROOT_DIR,
        baseUrl: './',
        dir: REQUIREJS_DIR,
        optimize: 'none',
        optimizeCss: 'none',
        removeCombined: true,
        mainConfigFile: SRC_ROOT_DIR + '/js/main.js',
        modules: function(){
            return MODULES;
        }(),
        logLevel: 1
    }, function() {
        done();
    });
}
gulp.task('requirejs', ['clean','less','handlebars'], requirejs);

function js() {
    var minifyJS = require('gulp-uglify');
    return gulp.src([REQUIREJS_DIR + '/**/*.js'])
        .pipe(minifyJS())
        .pipe(gulp.dest(MINIFY_DIR));
}
gulp.task('js', ['requirejs'], js);

function css() {
    var minifyCSS = require('gulp-minify-css');
    return gulp.src([REQUIREJS_DIR + '/**/*.css'])
        .pipe(minifyCSS())
        .pipe(gulp.dest(MINIFY_DIR));
}
gulp.task('css', ['requirejs'], css);

function html() {
    var minifyHTML = require('gulp-htmlmin');
    return gulp.src([REQUIREJS_DIR + '/**/*.html'], {base: REQUIREJS_DIR})
        .pipe(minifyHTML({removeComments: true, collapseWhitespace: true}))
        .pipe(gulp.dest(MINIFY_DIR));
}
gulp.task('html', ['requirejs'], html);

function copy() {
    return gulp.src([
            REQUIREJS_DIR + '/**/*',
            '!' + REQUIREJS_DIR + '/less/**/*.less',
            '!' + REQUIREJS_DIR + '/**/*.{js,css,html}',
            '!' + REQUIREJS_DIR + '/build.txt'
        ])
        .pipe(gulp.dest(MINIFY_DIR));
}
gulp.task('copy', ['requirejs'], copy);

function compile() {
    var revall = new(require('gulp-rev-all'))({
        dontGlobal: [],
        dontSearchFile : ['.pdf'],
        dontRenameFile: ['/favicon.ico','.html',/^\/res\/.+$/],
        dontUpdateReference: ['/favicon.ico','.html',/^\/res\/.+$/],
        transformFilename: function (file,hash){
            var path = file.path.replace(/\\/g, '/');
            var begin = path.lastIndexOf('/') + 1;
            var end = path.lastIndexOf('.');
            return path.slice(begin, end) + '-' + hash.slice(0,8) + file.path.slice(end);
        }
    });
    return gulp.src(MINIFY_DIR + '/**')
        .pipe(revall.revision())
        .pipe(gulp.dest(DIST_DIR));
}
gulp.task('compile', ['copy', 'html', 'css', 'js'], compile);

gulp.task('build',['compile']);
