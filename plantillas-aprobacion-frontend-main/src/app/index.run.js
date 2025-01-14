
(function() {
  'use strict';

  angular
    .module('app')
    .run(runBlock);

  /** @ngInject */
    function runBlock(Storage, $location, $log, PageNoLogin, $window, Datetime, $mdDialog, RouteValidator, formlyConfig, MyFormlyConfig, ExpirationTime) {
        RouteValidator.init();
        MyFormlyConfig.init(formlyConfig);
        var $container = angular.element('#container-main');
        var $document = $window.document;

        // Collapsed Panel
        $container.on('click', '.btn-collapsed', function () {
            var $el = angular.element(this)
            $el.parent().parent().next().slideToggle()
            $el.toggleClass('rotate')
        })

        var $toasts = angular.element('#toast-container-main')
        $toasts.on('click', '.md-toast-close', function () {
            angular.element(this).parent().parent().parent().fadeOut()
        });

        // Redirect
        if (!Storage.existUser()) {
            var path = $location.path();
            // $log.log('Revisando el path', path);
            if (!exist(path)) {
                if (path.length) Storage.setSession('path', path.replace('/', ''));                
                if (Storage.getSession('path') !== 'verificar') $location.path('login');
            }
        } else {
            ExpirationTime.init();
        }

        function exist(path) {
            var paths = PageNoLogin;
            for (var i in paths) {
                if (path.indexOf('/' + paths[i]) == 0 || path.indexOf('/' + paths[i] + '/') == 0) {
                    return true;
                }
            }
            return false;
        }

        //Fullscreen
        function exitFullScreen () {
            angular.element('body').removeClass('fullscreen');
        }

        angular.element($window.document).on('keyup', function(e) {
            if (e.keyCode == 27) {
                exitFullScreen();
            }
        });

        $document.addEventListener("mozfullscreenchange", function () {
            if (!$document.mozFullScreen) {
                exitFullScreen();
            }
        }, false);

    }

})();
