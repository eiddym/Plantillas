(function () {
  'use strict';
  angular
    .module('app')
    .controller('fcBajaActivosController', BajaActivos);

  /**@ngInject */
  function BajaActivos($scope, $timeout, DataService, restUrl, Datetime, Documento) {
    var vm = this;
    var sc = $scope;

    sc.vm = vm;
    vm.buscar = {};
    vm.general = {};
    vm.buscar_doc = '';
    vm.documentos = [];

    vm.agregarActivo = agregarActivo;
    vm.eliminarActivo = eliminarActivo;
    vm.consultarActivo = consultarActivo;
    vm.controlSelectDoc = controlSelectDoc;
    vm.openSelect = openSelect;
    vm.closeSelectDoc = closeSelectDoc;
    vm.mostrarPdf = mostrarPdf;


    vm.listaMotivos = [
      {key:1, value:'Disposición definitiva de bienes'},
      {key:2, value:'Hurto, robo o pérdida fortuita'},
      {key:3, value:'Mermas'},
      {key:4, value:'Vencimientos, descomposiciones, alteraciones o deterioros'},
      {key:5, value:'Inutilización'},
      {key:6, value:'Obselescencia'},
      {key:7, value:'Desmantelamiento total o parcial de edificaciones'},
      {key:8, value:'Otros'}
    ];


    var datosIniciales = {
      activos: [],
      motivo: {},
      respaldo: {
        nombre: '',
        fecha: ''
      },
      listaMotivos: {}
    };
    for (var i = 0; i < vm.listaMotivos.length; i++) {
      var temp = vm.listaMotivos[i];
      datosIniciales.listaMotivos[temp.key] = temp.value;
    }
    $timeout(inicializarDatos);

    function inicializarDatos() {
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = angular.copy(datosIniciales);
      }
      else {
        if (sc.model[sc.options.key].fecha) sc.model[sc.options.key].fecha = new Date(sc.model[sc.options.key].fecha);
        vm.docSeleccionado = sc.model[sc.options.key].respaldo;
        vm.documentos = [vm.docSeleccionado];
      }
      
    }

    function consultarActivo(texto) {
      if (!texto || texto.length < 1) return [];
      var url = restUrl + 'activos/consulta/baja?filter=' + texto;
      return DataService.get(url)
        .then(function (respuesta) {
          return respuesta ? respuesta.datos : [];
        });
    }

    function seRepite(id) {
      var resp = false;

      sc.model[sc.options.key].activos.forEach(function (item) {
        if (item.id === id) {
          resp = true;
        }
      });
      return resp;
    }

    function agregarActivo() {
      var itemTemp = angular.copy(vm.buscar.item_seleccionado);
      if (itemTemp) {
        itemTemp.cantidad = 1;
        if (!seRepite(itemTemp.id)) {
          sc.model[sc.options.key].activos.push(itemTemp);
        }
        vm.buscar.item_seleccionado = undefined;
      }
    }

    function eliminarActivo(indice) {
      sc.model[sc.options.key].activos.splice(indice, 1);

    }

    function openSelect(ev, show) {
      angular.element(ev.currentTarget).parent().next().children()[1].click();
      switch (show) {
        case 'doc': vm.show_doc = true; break;
      }
    }

    function closeSelectDoc() {
      vm.buscar_doc = '';
      vm.show_doc = false;
    }

    function mostrarPdf(pIdentificador) {
      Documento.showPdfId(pIdentificador);
    }


    function controlSelectDoc(documento) {
      vm.show_doc = true;
      sc.model[sc.options.key].respaldo = angular.copy(documento);
      sc.model[sc.options.key].respaldo.fechaMostrar = Datetime.dateLiteral(sc.model[sc.options.key].respaldo.fecha);

    }

    sc.$watch('vm.buscar_doc', function () {
      if (vm.buscar_doc != "") {
        DataService.get(restUrl + 'plantillasFormly/documento?fields=id_documento,nombre,fecha&estado=APROBADO,CERRADO,DERIVADO&page=1&order=-fecha&limit=20&searchPro=1&tipoBus=campo&campoSel=nombre&filter=' + vm.buscar_doc)
        .then(function (respuesta) {
          vm.documentos = respuesta.datos.resultado || [];
        });
      }
    });

  }
})();