(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcCajaChicaController', CajaChicaController);

  /** @ngInject */
  function CajaChicaController($scope, $timeout, DataService, restUrl) {
    var vm = this;
    var sc = $scope;
    var model, to;
    sc.vm = vm;

    vm.buscar = {};
    vm.alert = {};

    vm.addRow = addRow;
    vm.deleteRow = deleteRow;
    vm.buscarDocumentos = buscarDocumentos;
    vm.buscarPartidas = buscarPartidas;
    vm.cargarPartidas = cargarPartidas;
    vm.obtenerSaldo = obtenerSaldo;
    vm.calcularTotal = calcularTotal;

    $timeout(iniciarController);

    function iniciarController() {
        to = sc.options.templateOptions;
        vm.documentos = [];
        if (angular.isUndefined(sc.model[sc.options.key])) {
            sc.model[sc.options.key] = { rows: [], monto_total:0 };
            sc.model[sc.options.key].tipo = to.tipo=='GESTION'? 'MODIFICADO': to.tipo;
        }else {
          calcularTotal();
        }
        model = sc.model[sc.options.key];
    }

    function buscarPartidas(texto) {
      var url = restUrl+'presupuesto/partidas/';
      if (texto) { url += '?filter='+texto; }
      return DataService.get(url)
      .then(function (respuesta) {
        return respuesta.datos || [];
      })
    }

    function calcularTotal(row) {
      if (row) row.monto = isFloat(row.monto)? parseFloat(row.monto).toFixed(2) : '0.00';

      sc.model[sc.options.key].monto_total = 0;
      sc.model[sc.options.key].rows.forEach(function (it) {
        if (isFloat(it.monto)) sc.model[sc.options.key].monto_total+=toFloat(it.monto);
      })
      sc.model[sc.options.key].monto_total = parseFloat(sc.model[sc.options.key].monto_total).toFixed(2);
    }
    function toFloat(string) { return parseFloat(parseFloat(string).toFixed(2)); }
    function isFloat(string) { return /(?:\d*\.)?\d+/.test(string); }

    function obtenerSaldo(multiple) {
        var url = restUrl+'presupuesto/partidas/?saldo='+multiple;
        DataService.get(url)
        .then(function (respuesta) {
          if (respuesta) {
            if (respuesta.tipoMensaje=='EXITO')
              showALert('info', ' El saldo actual del comprometido es '+respuesta.datos.monto);
            if (respuesta.tipoMensaje=='ADVERTENCIA')
              showALert('warning', ' '+respuesta.mensaje);
          }
        })
    }

    function cargarPartidas(cite) {
      if (cite) {
        var url = restUrl+'presupuesto/partidas/?cite='+cite;
        DataService.get(url)
        .then(function (respuesta) {
          if (respuesta){
            if (respuesta.tipoMensaje=='EXITO'){
              if (model.rows) {
                vm.ids_comprometidos = {};
                model.rows.forEach(function (it) { vm.ids_comprometidos[it.id_comprometido] = !it.pago_multiple; })

                for (var k in respuesta.datos) {
                  if (respuesta.datos.hasOwnProperty(k) && !vm.ids_comprometidos[k]) {
                      model.rows.push({
                        cite: angular.copy(vm.buscar.doc_seleccionado),
                        partida: angular.copy(respuesta.datos[k].partida),
                        descripcion: angular.copy(respuesta.datos[k].descripcion),
                        id_comprometido: angular.copy(respuesta.datos[k].id),
                        comprometido: angular.copy(respuesta.datos[k].monto),
                        pago_multiple: angular.copy(respuesta.datos[k].pago_multiple),
                        monto: '0.00'
                      })
                      vm.ids_comprometidos[k] = !respuesta.datos[k].pago_multiple;
                  }
                }
                if (Object.keys(respuesta.datos)==0) showALert('warning', 'El documento ya no tiene partidas disponibles.')
              }
            } else if (respuesta.tipoMensaje=='ADVERTENCIA') showALert('warning', respuesta.mensaje);
          }
          vm.buscar.doc_seleccionado = null;
        })
      }
    }

    function buscarDocumentos(texto) {
      var url = restUrl+'plantillasFormly/documento?fields=id_documento,nombre,fecha&estado=APROBADO,CERRADO,DERIVADO&page=1&order=-fecha&limit=20';
      if (texto) {
        url += '&searchPro=1&tipoBus=campo&campoSel=nombre&filter='+texto;
      }
      return DataService.get(url)
      .then(function (respuesta) {
        if (respuesta){
          vm.documentos = respuesta.datos.resultado;
        }
        return respuesta.datos.resultado || [];
      })
    }

    function addRow(tipo, button) {
      if (tipo=='MODIFICADO'||tipo=='COMPROMETIDO') {
        if (button) {
          if (vm.buscar.par_seleccionado)
            model.rows.push({ partida: angular.copy(vm.buscar.par_seleccionado), monto:'0.00' });
          else showALert('warning', 'Seleccione una partida para adicionar');
        }
        else if (vm.buscar.par_seleccionado) model.rows.push({ partida: angular.copy(vm.buscar.par_seleccionado), monto:'0.00' });
      }
      else if ( tipo=='INICIAL' )
        model.rows.push({monto:'0.00'});
      calcularTotal();
    }
    function deleteRow(i) { model.rows.splice(i, 1); calcularTotal(); }
    function showALert(tipo, mensaje, time) {
      var icons = {
        'info': 'info',
        'warning': 'warning'
      }
      vm.alert.show = true;
      vm.alert.tipo = tipo;
      vm.alert.mensaje = mensaje;
      vm.alert.icono = icons[tipo];
      vm.alert.time = time || 0;
    }
  }
})();
