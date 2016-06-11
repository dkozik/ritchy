/**
 * Created by admin on 11.06.2016.
 */
var RitchyApp = angular.module('Ritchy', ['ngRoute', 'ngMaterial']);

(function() {

    var modulesBase = './modules';

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
console.log('controller: ',$route.current.params.module);
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
