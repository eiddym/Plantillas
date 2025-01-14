(function() {
  'use strict';

  angular
    .module('app')
    .controller('MenuController', MenuController);

    /** @ngInject */
    function MenuController(Storage, restUrl) {

        var vm=this;

        vm.url = restUrl + 'seguridad/menu/';
        vm.fields = [
            'id_menu', 
            'fid_menu_padre',
            'nombre', 
            'descripcion', 
            'orden', 
            'ruta', 
            'icono', 
            'estado',
            '_fecha_creacion',
            '_fecha_modificacion'
        ];
        
        vm.titulo = "Menús";

        var cuenta=Storage.getUser();
        vm.usuario = cuenta.id;
        
    }
})();
