(function () {
  'use strict';

  angular
    .module('app')
    .controller('fcIngresoAlmacenController', IngresoAlmacen);

  /** @ngInject */
  function IngresoAlmacen($scope, $timeout, DataService, restUrl, Datetime, Documento) {
    var vm = this;
    var sc = $scope;
    var model, articulos;

    sc.vm = vm;
    vm.buscarProveedor = buscarProveedor;
    vm.buscarArticulo = buscarArticulo;
    vm.agregarFila = agregarFila;
    vm.eliminarFila = eliminarFila;
    vm.calcularSubTotal = calcularSubTotal;
    vm.calcularTotal = calcularTotal;
    vm.calcularTotalConDescuento = calcularTotalConDescuento;
    vm.proveedores = [];
    vm.documentos = [];
    vm.docSeleccionado = {};
    vm.buscar_doc = '';
    vm.listaTipos = [
      { key: 1, value: 'Compra' },
      { key: 2, value: 'Donación y/o transferencia' },
      { key: 3, value: 'Reingreso' }
    ];

    vm.campoRequerido = true;

    vm.controlSelectDoc = controlSelectDoc;
    vm.openSelect = openSelect;
    vm.closeSelectDoc = closeSelectDoc;
    vm.mostrarPdf = mostrarPdf;
    vm.controlSeleccionProveedor = controlSeleccionProveedor;

    
    $timeout(iniciarController);
  

    function iniciarController() {
      if (angular.isUndefined(sc.model[sc.options.key])) {
        sc.model[sc.options.key] = {
          reingreso: false,
          proveedor: {},
          proveedorSeleccionado: {},
          proveedor_nombre: '',
          c31: null,
          c31_fecha: null,
          nota_entrega_numero: null,
          nota_entrega_fecha: null,
          factura_numero: null,
          factura_autorizacion: null,
          factura_fecha: null,
          items: [],
          descuento: 0,
          subtotal: 0.00,
          total: 0.00,
          observaciones:'',
          tipoIngreso: 1,
          respaldo: {
            nombre: '',
            fecha:''
          },
          listaTipos: {}

        };
        for (var i = 0; i < vm.listaTipos.length; i++) {
          var temp = vm.listaTipos[i];
          sc.model[sc.options.key].listaTipos[temp.key] = temp.value;
        }
      }
      if(vm.proveedores.length === 0) {
        if (angular.isDefined(sc.model[sc.options.key].proveedor.nombre)) {
          vm.proveedores.push(sc.model[sc.options.key].proveedor);
        }
        vm.proveedor_buscar = sc.model[sc.options.key].proveedor.nombre;
      }
      articulos = sc.model[sc.options.key].items;
      model = sc.model[sc.options.key];

      if (sc.model[sc.options.key].respaldo) {
        vm.docSeleccionado = sc.model[sc.options.key].respaldo;
        vm.documentos = [vm.docSeleccionado];
      }
      
      if (sc.model[sc.options.key].c31_fecha) sc.model[sc.options.key].c31_fecha = new Date(sc.model[sc.options.key].c31_fecha);
      if (sc.model[sc.options.key].factura_fecha) sc.model[sc.options.key].factura_fecha = new Date(sc.model[sc.options.key].factura_fecha);
      if (sc.model[sc.options.key].nota_entrega_fecha) sc.model[sc.options.key].nota_entrega_fecha = new Date(sc.model[sc.options.key].nota_entrega_fecha);

    }

    function buscarProveedor() {
      if (!vm.proveedor_buscar) return;
      var url = restUrl + 'almacen/proveedor/?filter='+vm.proveedor_buscar;
      return DataService.get(url)
      .then(function (resp) {
        vm.proveedores = resp.datos;
      })
    }
    function buscarArticulo() {
      var url = restUrl + 'almacen/consulta?todos=1&filter='+vm.articulo_buscar;
      return DataService.get(url)
      .then(function (resp) {
        vm.articulos = resp.datos || [];
        
      })
    }

    function agregarFila(indice) {
      var itemTemp = angular.copy(vm.articulos[indice]);
      if (itemTemp) {
        itemTemp.cantidad = 0;
        itemTemp.precio = '0.00';
        itemTemp.total = '0.00';
        if (!seRepite(itemTemp.codigo)) articulos.push(itemTemp);
        vm.articulos.splice(indice, 1);
      }
    }

    function eliminarFila(indice) {
      articulos.splice(indice, 1);
      vm.calcularTotal();
    }

    function seRepite(codigo) {
      var resp = false;
      articulos.forEach(function (item) {
        if (item.codigo === codigo) {
          resp = true;
        }
      });
      return resp;
    }

    function calcularSubTotal(indice) {
      var precio = articulos[indice].precio;
      var cantidad = articulos[indice].cantidad;
      var total = parseInt(cantidad) *  parseFloat(precio);
      articulos[indice].total = total.toFixed(2);
      vm.calcularTotal();
    }

    function calcularTotal() {
      var descuento = model.descuento || 0;
      var total = 0;
      for (var i = 0; i < articulos.length; i++) {
        var element = articulos[i];
        total += parseFloat(element.total);
      }
      model.subtotal = total.toFixed(2);
      // if (descuento) 
      total = total - parseFloat(descuento);
      model.total = total.toFixed(2);
    }

    function calcularTotalConDescuento() {
      var descuento = model.descuento || 0;
      var total = model.total || 0;
      var totalConDescuento = parseFloat(total) - parseFloat(descuento);
      model.total = totalConDescuento.toFixed(2);
    }

    sc.$watch('vm.buscar_doc', function () {
      if (vm.buscar_doc != "") {
        DataService.get(restUrl + 'plantillasFormly/documento?fields=id_documento,nombre,fecha&estado=APROBADO,CERRADO,DERIVADO&page=1&order=-fecha&limit=20&searchPro=1&tipoBus=campo&campoSel=nombre&filter=' + vm.buscar_doc)
          .then(function (respuesta) {
            vm.documentos = respuesta.datos.resultado || [];
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

    function controlSeleccionProveedor(proveedor) {
      if (proveedor) {
        sc.model[sc.options.key].nitProveedor = proveedor.nit;
        sc.model[sc.options.key].idProveedor = proveedor.id;
        sc.model[sc.options.key].proveedorSeleccionado = proveedor;
      }
    }
  }
})();