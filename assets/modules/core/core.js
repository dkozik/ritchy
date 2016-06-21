/**
 * Created by admin on 11.06.2016.
 */
'use strict';

(function(){
    angular.extend( angular, {
        toParam: toParam
    });

    function toParam( object, prefix ) {
        var stack = [];
        var value;

        for( var key in object ) {
            value = object[ key ];
            key = prefix ? prefix + '[' + key + ']' : key;

            if ( value === null ) {
                value = encodeURIComponent( key ) + '=';
            } else if ( typeof( value ) !== 'object' ) {
                value = encodeURIComponent( key ) + '=' + encodeURIComponent( value );
            } else {
                value = toParam( value, key );
            }

            stack.push( value );
        }
        return stack.join( '&' );
    }
})();

var RitchyApp = angular.module('Ritchy', ['ngRoute', 'ngMaterial', 'ngMessages'])
    .config(['$httpProvider', function($httpProvider){
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        // Временная отмена OAuth 2.0
        // $httpProvider.defaults.withCredentials = true;
    }])
    .run(['$rootScope', '$injector', function($rootScope, $injector) {
        $injector.get('$http').defaults.transformRequest = function( data ) {
            // Трансформация тела POST запроса в понятный PHP вид
            return angular.isObject(data) && String(data) !== '[Object File]' ? angular.toParam(data) : data;
        };
    }]);

(function() {

    var modulesBase = './modules';

    RitchyApp.factory('RitchUtil', [function() {

        var _isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Firefox 1.0+
        var _isFirefox = typeof InstallTrigger !== 'undefined';
        // At least Safari 3+: "[object HTMLElementConstructor]"
        var _isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // Internet Explorer 6-11
        var _isIE = /*@cc_on!@*/false || !!document.documentMode;
        // Edge 20+
        var _isEdge = !_isIE && !!window.StyleMedia;
        // Chrome 1+
        var _isChrome = !!window.chrome && !!window.chrome.webstore;
        // Blink engine detection
        var _isBlink = (_isChrome || _isOpera) && !!window.CSS;

        return {
            isChrome: function() { return _isChrome; },
            isOpera: function() { return _isOpera; },
            isIE: function() { return _isIE; }
        }
    }]);

    /**
     * Сервис стандартной анимации
     */
    RitchyApp.factory('RitchyAnim', [function() {
        return {
            easeInBounce: function( target ) {
                var tl = new TimelineMax();
                TweenLite.set(target, {scale: 0.5, autoAlpha:0});
                tl.to(target, 0.3, {autoAlpha: 1});
                tl.to(target, 0.5, {scale: 1, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
            },
            easeIn: function( target ) {
                var tl = new TimelineMax();
                TweenLite.set(target, {scale: 0.5, autoAlpha:0});
                tl.to(target, 0.3, {autoAlpha: 1});
                tl.to(target, 0.5, {scale: 1, ease: Back.easeOut.config(0), autoRound: false}, 0);
            },
            easeOut: function( target, callback ) {
                var tl = new TimelineMax();
                TweenLite.set(target, {scale: 1, rotation: 0.1, autoAlpha: 1});
                tl.to(target, 0.2, {autoAlpha: 0});
                tl.to(target, 0.2, {scale: 0.5, ease: Back.easeOut.config(0.6), autoRound: false}, 0);
                if (callback) {
                    tl.call(callback);
                }
            }
        }
    }]);

    /**
     * Сервис реализующий логику сообщений и форм ввода/выбора значений
     */
    RitchyApp.factory('RitchyDialog', ['$mdDialog', '$mdMedia', 'RitchyAnim', '$q', '$timeout', '$document', 'RitchUtil', '$mdUtil', '$mdTheming', '$mdBottomSheet', '$animate', '$mdGesture', '$mdConstant', '$rootElement', '$mdAria', '$window',
        function($mdDialog, $mdMedia, RitchyAnim, $q, $timeout, $document, RitchUtil, $mdUtil, $mdTheming, $mdBottomSheet, $animate, $mdGesture, $mdConstant, $rootElement, $mdAria, $window) {

            var topFocusTrap, bottomFocusTrap;

            function captureParentAndFromToElements(options) {
                options.origin = angular.extend({
                    element: null,
                    bounds: null,
                    focus: angular.noop
                }, options.origin || {});

                options.parent   = getDomElement(options.parent, $rootElement);
                options.closeTo  = getBoundingClientRect(getDomElement(options.closeTo));
                options.openFrom = getBoundingClientRect(getDomElement(options.openFrom));

                if ( options.targetEvent ) {
                    options.origin   = getBoundingClientRect(options.targetEvent.target, options.origin);
                }

                /**
                 * Identify the bounding RECT for the target element
                 *
                 */
                function getBoundingClientRect (element, orig) {
                    var source = angular.element((element || {}));
                    if (source && source.length) {
                        // Compute and save the target element's bounding rect, so that if the
                        // element is hidden when the dialog closes, we can shrink the dialog
                        // back to the same position it expanded from.
                        //
                        // Checking if the source is a rect object or a DOM element
                        var bounds = {top:0,left:0,height:0,width:0};
                        var hasFn = angular.isFunction(source[0].getBoundingClientRect);

                        return angular.extend(orig || {}, {
                            element : hasFn ? source : undefined,
                            bounds  : hasFn ? source[0].getBoundingClientRect() : angular.extend({}, bounds, source[0]),
                            focus   : angular.bind(source, source.focus),
                        });
                    }
                }

                /**
                 * If the specifier is a simple string selector, then query for
                 * the DOM element.
                 */
                function getDomElement(element, defaultElement) {
                    if (angular.isString(element)) {
                        element = $document[0].querySelector(element);
                    }

                    // If we have a reference to a raw dom element, always wrap it in jqLite
                    return angular.element(element || defaultElement);
                }

            }

            function configureAria(element, options) {
                var role = (options.$type === 'alert') ? 'alertdialog' : 'dialog';
                var dialogContent = element.find('md-dialog-content');
                var existingDialogId = element.attr('id');
                var dialogContentId = 'dialogContent_' + (existingDialogId || $mdUtil.nextUid());

                element.attr({
                    'role': role,
                    'tabIndex': '-1'
                });

                if (dialogContent.length === 0) {
                    dialogContent = element;
                    // If the dialog element already had an ID, don't clobber it.
                    if (existingDialogId) {
                        dialogContentId = existingDialogId;
                    }
                }
                dialogContent.attr('id', dialogContentId);
                element.attr('aria-describedby', dialogContentId);

                if (options.ariaLabel) {
                    $mdAria.expect(element, 'aria-label', options.ariaLabel);
                }
                else {
                    $mdAria.expectAsync(element, 'aria-label', function() {
                        var words = dialogContent.text().split(/\s+/);
                        if (words.length > 3) words = words.slice(0, 3).concat('...');
                        return words.join(' ');
                    });
                }

                // Set up elements before and after the dialog content to capture focus and
                // redirect back into the dialog.
                topFocusTrap = document.createElement('div');
                topFocusTrap.classList.add('_md-dialog-focus-trap');
                topFocusTrap.tabIndex = 0;

                bottomFocusTrap = topFocusTrap.cloneNode(false);

                // When focus is about to move out of the dialog, we want to intercept it and redirect it
                // back to the dialog element.
                var focusHandler = function() {
                    element.focus();
                };
                topFocusTrap.addEventListener('focus', focusHandler);
                bottomFocusTrap.addEventListener('focus', focusHandler);
                // The top focus trap inserted immeidately before the md-dialog element (as a sibling).
                // The bottom focus trap is inserted at the very end of the md-dialog element (as a child).
                element[0].parentNode.insertBefore(topFocusTrap, element[0]);
                element.after(bottomFocusTrap);
            }

            function showBackdrop(scope, element, options) {

                if (options.disableParentScroll) {
                    // !! DO this before creating the backdrop; since disableScrollAround()
                    //    configures the scroll offset; which is used by mdBackDrop postLink()
                    options.restoreScroll = $mdUtil.disableScrollAround(element, options.parent);
                }

                if (options.hasBackdrop) {
                    options.backdrop = $mdUtil.createBackdrop(scope, "_md-dialog-backdrop md-opaque");
                    $animate.enter(options.backdrop, options.parent);
                }

                /**
                 * Hide modal backdrop element...
                 */
                options.hideBackdrop = function hideBackdrop($destroy) {
                    if (options.backdrop) {
                        if ( !!$destroy ) options.backdrop.remove();
                        else              $animate.leave(options.backdrop);
                    }

                    if (options.disableParentScroll) {
                        options.restoreScroll();
                        delete options.restoreScroll;
                    }

                    options.hideBackdrop = null;
                }
            }

            function stretchDialogContainerToViewport(container, options) {
                var isFixed = $window.getComputedStyle($document[0].body).position == 'fixed';
                var backdrop = options.backdrop ? $window.getComputedStyle(options.backdrop[0]) : null;
                var height = backdrop ? Math.min($document[0].body.clientHeight, Math.ceil(Math.abs(parseInt(backdrop.height, 10)))) : 0;

                var previousStyles = {
                    top: container.css('top'),
                    height: container.css('height')
                };

                container.css({
                    top: (isFixed ? $mdUtil.scrollTop(options.parent) : 0) + 'px',
                    height: height ? height + 'px' : '100%'
                });

                return function() {
                    // Reverts the modified styles back to the previous values.
                    // This is needed for contentElements, which should have the same styles after close
                    // as before.
                    container.css(previousStyles);
                };
            }

            function dialogPopIn(container, options) {
                // Add the `md-dialog-container` to the DOM
                options.parent.append(container);
                options.reverseContainerStretch = stretchDialogContainerToViewport(container, options);

                var dialogEl = container.find('md-dialog');

                if (options.fullscreen) {
                    dialogEl.addClass('md-dialog-fullscreen');
                }

                return $q.when(RitchyAnim.easeIn(dialogEl));
            }

            function activateListeners(element, options) {
                var window = angular.element($window);
                var onWindowResize = $mdUtil.debounce(function() {
                    stretchDialogContainerToViewport(element, options);
                }, 60);

                var removeListeners = [];
                var smartClose = function() {
                    // Only 'confirm' dialogs have a cancel button... escape/clickOutside will
                    // cancel or fallback to hide.
                    var closeFn = ( options.$type == 'alert' ) ? $mdDialog.hide : $mdDialog.cancel;
                    $mdUtil.nextTick(closeFn, true);
                };

                if (options.escapeToClose) {
                    var parentTarget = options.parent;
                    var keyHandlerFn = function(ev) {
                        if (ev.keyCode === $mdConstant.KEY_CODE.ESCAPE) {
                            ev.stopPropagation();
                            ev.preventDefault();

                            smartClose();
                        }
                    };

                    // Add keydown listeners
                    element.on('keydown', keyHandlerFn);
                    parentTarget.on('keydown', keyHandlerFn);

                    // Queue remove listeners function
                    removeListeners.push(function() {

                        element.off('keydown', keyHandlerFn);
                        parentTarget.off('keydown', keyHandlerFn);

                    });
                }

                // Register listener to update dialog on window resize
                window.on('resize', onWindowResize);

                removeListeners.push(function() {
                    window.off('resize', onWindowResize);
                });

                if (options.clickOutsideToClose) {
                    var target = element;
                    var sourceElem;

                    // Keep track of the element on which the mouse originally went down
                    // so that we can only close the backdrop when the 'click' started on it.
                    // A simple 'click' handler does not work,
                    // it sets the target object as the element the mouse went down on.
                    var mousedownHandler = function(ev) {
                        sourceElem = ev.target;
                    };

                    // We check if our original element and the target is the backdrop
                    // because if the original was the backdrop and the target was inside the dialog
                    // we don't want to dialog to close.
                    var mouseupHandler = function(ev) {
                        if (sourceElem === target[0] && ev.target === target[0]) {
                            ev.stopPropagation();
                            ev.preventDefault();

                            smartClose();
                        }
                    };

                    // Add listeners
                    target.on('mousedown', mousedownHandler);
                    target.on('mouseup', mouseupHandler);

                    // Queue remove listeners function
                    removeListeners.push(function() {
                        target.off('mousedown', mousedownHandler);
                        target.off('mouseup', mouseupHandler);
                    });
                }

                // Attach specific `remove` listener handler
                options.deactivateListeners = function() {
                    removeListeners.forEach(function(removeFn) {
                        removeFn();
                    });
                    options.deactivateListeners = null;
                };
            }

            function isNodeOneOf(elem, nodeTypeArray) {
                if (nodeTypeArray.indexOf(elem.nodeName) !== -1) {
                    return true;
                }
            }

            function lockScreenReader(element, options) {
                var isHidden = true;

                // get raw DOM node
                walkDOM(element[0]);

                options.unlockScreenReader = function() {
                    isHidden = false;
                    walkDOM(element[0]);

                    options.unlockScreenReader = null;
                };

                /**
                 * Walk DOM to apply or remove aria-hidden on sibling nodes
                 * and parent sibling nodes
                 *
                 */
                function walkDOM(element) {
                    while (element.parentNode) {
                        if (element === document.body) {
                            return;
                        }
                        var children = element.parentNode.children;
                        for (var i = 0; i < children.length; i++) {
                            // skip over child if it is an ascendant of the dialog
                            // or a script or style tag
                            if (element !== children[i] && !isNodeOneOf(children[i], ['SCRIPT', 'STYLE'])) {
                                children[i].setAttribute('aria-hidden', isHidden);
                            }
                        }

                        walkDOM(element = element.parentNode);
                    }
                }
            }

        return {
            // Показ инфомрационного уведомления на экране
            showAlert: function( ev, title, text, callback ) {
                var alert_com = $mdDialog.alert()
                    .parent(angular.element(document.body))
                    .clickOutsideToClose(true)
                    .title(title)
                    .textContent(text)
                    .ok('OK');
                if (ev!=null) {
                    alert_com.targetEvent(ev);
                }
                $mdDialog.show(alert_com).finally(callback);
            },
            showTemplateDialog: function( ev, templateUrl, fullScreen ) {
                var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) || fullScreen;
                var params = {
                    templateUrl: templateUrl,
                    hasBackdrop: true,
                    disableParentScroll: true,
                    parent: angular.element(document.body),
                    onShow: function onShow(scope, element, options, controller) {
                        angular.element($document[0].body).addClass('md-dialog-is-showing');

                        if (options.contentElement) {
                            var contentEl = options.contentElement;

                            if (angular.isString(contentEl)) {
                                contentEl = document.querySelector(contentEl);
                                options.elementInsertionSibling = contentEl.nextElementSibling;
                                options.elementInsertionParent = contentEl.parentNode;
                            } else {
                                contentEl = contentEl[0] || contentEl;
                                // When the element is not visible in the DOM, then we can treat is as same
                                // as a normal dialog would do. Removing it at close etc.
                                // ---
                                // When the element is visible in the DOM, then we restore it at close of the dialog.
                                if (document.contains(contentEl)) {
                                    options.elementInsertionSibling = contentEl.nextElementSibling;
                                    options.elementInsertionParent = contentEl.parentNode;
                                }
                            }

                            options.elementInsertionEntry = contentEl;
                            element = angular.element(contentEl);
                        }

                        captureParentAndFromToElements(options);
                        configureAria(element.find('md-dialog'), options);
                        showBackdrop(scope, element, options);

                        return dialogPopIn(element, options)
                            .then(function() {
                                activateListeners(element, options);
                                lockScreenReader(element, options);
                                warnDeprecatedActions();
                                focusOnOpen();
                            });

                        /**
                         * Check to see if they used the deprecated .md-actions class and log a warning
                         */
                        function warnDeprecatedActions() {
                            if (element[0].querySelector('.md-actions')) {
                                $log.warn('Using a class of md-actions is deprecated, please use <md-dialog-actions>.');
                            }
                        }

                        /**
                         * For alerts, focus on content... otherwise focus on
                         * the close button (or equivalent)
                         */
                        function focusOnOpen() {
                            if (options.focusOnOpen) {
                                var target = $mdUtil.findFocusTarget(element) || findCloseButton();
                                target.focus();
                            }

                            /**
                             * If no element with class dialog-close, try to find the last
                             * button child in md-actions and assume it is a close button.
                             *
                             * If we find no actions at all, log a warning to the console.
                             */
                            function findCloseButton() {
                                var closeButton = element[0].querySelector('.dialog-close');
                                if (!closeButton) {
                                    var actionButtons = element[0].querySelectorAll('.md-actions button, md-dialog-actions button');
                                    closeButton = actionButtons[actionButtons.length - 1];
                                }
                                return angular.element(closeButton);
                            }
                        }
                    },
                    // Переопределение стандартной анимации закрывания popup диалога
                    onRemove: function(scope, element, options) {

                        options.deactivateListeners();
                        options.unlockScreenReader();
                        options.hideBackdrop(options.$destroy);


                        // По аналогии со стандартным методом - удаляются focus-trap элементы
                        var focusTraps = element[0].querySelectorAll('div._md-dialog-focus-trap');
                        angular.forEach(focusTraps, function(element, offset) {
                            if (element && element.parentNode) {
                                element.parentNode.removeChild(element);
                            }
                        });

                        // Удаление элемента без анимации
                        return detachAndClean();

                        function removeContentElement() {
                            if (!options.contentElement) return;

                            options.reverseContainerStretch();

                            if (!options.elementInsertionParent) {
                                // When the contentElement has no parent, then it's a virtual DOM element, which should
                                // be removed at close, as same as normal templates inside of a dialog.
                                options.elementInsertionEntry.parentNode.removeChild(options.elementInsertionEntry);
                            } else if (!options.elementInsertionSibling) {
                                // When the contentElement doesn't have any sibling, then it can be simply appended to the
                                // parent, because it plays no role, which index it had before.
                                options.elementInsertionParent.appendChild(options.elementInsertionEntry);
                            } else {
                                // When the contentElement has a sibling, which marks the previous position of the contentElement
                                // in the DOM, we insert it correctly before the sibling, to have the same index as before.
                                options.elementInsertionParent.insertBefore(options.elementInsertionEntry, options.elementInsertionSibling);
                            }
                        }

                        /**
                         * Detach the element
                         */
                        function detachAndClean() {
                            // Очищаем стандартную анимацию "скрывания" диалога
                            //options.clearAnimate();
                            // Применяем стандартную анимацию закрывания диалога
                            RitchyAnim.easeOut(element, function() {
                                angular.element($document[0].body).removeClass('md-dialog-is-showing');
                                // Only remove the element, if it's not provided through the contentElement option.
                                if (!options.contentElement) {
                                    element.remove();
                                } else {
                                    removeContentElement();
                                }

                                if (!options.$destroy) options.origin.focus();
                            });
                        }
                    },
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    controller: ['$scope', function($scope) {
                        $scope.hide = function() {
                            $mdDialog.hide();
                        };
                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        };
                        $scope.close = function() {
                            $mdDialog.hide();
                        };
                    }]
                };
                if (!RitchUtil.isChrome() && !RitchUtil.isOpera()) {
                    params.onComplete = function (scope, element) {
//                        RitchyAnim.easeIn(element);
//                        element[0].querySelector('md-dialog').style.display = "fixed";
                    };
                }
                if (ev!=null) {
                    params.targetEvent = ev;
                }

                $mdDialog.show(params);
            }
        }
    }]);

    /**
     * Сервис реализующий логику работы с серверным API
     */
    RitchyApp.factory('RitchyApi', ['$http', '$rootScope', function($http, $rootScope) {

        var apiUrl = 'http://private-2251e-ritchy2.apiary-mock.com';

        return {
            request: function( controller, action, params, onSuccess, onError ) {
                var url = apiUrl+'/'+controller;
                var token = $rootScope.auth.getUserToken();
                var config = {};
                var native_params = {};
                if (token>'') {
                    // Отправка токена с каждым запросом
                    // Поддержка OAuth 2.0 временно отменяется
                    // config.headers = {'Authorization': 'Bearer '+token};
                    // Token переходит в параметры каждого запроса
                    native_params.token = token;
                }
                if (action>'') url+='/'+action;
                $http.post(url, angular.extend({}, params, native_params), config).then(function onSuccessPre( response ) {
                    // Вывод дополнительной информации в консоль в случае её наличия
                    if (response.data.debug>'') {
                        console.log(response.data.debug);
                    }
                    onSuccess && onSuccess( response );
                }, onError);
            }
        }
    }]);

    /**
     * Сервис реализующий логику работы с сессией
     */
    RitchyApp.factory('RitchyAuth', ['$http', 'RitchyDialog', 'RitchyApi', function( $http, RitchyDialog, RitchyApi ) {
        // Service internal params
        var isUserAuth = false,
            firstStatLoaded = false,
            userToken = null;


        // Constructor method implementation
        function requestLoginStat( callback, firstStat ) {
            if (firstStat && firstStatLoaded) {
                callback && callback(isUserAuth);
                return;
            }
            RitchyApi.request('login', 'stat', null, function onSuccess( response ) {
                if (response.data.error>'') {
                    RitchyDialog.showAlert(null, 'API error', 'Request user stats returned error: '+response.data.error);
                } else if (response.data.loggedIn) {
                    isUserAuth = response.data.loggedIn || false;
                }
                firstStatLoaded = true;
                callback && callback(isUserAuth);
            }, function onError( response ) {
                firstStatLoaded = true;
                if (angular.isObject(response)) {
                    if (response.status<0) {
                        RitchyDialog.showAlert(null, 'API error', 'Unknown api error: ' + response.status+'<br>Error details in console.', callback);
                    } else {
                        RitchyDialog.showAlert(null, 'API error', 'Unknown api error: ' + response.statusText, callback);
                    }
                } else {
                    RitchyDialog.showAlert(null, 'API error', 'Unknown api error: '+response, callback);
                }
            });
        }

        function requestLogout( callback, ev ) {
            RitchyApi.request('logout', null, null, function onSuccess( response ) {
                if (response.data.error>'') {
                    RitchyDialog.showAlert(ev, 'API error', 'Error when logout: '+response.data.error, callback);
                } else {
                    isUserAuth = false;
                    callback && callback(isUserAuth);
                }
            }, function onError( response ) {
                RitchyDialog.showAlert(ev, 'API error', 'Unknown api error: '+response, callback);
            });
        }

        // Service public methods
        return {
            doLogin: function() {
                // Программная авторизация
                // TODO: реализовать метод по мере необходимости
            },
            // Выход из приложения
            doLogout: function( callback ) {
                requestLogout(callback);
            },
            // Получение статуса авторизации пользователя в системе
            isUserAuth: function( callback ) {
                requestLoginStat(callback, true);
            },
            updateToken: function( token ) {
                userToken = token;
            },
            getUserToken: function() {
                return userToken;
            }
        }
    }]);


    /**
     * Контроллер реализующий логику основной страницы ядра
     */
    RitchyApp.controller('core',['$scope', '$http', 'RitchyAuth', 'RitchyDialog', '$rootScope',
        function($scope, $http, RitchyAuth, RitchyDialog, $rootScope) {

            //RitchyDialog.showAlert(null, 'title', 'text');
        $rootScope.auth = RitchyAuth;
//        console.log('RitchyAuth.isUserAuth: ', RitchyAuth.isUserAuth());
    }]);

    /**
     * Настройка маршрутизации
     */
    RitchyApp.config(['$locationProvider','$routeProvider',
        function($location, $routeProvider) {

            // Предварительная проверка доступности маршрута
            var _checkRoute = function($route, $http, onSuccess, onError) {
                var module = $route.current.params.module || 'core';
                var view = $route.current.params.view || 'index';
                var url = modulesBase+'/'+module+'/views/'+view+'.html';

                // Проверка доступности шаблона коротким запросом
                var http = new XMLHttpRequest();
                http.open('HEAD', url, true);
                http.onreadystatechange = function() {
                    if (http.readyState==4) {
                        if (http.status==200) {
                            onSuccess && onSuccess();
                        } else {
                            onError && onError();
                        }
                    }
                };
                http.send('');
            };

            // Простая проверка доступности маршрута
            var checkRoute = ['$route', '$http', '$location', '$q',
            function($route, $http, $location, $q) {
                var deferred = $q.defer();
                _checkRoute($route, $http, function onSuccess() {
                    deferred.resolve();
                }, function onError() {
                    deferred.resolve();
                    $location.path("/404");
                })
            }];


            // Проверка доступности маршрута с проверкой статуса вторизации пользователя
            var checkAuthRoute = ['$route', '$http', '$location', '$q', 'RitchyAuth',
                function($route, $http, $location, $q, RitchyAuth) {

                var deferred = $q.defer();
                    // Проверка авторизации пользователя
                    RitchyAuth.isUserAuth(function( isUserAuth ) {
                        if (!isUserAuth) {
                            // Пользователь не авторизован, нужно его завставить авторизоваться
                            deferred.resolve();
                            $location.path('/login');
                        } else {
                            // Пользователь авторизован, проверяем доступность маршрута
                            _checkRoute($route, $http, function onSuccess() {
                                deferred.resolve();
                            }, function onError() {
                                deferred.resolve();
                                $location.path("/404");
                            })
                        }
                    });
            }];

            $routeProvider
                .when('/404', {
                    templateUrl: modulesBase+'/core/views/404.html'
                })
                .when('/logout', {
                    template: '', // Шаблон нужно указывать обязательно, иначе этот маршрут не заработает
                    controller: ['$scope', '$http', '$location', 'RitchyAuth',
                        function($scope, $http, $location, RitchyAuth) {
                        RitchyAuth.doLogout(function onLogout() {
                            // Переадресация после выода на страницу входа
                            $location.path('/login');
                        });
                    }]
                })
                .when('/recovery', {
                    templateUrl: modulesBase+'/recovery/views/index.html',
                    resolve: {
                        check: checkRoute
                    }
                })
                .when('/register', {
                    templateUrl: modulesBase+'/register/views/index.html',
                    resolve: {
                        check: checkRoute
                    }
                })
                .when('/:module/:view/:params*', {
                    templateUrl: function(params) {
                        // TODO: need to setup params.params to current controller of calculated view
                        return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                    },
                    resolve: {
                        check: checkAuthRoute
                    }
                }).when('/:module/:view', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/'+(params.view || 'index')+'.html';
                },
                resolve: {
                    check: checkAuthRoute
                }
            }).when('/:module', {
                templateUrl: function( params ) {
                    return modulesBase+'/'+(params.module || 'core')+'/views/index.html';
                },
                resolve: {
                    check: checkAuthRoute
                }
            });
        }]);
})();
