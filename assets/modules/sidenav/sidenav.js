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

        function expand() {
            var tl = new TimelineMax();

            TweenLite.set($element[0], {rotationY: '90'});
            tl.to($element[0], 0.5, {rotationY: '0', ease: Back.easeOut.config(2)});
            //RitchyAnim.easeIn($element[0]);
            angular.element($document[0].body).addClass('navbar-expanded');
        }

        function collapse() {
            RitchyAnim.easeOut($element[0]);
            angular.element($document[0].body).removeClass('navbar-expanded');
        }

        expand();

    }]);
    
})();