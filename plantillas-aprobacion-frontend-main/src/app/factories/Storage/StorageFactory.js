(function() {
    'use strict'

    angular
    .module('app')
    .factory('Storage', ['$window', 'appName', StorageFactory]);

    /** @ngInject */
    function StorageFactory($window, appName) {

        appName = appName || 'app';

        var $local = $window.localStorage;
        var $session = $window.sessionStorage;

        var factory = {
            get: get,
            set: set,
            remove: remove,
            destroy: destroy,
            exist: exist,
            getSession: getSession,
            setSession: setSession,
            removeSession: removeSession,
            destroySession: destroySession,
            existSession: existSession,
            setUser: setUser,
            getUser: getUser,
            existUser: existUser,
            removeUser: removeUser,
            getToken: getToken
        };

        return factory;

        function setUser(user) {
            setSession('user', user);
        }

        function getUser() {
            return getSession('user');
        }

        function existUser() {
            return existSession('user');
        }

        function removeUser() {
            removeSession('user');
        }

        function getToken() {
            return $local.getItem(appName + '_' + 'token');
        }

        // LocalStorage
        function set(key, value) {
            $local.setItem(appName + '_' + key, angular.toJson(value));
        }

        function get(key) {
            return angular.fromJson($local.getItem(appName + '_' + key));
        }

        function remove(key) {
            $local.removeItem(appName + '_' + key);
        }

        function destroy() {
            for(var x in $local)
                $local.removeItem(x);
        }

        function exist(key) {
            return typeof $local.getItem(appName + '_' + key) != 'undefined' && $local.getItem(appName + '_' + key) != null && $local.getItem(appName + '_' + key) != 'undefined';
        }

        // SessionStorage
        function setSession(key, value) {
            $session.setItem(appName + '_' + key, angular.toJson(value));
        }

        function getSession(key) {
            return angular.fromJson($session.getItem(appName + '_' + key));
        }

        function removeSession(key) {
            $session.removeItem(appName + '_' + key);
        }
        function destroySession() {
            for(var x in $session)
                $session.removeItem(x);
        }

        function existSession(key) {
            return typeof $session.getItem(appName + '_' + key) != 'undefined' && $session.getItem(appName + '_' + key) != null && $session.getItem(appName + '_' + key) != 'undefined';
        }
    }
})();
