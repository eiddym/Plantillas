(function () {
  'use strict';

  angular
  .module('app')
  .controller('CatalogoController', CatalogoController);

  /**@ngInject */
  function CatalogoController(DataService, restUrl, Storage, $stateParams, Message, $location, Documento, $timeout, Modal, $filter) {
    var vm = this;
    var cuenta = Storage.getUser();
    vm.id_catalogo = $stateParams.idCatalogo;
    vm.esPropietario= false;
    vm.esModificacionNombre = false;
    vm.nombreAntiguo = '';
    vm.documentosDic = {};
    
    vm.data = {
      usuarios: [],
      documentos: []
    };
    vm.usuarios = [];
    vm.dic_estado = {
      'ACTIVO': 'INACTIVO',
      'INACTIVO': 'ACTIVO'
    }
    vm.buscarUsuario = buscarUsuario;
    vm.autorizarUsuario = autorizarUsuario;
    vm.buscarDocumento = buscarDocumento;
    vm.agregarDocumento = agregarDocumento;
    vm.guardarCatalogo = guardarCatalogo;
    vm.volverAtras = volverAtras;
    vm.escucharCambioNombre = escucharCambioNombre;
    vm.subirOrdenDocumento = subirOrdenDocumento;
    vm.bajarOrdenDocumento = bajarOrdenDocumento;
    vm.actualizarMultiple = actualizarMultiple;
    vm.construirActualizacionOrden = construirActualizacionOrden;
    vm.guardarCambiosDocumento = guardarCambiosDocumento;
    vm.guardarModificarDocumento = guardarModificarDocumento;
    iniciar();
    

    function iniciar() {
      inicializarConfiguracionTablas();
      if (vm.id_catalogo == 0) {
        Message.show('INFORMACION', 'No olvide guardar sus cambios, de lo contrario se perderán.');
      }
      else {
        DataService.get(restUrl+'plantillasFormly/catalogo/'+vm.id_catalogo)
        .then(function (resp) {
          if (resp.datos.propietario != cuenta.id) $location.path('catalogos');
          vm.data = resp.datos;
          vm.data.usuarios = resp.datos.usuarios;
          if (vm.data.propietario == cuenta.id) {
            vm.esPropietario = true;
            vm.data.comentario = "";
            vm.nombreAntiguo = vm.data.nombre;
          }
          vm.data.documentos = $filter("orderBy")(resp.datos.documentos,"orden", false);
          angular.forEach(vm.data.documentos, function (item) {
            if (item._usuario_creacion == cuenta.id) {
              item.esCreador = true;
            }
          });
        });
      }
    }

    function guardarModificarDocumento() {
      if (vm.documento && vm.documento.id_catalogo_documento && vm.documento.fid_documento && vm.documento.fid_catalogo) return guardarCambiosDocumento();
      return agregarDocumento();
    }

    function iniciarEdicionDocumento(ev, item) {
      vm.documento = angular.copy(item);
      vm.documento.editar = true;
    }

    function buscarDocumento() {
      
      if (!vm.buscar_documento || vm.buscar_documento == '') Message.show('ADVERTENCIA', 'Escriba el cite del documento a buscar.');
      var datos = {
        cite: vm.buscar_documento
      }
      DataService.post(restUrl+'plantillasFormly/catalogo/documento/', datos)
      .then(function (resp) {
        if (resp) {
          vm.documento = resp.datos;
        }
        else {
          vm.documento = {};
        }
      });
      
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


    function agregarDocumento() {
      if (!vm.documento || !vm.documento.nombre || !vm.documento.id_documento || !vm.documento.descripcion) {
        Message.show('ERROR', 'Los datos del documento estan incompletos.');
        return;
      }
      vm.documento.estado = 'ACTIVO';
      vm.documento.orden = vm.data.documentos.length + 1;
      if (!vm.documento.fid_documento) vm.documento.fid_documento = vm.documento.id_documento;
      vm.data.documentos.push(vm.documento);
      vm.documento = {};
      vm.buscar_documento = null;

      guardarCatalogo();
    }

    function verDocumento(ev,item) {
      ev.preventDefault();
      Documento.showPdfId(item.fid_documento);
    }

    function cambiarEstadoUsuario(ev, item) {
      ev.preventDefault();
      var datos = {
        fid_catalogo: item.fid_catalogo,
        actualizar: {
          estado: vm.dic_estado[item.estado]
        }
      };
      aplicarCambio(item.id_catalogo_usuario, 'usuario', datos);
      $timeout(function () {
        iniciar();
      }, 300);
    }

    function cambiarPermisoEdicion(ev, item) {
      ev.preventDefault();

      var datos = {
        fid_catalogo: item.fid_catalogo,
        actualizar: {
          escritura: !item.escritura
        }
      };
      aplicarCambio(item.id_catalogo_usuario, "usuario", datos);
    }
    function cambiarPermisoLectura(ev, item) {
      ev.preventDefault();

      var datos = {
        fid_catalogo: item.fid_catalogo,
        actualizar: {
          lectura: !item.lectura
        }
      };
      aplicarCambio(item.id_catalogo_usuario, "usuario", datos);
      $timeout(function () {
        iniciar();
      }, 300);
    }

    function cambiarEstadoDocumento(ev, item) {
      ev.preventDefault();
      var datos = {
        fid_catalogo: item.fid_catalogo,
        actualizar: {
          estado: vm.dic_estado[item.estado]
        }
      };
      aplicarCambio(item.id_catalogo_documento, 'documento', datos);
      $timeout(function () {
        iniciar();
      }, 300);
    }
    
    function aplicarCambio(id, ruta, datos) {
      DataService.put(restUrl+'plantillasFormly/catalogo/'+ruta+'/'+id, datos);
    }

    function buscarUsuario() {
      if (!vm.buscar_usuario || vm.buscar_usuario == '') return;
      DataService.get(restUrl + 'seguridad/usuario/catalogo?fields=id_usuario,nombres,apellidos,estado&filter=' + vm.buscar_usuario)
      .then(function (resp) {
        filtrarUsuarios(resp.datos.resultado);
      });
    }

    function autorizarUsuario(ev, usuario) {
      if (!usuario.fid_usuario) usuario.fid_usuario = usuario.id_usuario;
      var existe = false;
      if (!vm.data.usuarios) vm.data.usuarios = [];
      vm.data.usuarios.forEach(function (item) {
        if (item.id_usuario == usuario.id_usuario) {
          existe = true;
        }
      });

      if (existe !== true) {
        vm.data.usuarios.push(usuario);
        guardarCatalogo();
        filtrarUsuarios();
      }
    }

    function filtrarUsuarios(usuarios) {
      if (!vm.data.usuarios || vm.data.usuarios.length == 0) {
        vm.usuarios = usuarios? usuarios: [];
        return;
      }
      var lista = vm.usuarios;
      if (usuarios) {
        if (lista.length == 0) lista = usuarios;
        else lista = usuarios;
      }
      var enUso = vm.data.usuarios;
      var listaLimpia = [];
      for (var i = 0; i < lista.length; i++) {
        var usado = false;
        var item = null;
        for (var j = 0; j < enUso.length; j++) {
          item = lista[i];
          if (enUso[j].id_usuario == lista[i].id_usuario) {
            usado = true;
            break;
          }
        }
        if (usado == false && item != null ) {
          listaLimpia.push(item)
        }
      }
      vm.usuarios = listaLimpia;
    }

    function guardarCatalogo() {
      if (vm.id_catalogo == 0) {
        DataService.post(restUrl+'plantillasFormly/catalogo', vm.data)
        .then(function () {
          $timeout(function () {
            volverAtras();
          }, 300);
        });
      }
      else {
        DataService.put(restUrl+'plantillasFormly/catalogo/'+vm.id_catalogo, vm.data)
        .then(function () {
          $timeout(function () {
            iniciar();
            volverAtras();
          }, 300);
        })
      }
    }

    function volverAtras() {
      $location.path('catalogos');
    }

    function escucharCambioNombre() {
      if (vm.data.nombre != vm.nombreAntiguo) {
        vm.esModificacionNombre = true;
      }
    }
    function subirOrdenDocumento (ev, item, indice) {
      var listaActualizar = [];
      listaActualizar.push(vm.construirActualizacionOrden(indice, indice-1));
      listaActualizar.push(vm.construirActualizacionOrden(indice-1, indice));
      vm.actualizarMultiple(listaActualizar);
      $timeout(function () {
        iniciar();
      }, 350);
    }
    
    function actualizarMultiple(lista) {
      angular.forEach(lista, function (item) {
        aplicarCambio(item.id_catalogo_documento, "documento", item);
      });
    }
    function construirActualizacionOrden(indice, orden) {
      var temp = vm.data.documentos[indice]
      return {
        actualizar: { orden: orden },
        fid_catalogo: temp.fid_catalogo,
        fid_documento: temp.fid_documento,
        id_catalogo_documento: temp.id_catalogo_documento
      };
    }
    function bajarOrdenDocumento (ev, item, indice) {
      var listaActualizar = [];
      listaActualizar.push({
        actualizar: { orden: indice + 1 },
        fid_catalogo: item.fid_catalogo,
        fid_documento: item.fid_documento,
        id_catalogo_documento: item.id_catalogo_documento
      });
      var documentoTemp = vm.data.documentos[indice + 1];
      listaActualizar.push({
        actualizar: { orden: indice },
        fid_catalogo: documentoTemp.fid_catalogo,
        fid_documento: documentoTemp.fid_documento,
        id_catalogo_documento: documentoTemp.id_catalogo_documento
      });
      vm.actualizarMultiple(listaActualizar);
      $timeout(function () {
        iniciar();
      }, 350);
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
          tooltip: "Ver documento",
          icon: "remove_red_eye",
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
        },
        {
          tooltip: "Activar",
          icon: "done",
          onclick: cambiarEstadoDocumento,
          condition: {
            field: "estado",
            is: "INACTIVO"
          }
        },
        {
          tooltip: "Inactivar",
          icon: "clear",
          onclick: cambiarEstadoDocumento,
          condition: {
            field: "estado",
            is: "ACTIVO"
          }
        },
        {
          tooltip: "Subir",
          icon: "keyboard_arrow_up",
          onclick: subirOrdenDocumento,
          condition: {
            type: "defaultUp"
          }
        },
        {
          tooltip: "Bajar",
          icon: "keyboard_arrow_down",
          onclick: bajarOrdenDocumento,
          condition: {
            type: "defaultDown"
          }
        }
        
      ];
      vm.camposUsuarios = [{
          field_value: 'nombres',
          field_name: 'Nombres'
        },
        {
          field_value: 'apellidos',
          field_name: 'Apellidos'
        }
      ];
      vm.botonesUsuarios = [
        {
          tooltip: "Activar",
          icon: "done",
          onclick: cambiarEstadoUsuario,
          condition: {
            field: "estado",
            is: "INACTIVO"
          }
        },
        {
          tooltip: "Inactivar",
          icon: "clear",
          onclick: cambiarEstadoUsuario,
          condition: {
            field: "estado",
            is: "ACTIVO"
          }
        },
        {
          tooltip: "No puede ver",
          icon: "remove_red_eye",
          onclick: cambiarPermisoLectura,
          condition: {
            field: "lectura",
            is: false,
            class: "botonDesactivado"
          }
        },
        {
          tooltip: "Puede ver",
          icon: "remove_red_eye",
          onclick: cambiarPermisoLectura,
          condition: {
            field: "lectura",
            is: true,
            class: "botonActivado"
          }
        },
        {
          tooltip: "No puede modificar",
          icon: "create",
          onclick: cambiarPermisoEdicion,
          condition: {
            field: "escritura",
            is: false,
            class: "botonDesactivado"
          }
        },
        {
          tooltip: "Puede modificar",
          icon: "create",
          onclick: cambiarPermisoEdicion,
          condition: {
            field: "escritura",
            is: true,
            class: "botonActivado"
          }
        }
      ];
    }

  }
})();
