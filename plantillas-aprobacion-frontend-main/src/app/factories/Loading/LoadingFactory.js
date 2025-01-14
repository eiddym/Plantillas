(function() {
    'use strict';

    angular
    .module('app')
    .factory('Loading', ['$mdDialog', LoadingFactory]);

    /** @ngInject */
    function LoadingFactory($mdDialog) {

        var factory = {
            show : show,
            cerrar : cerrar,
            cambiar: cambiar
        };
        var tiposDic = {
            warning: 'loader-warning',
            error: 'loader-error',
            success: 'loader-success',
            info: 'loader-info'
        };
        var dataLocal = {
            mensaje: 'Cargando...',
            tipo: tiposDic.warning
        };

        return factory;

        function show(config) {
            if(config.data) dataLocal= config.data;
            var settings = {
                controller: config.dialogController || config.controller || ['$scope', '$mdDialog', 'data', 'fields', 'title', 'add', 'column', DialogController],
                templateUrl: config.templateUrl || 'app/factories/Loading/Loading.html' ||'',
                parent: angular.element('body'),
                // clickOutsideToClose:typeof config.clickOutsideToClose == 'undefined' ? true : config.clickOutsideToClose,
                escapeToClose: false,
                locals: {
                    // data: config.data || dataLocal ||'',
                    data:  dataLocal,
                    fields: config.fields || '',
                    title: config.title || '',
                    add: config.add || '',
                    column: config.column || 1
                    // done: config.done || function () {}
                }
            };
            if (config.event) {
                settings.targetEvent = config.event;
            }
            $mdDialog.show(settings)
            .then(function () {}, function() {
                if (config.close) {
                    
                    config.close();
                }
            });
        }
        function cerrar() {
          $mdDialog.hide();
        }

        function cambiar(datos) {
            if(datos.mensaje) dataLocal.mensaje = datos.mensaje;
            if (datos.tipo) dataLocal.tipo = tiposDic[datos.tipo];
        }

        function DialogController($scope, $mdDialog, data, fields, title, add, column) {
            var vm = $scope;
            vm.data = data;
            vm.fields = fields;
            vm.title = title;
            vm.add = add;
            vm.column = column;
            vm.hide = $mdDialog.hide;
            

            
        }

        
    }
})();
