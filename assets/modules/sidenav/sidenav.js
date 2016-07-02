/**
 * Created by admin on 21.06.2016.
 */
(function() {

    RitchyApp.factory('RitchySidebar', ['$templateRequest', 'RitchyCore', function( $templateRequest, RitchyCore ) {
        var sideBarLoaded = false;

        function loadSideBar() {
            if (!sideBarLoaded) {
                //var $coreScope = angular.element(document.querySelector('body>div[ng-controller="core"]')).scope();
                var $coreScope = RitchyCore.getCoreScope();
                sideBarLoaded = true;
                $templateRequest(RitchyCore.getModulesBase()+'/sidenav/views/index.html', false).then(function (html) {
                    $coreScope.sidenav = html;
                });
            }
        }

        return {
            connect: function( $scope ) {
                loadSideBar();
            }
        }

    }]);

    RitchyApp.controller('sidenav', ['$scope', '$rootScope', '$document', '$element', 'RitchyAnim',
        function($scope, $rootScope, $document, $element, RitchyAnim) {
            
            var container = $element;
            var parent = document.querySelector('div#sidenav-parent');
            var faces = document.querySelectorAll('div.sidenav-face');
            $scope.cube = new Cube(container, parent, faces);

            $scope.cube.show();

            $rootScope.RitchySidenav = $scope;

            $rootScope.$on('app.onlogout', function() {
                $scope.cube.hide();
            });

            $rootScope.$on('app.onlogin', function() {
                $scope.cube.show();
            });

            $scope.rotate = function() {
                $scope.cube.rotateLeft();
            }

    }]);
    
})();