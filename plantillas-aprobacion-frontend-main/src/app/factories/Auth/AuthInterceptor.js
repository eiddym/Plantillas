
(function() {
    'use strict'

    angular
    .module('app')
    .factory('AuthInterceptor', AuthInterceptor)
    .config(function($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    });

    /** @ngInject */
    function AuthInterceptor($q, $location, $injector) {

        var interceptor = {
            request: function(config) {
                angular.element('#loading-progress').show();
                return config;
            },
            requestError: function(config) {
                angular.element('#loading-progress').hide();
                return config;
            },
            response: function(response){
                angular.element('#loading-progress').hide();
                return response || $q.when(response);
            },
            responseError: function(rejection) {
                if (rejection.status === 401 || rejection.status === 403) {
                    // en estos estados se deslogue y va a login
                    var Storage = $injector.get('Storage');
                    var ExpirationTime = $injector.get('ExpirationTime');

                    Storage.setSession('path', $location.path());
                    ExpirationTime.logout();
                }
                return $q.reject(rejection);
            }
        };

        /*eslint-disable no-unused-vars*/
        function exist(path) {
          /*eslint-enable no-unused-vars*/
            var paths = $injector.get('PageNoLogin');
            for (var i in paths) {
                if (path.indexOf('/' + paths[i]) != -1 || path.indexOf('/' + paths[i] + '/') != -1) {
                    return true;
                }
            }
            return false;
        }


        return interceptor;
    }

})();
