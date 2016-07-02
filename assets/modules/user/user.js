/**
 * Created by admin on 21.06.2016.
 */
(function() {

    RitchyApp.factory('RitchyUserMenu', ['$templateRequest', 'RitchyCore',
        function( $templateRequest, RitchyCore ) {
        var menuLoaded = false;
        var currentPage = null, currentScope = null;
        function loadMenu() {
            if (!menuLoaded) {
                var $coreScope = RitchyCore.getCoreScope();
                menuLoaded = true;
                $templateRequest(RitchyCore.getModulesBase()+'/user/views/menu.html', false).then(function (html) {
                    $coreScope.user_menu = html;
                });
            }
        }

        return {
            connect: function( $scope, $element ) {
                loadMenu();
                currentPage = $element;
                currentScope = $scope;
            },
            getCurrentPage: function() {
                return currentPage;
            },
            getCurrentScope: function() {
                return currentScope;
            }
        }
    }]);

    RitchyApp.controller('userMenu', ['$scope', '$element', '$timeout', '$location', '$window', '$rootScope', 'RitchySidebar', 'RitchyAnim', 'RitchyUserMenu',
        function($scope, $element, $timeout, $location, $window, $rootScope, RitchySidebar, RitchyAnim, RitchyUserMenu) {

            var visible = true;
            var currentRoute = $location.path();

            $element.css('left', '-1000px');
            angular.element($element).ready(function() {
                $timeout(function() {
                    RitchyAnim.pushLeft( $element, 0 );
                });
            });

            $rootScope.RitchyUserMenu = $scope;

            $scope.restore = function() {
                if (!visible) {
                    visible = true;
                    $element.css('left', '-1000px');
                    TweenLite.set($element, {scale: 1, autoAlpha: 1});
                    RitchyAnim.pushLeft($element, 0);
                }
            };

            function goto( addr, skipRotate ) {
                var target = RitchyUserMenu.getCurrentPage();
                if (!target || currentRoute===addr) return;
                if (!skipRotate) {
                    $rootScope.RitchySidenav.cube.rotateAround();
                }
                RitchyAnim.fadeOut(target, function() {
                    $rootScope.$apply(function() {
                        currentRoute = addr;
                        $location.path(addr);
                    });
                });
            }

            var items = document.querySelectorAll("div.menu-container div.menu-link div");
            for (var i=0; i<items.length; i++) {
                var $item = angular.element(items[i]);
                $item.bind("mouseenter", function( $event ) {
                    var tl = new TimelineLite();
                    tl.to($event.target, 0.2, { x: -10, yoyo: true, repeat: 1 })
                      .to($event.target, 0.2, { x:  10, yoyo: true, repeat: 1 })
                      .to($event.target, 0.2, { x:   0, yoyo: true, repeat: 1 });
                      //.to($event.target, 0.2, { clearProps:"x" });
                });
//                $item.bind("mouseleave", function( $event ) {
//                    TweenLite.to($event.target, 0.5, { rotationX: 0 });
//                });
            }

            $scope.goto_details = function() {
                goto("/user");
            };
            $scope.goto_pricelist = function() {
                goto("/user/pricelist");
            };
            $scope.goto_discounts = function() {
                goto("/user/discount");
            };
            $scope.goto_logout = function() {
                RitchyAnim.easeOut($element);
                visible = false;
                goto("/logout", true);
            };
        }]);

    RitchyApp.controller('userIndex', ['$scope', '$rootScope', '$element', 'RitchySidebar', 'RitchyUserMenu',
        function ($scope, $rootScope, $element, RitchySidebar, RitchyUserMenu) {

            RitchySidebar.connect($scope, $element);
            RitchyUserMenu.connect($scope, $element);

            if ($rootScope.RitchyUserMenu) {
                $rootScope.RitchyUserMenu.restore();
            }

        }]);

})();