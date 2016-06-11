/**
 * Created by admin on 11.06.2016.
 */
var lr = require('tiny-lr'), // Минивебсервер для livereload
    gulp = require('gulp'), // Сообственно Gulp JS
    jade = require('gulp-jade'), // Плагин для Jade
    stylus = require('gulp-stylus'), // Плагин для Stylus
    livereload = require('gulp-livereload'), // Livereload для Gulp
    myth = require('gulp-myth'), // Плагин для Myth - http://www.myth.io/
    csso = require('gulp-csso'), // Минификация CSS
    imagemin = require('gulp-imagemin'), // Минификация изображений
    uglify = require('gulp-uglify'), // Минификация JS
    concat = require('gulp-concat'), // Склейка файлов
    rename = require('gulp-rename'), // Переименование файлов
    connect = require('connect'), // Webserver
    path = require('path'),
    fs = require('fs'),
    server = lr();

var port = '8080';
var modulesBase = './assets/modules';
var publishFolder = './public';
var modulesQueue = ['core'];

// Собираем Stylus (динамические css)
gulp.task('stylus', function() {
    gulp.src('./assets/stylus/index.styl')
        .pipe(stylus({
//            use: ['nib']
        })) // собираем stylus
        .on('error', console.log) // Если есть ошибки, выводим и продолжаем
        .pipe(myth()) // добавляем префиксы - http://www.myth.io/
        .pipe(gulp.dest('./public/css/')) // записываем css
        .pipe(livereload(server)); // даем команду на перезагрузку css
});

// Сборка CSS
gulp.task('css', function() {
    gulp.src('./assets/css/*.css')
        .pipe(concat('ritchy.css'))
        .pipe(gulp.dest('./public/css'))
        .pipe(livereload(server));
});

function getFolders(dir) {
    var folders = fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
    // Выстраиваем порядок следования модулей в соответствии с жёстко указанным
    // в переменной modulesQueue. В том случае когда modulesQueue пустой массив
    // (что по определению не правильно) функция вернёт массив найденых каталогов
    modulesQueue.map(function( module ) {
        var offset = folders.indexOf(module);
        if (offset>=0) folders.splice(offset, 1);
    });
    return modulesQueue.concat(folders);
}

var compileMethods = {
    jade: function(moduleBase, publishBase, folder) {
        gulp.src([path.join(moduleBase, 'views')+path.sep+'*.jade'])
            .pipe(jade({
                pretty: true
            }))
            .on('error', console.error)
            .pipe(gulp.dest(path.join(publishBase, 'views')))
            .pipe(livereload(server));
    },
    // Автосборка html шаблонов
    js: function(moduleBase, publishBase, folder) {
        gulp.src([moduleBase+path.sep+'*.js'])
            .pipe(concat(folder+'.js'))
            .pipe(gulp.dest(publishBase))
            .pipe(livereload(server));
    }
};

var nonStandardModules = {
    core: {
        jade: function(moduleBase, publishBase, folder) {
            gulp.src([moduleBase+path.sep+'index.jade'])
                .pipe(jade({
                    pretty: true
                }))
                .on('error', console.error)
                .pipe(gulp.dest(publishFolder))
                .pipe(rename('index.html'))
                .pipe(livereload(server));

            compileMethods.jade(moduleBase, publishBase, folder);
        },
        js: function(moduleBase, publishBase, folder) {
            // Сборка Angular библиотек в нужной последовательности
            gulp.src([
                path.join(moduleBase, 'js/angular.min.js'),
                path.join(moduleBase, 'js/angular/angular.min.js'),
                path.join(moduleBase, 'js/angular/angular-route.min.js'),
                path.join(moduleBase, 'js/angular/angular-aria.min.js'),
                path.join(moduleBase, 'js/angular/angular-animate.min.js'),
                path.join(moduleBase, 'js/angular/angular-messages.min.js'),
                path.join(moduleBase, 'js/angular/angular-material.min.js'),
                path.join(moduleBase, 'js/angular/mui.min.js')
            ])
                .pipe(concat('angular.min.js'))
                .pipe(gulp.dest(path.join(publishBase, 'js')))
                .pipe(livereload(server));
        }
    }
};

gulp.task('js', function() {
    var modulesJS = getFolders(modulesBase).map(function( module ) {
        return './'+path.join(modulesBase, module)+path.sep+'*.js';
    });

    gulp.src(modulesJS)
        .pipe(concat('ritchy.js'))
        .pipe(gulp.dest(path.join(publishFolder, 'js')))
        .pipe(livereload(server));

});

gulp.task('modules', function() {
    getFolders(modulesBase).map(function( folder ) {
        var moduleBase = './'+path.join(modulesBase, folder);
        var publishBase = './'+path.join(publishFolder, 'modules', folder);
        var nonStandardModule = nonStandardModules[folder];

        // Автосборка шаблонов
        if (nonStandardModule && nonStandardModule.jade) {
            nonStandardModule.jade(moduleBase, publishBase, folder);
        } else {
            compileMethods.jade(moduleBase, publishBase, folder);
        }

        // Автосборка JS библиотек
        if (nonStandardModule && nonStandardModule.js) {
            nonStandardModule.js(moduleBase, publishBase, folder);
        }

    });
});

// Копируем и минимизируем изображения
gulp.task('images', function() {
    gulp.src('./assets/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./public/img'))

});


// Локальный сервер для разработки
gulp.task('http-server', function() {
    connect()
        .use(require('connect-livereload')())
        .use(connect.static('./public'))
        .listen(port);

    console.log('Server listening on http://localhost:'+port);
});


// Запуск сервера разработки gulp watch
gulp.task('watch', function() {
    // Предварительная сборка проекта
    gulp.run('stylus');
    gulp.run('css');
    gulp.run('images');
    gulp.run('js');
    gulp.run('modules');

    // Подключаем Livereload
    server.listen(35729, function(err) {
        if (err) return console.log(err);

        var modules = getFolders(modulesBase);

        gulp.watch('assets/stylus/**/*.styl', function() {
            gulp.run('stylus');
        });

        gulp.watch('assets/img/**/*', function() {
            gulp.run('images');
        });

        // Обход всех JS в модулях
        gulp.watch(modules.slice().map(function( module ) {
            return './'+path.join(modulesBase, module)+path.sep+'*.js';
        }), ['js']);

        // Обход модулей на предмет изменения view и кастомных JS
        modules.slice().map(function( folder ) {
            var moduleBase = './'+path.join(modulesBase, folder);
            var publishBase = './'+path.join(publishFolder, 'modules', folder);
            var nonStandardModule = nonStandardModules[folder];

            gulp.watch(path.join(moduleBase, 'views')+path.sep+'**'+path.sep+'*.jade', function() {
                if (nonStandardModule && nonStandardModule.jade) {
                    nonStandardModule.jade(moduleBase, publishBase, folder);
                } else {
                    compileMethods.jade(moduleBase, publishBase, folder);
                }
            });

            // Следим за нестандартными модулями
            if (nonStandardModule && nonStandardModule.js) {
                gulp.watch(path.join(moduleBase, 'js') + path.sep + '**' + path.sep + '*.js', function () {
                    nonStandardModule.js(moduleBase, publishBase, folder);
                });
            }

        });

    });
    gulp.run('http-server');
});


// Production сборка
gulp.task('build', function() {
    // css
    gulp.src('./assets/stylus/screen.styl')
        .pipe(stylus({
            use: ['nib']
        })) // собираем stylus
        .pipe(myth()) // добавляем префиксы - http://www.myth.io/
        .pipe(csso()) // минимизируем css
        .pipe(gulp.dest('./build/css/')); // записываем css

    // jade
    gulp.src(['./assets/template/*.jade', '!./assets/template/_*.jade'])
        .pipe(jade())
        .pipe(gulp.dest('./build/'));

    // js
    gulp.src(['./assets/js/**/*.js', '!./assets/js/vendor/**/*.js'])
        .pipe(concat('index.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/js'));

    // image
    gulp.src('./assets/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/img'));

});
