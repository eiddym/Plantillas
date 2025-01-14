(function() {
  'use strict';

  angular
    .module('app')
    .controller('ImpresionController', ImpresionController);

  /** @ngInject */
  function ImpresionController(restUrl, Storage, Documento, Modal) {
    var vm = this;
    vm.titulo = "Imprimir documentos";
    vm.url = restUrl + "plantillasFormly/documento/";
    var cuenta = Storage.getUser();
    vm.usuario = cuenta.id;

    vm.queryExtra = {
        estado: 'APROBADO,CERRADO,DERIVADO'
    };

    vm.permission = {
        create: false,
        update: false,
        delete: false
    };

    vm.fields = [
      "id_documento",
      "nombre",
      "nombre_plantilla",
      "fecha",
      "impreso",
      "_usuario_modificacion",
      "_fecha_creacion",
      "_fecha_modificacion"
    ];

    vm.buttons = [
      {
        tooltip: 'Ver',
        icon: 'remove_red_eye',
        onclick: vistaPrevia
      },
      {
        tooltip: 'Ver Historial',
        icon: 'timeline',
        onclick: verProgreso
      }
    ];
    vm.multiple = {
      tooltip: 'Impresion multiple',
      icon: 'print',
      onclick: impresionMultiple
    };

    function verProgreso(pEvento, pIdentificador) {
      Documento.showProgressAll(pEvento, pIdentificador);
    }

    function vistaPrevia(pEvento, pIdentificador){
      Documento.showPdfId(pIdentificador);
    }

    function impresionMultiple(evento) {
      var config = {
        event: evento,
        templateUrl: 'app/modules/plantillasFormly/impresion/multiple.dialog.html',
        controller: ['$scope', '$mdDialog', 'DataService', 'Message', 'restUrl', DialogImpresionMultiple]
      };
      Modal.show(config);      
    }

    function DialogImpresionMultiple($scope, $mdDialog, DataService, Message, restUrl) {
      var vmd = $scope;
      vmd.obtenerDocumento = obtenerDocumento;
      vmd.cancel = cancel;

      /**
       * Función que obtiene el buffer de todos los documentos de un grupo multiple
       */
      function obtenerDocumento() {
        if (angular.isUndefined(vmd.cite) || vmd.cite=="") {
          Message.warning('Debe escribir un número de cite');
          return;
        }
        
        DataService.pdf(restUrl + 'plantillasFormly/multiple', { cite: vmd.cite })
        .then(function (respuestaPdf) {
          if (respuestaPdf){            
            vmd.documentoAImprimir = respuestaPdf;
          }
        })
        .catch(function () {
          return;
        });
        
      }

      /**
       * Funcion que permite cancelar el modal
       */
      function cancel() {
        
        $mdDialog.cancel();
        
      }
      
    }

  }
})();
