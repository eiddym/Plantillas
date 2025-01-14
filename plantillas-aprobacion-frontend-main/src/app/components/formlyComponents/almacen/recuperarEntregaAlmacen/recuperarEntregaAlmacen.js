(function () {
  'use strict';

  angular
  .module('app')
  .controller('fcRecuperarEntregaAlmacenController', RecuperarEntregaAlmacen);

  /**@ngInject */
  function RecuperarEntregaAlmacen($scope, $timeout, DataService, restUrl, Message, Storage) {
    var vm = this;
    var sc = $scope;

    sc.vm = vm;

    vm.buscar = {};
    vm.recuperarEntrega = recuperarEntrega;
    vm.activar_busqueda = true;

    $timeout(iniciarController);

    function iniciarController() {
      vm.items = [];
      var datosPlantilla = Storage.getSession('pl');
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = {
          solicitado_por: {
            nombre_completo: null,
            cargo: null
          },
          entregado_por: {
            nombre_completo: null,
            cargo: null
          },
          fecha_entrega:null,
          filas: []
        };
      }
      if (datosPlantilla.grupo) {
        obtenerFlujo(datosPlantilla.grupo);
      }
    }

    function recuperarEntrega(cite, automatico) {
      var citeBuscar = vm.cite_buscar;
      if (angular.isUndefined(vm.cite_buscar) && angular.isUndefined(cite)) {
        return;
      }
      if (angular.isUndefined(vm.cite_buscar) && angular.isDefined(cite)) {
        citeBuscar = cite;
      }
      var url = restUrl+'almacen/recuperar';
      return DataService.post(url, {cite: citeBuscar})
      .then(function (respuesta) {
        if (angular.isUndefined(respuesta)) return;
        sc.model[sc.options.key].filas = respuesta.datos.items;
        sc.model[sc.options.key].fecha_entrega = respuesta.datos.cabecera.fecha_entrega;
        sc.model[sc.options.key].entregado_por.nombre_completo = respuesta.datos.cabecera.entregado_por;
        sc.model[sc.options.key].solicitado_por.nombre_completo = respuesta.datos.cabecera.solicitado_por;
        sc.model[sc.options.key].cite_sms = respuesta.datos.cite_sms;
        sc.model[sc.options.key].id_solicitud = respuesta.datos.id_solicitud;
        if (automatico && automatico == true) {
          sc.model[sc.options.key].consultado = true;
        }
        if (sc.model[sc.options.key].consultado == true && sc.model[sc.options.key].filas.length > 0) {
          vm.activar_busqueda = false;
        }
      });
    }

    function obtenerFlujo(grupo) {
      var grupoDocPadre = grupo;
      var docsFlujo = [];
      var citeSolicitud = null;
      var abreviacionSolicitud = sc.options.templateOptions.solicitud;
      if (sc.model[sc.options.key].consultado == true && sc.options.templateOptions.manual == false) {
        vm.activar_busqueda = false;
        return;
      }
      if (angular.isUndefined(grupo)) {
        if (sc.model[sc.options.key].consultado == true && sc.model[sc.options.key].filas.length > 0) {
          vm.activar_busqueda = false;
          return;
        }
      }
      DataService.get(restUrl + 'plantillasFormly/documento/?fields=id_documento,nombre,nombre_plantilla,grupo&estado=DERIVADO,CERRADO,APROBADO&sort=_fecha_creacion&grupo='+grupoDocPadre)
      .then(function (respuesta) {
        docsFlujo = respuesta.datos.resultado;

        for (var i = 0; i < docsFlujo.length; i++) {
          if (docsFlujo[i].nombre.indexOf('/'+abreviacionSolicitud+'/') > -1) {
            citeSolicitud = docsFlujo[i].nombre;
          }
        }
        if (citeSolicitud == null) {
          Message.show('INFO', 'No se encontro una solicitud en el flujo.');
          vm.activar_busqueda = true;
          return;
        }
        recuperarEntrega(citeSolicitud, true);
      });
      
    }

  }
})();