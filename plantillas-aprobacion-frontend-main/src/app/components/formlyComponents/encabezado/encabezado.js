(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcEncabezadoController', EncabezadoController);

  /** @ngInject */
  function EncabezadoController($scope, DataService, restUrl, $timeout, Storage, Datetime, ArrayUtil) {
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
        var xu, u, i, arr, xde, xpara, xvia, fd;
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

            if(fd!=null){
                if(angular.isDefined(fd.via)){
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
                    vm.usuarios.push( (xu.id_usuario==u.id_usuario)? xu : u );
                    vm.usuarios_jefes.push(u);
                }
            }else {
                for (i = 0; i < arr.length; i++) {
                    u = newUser(arr[i]);
                    if(xpara && ArrayUtil.buscarObj(xpara, 'id_usuario', u.id_usuario)){
                        vm.usuarios_jefes.push(ArrayUtil.buscarObj(xpara, 'id_usuario', u.id_usuario, true));
                        vm.usuarios.push(u);
                    }else if(xvia && ArrayUtil.buscarObj(xvia, 'id_usuario', u.id_usuario)) {
                        vm.usuarios_jefes.push(ArrayUtil.buscarObj(xvia, 'id_usuario', u.id_usuario, true));
                        vm.usuarios.push(u);
                    }else if(ArrayUtil.buscarObj(xde, 'id_usuario', u.id_usuario)) {
                        vm.usuarios.push(ArrayUtil.buscarObj(xde, 'id_usuario', u.id_usuario, true));
                    }else {
                        vm.usuarios_jefes.push(u);
                        vm.usuarios.push(u);
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

    function moverUsuario(index, dir, nom) {
        var arr = sc.model[sc.options.key][ nom||'via' ];
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
