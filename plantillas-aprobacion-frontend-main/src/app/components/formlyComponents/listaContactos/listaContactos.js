(function() {
  'use strict';

  angular
  .module('app')
  .controller('fcListaContactosController', listaContactos);

  /** @ngInject */
  function listaContactos($scope, DataService, restUrl, ArrayUtil) {
    var vm = this;
    var sc = $scope;
    var tempContactos;
    
    sc.vm = vm;
    vm.buscarContacto = "";
    vm.mostrarContacto = false;
    vm.contactos = [];
    vm.contadorBusquedasKey = 0;

    vm.abrirSelector = abrirSelector;
    vm.cerrarSelector = cerrarSelector;
    if (angular.isUndefined(sc.model[sc.options.key])) sc.model[sc.options.key]={};
    if (angular.isUndefined(sc.model[sc.options.key].lista)) sc.model[sc.options.key].lista=[];

    sc.$watch('vm.buscarContacto', function () {
      vm.contadorBusquedasKey++;
      if (vm.contadorBusquedasKey < 3) {
        return;
      }
      vm.contadorBusquedasKey = 0;
      
      var contador;
      var vector = [];
      vm.contactos = [];
      tempContactos = sc.model[sc.options.key].lista || [];
      
      for (contador = 0; contador < tempContactos.length; contador++) {
        vm.contactos.push(tempContactos[contador]);
      }

      if(vm.buscarContacto != "") {
        DataService.get(restUrl + 'plantillasFormly/contactos?filter='+vm.buscarContacto)
        .then(function (respuesta) {
          vm.contactos = [];
          vector = respuesta.datos.resultado;
          for (contador = 0; contador < tempContactos; contador ++) vm.contactos.push(tempContactos[contador]);
          for (contador = 0; contador < vector.length; contador++) {
            if(!ArrayUtil.buscarObj(tempContactos, 'id_contacto', vector[contador].id_contacto)) {
              vm.contactos.push(vector[contador]);
            }
          }
        });
      }
    });
    
    function abrirSelector(evento, mostrar) {
      vm.contadorBusquedasKey = 0;
      angular.element(evento.currentTarget).parent().next().children()[1].click();
      switch (mostrar) {
        case 'contacto': vm.mostrarContacto = true; break;
      }
    }

    function cerrarSelector() {
      vm.buscarContacto = '';
      vm.mostrarContacto = false;
    }

  }
})();