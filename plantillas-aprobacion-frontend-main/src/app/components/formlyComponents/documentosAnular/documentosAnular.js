(function() {
  'use strict';

  angular
  .module('app')
  .controller('fcDocumentosAnularController', documentosAnular);

  /** @ngInject */
  function documentosAnular($scope, DataService, restUrl, ArrayUtil, Documento) {
    var vm = this,
    sc = $scope,
    xdocs;
    sc.vm = vm;
    vm.buscar_doc = "";
    vm.show_doc = false;
    vm.documentos = [];

    //cargamos funciones
    vm.openSelect = openSelect;
    vm.mostrarPdf = mostrarPdf;
    vm.closeSelectDoc = closeSelectDoc;

    sc.$watch('vm.buscar_doc', function () {
      var i, arr;
      vm.documentos = [];
      xdocs = sc.model[sc.options.key] || [];
      for (i = 0; i < xdocs.length; i++) vm.documentos.push(xdocs[i]);

      if (vm.buscar_doc!="") {
        DataService.get( restUrl+'plantillasFormly/documento?fields=id_documento,nombre,fecha&estado=APROBADO,CERRADO,DERIVADO&page=1&order=-fecha&limit=20&searchPro=1&tipoBus=campo&campoSel=nombre&filter='+vm.buscar_doc)
        .then(function (respuesta) {
          vm.documentos = [];
          arr = respuesta.datos.resultado;
          for (i = 0; i < xdocs.length; i++) vm.documentos.push(xdocs[i]);
          for (i = 0; i < arr.length; i++) {
            if(!ArrayUtil.buscarObj(xdocs, 'id_documento', arr[i].id_documento))
            vm.documentos.push( arr[i] );
          }
        });
      }
    });

    function openSelect(ev, show) {
      angular.element(ev.currentTarget).parent().next().children()[1].click();
      switch (show) {
        case 'doc': vm.show_doc = true; break;
      }
    }

    function closeSelectDoc() {
      vm.buscar_doc='';
      vm.show_doc=false;
    }

    function mostrarPdf(pIdentificador){
      Documento.showPdfId(pIdentificador);
    }

  }
})();
