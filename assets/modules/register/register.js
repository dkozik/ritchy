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
            }, function onError( response, message ) {
                RitchyDialog.showAlert(ev, 'API error', message);
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
console.log('changed');
                    this.canRegister = this.name>'' && this.company>'' && this.email>'' && this.password>'' && this.termsAgree;
                },
                doRegister: function( ev ) {
                    var params = {
                        name: this.name,
                        company: this.company,
                        country: this.country,
                        email: this.email,
                        password: this.password,
                        delivery: this.delivery+''
                    };
console.log('params: ', params);
                    RitchyApi.post('register', null, params, function onSuccess( response ) {
                        if (response.data.code==1) {
                            RitchyDialog.showAlert(ev, 'Registration result', 'Registration successfuly complete, wait for email notification', function() {
                                RitchyAnim.easeOut(target, function() {
                                    $rootScope.$apply(function() {
                                        $location.path('/login');
                                    });
                                });
                            });
                        } else if (response.data.error>'') {
                            RitchyDialog.showAlert(ev, 'Registration API error', response.data.error);
                        }
                    }, function onError() {
                        RitchyDialog.showAlert(ev, 'Registration API error', message);
                    });
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