/**
 * Created by admin on 13.06.2016.
 */

(function() {

    RitchyApp.controller('recovery', ['$scope', '$element', 'RitchyApi', 'RitchyDialog', '$location',
        function($scope, $element, RitchyApi, RitchyDialog, $location) {

            // Animation
            var tl = new TimelineMax();
            TweenLite.set($element, {scale: 0.5, rotation: 0.1, autoAlpha:0});
            tl.to($element, 0.3, {autoAlpha: 1});
            tl.to($element, 0.5, {scale: 1, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
        }]);

})();