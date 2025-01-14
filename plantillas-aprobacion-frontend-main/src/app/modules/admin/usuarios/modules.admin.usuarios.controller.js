(function() {
    'use strict';

    angular
    .module('app')
    .controller('UsuariosController',UsuariosController);


    /** @ngInject */
    function UsuariosController(restUrl, Modal, DataService, Util, Message, Storage, $log) {
        var vm = this;

        vm.title = 'Usuarios';
        vm.url = restUrl + 'seguridad/usuario/';
        vm.fields = ['id_usuario','usuario','numero_documento','nombres','apellidos','cargo','email','estado','_fecha_creacion','_fecha_modificacion'];
        vm.dialogController = [ 'data', 'Message', '$scope', '$mdConstant', '$mdDialog', 'Modal', 'DataService', 'restUrl', '$timeout', DialogUsuarioController];
        vm.template = 'app/modules/admin/usuarios/dialog.usuario.html';
        var cuenta=Storage.getUser();
        vm.usuario=cuenta.id;

        vm.permission ={
          create:true,
          update:true,
          delete:false
        };

        vm.buttonAgregar = {
            tooltip: 'Syncronizar todos los datos con ldap',
            icon: 'cached',
            onclick: Syncronizar
        };

        function Syncronizar(ev) {
            $log.log("Sin servicio", ev);
        }

        function DialogUsuarioController(data, Message, $scope,$mdConstant,$mdDialog,Modal,DataService,restUrl,$timeout){

          var vmd=$scope;

          vmd.data = data;
          // funciones
          vmd.cerrar = cerrar;
          vmd.registrarUsuario = registrarUsuario;

          var flagEditar=(data.id_usuario)?true:false; // true: editar, false:crear.
          iniciarDialog();

          function iniciarDialog(){
            var roles=[];
            var rolesEnviar=[];
            var virtuales = [];
            DataService.get(restUrl+"seguridad/rol")
            .then(function(response){
              roles=response.datos.resultado;
              if(flagEditar){
                var rolesAsignados=data.usuario_rol;
                roles.forEach(function(itemGlobal,indiceGlobal){
                  var rol={
                    id_rol:itemGlobal.id_rol,
                    nombre:itemGlobal.nombre,
                    valor:false
                  }

                  if(rolesAsignados!=null && rolesAsignados.length>0){
                    rolesAsignados.forEach(function(item,indice){
                      if(itemGlobal.id_rol==item.rol.id_rol) rol.valor=true;
                      if(indice==rolesAsignados.length-1){
                        rolesEnviar.push(rol);
                        if(indiceGlobal==roles.length-1) vmd.data.roles=rolesEnviar;
                      }
                    });
                  }else{
                    vmd.data.roles = roles;
                  }

                });
              }
              else{
                // Agrega valor, por defecto en false.
                roles.forEach(function(item,indice){

                  var rol={
                    id_rol:item.id_rol,
                    nombre:item.nombre,
                    valor:false
                  }
                  rolesEnviar.push(rol);
                  if(indice==roles.length-1) vmd.data.roles=rolesEnviar;
                });

              }
            })

            DataService.get(restUrl + "seguridad/virtual/todos")
            .then(function (response) {
              if (angular.isUndefined(response.datos.resultado)) virtuales = [];
              virtuales = response.datos.resultado;
              var procesado = [];
              if (flagEditar && flagEditar === false) {
                vmd.data.virtuales = virtuales;
                return;                
              }
              
              var enUso = vmd.data.virtuales || [];
              virtuales.forEach(function (dispItem) {
                var objTemp = {
                  id_usuario: dispItem.id_usuario,
                  cargo: dispItem.cargo,
                  nombres: dispItem.nombres,
                  libre: dispItem.libre,
                  valor: false,
                  titular: dispItem.titular
                };
                if(enUso.length == 0) {
                  procesado.push(objTemp);
                }
                var idProcesado = [];
                enUso.forEach(function (usoItem) {
                  if (dispItem.id_usuario == usoItem.fid_usuario_virtual) {
                    idProcesado.push(dispItem.id_usuario);
                    objTemp.id_virtual = usoItem.id_virtual;
                    if ( usoItem.estado == 'ACTIVO') {
                      objTemp.libre = true;
                      objTemp.valor = true;
                    } else {
                      objTemp.valor = false;
                    }

                    procesado.push(objTemp);
                  }
                });
                
                if(idProcesado.indexOf(dispItem.id_usuario)=== -1 && enUso.length > 0) {
                  procesado.push(objTemp)
                }
              })

              vmd.data.virtuales = procesado;

            })

            DataService.get(restUrl+"seguridad/unidad?fields=id_unidad,nombre,abreviacion")
            .then(function (respuesta) {
                vmd.data.unidades = respuesta.datos.resultado;
            })

          }

          function cerrar(){
            $mdDialog.cancel();
          }


          function registrarUsuario(){

            var roles=[];
            for(var i in vmd.data.roles){
              if(vmd.data.roles[i].valor==true) roles.push(vmd.data.roles[i].id_rol);
            }
            var oficinas=[];
            for(var j in vmd.data.oficinas){

              if(vmd.data.oficinas[j].valor==true) oficinas.push(vmd.data.oficinas[j].id_oficina);
            }

            var usuario={
              usuario:vmd.data.usuario,
              fid_unidad:vmd.data.fid_unidad,
              contrasena:" ",//vmd.data.contrasena, //Se utiliza la contraseña del LDAP
              numero_documento:vmd.data.numero_documento,
              nombres:vmd.data.nombres,
              apellidos:vmd.data.apellidos,
              cargo:vmd.data.cargo,
              email:vmd.data.email,
              estado:vmd.data.estado,
              roles:roles,
              oficinas:oficinas,
              virtuales: vmd.data.virtuales
            }

            if(flagEditar){
              usuario.id_usuario=vmd.data.id_usuario;
              usuario._usuario_modificacion=cuenta.id;
              usuario._fecha_modificacion=new Date();
            }
            else{
              usuario._usuario_creacion=cuenta.id;
              usuario._fecha_creacion= new Date();
            }

            if(flagEditar){
              DataService.put(restUrl+"seguridad/usuario/"+usuario.id_usuario, usuario)
              .then(function(respuesta){
                Message.success();
                if(respuesta!=undefined ){
                  $mdDialog.hide();

                  $timeout(function(){
                    angular.element('#btn-refresh-crudtable').click();
                  },500)
                }

              });
            }
            else{
              DataService.post(restUrl+"seguridad/usuario", usuario)
              .then(function(respuesta){
                Message.success();
                if(respuesta!=undefined){
                  $mdDialog.hide();
                  $timeout(function(){
                    angular.element('#btn-refresh-crudtable').click();
                  },500)
                }

              });
            }

          }

        } // Fin DialogUsuarioController.



    }
})();
