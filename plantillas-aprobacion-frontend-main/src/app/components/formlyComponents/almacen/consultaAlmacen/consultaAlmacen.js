(function () {
  'use strict';

  angular
  .module('app')
  .controller('fcConsultaAlmacenController', ConsultaAlmacen);


  /** @ngInject */
  function ConsultaAlmacen($scope, $timeout, DataService, restUrl) {
    var vm = this;
    var sc = $scope;
    var model;

    sc.vm = vm;

    vm.buscar = {};
    vm.alert = {};
    vm.agregarFila = agregarFila;
    vm.eliminarFila = eliminarFila;
    vm.consultarAlmacen = consultarAlmacen;
    
    $timeout(iniciarController);

    function iniciarController() {
      vm.items = [];
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = { filas: []};
      }

      model = sc.model[sc.options.key];
    }

    function consultarAlmacen(texto) {
      if (!texto) return [];
      var url = restUrl+'almacen/consulta/?filter='+texto;
      if (sc.options.templateOptions.tipo == 'REINGRESO') {
        url += '&reingreso='+true;
      }

      return DataService.get(url)
      .then(function (respuesta) {
        return respuesta.datos || [];
      });
    }
    function seRepite(codigo) {
      var resp = false;
      model.filas.forEach(function (item)  {
        if (item.codigo === codigo) {
          resp = true;
        }
      });
      return resp;
    }
    function agregarFila() {
      var itemTemp = angular.copy(vm.buscar.item_seleccionado);
      if (itemTemp) {
        itemTemp.cantidad = 1;
        if (!seRepite(itemTemp.codigo)) model.filas.push(itemTemp);
        vm.buscar.item_seleccionado = undefined;        
      }
    }

    function eliminarFila(indice) {
      model.filas.splice(indice, 1);
    }
  }
})();