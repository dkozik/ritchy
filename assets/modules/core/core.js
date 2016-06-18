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

var RitchyApp = angular.module('Ritchy', ['ngRoute', 'ngMaterial', 'ngMessages'])
    .config(['$httpProvider', function($httpProvider){
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        // Временная отмена OAuth 2.0
        // $httpProvider.defaults.withCredentials = true;
    }])
    .run(['$rootScope', '$injector', function($rootScope, $injector) {
        $injector.get('$http').defaults.transformRequest = function( data ) {
            // Трансформация тела POST запроса в понятный PHP вид
            return angular.isObject(data) && String(data) !== '[Object File]' ? angular.toParam(data) : data;
        };
    }]);

(function() {

    var modulesBase = './modules';

    RitchyApp.factory('RitchUtil', [function() {

        var _isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Firefox 1.0+
        var _isFirefox = typeof InstallTrigger !== 'undefined';
        // At least Safari 3+: "[object HTMLElementConstructor]"
        var _isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // Internet Explorer 6-11
        var _isIE = /*@cc_on!@*/false || !!document.documentMode;
        // Edge 20+
        var _isEdge = !_isIE && !!window.StyleMedia;
        // Chrome 1+
        var _isChrome = !!window.chrome && !!window.chrome.webstore;
        // Blink engine detection
        var _isBlink = (_isChrome || _isOpera) && !!window.CSS;

        return {
            isChrome: function() { return _isChrome; },
            isOpera: function() { return _isOpera; },
            isIE: function() { return _isIE; }
        }
    }]);

    /**
     * Сервис стандартной анимации
     */
    RitchyApp.factory('RitchyAnim', [function() {
        return {
            easeIn: function( target ) {
                var tl = new TimelineMax();
                TweenLite.set(target, {scale: 0.5, autoAlpha:0});
                tl.to(target, 0.3, {autoAlpha: 1});
                tl.to(target, 0.5, {scale: 1, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
            },
            easeOut: function( target, callback ) {
                var tl = new TimelineMax();
                TweenLite.set(target, {scale: 1, rotation: 0.1, autoAlpha: 1});
                tl.to(target, 0.2, {autoAlpha: 0});
                tl.to(target, 0.2, {scale: 0.5, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
                if (callback) {
                    tl.call(callback);
                }
            }
        }
    }]);

    /**
     * Сервис реализующий логику сообщений и форм ввода/выбора значений
     */
    RitchyApp.factory('RitchyDialog', ['$mdDialog', '$mdMedia', 'RitchyAnim', '$q', '$timeout', '$document', 'RitchUtil',
        function($mdDialog, $mdMedia, RitchyAnim, $q, $timeout, $document, RitchUtil) {
        return {
            // Показ инфомрационного уведомления на экране
            showAlert: function( ev, title, text, callback ) {
                var alert_com = $mdDialog.alert()
                    .parent(angular.element(document.body))
                    .clickOutsideToClose(true)
                    .title(title)
                    .textContent(text)
                    .ok('OK');
                if (ev!=null) {
                    alert_com.targetEvent(ev);
                }
                $mdDialog.show(alert_com).finally(callback);
            },
            showTemplateDialog: function( ev, templateUrl, fullScreen ) {
                var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) || fullScreen;
                var params = {
                    templateUrl: templateUrl,
                    //hasBackdrop: false,
                    //disableParentScroll: false,
                    //parent: angular.element(document.body),
                    onShowing : function( scope, element, options, controller ) {
                        // Наложение стандартной анимации "всплытия" формы (из - за ошибки стандартной анимации)
                        //element[0].querySelector('md-dialog').style.display = "none";
                        if (RitchUtil.isChrome() || RitchUtil.isOpera()) {
                            RitchyAnim.easeIn(element[0].querySelector('md-dialog'));
                        } else {
//                            element[0].querySelector('md-dialog').style.display = "none";
                        }
                        // Fix проблемы "весящего" в пол экрана body при открытом диалоге
                        //$timeout(function() {
                            //document.body.style.top = "0";
                            //element[0].style.top = 0;
                            //document.body.style.height = '100%';
                        //}, 300);
                    },
                    // Переопределение стандартной анимации закрывания popup диалога
                    onRemove: function(scope, element, options) {
                        options.deactivateListeners();
                        options.unlockScreenReader();
                        options.hideBackdrop(options.$destroy);


                        // По аналогии со стандартным методом - удаляются focus-trap элементы
                        var focusTraps = element[0].querySelectorAll('div._md-dialog-focus-trap');
                        angular.forEach(focusTraps, function(element, offset) {
                            if (element && element.parentNode) {
                                element.parentNode.removeChild(element);
                            }
                        });

                        // Удаление элемента без анимации
                        return detachAndClean();

                        function removeContentElement() {
                            if (!options.contentElement) return;

                            options.reverseContainerStretch();

                            if (!options.elementInsertionParent) {
                                // When the contentElement has no parent, then it's a virtual DOM element, which should
                                // be removed at close, as same as normal templates inside of a dialog.
                                options.elementInsertionEntry.parentNode.removeChild(options.elementInsertionEntry);
                            } else if (!options.elementInsertionSibling) {
                                // When the contentElement doesn't have any sibling, then it can be simply appended to the
                                // parent, because it plays no role, which index it had before.
                                options.elementInsertionParent.appendChild(options.elementInsertionEntry);
                            } else {
                                // When the contentElement has a sibling, which marks the previous position of the contentElement
                                // in the DOM, we insert it correctly before the sibling, to have the same index as before.
                                options.elementInsertionParent.insertBefore(options.elementInsertionEntry, options.elementInsertionSibling);
                            }
                        }

                        /**
                         * Detach the element
                         */
                        function detachAndClean() {
                            // Очищаем стандартную анимацию "скрывания" диалога
                            options.clearAnimate();
                            // Применяем стандартную анимацию закрывания диалога
                            RitchyAnim.easeOut(element, function() {
                                angular.element($document[0].body).removeClass('md-dialog-is-showing');
                                // Only remove the element, if it's not provided through the contentElement option.
                                if (!options.contentElement) {
                                    element.remove();
                                } else {
                                    removeContentElement();
                                }

                                if (!options.$destroy) options.origin.focus();
                            });
                        }
                    },
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    controller: ['$scope', function($scope) {
                        $scope.hide = function() {
                            $mdDialog.hide();
                        };
                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };
                        $scope.close = function() {
                            $mdDialog.hide();
                        };
                    }]
                };
                if (!RitchUtil.isChrome() && !RitchUtil.isOpera()) {
                    params.onComplete = function (scope, element) {
//                        RitchyAnim.easeIn(element);
//                        element[0].querySelector('md-dialog').style.display = "fixed";
                    };
                }
                if (ev!=null) {
                    params.targetEvent = ev;
                }

                $mdDialog.show(params);
            }
        }
    }]);

    /**
     * Сервис реализующий логику работы с серверным API
     */
    RitchyApp.factory('RitchyApi', ['$http', '$rootScope', function($http, $rootScope) {

        var apiUrl = 'http://private-2251e-ritchy2.apiary-mock.com';

        return {
            request: function( controller, action, params, onSuccess, onError ) {
                var url = apiUrl+'/'+controller;
                var token = $rootScope.auth.getUserToken();
                var config = {};
                var native_params = {};
                if (token>'') {
                    // Отправка токена с каждым запросом
                    // Поддержка OAuth 2.0 временно отменяется
                    // config.headers = {'Authorization': 'Bearer '+token};
                    // Token переходит в параметры каждого запроса
                    native_params.token = token;
                }
                if (action>'') url+='/'+action;
                $http.post(url, angular.extend({}, params, native_params), config).then(function onSuccessPre( response ) {
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
                    RitchyDialog.showAlert(null, 'API error', 'Request user stats returned error: '+response.data.error);
                } else if (response.data.loggedIn) {
                    isUserAuth = response.data.loggedIn || false;
                }
                firstStatLoaded = true;
                callback && callback(isUserAuth);
            }, function onError( response ) {
                firstStatLoaded = true;
                if (angular.isObject(response)) {
                    if (response.status<0) {
                        RitchyDialog.showAlert(null, 'API error', 'Unknown api error: ' + response.status+'<br>Error details in console.', callback);
                    } else {
                        RitchyDialog.showAlert(null, 'API error', 'Unknown api error: ' + response.statusText, callback);
                    }
                } else {
                    RitchyDialog.showAlert(null, 'API error', 'Unknown api error: '+response, callback);
                }
            });
        }

        function requestLogout( callback, ev ) {
            RitchyApi.request('logout', null, null, function onSuccess( response ) {
                if (response.data.error>'') {
                    RitchyDialog.showAlert(ev, 'API error', 'Error when logout: '+response.data.error, callback);
                } else {
                    isUserAuth = false;
                    callback && callback(isUserAuth);
                }
            }, function onError( response ) {
                RitchyDialog.showAlert(ev, 'API error', 'Unknown api error: '+response, callback);
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
    RitchyApp.controller('core',['$scope', '$http', 'RitchyAuth', 'RitchyDialog', '$rootScope',
        function($scope, $http, RitchyAuth, RitchyDialog, $rootScope) {

            //RitchyDialog.showAlert(null, 'title', 'text');
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
                .when('/register', {
                    templateUrl: modulesBase+'/register/views/index.html',
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
