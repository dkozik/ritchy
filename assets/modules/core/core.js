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
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        $httpProvider.defaults.transformRequest = function( data ) {
            angular.isObject(data) && String(data) !== '[Object File]' ? angular.toParam(data) : data;
        }
    }]);

(function() {

    var modulesBase = './modules';

    RitchyApp.factory('RitchyDialog', ['$mdDialog', '$mdMedia', function($mdDialog, $mdMedia) {
        return {
            showAlert: function( title, text ) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.body))
                        .clickOutsideToClose(true)
                        .title(title)
                        .textContent(text)
                        .ok('OK')
                );
            }
        }
    }]);

    RitchyApp.factory('RitchyApi', ['$http', function($http) {

        var apiUrl = 'http://localhost/ritchy/api';

        return {
            request: function( controller, action, params, onSuccess, onError ) {
                var url = apiUrl+'/'+controller;
                if (action>'') url+='/'+action;
console.log('params: ', params);
                $http.post(url, params).then(onSuccess, onError);
            }
        }
    }]);

    RitchyApp.factory('RitchyAuth', ['$http', 'RitchyDialog', 'RitchyApi', function( $http, RitchyDialog, RitchyApi ) {
        // Service internal params
        var isUserAuth = false;

        // Constructor method implementation
        RitchyApi.request('login', 'stat', null, function onSuccess( response ) {
            if (response.data.error>'') {
                RitchyDialog.showAlert('API error', 'Request user stats returned error: '+response.data.error);
            } else if (response.data.loggedIn) {
                isUserAuth = response.data.loggedIn || false;
            }
        }, function onError( response ) {
            RitchyDialog.showAlert('API error', 'Unknown api error');
        });

        // Service public methods
        return {
            isUserAuth: function() {
                return isUserAuth;
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

            var checkRoute = ['$route', '$http', '$location', function($route, $http, $location) {
                var module = $route.current.params.module || 'core';
                var view = $route.current.params.view || 'index';
//console.log('$route.current.params: ',$route.current.params);
//console.log('Check route: ', modulesBase+'/'+module+'/views/'+view+'.html');
                return $http.get(modulesBase+'/'+module+'/views/'+view+'.html').success(function(res) {
                    return true;
                }).error(function(res) {
                    return $location.path("/404");
                })
            }];

            $routeProvider
                .when('/404', {
                    templateUrl: modulesBase+'/core/views/404.html'
                })
                .when('/:module/:view/:params*', {
                    templateUrl: function(params) {
                        console.log(params);
                    },
                    resolve: {
                        check: checkRoute
                    }
                }).when('/:module/:view', {
                templateUrl: function( params ) {
                    console.log(params);
                },
                resolve: {
                    check: checkRoute
                }
            }).when('/:module', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/index.html';
                },
                resolve: {
                    check: checkRoute
                },
                controller: ['$route', function($route) {
                    return $route.current.params.module;
                }]
            });
            /*
             .when('/404', {
             templateUrl: 'views/404.html'
             }).otherwise({
             redirectTo: '/404'
             });
             */

            /*
             .when('/login', {
             templateUrl: 'views/login.html',
             controller: 'LoginController'
             })
             */
        }]);


})();
