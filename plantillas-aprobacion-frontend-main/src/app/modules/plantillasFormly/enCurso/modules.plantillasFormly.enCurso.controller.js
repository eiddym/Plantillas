(function() {
  'use strict';

  angular
    .module('app')
    .controller('EnCursoController', EnCursoController);

  /** @ngInject */
  function EnCursoController(restUrl, Storage, Documento) {

      var vm = this;
      var cuenta = Storage.getUser();
      vm.usuario = cuenta.id;
      vm.titulo = "Documentos en curso";
      vm.url = restUrl + "plantillasFormly/documento/"+cuenta.id+"/encurso";

      vm.permission = {
          create: false,
          update: false,
          delete: false
      };

      vm.fields = [
          "id_documento",
          "nombre",
          "nombre_plantilla",
          "estado",
          "fecha",
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

      function vistaPrevia(pEvento, pIdentificador){
          Documento.showPdfId(pIdentificador);
      }
      function verProgreso(pEvento, pIdentificador) {
          Documento.showProgressAll(pEvento, pIdentificador);
      }

  }
})();
