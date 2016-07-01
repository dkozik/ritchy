/**
 * Created by admin on 21.06.2016.
 */
(function() {

    RitchyApp.factory('RitchyUserMenu', ['$templateRequest', 'RitchyCore',
        function( $templateRequest, RitchyCore ) {
        var menuLoaded = false;
        function loadMenu() {
            if (!menuLoaded) {
                var $coreScope = RitchyCore.getCoreScope();
                menuLoaded = true;
                $templateRequest('/modules/user/views/menu.html', false).then(function (html) {
                    $coreScope.user_menu = html;
                });
            }
        }

        return {
            connect: function( $scope ) {
                loadMenu();
            }
        }
    }]);

    RitchyApp.controller('userMenu', ['$scope', '$element', '$timeout', 'RitchySidebar', 'RitchyAnim',
        function($scope, $element, $timeout, RitchySidebar, RitchyAnim) {
            $element.css('left', '-1000px');
            angular.element($element).ready(function() {
                $timeout(function() {
                    RitchyAnim.pushLeft( $element, 0 );
                });
            });

            // 1. Push bg from left
            // 2. Slide every menu item
        }]);

    RitchyApp.controller('user', ['$scope', 'RitchySidebar', 'RitchyUserMenu',
        function ($scope, RitchySidebar, RitchyUserMenu) {

            RitchySidebar.connect($scope);
            RitchyUserMenu.connect($scope);

        }]);

})();