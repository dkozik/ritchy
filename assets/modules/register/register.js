/**
 * Created by kozik on 15.06.2016.
 */

(function() {

    RitchyApp.controller('register', ['$scope', '$element', '$location', '$rootScope', 'RitchyApi', 'RitchyDialog', 'RitchyAuth', 'RitchyAnim',
        function($scope, $element, $location, $rootScope, RitchyApi, RitchyDialog, RitchyAuth, RitchyAnim) {

            var target = document.querySelector('div.register-pane');
            RitchyAnim.easeInBounce(target);

            $scope.countryList = {
                list: [
                    {name: 'Czech Republic', code: 'ch'},
                    {name: 'Poland', code: 'pl'},
                    {name: 'Romania', code: 'rm'},
                    {name: 'Russian Federation', code: 'ru'},
                    {name: 'United Kingdom', code: 'uk'}
                ]
            };

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