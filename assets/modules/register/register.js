/**
 * Created by kozik on 15.06.2016.
 */

(function() {

    RitchyApp.controller('register', ['$scope', '$element', '$location', '$rootScope', 'RitchyApi', 'RitchyDialog', 'RitchyAuth', 'RitchyAnim',
        function($scope, $element, $location, $rootScope, RitchyApi, RitchyDialog, RitchyAuth, RitchyAnim) {

            var target = document.querySelector('div.register-pane');
            RitchyAnim.easeInBounce(target);

            $scope.countryList = {};

            // Получение списка стран
            RitchyApi.get('dict', null, {dictname: 'countries'}, function onSuccess( response ) {
                if (response.data.code==1) {
                    $scope.countryList.list = response.data.list;
                } else if (response.data.error>'') {
                    RitchyDialog.showAlert(ev, 'API error', response.data.error);
                }
            }, function onError( response ) {
                if (angular.isObject(response)) {
                    if (response.status<0) {
                        RitchyDialog.showAlert(ev, 'API error', 'Unknown api error, response status ' + response.status+', details in console log.');
                    } else {
                        RitchyDialog.showAlert(ev, 'API error', 'Unknown api error, response status '+ response.status+', response text: '+response.responseText);
                    }
                } else {
                    RitchyDialog.showAlert(ev, 'API error', 'Unknown api error: '+response);
                }
            });


            $scope.user = {
                name: '',
                company: '',
                country: '',
                email: '',
                password: '',
                delivery: false,
                termsAgree: false,
                canRegister: false,
                changed: function( ev ) {
                    this.canRegister = this.name>'' && this.company>'' && this.email>'' && this.password>'' && this.delivery && this.termsAgree;
                },
                doRegister: function( ev ) {

                },
                doSignIn: function(ev) {
                    RitchyAnim.easeOut(target, function() {
                        $rootScope.$apply(function() {
                            $location.path('/login');
                        });
                    });
                    return false;
                },
                showTerms: function(ev) {
                    RitchyDialog.showTemplateDialog(ev, '/modules/register/views/terms.html', true);
                },
                showPrivacy: function(ev) {
                    RitchyDialog.showTemplateDialog(ev, '/modules/register/views/privacy.html', true);
                },
                showMoreInfo: function(ev) {
                    RitchyDialog.showTemplateDialog(ev, '/modules/register/views/delivery.html', true);
                }
            };
        }]);
})();