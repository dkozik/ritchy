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
        $httpProvider.defaults.transformRequest = function( data ) {
            return angular.isObject(data) && String(data) !== '[Object File]' ? angular.toParam(data) : data;
        }
    }]);

(function() {

    var modulesBase = './modules';

    RitchyApp.factory('RitchyDialog', ['$mdDialog', '$mdMedia', function($mdDialog, $mdMedia) {
        return {
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

    RitchyApp.factory('RitchyApi', ['$http', function($http) {

        var apiUrl = 'http://localhost/ritchy/api';

        return {
            request: function( controller, action, params, onSuccess, onError ) {
                var url = apiUrl+'/'+controller;
                if (action>'') url+='/'+action;
                $http.post(url, params).then(onSuccess, onError);
            }
        }
    }]);

    RitchyApp.factory('RitchyAuth', ['$http', 'RitchyDialog', 'RitchyApi', function( $http, RitchyDialog, RitchyApi ) {
        // Service internal params
        var isUserAuth = false,
            firstStatLoaded = false;


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
                RitchyDialog.showAlert('API error', 'Unknown api error: '+response, callback);
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
            },
            doLogout: function( callback ) {
                requestLogout(callback);
            },
            isUserAuth: function( callback ) {
                requestLoginStat(callback, true);
            }
        }
    }]);


    RitchyApp.controller('core',['$scope', '$http', 'RitchyAuth', function($scope, $http, RitchyAuth) {
        function sendStat() {
            var img = new Image();
            img.src = "./api/1x1.png?";
        }
//        console.log('RitchyAuth.isUserAuth: ', RitchyAuth.isUserAuth());
    }]);

    RitchyApp.config(['$locationProvider','$routeProvider',
        function($location, $routeProvider) {

            var _checkRoute = function($route, $http, onSuccess, onError) {
                var module = $route.current.params.module || 'core';
                var view = $route.current.params.view || 'index';

                $http.get(modulesBase+'/'+module+'/views/'+view+'.html').then(onSuccess, onError);
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
                .when('/:module/:view/:params*', {
                    templateUrl: function(params) {
                        // TODO: need to setup params.params to current controller of calculated view
                        return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                    },
                    resolve: {
                        check: checkAuthRoute
                    },
                    controller: ['$route', function($route) {
                        return $route.current.params.module;
                    }]
                }).when('/:module/:view', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                },
                resolve: {
                    check: checkAuthRoute
                },
                controller: ['$route', function($route) {
                    return $route.current.params.module;
                }]
            }).when('/:module', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/index.html';
                },
                resolve: {
                    check: checkAuthRoute
                },
                controller: ['$route', function($route) {
                    return $route.current.params.module;
                }]
            });
        }]);
})();
