/**
 * Created by admin on 11.06.2016.
 */
'use strict';

(function(){
    angular.extend( angular, {
        toParam: toParam
    });

    function toParam( object, prefix ) {
        var stack = [];
        var value;

        for( var key in object ) {
            value = object[ key ];
            key = prefix ? prefix + '[' + key + ']' : key;

            if ( value === null ) {
                value = encodeURIComponent( key ) + '=';
            } else if ( typeof( value ) !== 'object' ) {
                value = encodeURIComponent( key ) + '=' + encodeURIComponent( value );
            } else {
                value = toParam( value, key );
            }

            stack.push( value );
        }
        return stack.join( '&' );
    }
})();

var RitchyApp = angular.module('Ritchy', ['ngRoute', 'ngMaterial'])
    .config(['$httpProvider', function($httpProvider){
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        $httpProvider.defaults.withCredentials = true;
    }])
    .run(['$rootScope', '$injector', function($rootScope, $injector) {
        $injector.get('$http').defaults.transformRequest = function( data ) {
            // Трансформация тела POST запроса в понятный PHP вид
            return angular.isObject(data) && String(data) !== '[Object File]' ? angular.toParam(data) : data;
        };
    }]);

(function() {

    var modulesBase = './modules';

    /**
     * Сервис реализующий логику сообщений и форм ввода/выбора значений
     */
    RitchyApp.factory('RitchyDialog', ['$mdDialog', '$mdMedia', function($mdDialog, $mdMedia) {
        return {
            // Показ инфомрационного уведомления на экране
            showAlert: function( title, text, callback ) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.body))
                        .clickOutsideToClose(true)
                        .title(title)
                        .textContent(text)
                        .ok('OK')
                ).finally(callback);
            }
        }
    }]);

    /**
     * Сервис реализующий логику работы с серверным API
     */
    RitchyApp.factory('RitchyApi', ['$http', '$rootScope', function($http, $rootScope) {

        var apiUrl = 'http://localhost/ritchy/api';

        return {
            request: function( controller, action, params, onSuccess, onError ) {
                var url = apiUrl+'/'+controller;
                var token = $rootScope.auth.getUserToken();
                var config = {};
                if (token>'') {
                    // Отправка токена с каждым запросом
                    config.headers = {'Authorization': 'Bearer '+token};
                }
                if (action>'') url+='/'+action;
                $http.post(url, params, config).then(function onSuccessPre( response ) {
                    // Вывод дополнительной информации в консоль в случае её наличия
                    if (response.data.debug>'') {
                        console.log(response.data.debug);
                    }
                    onSuccess && onSuccess( response );
                }, onError);
            }
        }
    }]);

    /**
     * Сервис реализующий логику работы с сессией
     */
    RitchyApp.factory('RitchyAuth', ['$http', 'RitchyDialog', 'RitchyApi', function( $http, RitchyDialog, RitchyApi ) {
        // Service internal params
        var isUserAuth = false,
            firstStatLoaded = false,
            userToken = null;


        // Constructor method implementation
        function requestLoginStat( callback, firstStat ) {
            if (firstStat && firstStatLoaded) {
                callback && callback(isUserAuth);
                return;
            }
            RitchyApi.request('login', 'stat', null, function onSuccess( response ) {
                if (response.data.error>'') {
                    RitchyDialog.showAlert('API error', 'Request user stats returned error: '+response.data.error);
                } else if (response.data.loggedIn) {
                    isUserAuth = response.data.loggedIn || false;
                }
                firstStatLoaded = true;
                callback && callback(isUserAuth);
            }, function onError( response ) {
                firstStatLoaded = true;
                if (angular.isObject(response)) {
                    if (response.status<0) {
                        RitchyDialog.showAlert('API error', 'Unknown api error: ' + response.status+'<br>Error details in console.', callback);
                    } else {
                        RitchyDialog.showAlert('API error', 'Unknown api error: ' + response.statusText, callback);
                    }
                } else {
                    RitchyDialog.showAlert('API error', 'Unknown api error: '+response, callback);
                }
            });
        }

        function requestLogout( callback ) {
            RitchyApi.request('logout', null, null, function onSuccess( response ) {
                if (response.data.error>'') {
                    RitchyDialog.showAlert('API error', 'Error when logout: '+response.data.error, callback);
                } else {
                    isUserAuth = false;
                    callback && callback(isUserAuth);
                }
            }, function onError( response ) {
                RitchyDialog.showAlert('API error', 'Unknown api error: '+response, callback);
            });
        }

        // Service public methods
        return {
            doLogin: function() {
                // Программная авторизация
                // TODO: реализовать метод по мере необходимости
            },
            // Выход из приложения
            doLogout: function( callback ) {
                requestLogout(callback);
            },
            // Получение статуса авторизации пользователя в системе
            isUserAuth: function( callback ) {
                requestLoginStat(callback, true);
            },
            updateToken: function( token ) {
                userToken = token;
            },
            getUserToken: function() {
                return userToken;
            }
        }
    }]);


    /**
     * Контроллер реализующий логику основной страницы ядра
     */
    RitchyApp.controller('core',['$scope', '$http', 'RitchyAuth', '$rootScope', function($scope, $http, RitchyAuth, $rootScope) {
        function sendStat() {
            var img = new Image();
            img.src = "./api/1x1.png?";
        }
        $rootScope.auth = RitchyAuth;
//        console.log('RitchyAuth.isUserAuth: ', RitchyAuth.isUserAuth());
    }]);

    /**
     * Настройка маршрутизации
     */
    RitchyApp.config(['$locationProvider','$routeProvider',
        function($location, $routeProvider) {

            // Предварительная проверка доступности маршрута
            var _checkRoute = function($route, $http, onSuccess, onError) {
                var module = $route.current.params.module || 'core';
                var view = $route.current.params.view || 'index';
                var url = modulesBase+'/'+module+'/views/'+view+'.html';

                // Проверка доступности шаблона коротким запросом
                var http = new XMLHttpRequest();
                http.open('HEAD', url, true);
                http.onreadystatechange = function() {
                    if (http.readyState==4) {
                        if (http.status==200) {
                            onSuccess && onSuccess();
                        } else {
                            onError && onError();
                        }
                    }
                };
                http.send('');
            };

            // Простая проверка доступности маршрута
            var checkRoute = ['$route', '$http', '$location', '$q',
            function($route, $http, $location, $q) {
                var deferred = $q.defer();
                _checkRoute($route, $http, function onSuccess() {
                    deferred.resolve();
                }, function onError() {
                    deferred.resolve();
                    $location.path("/404");
                })
            }];


            // Проверка доступности маршрута с проверкой статуса вторизации пользователя
            var checkAuthRoute = ['$route', '$http', '$location', '$q', 'RitchyAuth',
                function($route, $http, $location, $q, RitchyAuth) {

                var deferred = $q.defer();
                    // Проверка авторизации пользователя
                    RitchyAuth.isUserAuth(function( isUserAuth ) {
                        if (!isUserAuth) {
                            // Пользователь не авторизован, нужно его завставить авторизоваться
                            deferred.resolve();
                            $location.path('/login');
                        } else {
                            // Пользователь авторизован, проверяем доступность маршрута
                            _checkRoute($route, $http, function onSuccess() {
                                deferred.resolve();
                            }, function onError() {
                                deferred.resolve();
                                $location.path("/404");
                            })
                        }
                    });
            }];

            $routeProvider
                .when('/404', {
                    templateUrl: modulesBase+'/core/views/404.html'
                })
                .when('/logout', {
                    template: '', // Шаблон нужно указывать обязательно, иначе этот маршрут не заработает
                    controller: ['$scope', '$http', '$location', 'RitchyAuth',
                        function($scope, $http, $location, RitchyAuth) {
                        RitchyAuth.doLogout(function onLogout() {
                            // Переадресация после выода на страницу входа
                            $location.path('/login');
                        });
                    }]
                })
                .when('/recovery', {
                    templateUrl: modulesBase+'/recovery/views/index.html',
                    resolve: {
                        check: checkRoute
                    }
                })
                .when('/:module/:view/:params*', {
                    templateUrl: function(params) {
                        // TODO: need to setup params.params to current controller of calculated view
                        return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                    },
                    resolve: {
                        check: checkAuthRoute
                    }
                }).when('/:module/:view', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                },
                resolve: {
                    check: checkAuthRoute
                }
            }).when('/:module', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/index.html';
                },
                resolve: {
                    check: checkAuthRoute
                }
            });
        }]);
})();
