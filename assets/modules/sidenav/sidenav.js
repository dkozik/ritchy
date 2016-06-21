/**
 * Created by admin on 21.06.2016.
 */
(function() {

    RitchyApp.controller('sidenav', ['$scope', '$document', '$element', 'RitchyAnim',
        function($scope, $document, $element, RitchyAnim) {

        function expand() {
            var tl = new TimelineMax();
            //TweenLite.set($element[0]);
            RitchyAnim.easeIn($element[0]);
            angular.element($document[0].body).addClass('navbar-expanded');
        }

        function collapse() {
            RitchyAnim.easeOut($element[0]);
            angular.element($document[0].body).removeClass('navbar-expanded');
        }

        expand();

    }]);
    
})();