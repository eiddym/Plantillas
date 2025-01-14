(function() {
  'use strict';

  angular
    .module('app')
    .controller('RolController', RolController);

  /** @ngInject */
  function RolController(restUrl, Storage) {
    var vm = this;

    var cuenta=Storage.getUser();
    vm.usuario = cuenta.id;

    //config para crudTable
    vm.url = restUrl+'seguridad/rol/';
    vm.fields = ['id_rol','nombre','descripcion','peso','estado','_fecha_creacion','_fecha_modificacion'];
    vm.titulo = "Roles";
    vm.dialogController = ['data', 'Message', '$scope', '$mdDialog', 'DataService', 'restUrl', '$timeout', DialogRolController];
    vm.template = 'app/modules/seguridad/rol/dialog.rol.html';

    function DialogRolController(data, Message, $scope, $mdDialog, DataService, restUrl, $timeout) {
        var vmd = $scope;

        vmd.cerrar = cerrar;
        vmd.registrarRol = registrarRol;
        vmd.data = data;
        vmd.estados = [{id:"ACTIVO", name: "ACTIVO"},{id:"INACTIVO", name: "INACTIVO"}];


        if (!vmd.data.id_rol) vmd.data._fecha_creacion = new Date();
        vmd.data._fecha_modificacion = new Date();
        obtenerMenus();
        function obtenerMenus() {
            if(vmd.data.id_rol){
                DataService.get(restUrl+"seguridad/menu?limit=1000&estado=ACTIVO")
                .then(function(respuesta){
                    vmd.menus = respuesta.datos.resultado;
                    return DataService.get(restUrl+"seguridad/rol/"+vmd.data.id_rol+"/menu");
                })
                .then(function(respuesta){
                    vmd.rol_menus = respuesta.datos;
                    for (var i = 0; i < vmd.rol_menus.length; i++) {
                        for (var j = 0; j < vmd.menus.length; j++) {
                            if(vmd.rol_menus[i].fid_menu == vmd.menus[j].id_menu){
                                vmd.menus[j].checked = (vmd.rol_menus[i].estado == 'ACTIVO')? true : false;
                                j = vmd.menus.length;
                            }
                        }
                    }
                });

            }else {
                DataService.get(restUrl+"seguridad/menu?limit=1000&estado=ACTIVO")
                .then(function(respuesta){
                    vmd.menus = respuesta.datos.resultado;
                })
            }

        }

        function registrarRol() {
            var datosEnviar = {
                rol: {
                    id_rol: vmd.data.id_rol,
                    nombre: vmd.data.nombre,
                    descripcion: vmd.data.descripcion,
                    peso: vmd.data.peso,
                    estado: vmd.data.estado
                },
                menus: []
            };
            if (vmd.data.id_rol) {
                datosEnviar.rol._usuario_modificacion = cuenta.id;
                datosEnviar.menus_nuevos = [];
                for (var i = 0; i < vmd.menus.length; i++) {
                    var existe = false;
                    for (var j = 0; j < vmd.rol_menus.length; j++) {
                        if(vmd.menus[i].id_menu == vmd.rol_menus[j].fid_menu)
                        {
                            vmd.rol_menus[j].estado = (vmd.menus[i].checked)? 'ACTIVO' : 'INACTIVO';
                            vmd.rol_menus[j]._usuario_modificacion = cuenta.id;
                            delete vmd.rol_menus[j]._fecha_creacion;
                            delete vmd.rol_menus[j]._fecha_modificacion;
                            datosEnviar.menus.push(angular.fromJson(angular.toJson(vmd.rol_menus[j])));
                            existe = true;
                            j = vmd.rol_menus.length;
                        }
                    }
                    if(!existe && vmd.menus[i].checked){
                        datosEnviar.menus_nuevos.push(vmd.menus[i].id_menu);
                    }
                }

                DataService.put(restUrl+"seguridad/rol/"+vmd.data.id_rol+"/menu", datosEnviar)
                .then(function (respuesta) {
                    Message.show(respuesta.tipoMensaje,respuesta.mensaje);
                    $mdDialog.hide();
                    $timeout(function () {
                        angular.element('#btn-refresh-crudtable').click();
                    }, 500);
                });
            }else{
                datosEnviar.rol._usuario_creacion = cuenta.id;

                for (i = 0; i < vmd.menus.length; i++) {
                    if(vmd.menus[i].checked){
                        datosEnviar.menus.push(vmd.menus[i].id_menu);
                    }
                }
                DataService.post(restUrl+"seguridad/rol/0/menu", datosEnviar)
                .then(function (respuesta) {
                    Message.show(respuesta.tipoMensaje,respuesta.mensaje);
                    $mdDialog.hide();
                    $timeout(function () {
                        angular.element('#btn-refresh-crudtable').click();
                    }, 500);
                });
            }

        }
        function cerrar() {
            $mdDialog.cancel();
        }

    }

  }
})();
