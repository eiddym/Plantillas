(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcDatosGeneralesController', DatosGeneralesController);

  /** @ngInject */
  function DatosGeneralesController($scope, DataService, restUrl, $timeout, Storage, Datetime, ArrayUtil) {
    var vm = this;
    var sc = $scope;
    sc.vm = vm;
    var cuenta = Storage.getUser();

    vm.buscar_para = "";
    vm.buscar_via = "";
    vm.buscar_de = "";
    vm.show_para = false;
    vm.show_via = false;
    vm.show_de = false;

    //cargamos funciones
    vm.openSelect = openSelect;
    vm.moverUsuario = moverUsuario;

    $timeout(iniciarController);

    function iniciarController() {
        var xu, u, i, j, arr, xde, xpara, xvia, rol, fd, push_gral, push_jefe;
        var form_nuevo = angular.isUndefined(sc.model[sc.options.key]);

        xu = {
            id_usuario: cuenta.id,
            nombres: cuenta.first_name,
            apellidos: cuenta.last_name,
            cargo: cuenta.cargo
        };

        // cambiamos evento de los inputs
        angular.element('input.header-searchbox').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        if(form_nuevo){
            sc.model[sc.options.key] = {};
            sc.model[sc.options.key]["de"] = [xu];
        }else {
            // delete sc.model[sc.options.key]["para"].$$mdSelectId;
            xpara = sc.model[sc.options.key]["para"] || {id_usuario:-1};
            xde = sc.model[sc.options.key]["de"] || {id_usuario:-1};
            xvia = sc.model[sc.options.key]["via"] || {id_usuario:-1};
            vm.usuarios_check = {};
            fd = Storage.getSession('flujo_doc');

            if(angular.isDefined(fd) && fd!=null){
                if(fd.via!=null){
                    for (i = 0; i < fd.via.length; i++) {
                        if(fd.via[i]!==fd.via_actual)
                        vm.usuarios_check[fd.via[i]] = true;
                    }
                }
                if(sc.model['cite-0'] && sc.model['cite-0']['cite'])
                    vm.usuarios_check[fd.para[0]] = true;
            }
        }

        DataService.get(restUrl + 'seguridad/usuario_rol/')
        .then(function (resultado) {
            vm.usuarios = [];
            vm.usuarios_jefes = [];
            arr = resultado.datos;
            if(form_nuevo){
                for (i = 0; i < arr.length; i++) {
                    u = newUser(arr[i]);
                    push_jefe = false;
                    for (j = 0; j < arr[i].usuario_rol.length; j++) {
                        rol = arr[i].usuario_rol[j].rol.nombre;
                        if(rol==="JEFE" ||rol =="CORRESPONDENCIA")
                            push_jefe=true;
                    }
                    vm.usuarios.push( (xu.id_usuario==u.id_usuario)? xu : u );
                    if(push_jefe && xu.id_usuario!=u.id_usuario) vm.usuarios_jefes.push(u);
                }
            }else {
                for (i = 0; i < arr.length; i++) {
                    push_gral = false;
                    push_jefe = false;
                    u = newUser(arr[i]);
                    if( u.id_usuario==xpara.id_usuario ){
                        vm.usuarios_jefes.push(xpara);
                        if(!push_gral) vm.usuarios.push(u);
                        push_gral = true;
                        push_jefe = true;
                    }
                    if(xvia && ArrayUtil.buscarObj(xvia, 'id_usuario', u.id_usuario)) {
                        vm.usuarios_jefes.push(ArrayUtil.buscarObj(xvia, 'id_usuario', u.id_usuario, true));
                        if(!push_gral) vm.usuarios.push(u);
                        push_gral = true;
                        push_jefe = true;
                    }
                    if(ArrayUtil.buscarObj(xde, 'id_usuario', u.id_usuario)) {
                        vm.usuarios.push(ArrayUtil.buscarObj(xde, 'id_usuario', u.id_usuario, true));
                        push_gral = true;
                    }

                    {
                        if(!push_gral) vm.usuarios.push(u);

                        push_gral = false; // usamos para ver si en sus roles es jefe o CORRESPONDENCIA
                        if(!push_jefe)
                            for (j = 0; j < arr[i].usuario_rol.length; j++) {
                                rol = arr[i].usuario_rol[j].rol.nombre;
                                if(rol==="JEFE" ||rol =="CORRESPONDENCIA")
                                    push_gral = true;
                            }

                        if(push_gral && xu.id_usuario!=u.id_usuario &&  !push_jefe) vm.usuarios_jefes.push(u);
                    }
                }
            }
        });
    }

    function newUser(el) {
        return {
            id_usuario: el.id_usuario,
            nombres: el.nombres,
            apellidos: el.apellidos,
            cargo: el.cargo
        };
    }

    function moverUsuario(index, dir) {
        var arr = sc.model[sc.options.key]["via"];
        if(dir=="down") ArrayUtil.mover(arr, index, index+1);
        else if(dir=="up") ArrayUtil.mover(arr, index, index-1);
    }


    function openSelect(ev, show) {
        angular.element(ev.currentTarget).parent().next().children()[1].click();
        switch (show) {
            case 'para': vm.show_para = true; break;
            case 'via': vm.show_via = true; break;
            case 'de': vm.show_de = true; break;
        }
    }

  }
})();
