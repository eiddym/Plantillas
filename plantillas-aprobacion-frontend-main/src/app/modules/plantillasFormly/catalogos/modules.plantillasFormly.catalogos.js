
(function () {
  'use strict';

  angular
  .module('app')
  .controller('CatalogosController', CatalogosController);

  /**@ngInject */
  function CatalogosController(DataService, restUrl, Storage, $timeout, $location, Message, Modal, Catalogo) {
    var vm = this;
    var cuenta = Storage.getUser();
    vm.cuenta = cuenta;
    vm.usuario = cuenta.id;
    vm.titulo = "Edición/Creación de Catalogos";

    vm.url = restUrl + 'plantillasFormly/catalogo/'+vm.usuario+'/miscatalogos';
    vm.fields = ['id_catalogo', 'nombre', 'descripcion', 'estado'];
    vm.escucharSeleccion = escucharSeleccion;
    vm.existeSeleccionados = false;
    vm.items = {};

    vm.permissions = {
      create: false,
      update: false,
      delete: false
    };

    vm.order = 'estado';

    vm.botonAgregar = {
      tooltip: 'crear',
      icon: 'add',
      onclick: irCatalogo
    }
    vm.botonesCabecera = [
      {
        tooltip: "Cambiar propietario",
        icon: "security",
        onclick: abrirModalCambioPropietario,
        enable: vm.habilitarCambioPropietario
      }
    ];
    vm.botones = [
      {
        tooltip: "Agregar documentos/usuarios",
        icon: "create",
        onclick: irCatalogo
      },
      {
        tooltip: "Eliminar catalogo",
        icon: "delete",
        onclick: eliminarCatalogo
      },
      {
        tooltip: "Ver historial",
        icon: "timeline",
        onclick: obtenerHistorial
      }
    ];

    function abrirModalCambioPropietario(ev) {
      ev.preventDefault();
      if (!vm.existeSeleccionados) {
        Message.show('ADVERTENCIA', "No existe ningun catalogo seleccionado");
      }
      else {
        var config = {
          data: {
            items: vm.items,
            cuenta: vm.cuenta
          },
          templateUrl:
            "app/modules/plantillasFormly/catalogos/propietario.dialog.html",
          controller: [
            "data",
            "$scope",
            "$mdDialog",
            "DataService",
            "Message",
            "restUrl",
            "$timeout",
            DialogCambiarPropietario
          ]
        };
        Modal.show(config);
      }
    }

    function escucharSeleccion(seleccionado) {
      vm.existeSeleccionados = seleccionado;
    }

    function irCatalogo(ev, id) {
      ev.preventDefault();
      var identificador = 0;
      if (id) identificador = id;
      $location.path('catalogo/'+identificador);
    }
    function eliminarCatalogo(ev, id) {
      ev.preventDefault();
      if (!id) {
        Message.show('INFORMACION', 'No selecciono un catalogo a eliminar');
        return;
      }
      DataService.delete(restUrl + 'plantillasFormly/catalogo/' + id +'/miscatalogos', null, true)
      .then(function (resp) {
        Message.show(resp.tipoMensaje, resp.mensaje);
        $timeout(function () {
          angular.element('#btn-refresh-crudtable').click();
        }, 500);

      })
      
    }

    function obtenerHistorial(ev, id) {
      ev.preventDefault();
      Catalogo.showHistory(ev, id);
    }

    function DialogCambiarPropietario(data, $scope, $mdDialog, DataService, Message, restUrl, $timeout) {
      var vmd = $scope;
      vmd.test = 'asdasd';
      vmd.buscarPropietario="";
      vmd.data = data;
      vmd.listaCatalogos = [];
      
      iniciarController();

      vmd.clearSearchTerm = function () {
        vmd.buscarPropietario = "";
      };
      function iniciarController() {

        angular.element("input.header-searchbox").on("keydown", function (ev) {
          ev.stopPropagation();
        });
        
        vmd.listaCatalogos = data.items.data.filter(function (item) {
          if (item.selected) return item;
        });

        DataService.get(restUrl + "seguridad/usuario_rol/")
        .then(function (resp) {
          vmd.usuarios = resp.datos;
        });
        
      }
      vmd.transferir = function() {
        var datosEnviar= {
          propietario: vmd.usuario.id_usuario,
          catalogos: vmd.listaCatalogos
        };
        DataService.put(restUrl + "plantillasFormly/catalogo/"+vmd.data.cuenta.id+"/propietario", datosEnviar)
        .then(function(resp){
          Message.show(resp.tipoMensaje, resp.mensaje );
          // $location.path("catalogos");
          vmd.cerrar();
          $timeout(function () {
            angular.element("#btn-refresh-crudtable").click();
          }, 300);
        })

      }

      vmd.cerrar = function() {
        $mdDialog.cancel();
      }
      
    }
  }
})();