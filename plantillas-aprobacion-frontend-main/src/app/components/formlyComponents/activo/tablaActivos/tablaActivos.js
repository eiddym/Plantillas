(function () {
  'use strict';

  angular
  .module('app')
  .controller('fcTablaActivosController', TablaActivos);

  /**@ngInject */
  function TablaActivos($scope, $timeout, DataService, restUrl, Message, Storage, $location) {
    var vm = this;
    var sc = $scope;

    sc.vm = vm;

    vm.buscar = {};
    vm.alert  = {};
    
    vm.validado     = false;
    vm.listaMotivos = ['Abandono', 'Fallecimiento', 'Caso fortuito', 'Fuerza mayor'];

    vm.recuperarActivosAsignados = recuperarActivosAsignados;
    vm.recuperarSolicitud        = recuperarSolicitud;

    vm.agregarFila         = agregarFila;
    vm.eliminarFila        = eliminarFila;
    vm.consultarActivo     = consultarActivo;
    vm.cambiarTipoBusqueda = cambiarTipoBusqueda;
    vm.validarUsuario      = validarUsuario;

    var DATOS_POR_DEFECTO = {
      documentoDe     : {},
      documentoPara   : {},
      filas           : [],
      tipoFormulario  : 'SOLICITUD',
      tipoBusqueda    : 'BUSQUEDA_POR_CITE',
      citeBusqueda    : null,
      usuario_ci      : null,
      usuario_nuevo   : false,
      devolucionPropia: true,
      motivo          : 'Abandono',
      tipoFormularioSeleccionado: 'ASIGNACION'
    };
    
    $timeout(iniciarController);

    function iniciarController() {
      vm.items = [];
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = angular.copy(DATOS_POR_DEFECTO);
      }
      var url = $location.url();
      if (url.startsWith('/plantilla')) {
        // Asignando valores por defecto [VISTA EDICION DE PLANTILLA]
        sc.model[sc.options.key].tipoFormulario = sc.options.templateOptions.tipoFormulario;
        sc.model[sc.options.key].tipoBusqueda   = (sc.model[sc.options.key].tipoFormulario === 'SOLICITUD') ? 'BUSQUEDA_GLOBAL' : 'BUSQUEDA_POR_CITE';
      }
      if (url.startsWith('/documento')) {
        // Recupera los valores del documento [VISTA CREACION DE DOCUMENTO]
        var datosPlantilla = Storage.getSession('pl');
        var plantillaValor = angular.fromJson(datosPlantilla.plantilla_valor);
        var comp = plantillaValor[sc.options.key];
        if (comp) {
          sc.model[sc.options.key].tipoFormulario = comp.tipoFormulario;
          sc.model[sc.options.key].tipoBusqueda   = comp.tipoBusqueda;
          sc.model[sc.options.key].citeBusqueda   = comp.citeBusqueda;

          sc.model[sc.options.key].tipoFormularioSeleccionado = comp.tipoFormularioSeleccionado;
        } else {
          // Si no existen datos previos, se cargan los datos por defecto de plantillas. [CASO NUEVO DOCUMENTO]
          sc.model[sc.options.key].tipoFormulario = sc.options.templateOptions.tipoFormulario;
          sc.model[sc.options.key].tipoBusqueda   = (sc.model[sc.options.key].tipoFormulario === 'SOLICITUD') ? 'BUSQUEDA_GLOBAL' : 'BUSQUEDA_POR_CITE';
        }
      }
      sc.model[sc.options.key].usuario_nuevo = (sc.model[sc.options.key].tipoBusqueda === 'BUSQUEDA_GLOBAL');
      if (sc.model[sc.options.key].tipoFormulario === 'OTRA_DEVOLUCION') {
        sc.model[sc.options.key].tipoFormularioSeleccionado = 'DEVOLUCION';
        sc.model[sc.options.key].devolucionPropia = false;
      }
      recuperarSolicitud();

    }

    function cambiarTipoBusqueda (tipoBusqueda) {
      if (tipoBusqueda === 'BUSQUEDA_GLOBAL') {
        sc.model[sc.options.key].usuario_nuevo = true;
        sc.model[sc.options.key].citeBusqueda  = null;
      }
    }

    function recuperarSolicitud(cite) {
      var citeBuscar = sc.model[sc.options.key].citeBusqueda;
      if (angular.isUndefined(sc.model[sc.options.key].citeBusqueda) && angular.isUndefined(cite)) {
        return;
      }
      if (angular.isUndefined(sc.model[sc.options.key].citeBusqueda) && angular.isDefined(cite)) {
        citeBuscar = cite;
      }
      if (!citeBuscar) {
        return;
      }
      var url = restUrl+'activos/recuperar';
      return DataService.post(url, {cite: citeBuscar})
      .then(function (respuesta) {
        if (angular.isUndefined(respuesta)) {
          return;
        }
        sc.model[sc.options.key].filas         = respuesta.datos.items;
        sc.model[sc.options.key].documentoDe   = respuesta.datos.cabecera.documentoDe;
        sc.model[sc.options.key].documentoPara = respuesta.datos.cabecera.documentoPara;
        sc.model[sc.options.key].usuario_ci    = respuesta.datos.usuario_ci || null;

        sc.model[sc.options.key].tipoFormulario = sc.options.templateOptions.tipoFormulario;
        sc.model[sc.options.key].tipoBusqueda   = (sc.model[sc.options.key].tipoFormulario === 'SOLICITUD') ? 'BUSQUEDA_GLOBAL' : 'BUSQUEDA_POR_CITE';
        sc.model[sc.options.key].citeBusqueda   = citeBuscar;
        sc.model[sc.options.key].usuario_nuevo  = (sc.model[sc.options.key].tipoBusqueda === 'BUSQUEDA_GLOBAL');
      });
    }

    function recuperarActivosAsignados (ci) {
      var ciBuscar = sc.model[sc.options.key].usuario_ci;

      if (angular.isUndefined(sc.model[sc.options.key].usuario_ci) && angular.isUndefined(ci)) {
        return;
      }
      if (angular.isUndefined(sc.model[sc.options.key].usuario_ci) && angular.isDefined(ci)) {
        ciBuscar = ci;
      }
      if (!ciBuscar) {
        return;
      }
      var url = restUrl+'activos/consulta/usuario/' + ciBuscar;
      return DataService.get(url)
      .then(function (respuesta) {
        if (angular.isUndefined(respuesta)) {
          sc.model[sc.options.key].filas = [];
          return;
        }
        respuesta.datos.items.map(function (x) { x.cantidad = 1; });
        sc.model[sc.options.key].filas = respuesta.datos.items || [];
        sc.model[sc.options.key].devolucionPropia = respuesta.datos.propio;
      });
    }

    function consultarActivo(texto) {
      if (!texto || texto.length < 1) return [];
      var url = restUrl+'activos/consulta?filter='+texto;
      return DataService.get(url)
      .then(function (respuesta) {
        return respuesta ? respuesta.datos : [];
      });
    }

    function seRepite(id) {
      var resp = false;
      sc.model[sc.options.key].filas.forEach(function (item)  {
        if (item.id === id) {
          resp = true;
        }
      });
      return resp;
    }

    function agregarFila() {
      var itemTemp = angular.copy(vm.buscar.item_seleccionado);
      if (itemTemp) {
        itemTemp.cantidad = 1;
        if (!seRepite(itemTemp.id)) {
          sc.model[sc.options.key].filas.push(itemTemp);
        }
        vm.buscar.item_seleccionado = undefined;        
      }
    }

    function eliminarFila(indice) {
      sc.model[sc.options.key].filas.splice(indice, 1);
    }

    function  validarUsuario() {
      DataService.get(restUrl + 'seguridad/usuario_unidad/' + sc.model[sc.options.key].usuario_ci)
      .then(function (resp) {
        sc.model[sc.options.key].documentoDe = resp.datos;
        vm.validado = true;
        Message.show('EXITO','Usuario valido');
      });
      
    }
  }
})();
