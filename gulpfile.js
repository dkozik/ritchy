/**
 * Created by admin on 11.06.2016.
 */
var lr = require('tiny-lr'), // Минивебсервер для livereload
    gulp = require('gulp'), // Сообственно Gulp JS
    util = require('gulp-util'),
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
    serveStatic = require('serve-static'),
    path = require('path'),
    fs = require('fs'),
    ini = require('ini'),
    server = lr();

// Настройки проекта по умолчанию
var props = {
    webServer: {
        // Порт локального Web сервера
        port: '8080'
    },
    RitchyModules: {
        // Относительный путь к каталогу модулей
        base: './assets/modules',
        // Преднастроенная очередь модулей (расширяющий параметр - все не перечисленные модули
        // будут автоматически добавлены в естественной последовательности вслед за перечисленными)
        queue: ['core']
    },
    RitchyPublish: {
        // Относительный путь сборки готового проекта
        folder: './public'
    }
};

// Modules cache
var modulesFolders = [];


// Загрузка локальных настроек из ini файла ./custom_properties
(function( localConfigFile ) {
    try {
        if (fs.lstatSync(localConfigFile)) {
            util.log('Read custom properties from ini file: ', '\x1b[36m'+localConfigFile+'\x1b[0m');
            var config = ini.parse(fs.readFileSync(localConfigFile, 'utf-8'));
            for (var section in config) {
                util.log('Read section [\x1b[36m'+section+'\x1b[0m]');
                var sect = config[section];
                var psect = props[section];
                if (!psect) continue;
                for (var key in config[section]) {
                    props[section][key] = sect[key];
                }
            }
        }
    } catch(e) {
        console.error(e);
    }
})('./custom_properties');

function getFolders(dir) {
    if (modulesFolders.length>0) {
        return modulesFolders.slice();
    }

    var folders = fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
    // Выстраиваем порядок следования модулей в соответствии с жёстко указанным
    // в переменной props.RitchyModules.queue. В том случае когда props.RitchyModules.queue пустой массив
    // (что по определению не правильно) функция вернёт массив найденых каталогов
    props.RitchyModules.queue.map(function( module ) {
        var offset = folders.indexOf(module);
        if (offset>=0) folders.splice(offset, 1);
    });
    modulesFolders = props.RitchyModules.queue.concat(folders);
    return modulesFolders.slice();
}

// Собираем Stylus (динамические css)
gulp.task('stylus', function() {
    var modulesSTYL = getFolders(props.RitchyModules.base).map(function( module ) {
        return './'+path.join(props.RitchyModules.base, module)+path.sep+'*.styl';
    });
    gulp.src(['./assets/stylus/index.styl'].concat(modulesSTYL))
        .pipe(concat('index.styl'))
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
    var modulesCSS = getFolders(props.RitchyModules.base).map(function( module ) {
        return './'+path.join(props.RitchyModules.base, module)+path.sep+'*.css';
    });
    gulp.src(['./assets/css/*.css'].concat(modulesCSS))
        .pipe(concat('ritchy.css'))
        .pipe(gulp.dest('./public/css'))
        .pipe(livereload(server));
});

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
                .pipe(gulp.dest(props.RitchyPublish.folder))
                .pipe(rename('index.html'))
                .pipe(livereload(server));

            compileMethods.jade(moduleBase, publishBase, folder);
        },
        js: function(moduleBase, publishBase, folder) {
            // Сборка Angular библиотек в нужной последовательности
            gulp.src([
                path.join(moduleBase, 'js/angular/angular.min.js'),
                path.join(moduleBase, 'js/auth.js'), // auth скрывается в недрах Angular'а
                path.join(moduleBase, 'js/angular/angular-route.min.js'),
                path.join(moduleBase, 'js/angular/angular-aria.min.js'),
                path.join(moduleBase, 'js/angular/angular-animate.min.js'),
                path.join(moduleBase, 'js/angular/angular-messages.min.js'),
//                path.join(moduleBase, 'js/angular/angular-material.min.js'),
                    path.join(moduleBase, 'js/angular/angular-material.js'),
                path.join(moduleBase, 'js/angular/mui.min.js'),
                path.join(moduleBase, 'js/greensock/minified/TweenMax.min.js')
            ])
                .pipe(concat('angular.min.js'))
                .pipe(gulp.dest(path.join(publishBase, 'js')))
                .pipe(livereload(server));
        }
    }
};

gulp.task('js', function() {
    var modulesJS = getFolders(props.RitchyModules.base).map(function( module ) {
        return './'+path.join(props.RitchyModules.base, module)+path.sep+'*.js';
    });

    gulp.src(modulesJS)
        .pipe(concat('ritchy.js'))
        .pipe(gulp.dest(path.join(props.RitchyPublish.folder, 'js')))
        .pipe(livereload(server));

});

gulp.task('modules', function() {
    getFolders(props.RitchyModules.base).map(function( folder ) {
        var moduleBase = './'+path.join(props.RitchyModules.base, folder);
        var publishBase = './'+path.join(props.RitchyPublish.folder, 'modules', folder);
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
    gulp.src('./assets/img/icons/**/*')
        .pipe(gulp.dest('./public/img/icons'));
    gulp.src('./assets/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./public/img'))
});


// Локальный сервер для разработки
gulp.task('http-server', function() {
    connect()
        .use(require('connect-livereload')())
        .use(serveStatic('./public'))
        .listen(props.webServer.port);

    console.log('Server listening on http://localhost:'+props.webServer.port);
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

        gulp.watch('assets/stylus/**/*.styl', function() {
            gulp.run('stylus');
        });

        gulp.watch('assets/img/**/*', function() {
            gulp.run('images');
        });

        // Обход всех JS в модулях
        gulp.watch(getFolders(props.RitchyModules.base).map(function( module ) {
            return './'+path.join(props.RitchyModules.base, module)+path.sep+'*.js';
        }), ['js']);

        // Обход модулей на предмет изменения view и кастомных JS
        getFolders(props.RitchyModules.base).map(function( folder ) {
            var moduleBase = './'+path.join(props.RitchyModules.base, folder);
            var publishBase = './'+path.join(props.RitchyPublish.folder, 'modules', folder);
            var nonStandardModule = nonStandardModules[folder];

            gulp.watch([path.join(moduleBase, 'views')+path.sep+'**'+path.sep+'*.jade',
                        moduleBase+path.sep+'**'+path.sep+'*.jade'], function() {
                if (nonStandardModule && nonStandardModule.jade) {
                    nonStandardModule.jade(moduleBase, publishBase, folder);
                } else {
                    compileMethods.jade(moduleBase, publishBase, folder);
                }
            });

            gulp.watch(moduleBase+path.sep+'**'+path.sep+'*.styl', ['stylus']);

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
