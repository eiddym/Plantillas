(function() {
  'use strict';

  angular
    .module('app')
    .controller('PlantillasController', PlantillasController);

  /** @ngInject */

  function PlantillasController(restUrl, Storage, $location) {
    var vm = this;
    vm.titulo = "Bandeja de plantillas";
    vm.url = restUrl + "plantillasFormly/plantilla_formly/";
    var cuenta = Storage.getUser();
    vm.usuario=cuenta.id;
    vm.estadoSw=true;
    vm.permission ={
      create:false,
      update:false,
      delete:true
    };
    vm.fields = [
      "id_plantilla_formly",
      "nombre",
      "abreviacion",
      "estado",
      "_fecha_creacion",
      "_fecha_modificacion"
    ];

    vm.buttons = [
      {
        tooltip: 'Editar',
        icon: 'checked',
        onclick: irPlantilla
      }
    ];
    vm.buttonAgregar = {
        tooltip: 'Añadir',
        icon: 'add',
        onclick: nuevaPlantilla
    };
    function nuevaPlantilla(event) { irPlantilla(event, 0); }

    function irPlantilla(pEvento, pIdentificador){
      $location.path('plantilla/' + pIdentificador);
    }

  }
})();
