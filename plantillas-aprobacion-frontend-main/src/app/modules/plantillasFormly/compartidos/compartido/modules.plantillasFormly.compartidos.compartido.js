
(function () {
  'use strict';

  angular
    .module('app')
    .controller('CompartidoController', CompartidoController);

  /**@ngInject */
  function CompartidoController(DataService, restUrl, Storage, $stateParams, Message, $location, Documento, $timeout, $filter) {
    var vm = this;
    var cuenta = Storage.getUser();
    vm.id_catalogo = $stateParams.idCompartido;
    vm.data = {
      usuarios: [],
      documentos: []
    };
    vm.esEditor = false;
    vm.buscarDocumento = buscarDocumento;
    vm.guardarModificarDocumento = guardarModificarDocumento;
    vm.volverAtras = volverAtras;

    iniciar();

    function iniciar() {
      inicializarConfiguracionTablas();
      if (vm.id_catalogo == 0) {
        Message.show('ERROR', 'Identificador no valido.');
        $location.path('compartidos')
      } else {
        DataService.get(restUrl + 'plantillasFormly/catalogo/' + vm.id_catalogo+'?filter=true')
        .then(function (resp) {
          if (!resp) {
            Message.show('ERROR', 'El catalogo no pudo ser encontrado.');
            $location.path('compartidos');
          }
          var esValido = false;
          
          for (var i = 0; i < resp.datos.usuarios.length; i++) {
            var usuario = resp.datos.usuarios[i];
            if (usuario.fid_usuario == cuenta.id) {
              esValido = true;
              vm.esEditor = usuario.escritura;
            }
          }
          angular.forEach(resp.datos.documentos, function (item) {
            if (item._usuario_creacion == cuenta.id) {
              item.esCreador = true;
            }
          });
          if (esValido == false) {
            Message.show('ERROR', 'Usted no se encuentra autorizado para ver este catalogo.');
            $location.path('compartidos');
          }
          vm.data = resp.datos;

          vm.data.documentos = $filter("orderBy")(resp.datos.documentos,"orden", false);

        });
      }
    }

    function guardarModificarDocumento() {
      if (vm.documento && vm.documento.id_catalogo_documento && vm.documento.fid_documento && vm.documento.fid_catalogo) return guardarCambiosDocumento();
      return agregarDocumento();
    }

    function guardarCambiosDocumento() {
      var datos = {
        fid_catalogo: vm.documento.fid_catalogo,
        actualizar: {
          descripcion: vm.documento.descripcion
        }
      };
      aplicarCambio(vm.documento.id_catalogo_documento, "documento", datos);
      $timeout(function () {
        vm.documento = {};
        return iniciar();
      }, 300);
    }

    function iniciarEdicionDocumento(ev, item) {
      vm.documento = angular.copy(item);
      vm.documento.editar = true;
    }

    /**
     * Inicializa las cabeceras de las tablas y la configuracion de los botones de acción
     * las tablas son de documentos y usuarios
     * @returns Un vector de objetos
     */
    function inicializarConfiguracionTablas() {
      vm.camposDocumentos = [{
          field_value: 'nombre',
          field_name: 'Documento'
        },
        {
          field_value: 'descripcion',
          field_name: 'Descripción'
        }
      ]
      vm.botonesDocumentos = [
        {
          tooltip: 'Ver documento',
          icon: 'remove_red_eye',
          onclick: verDocumento
        },
        {
          tooltip: "Editar",
          icon: "create",
          onclick: iniciarEdicionDocumento,
          condition: {
            field: "esCreador",
            is: true
          }
        }
      ];
      vm.camposUsuarios = [
        {
          field_value: 'nombres',
          field_name: 'Nombres'
        },
        {
          field_value: 'apellidos',
          field_name: 'Apellidos'
        }
      ];
      vm.botonesUsuarios = [];
    }

    function verDocumento(ev, item) {
      ev.preventDefault();
      Documento.showPdfId(item.fid_documento);
    }

    function buscarDocumento() {
      if (!vm.buscar_documento || vm.buscar_documento == "")
        Message.show("ADVERTENCIA", "Escriba el cite del documento a buscar.");
      var datos = {
        cite: vm.buscar_documento
      };
      DataService.post(
        restUrl + "plantillasFormly/catalogo/documento/",
        datos
      ).then(function (resp) {
        if (resp) {
          vm.documento = resp.datos;
        } else {
          vm.documento = {};
        }
      });
    }

    function agregarDocumento() {
      if (
        !vm.documento ||
        !vm.documento.nombre ||
        !vm.documento.id_documento ||
        !vm.documento.descripcion
      ) {
        Message.show("ERROR", "Los datos del documento estan incompletos.");
        return;
      }
      vm.documento.estado = "ACTIVO";
      if (!vm.documento.fid_documento)
        vm.documento.fid_documento = vm.documento.id_documento;
      vm.data.documentos.push(vm.documento);
      vm.documento = {};
      vm.buscar_documento = null;

      guardarCatalogo();
    }

    function guardarCatalogo() {
      if (vm.id_catalogo == 0) {
        DataService.post(restUrl + "plantillasFormly/catalogo", vm.data).then(
          function (resp) {
            $timeout(function () {
              $location.path("catalogo/" + resp.datos.id_catalogo);
            }, 300);
          }
        );
      }
      // Actualizar catalogo
      else {
        DataService.put(
          restUrl + "plantillasFormly/catalogo/" + vm.id_catalogo,
          vm.data
        ).then(function () {
          iniciar();
        });
      }
    }

    function aplicarCambio(id, ruta, datos) {
      DataService.put(restUrl+'plantillasFormly/catalogo/'+ruta+'/'+id, datos);
    }

    function volverAtras() {
      $location.path("catalogos");
    }

  }
})();