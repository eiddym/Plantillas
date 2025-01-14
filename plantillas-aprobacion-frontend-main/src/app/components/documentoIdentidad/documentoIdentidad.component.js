(function() {
    'use strict';

    angular
    .module('app')
    .component('documentoIdentidad', {
        templateUrl: 'app/components/documentoIdentidad/documentoIdentidad.html',
        controller: ['$scope', 'DataService', 'Datetime', 'Message', DocumentoIdentidadController],
        controllerAs: 'vm',
        bindings: {
            ngModel: '=',
            ngDisabled: '=',
            onlyCi: '@',
            url: '='
        }
    });

    /** @ngInject */
    function DocumentoIdentidadController($scope, DataService, Datetime, Message) {
        var vm = this;

        vm.tipos = [
            {
                value: 'CI',
                name: 'Cedula de identidad'
            },
            {
                value: 'PASAPORTE',
                name: 'Pasaporte'
            }
        ];

        vm.tipo_documento = 'CI';
        vm.search = search;
        vm.isDisabled = isDisabled;

        activate();

        function activate() {
            if (vm.ngModel) {
                vm.model = vm.ngModel;
                vm.fecha_nacimiento = new Date(vm.model.persona.fecha_nacimiento);
                vm.complemento = vm.model.persona.complemento;
                vm.nro_documento = vm.model.persona.nro_documento;
                vm.tipo_documento = vm.model.persona.tipo_documento;
            } else {
                vm.model = {};
            }
        }

        function isDisabled() {
            return typeof vm.nro_documento == 'undefined' || !Datetime.isDate(vm.fecha_nacimiento);
        }

        function search() {
            Message.loading("Buscando datos en el SEGIP");
            DataService.get(vm.url + vm.nro_documento + '?fecha_nacimiento=' + Datetime.format(vm.fecha_nacimiento, 'dd/MM/YYYY'))
            .then(function(response) {
                if (response) {
                    vm.model.persona = response;
                    vm.ngModel = vm.model;
                } else {
                    vm.model.persona = {};
                    vm.ngModel = vm.model;
                }
            });
        }

        $scope.$watch('vm.tipo_documento', function (newValue) {
            vm.model.tipo_documento = newValue;
            vm.ngModel = vm.model;
        });
        $scope.$watch('vm.nro_documento', function (newValue) {
            vm.model.nro_documento = newValue;
            vm.ngModel = vm.model;
        });
        $scope.$watch('vm.complemento', function (newValue) {
            vm.model.complemento = newValue;
            vm.ngModel = vm.model;
        });
        $scope.$watch('vm.fecha_nacimiento', function (newValue) {
            vm.model.fecha_nacimiento = newValue;
            vm.ngModel = vm.model;
        });

    }

})();
