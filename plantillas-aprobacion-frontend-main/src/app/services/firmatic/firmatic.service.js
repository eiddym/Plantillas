(function () {
  'use strict';

  angular
  .module('app')
  .service('FirmaticService', ['$log', '$q',  FirmaticService]);

  /** @ngInject */
  function FirmaticService($log, $q) {
    var urlFirmatic = 'https://localhost:4637';
    var service = {
      firmarPdf: firmarPdf,
      verificarEstado: verificarEstado
    };
    return service;

    function firmarPdf(documentos, ci) {
      // $log.log('Iniciando el proceso de firma', documentos);
      var datos = {
        archivo: documentos,
        format: 'pades',
        language: 'es'
      };
      if(angular.isDefined(ci)) datos.ci = ci;
      var cabeceras = {
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      var urlFirma = urlFirmatic + '/sign';
      return $q(function (resolve, reject) {
        axios.post(urlFirma, datos, cabeceras)
        .then(function (respFirma) {
          // $log.log('Revisando la respuesta de la firma', respFirma);
          return resolve(respFirma);
        })
        .catch(function (errorFirma) {
          // $log.log('#error en la firma', errorFirma.response);
          return reject({
            finalizado: false,
            message: (errorFirma.response.data.message || errorFirma.response.data) + ' (Error en el firmador.)'
          });
        });
      });
    }

    function verificarEstado() {
      var respuesta = {
        activo: false,
        mensaje: ''
      }
      return $q(function (resolve) {
        axios.get(urlFirmatic)
        .then(function (respEstado) {
          // $log.log('Revisando la respuesta del estado', respEstado);
          if(respEstado.status === 200) {
            respuesta.activo = true;
          }
          else {
            $log.log('Error no definido');
          }
          return resolve(respuesta);
        })
        .catch(function (errorEstado) {
          respuesta.activo = false;
          if(errorEstado.message.indexOf('Network Error' > -1)) {
            respuesta.mensaje = 'El servicio del firmador no se encuentra iniciado.'
          }

          return resolve(respuesta);
        });
      });
    }
  }
  
})();