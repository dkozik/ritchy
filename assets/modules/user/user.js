/**
 * Created by admin on 21.06.2016.
 */

(function() {

    RitchyApp.controller('user', ['$scope', 'RitchySidebar',
        function ($scope, RitchySidebar) {

            RitchySidebar.connect($scope);
            console.log(' [[build user]]');
        }]);

})();