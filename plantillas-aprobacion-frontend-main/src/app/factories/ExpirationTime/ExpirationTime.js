(function() {
    'use strict'

    angular
    .module('app')
    .factory('ExpirationTime', ['Storage', 'Message', '$interval', '$auth', '$location', '$mdDialog', 'DataService', 'restUrl', ExpirationTimeFactory]);

    /** @ngInject */
    function ExpirationTimeFactory(Storage, Message, $interval, $auth, $location, $mdDialog, DataService, restUrl) {

        /**
            Factory que se encargara de controlar el tiempo de expiración de la sesion de usuario.
            interval: funcion que se repite cada segundo
            time: el tiempo que se que tiende a disminuir hasta cero si no se apreta alguna tecla o se hace un click
            init: funcion que inicializara a la funcion interval y el tiempo time
            stopInterval: funcion que cancela la funcion interval y la vuelve indefinida
            refreshToken: funcion que refresca el tiempo time, esta funcion se activa al entrar a la ruta documento/:idDocumento
            guardar: funcion que se manda desde documento/:idDocumento
            autoSaveInterval: funcion que se repite cada 10 minutos y activa a guardar,
            initAutoSave: iniciar el autoguardado,
            stopAutoSave: cancelar el autoguardado,
            getExpirationTime: obtener el tiempo de expiracion,
            logout: funcion desloguearse del sistema
        */
        var factory = {
            interval: undefined,
            time: null,
            init: init,
            stopInterval: stopInterval,
            refreshToken: refreshToken,
            guardar: undefined,
            autoSaveInterval: undefined,
            initAutoSave: initAutoSave,
            stopAutoSave: stopAutoSave,
            getExpirationTime: getExpirationTime,
            logout: logout
        };
        var fac = factory;
        return factory;

        function init(){
            if(angular.isUndefined(fac.interval)){
                fac.time = getExpirationTime()*60;
                fac.interval = $interval(function () {
                    fac.time--;
                    if (fac.time == 10 && $location.url().indexOf('/documento/') && angular.isDefined(fac.autoSaveInterval)) fac.guardar(false, true);
                    if (fac.time <= 0 || $location.url().indexOf('/login')==0)  logout(true);
                }, 1000)
            }
        }

        function getExpirationTime() {
             return angular.isDefined($auth.getPayload())? $auth.getPayload().tiempo : 0 ;
         }

        function stopInterval() {
            if(angular.isDefined(fac.interval)) {
                $interval.cancel(fac.interval);
                fac.interval = undefined;
            }
        }

        function stopAutoSave() {
            if(angular.isDefined(fac.autoSaveInterval)) {
                $interval.cancel(fac.autoSaveInterval);
                fac.autoSaveInterval = undefined;
            }
        }

        function initAutoSave(funcionGuardar, enviado) {
            fac.guardar = angular.isFunction(funcionGuardar)? funcionGuardar: function(x,y){};  // eslint-disable-line no-unused-vars
            if(angular.isUndefined(fac.autoSaveInterval)){
                // la funcion interval se activara cada 10 minutos--> 10*60 = 600, tiempo en miliseconds 600*1000=600000
                fac.autoSaveInterval = $interval(function () {
                    fac.guardar(false, true);
                }, 600000); //
            }
            if(enviado) stopAutoSave();
            refreshToken();
        }

        /*
            Funcion logout que limpia la session de usuario y redirecciona a la vista login
            se activa cuando el tiempo de expiracion es igual a 0 o menor
        */
        function logout (sw_inactive) {
            fac.stopInterval();
            if(sw_inactive) Message.warning('Su sesión ha sido cerrada automáticamente después de ' + getExpirationTime() + ' minutos, tiempo que dura la sesión.', null, 0);
            $auth.logout()
            .then(function() {
                $location.path("login");
                $mdDialog.hide();
            });
        }

        function refreshToken() {
            if(angular.isDefined(fac.interval)){
                DataService.get(restUrl+'refrescar')
                .then(function (respuesta) {
                    if(angular.isDefined(respuesta)){
                        $auth.setToken(respuesta.token);
                        fac.time = getExpirationTime()*60;
                    }
                })
            }
        }

    }
})();
