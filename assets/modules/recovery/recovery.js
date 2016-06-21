/**
 * Created by admin on 13.06.2016.
 */

(function() {

    RitchyApp.controller('recovery', ['$scope', '$rootScope', 'RitchyApi', 'RitchyDialog', 'RitchyAnim', '$location',
        function($scope, $rootScope, RitchyApi, RitchyDialog, RitchyAnim, $location) {

            // Animation
            var target = document.querySelector("div.recovery-pane");
            RitchyAnim.easeInBounce(target);
            
            $scope.user = {
                email: '',
                canRecovery: false,
                changed: function() {
                    this.canRecovery = this.email>'';
                },
                doCancel: function() {
                    RitchyAnim.easeOut(target, function() {
                        $rootScope.$apply(function() {
                            $location.path('/login');
                        });
                    });
                },
                doRecovery: function( ev ) {
                    RitchyApi.post('recovery', null, {email: this.email},
                    function onSuccess( response ) {
                        if (response.data.code==1) {
                            RitchyDialog.showAlert(ev, 'Recovery result', 'Password reset instructions sent to email', function() {
                                RitchyAnim.easeOut(target, function() {
                                    $rootScope.$apply(function() {
                                        $location.path('/login');
                                    });
                                });
                            });
                        } else if (response.data.error>'') {
                            RitchyDialog.showAlert(ev, 'Login error', response.data.error);
                        }
                    }, function onError(response) {
                            if (angular.isObject(response)) {
                                if (response.status<0) {
                                    RitchyDialog.showAlert(ev, 'Login error', 'Unknown api error, response status ' + response.status+', details in console log.');
                                } else {
                                    RitchyDialog.showAlert(ev, 'Login error', 'Unknown api error, response status '+ response.status+', response text: '+response.responseText);
                                }
                            } else {
                                RitchyDialog.showAlert(ev, 'Login error', 'Unknown api error: '+response);
                            }
                    });
                }
            };

        }]);
})();