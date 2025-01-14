(function () {
  'use strict';
  angular
  .module('app')
  .controller('fcIngresoActivosController', IngresoActivos);

  /**@ngInject */
  function IngresoActivos($scope, $timeout, DataService, restUrl, Datetime, Documento) {
    var vm = this;
    var sc = $scope;

    sc.vm = vm;
    vm.buscar = {};
    vm.general = {};
    vm.buscar_doc_activos = '';
    vm.buscar_doc_baja = '';
    vm.documentos = [];
    vm.docSeleccionado = {};

    vm.agregarActivo    = agregarActivo;
    vm.seleccionarActivoBaja = seleccionarActivoBaja;
    vm.eliminarActivo   = eliminarActivo;
    vm.consultarActivo  = consultarActivo;
    vm.consultarActivoBaja  = consultarActivoBaja;
    vm.buscarProveedor  = buscarProveedor;
    vm.controlSeleccionProveedor = controlSeleccionProveedor;
    vm.controlSeleccionTipoIngreso = controlSeleccionTipoIngreso;
    vm.controlSelectDoc = controlSelectDoc;
    vm.openSelect = openSelect;
    vm.closeSelectDoc = closeSelectDoc;
    vm.mostrarPdf = mostrarPdf;
    
    vm.listaTipos = [
      {key: 1, value: 'Compra'},
      {key: 2, value: 'Donación y/o transferencia'},
      {key: 3, value: 'Reposición'}
    ];

    var datosIniciales = {
      activos: [],
      nitProveedor: null,
      proveedor: null,
      proveedorSeleccionado: {},
      total: 0,
      tipoIngreso: 1,
      respaldo: {
        nombre:'',
        fecha:''
      },
      listaTipos: {}
    };
    for (var i = 0; i < vm.listaTipos.length; i++) {
      var temp = vm.listaTipos[i];
      datosIniciales.listaTipos[temp.key] = temp.value;
    }

    $timeout(inicializarDatos);

    function inicializarDatos() {
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = angular.copy(datosIniciales);
      }
      else if (angular.isDefined(sc.model[sc.options.key].proveedorSeleccionado)) {
        vm.proveedores = [sc.model[sc.options.key].proveedorSeleccionado];
        sc.model[sc.options.key].proveedor = sc.model[sc.options.key].proveedorSeleccionado;
        if (sc.model[sc.options.key].fechaFactura) sc.model[sc.options.key].fechaFactura = new Date(sc.model[sc.options.key].fechaFactura);
        if (sc.model[sc.options.key].fechaEntrega) sc.model[sc.options.key].fechaEntrega = new Date(sc.model[sc.options.key].fechaEntrega);
        if (sc.model[sc.options.key].fechaPreventivo) sc.model[sc.options.key].fechaPreventivo = new Date(sc.model[sc.options.key].fechaPreventivo);

        

      }
      if (sc.model[sc.options.key].respaldo) {
        vm.docSeleccionado = sc.model[sc.options.key].respaldo;
        vm.documentos = [vm.docSeleccionado];
      }

    }

    function consultarActivo(texto) {
      if (!texto || texto.length < 1) return [];
      var url = restUrl + 'activos/consulta/ingreso?filter=' + texto;
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
          sc.model[sc.options.key].total = parseFloat(sc.model[sc.options.key].total)+ parseFloat(itemTemp.precio);
        }
        vm.buscar.item_seleccionado = undefined;
      }
    }

    function eliminarActivo(indice) {
      sc.model[sc.options.key].total = parseFloat(sc.model[sc.options.key].total) - parseFloat(sc.model[sc.options.key].activos[indice].precio);
      sc.model[sc.options.key].activos.splice(indice, 1);

    }

    function buscarProveedor() {
      if (!vm.proveedor_buscar) return;
      var url = restUrl + 'activos/proveedor/?filter=' + vm.proveedor_buscar;
      return DataService.get(url)
        .then(function (resp) {
          vm.proveedores = resp.datos;
        });
    }

    function controlSeleccionProveedor(proveedor) {
      if (proveedor) {
        sc.model[sc.options.key].nitProveedor = proveedor.nit;
        sc.model[sc.options.key].idProveedor = proveedor.id;
        sc.model[sc.options.key].proveedorSeleccionado = proveedor;
      }
    }

    function controlSeleccionTipoIngreso(tipo) {
      if(tipo) {
        sc.model[sc.options.key].tipoSeleccionado = tipo;
      }
    }


    function openSelect(ev, show) {
      angular.element(ev.currentTarget).parent().next().children()[1].click();
      switch (show) {
        case 'doc': vm.show_doc = true; break;
      }
    }

    function closeSelectDoc() {
      vm.buscar_doc_activos = '';
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

    function consultarActivoBaja(texto) {
      if (!texto || texto.length < 1) return [];
      var url = restUrl + 'activos/consulta/reposicion?filter=' + texto;
      return DataService.get(url)
        .then(function (respuesta) {
          return respuesta? respuesta.datos : [];
        });
    }

    function seleccionarActivoBaja() {
      var bajaTemp = angular.copy(vm.buscar.item_seleccionado_baja);
      if (bajaTemp) {
        sc.model[sc.options.key].activoBaja = bajaTemp;
        vm.buscar.item_seleccionado_baja = undefined;
      }
    }
    sc.$watch('vm.buscar_doc_activos', function () {
      if (vm.buscar_doc_activos != "") {
        DataService.get(restUrl + 'plantillasFormly/documento?fields=id_documento,nombre,fecha&estado=APROBADO,CERRADO,DERIVADO&page=1&order=-fecha&limit=20&searchPro=1&tipoBus=campo&campoSel=nombre&filter=' + vm.buscar_doc_activos)
          .then(function (respuesta) {
            vm.documentos = respuesta.datos.resultado || [];
          });
      }
    });

  }
})();