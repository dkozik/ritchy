/**
 * Created by admin on 11.06.2016.
 */
(function() {

    RitchyApp.controller('login', ['$scope', '$element', '$location', '$rootScope', 'RitchyApi', 'RitchyDialog', 'RitchyAuth', 'RitchyAnim',
        function($scope, $element, $location, $rootScope, RitchyApi, RitchyDialog, RitchyAuth, RitchyAnim) {

        // Login panel animation
        var target = document.querySelector('div.login-pane');
        RitchyAnim.easeIn(target);

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
                        RitchyAuth.updateToken(response.data.token);
                        // TODO: Redirect to first requested page before redirected to /login
                        RitchyAnim.easeOut(target, function() {
                            $rootScope.$apply(function() {
                                $location.path('/core');
                            });
                        });
                    } else if (response.data.error>'') {
                        RitchyDialog.showAlert('Login error', response.data.error);
                    }
                }, function onError(response) {
                        RitchyDialog.showAlert('Login error', 'Unknown api error: '+response);
                });
            },
            doRecovery: function() {
                RitchyAnim.easeOut(target, function() {
                    $rootScope.$apply(function() {
                        $location.path('/recovery');
                    });
                });
                return false;
            },
            doRegister: function() {
                RitchyAnim.easeOut(target, function() {
                    $rootScope.$apply(function() {
                        $location.path('/register');
                    });
                });
            }
        };

    }]);
})();