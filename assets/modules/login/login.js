/**
 * Created by admin on 11.06.2016.
 */
(function() {

    RitchyApp.controller('login', ['$scope', '$element', 'RitchyApi', function($scope, $element, RitchyApi) {

        // Login panel animation
        var tl = new TimelineMax();
        TweenLite.set($element, {scale: 0.5, rotation: 0.1, autoAlpha:0});
        tl.to($element, 0.3, {autoAlpha: 1});
        tl.to($element, 0.5, {scale: 1, ease: Back.easeOut.config(0.6), autoRound: false}, 0);

        $scope.links = {
            recovery_url: '#/recovery'
        };

        $scope.user = {
            login: 'admin',
            password:'123',
            canLogin: true,
            changed: function() {
                this.canLogin = this.login>'' && this.password>'';
            },
            doLogin: function() {
                RitchyApi.request('login', null, {login: this.login, password: this.password},
                function onSuccess(response) {
console.log(response);
                }, function onError(response) {

                });
            }
        };

    }]);
})();