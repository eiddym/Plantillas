(function () {
  'use strict';

  angular
  .module('app')
  .controller('ContactosController', ContactosController);

  /** @ngInject */

  function ContactosController(restUrl, Storage) {
    var vm = this;
    var cuenta = Storage.getUser();
    vm.usuario = cuenta.id;
    
    vm.titulo = 'Bandeja de contactos';
    vm.url = restUrl + 'plantillasFormly/contacto/';
    vm.fields = [
      'id_contacto',
      'grado',
      'nombres',
      'apellidos',
      'entidad',
      'tipo_entidad',
      'estado',
      '_fecha_creacion',
      '_fecha_modificacion'
    ];
    vm.permission = {
      delete: false
    };

    vm.order= 'estado';
    vm.dialogController = ['data', 'Message', '$scope', '$mdDialog', 'DataService', 'restUrl', '$timeout', DialogContactoController];
    vm.template = 'app/modules/plantillasFormly/contactos/dialog.contactos.html';
    function DialogContactoController(data, Message, $scope, $mdDialog, DataService, restUrl, $timeout) {
      var vmd = $scope;
      
      vmd.obtenerTiposEntidad = obtenerTiposEntidad;
      vmd.cerrar = cerrar;
      vmd.registrarContacto = registrarContacto;
      vmd.habilitarOtro = habilitarOtro;
      vmd.data = data;
      vmd.titulo = 'Editar';
      vmd.otroEditar = false;
      vmd.departamentos = [
        { id: 'BENI', name: 'BENI'},
        { id: 'CHUQUISACA', name: 'CHUQUISACA'},
        { id: 'COCHABAMBA', name: 'COCHABAMBA'},
        { id: 'LA PAZ', name: 'LA PAZ'},
        { id: 'ORURO', name: 'ORURO'},
        { id: 'PANDO', name: 'PANDO'},
        { id: 'POTOSI', name: 'POTOSI'},
        { id: 'SANTA CRUZ', name: 'SANTA CRUZ'},
        { id: 'TARIJA', name: 'TARIJA'}
      ];
      vmd.estados = [
        { id: 'ACTIVO', name: 'ACTIVO'},
        { id: 'INACTIVO', name: 'INACTIVO'}
      ];
      if(vmd.data.id_contacto == null) {
        vmd.titulo = 'Agregar';
        vmd.data.estado = 'ACTIVO';
        vmd.data.departamento = 'LA PAZ';
      }
      vmd.obtenerTiposEntidad();
      
      function registrarContacto() {
        var datosEnviar = vmd.data;

        if (vmd.otroEditar == true) {
          datosEnviar.tipo_entidad = datosEnviar.otro_tipo;
        }
        // Modificar contacto
        if(vmd.data.id_contacto) {
          DataService.put(restUrl + 'plantillasFormly/contacto/' + vmd.data.id_contacto, datosEnviar)
          .then(function (respContacto) {
            Message.show(respContacto.tipoMensaje, respContacto.mensaje);
            $mdDialog.hide();
            $timeout(function (){
              angular.element('#btn-refresh-crudtable').click();
            }, 500);
          });
        }
        // Crear contacto
        else {
          DataService.post(restUrl+'plantillasFormly/contacto', datosEnviar)
          .then(function (respContacto) {
            Message.show(respContacto.tipoMensaje, respContacto.mensaje);
            $mdDialog.hide();
            $timeout(function () {
              angular.element('#btn-refresh-crudtable').click();
            }, 500)
          })
        }
      }
      
      function obtenerTiposEntidad() {
        DataService.get(restUrl + 'plantillasFormly/contactos/tiposEntidad')
        .then(function (respTipos) {
          vmd.tiposEntidad = respTipos.datos;
          vmd.tiposEntidad.push({tipo_entidad:'Otros...', otro:true});
        })
        
      }

      function habilitarOtro(item) {
        if (angular.isDefined(item.otro) && item.otro == true) {
          vmd.otroEditar = true;
        }
        else {
          vmd.otroEditar = false;
        }
        
      }

      function cerrar() {
        $mdDialog.cancel();
      }
      
    }

  }
})();