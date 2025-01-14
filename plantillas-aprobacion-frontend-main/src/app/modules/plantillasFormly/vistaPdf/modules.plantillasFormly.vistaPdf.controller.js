(function() {
  'use strict';

  angular
    .module('app')
    .controller('VistaPdfController', VistaPdfController);

  /** @ngInject */
  function VistaPdfController($scope, DataService, restUrl, Storage, $sce, $location, Documento, Util) {
      var vm = this;
      var datos_enviar = Storage.getSession('datos_enviar');

      if(datos_enviar==null) $location.path('/documentos');
      else {
          DataService.pdf(restUrl+'plantillasFormly/documentoPDF/',{cite: datos_enviar.nombre})
          .then(function (respuestaPdf) {
            if(!respuestaPdf) return;
              datos_enviar.pdf = respuestaPdf.url;
              datos_enviar.pdf_buffer = respuestaPdf.data;

              vm.html=datos_enviar.html;
              vm.pdf=datos_enviar.pdf;
              vm.flag_html=true;
              if (datos_enviar.esDocumentoExterno) vm.flag_html=false;
              vm.show_pdf=!datos_enviar.esDispositivoMovil;
               if (datos_enviar.esDispositivoMovil) {
                Util.loadCanvas(datos_enviar.pdf_buffer, '#canvasContainer');
            }
              //funciones
              vm.verHtml = function(){ vm.flag_html=true; }
              vm.verPdf = function(){ vm.flag_html=false; }
              vm.load = true;
          })
      }

      $scope.mostrarPdf = function (id, sw){ if(sw) Documento.showPdfx(id); else Documento.showPdfId(id, false); } // eslint-disable-line angular/controller-as
  }
})();
