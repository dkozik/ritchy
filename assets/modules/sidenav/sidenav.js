/**
 * Created by admin on 21.06.2016.
 */
(function() {

    RitchyApp.factory('RitchySidebar', ['$templateRequest', function( $templateRequest ) {
        var sideBarLoaded = false;

        function loadSideBar() {
            if (!sideBarLoaded) {
                var $coreScope = angular.element(document.querySelector('body>div[ng-controller="core"]')).scope();
                sideBarLoaded = true;
                $templateRequest('/modules/sidenav/views/index.html', false).then(function (html) {
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

    RitchyApp.controller('sidenav', ['$scope', '$document', '$element', 'RitchyAnim',
        function($scope, $document, $element, RitchyAnim) {
            
            var container = $element;
            var parent = document.querySelector('div#sidenav-parent');
            var faces = document.querySelectorAll('div.sidenav-face');
            var cube = new Cube(container, parent, faces);

            cube.show();

            $scope.rotate = function() {
                cube.rotateLeft();
            }

    }]);
    
})();