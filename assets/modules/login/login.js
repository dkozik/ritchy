/**
 * Created by admin on 11.06.2016.
 */
(function() {

    RitchyApp.controller('login', ['$scope', '$element', 'RitchyApi', 'RitchyDialog', '$location', '$rootScope',
        function($scope, $element, RitchyApi, RitchyDialog, $location, $rootScope) {

        // Login panel animation
        var tl = new TimelineMax();
        TweenLite.set($element, {scale: 0.5, rotation: 0.1, autoAlpha:0});
        tl.to($element, 0.3, {autoAlpha: 1});
        tl.to($element, 0.5, {scale: 1, ease: Back.easeOut.config(0.6), autoRound: false}, 0);

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
                    if (response.data.code==1) {
                        // TODO: Redirect to first requested page before redirected to /login
                        $location.path('/core');
                    } else if (response.data.error>'') {
                        RitchyDialog.showAlert('Login error', response.data.error);
                    }
                }, function onError(response) {
                        RitchyDialog.showAlert('Login error', 'Unknown api error: '+response);
                });
            },
            doRecovery: function() {
                var tl = new TimelineMax();
                TweenLite.set($element, {scale: 1, rotation: 0.1, autoAlpha: 1});
                tl.to($element, 0.2, {autoAlpha: 0});
                tl.to($element, 0.2, {scale: 0.5, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
                tl.call(function() {
                    $rootScope.$apply(function() {
                        $location.path('/recovery');
                    });
                });
                return false;
            }
        };

    }]);
})();