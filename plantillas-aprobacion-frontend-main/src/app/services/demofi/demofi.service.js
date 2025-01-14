(function() {
    'use strict';
    
    angular
    .module('app')
    .service('DemofiService', ['$log', '$q', '$http', '$compile', 'Modal', '$window', 'Message', DemofiService]);

    /** @ngInject */
    function DemofiService($log, $q, $http, $compile, Modal, $window, Message) {

        var url_demofi = 'https://localhost:3200';

        var service = {
            openModal: openModal,
            verificarServidor: verificarServidor,
            listTokens: listTokens,
            login: login,
            listCertificates: listCertificates,
            sign: sign,
            logout: logout
        };

        return service;

        function openModal(solicitudes, config) {
            //import templateModal from './demofi.modal.html';
            //import controllerModal from './demofi.modal.controller';
            return Modal.show({
                template: './demofi.modal.html', //templateModal,
                controller: './demofi.modal.controller', //controllerModal,
                data: { solicitudes: solicitudes, config: config },
                size: 'lg'
            });
        }

        function verificarServidor() {
            var w = 800;
            var h = 400;
            var y = $window.outerHeight / 2 + $window.screenY - (h / 2);
            var x = $window.outerWidth / 2 + $window.screenX - (w / 2);
            $window.open(url_demofi,'_blank', 'toolbar=no,status=no,menubar=no,scrollbars=yes,left='+x+', top='+y+', width='+w+', height='+h+', visible=none', '');
        }

        function listTokens() {
            var req = url_demofi+'/tokens';
            return callRequest(req);
        }

        function login(pinToken) {
            var req = url_demofi+'/start?pin='+pinToken;
            return callRequest(req);
        }

        function listCertificates() {
            var req = url_demofi+'/certs';
            return callRequest(req);
        }

        function sign(solicitudFirma, aliasParaFirmar) {
            var dataSend = {
                nombre_archivo: solicitudFirma.codigo_archivo,
                pdf_base64: solicitudFirma.pdf_base64,
                alias: aliasParaFirmar
            };

            return $q(function(resolve, reject) {
                axios.post(url_demofi+'/sign', dataSend,  {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    })
                  .then(function (response) {
                    resolve(response.data);
                    return;
                  })
                  .catch(function (error) {
                    reject({ finalizado: false, mensaje: "Demofi no se esta ejecutando en su equipo" + error });
                  });
            });
        }

        function logout() {
            var req =  url_demofi + '/finish';
            return callRequest(req);
        }

        function callRequest(req) {
            return $q(function(resolve, reject) {
                axios.get(req)
                .then(function (response) {
                    if (response.data.finalizado === false) {
                        reject(response.data);
                        return;
                    }
                    resolve(response.data);
                })
                .catch(function (error) {
                    if (error) {
                        Message.error('Demofi no se esta ejecutando en su equipo.');
                        reject({ finalizado: false, mensaje: "Demofi no se esta ejecutando en su equipo" });
                    }
                    else {
                        Message.error('No se puede conectar con Demofi. Verifique que el programa se este ejecutando en su maquina.');
                        reject({ finalizado: false, mensaje: "No se puede conectar con Demofi. Verifique que el programa se este ejecutando en su maquina." });
                    }
                });
            });
        }

    }

})();
