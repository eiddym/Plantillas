(function() {
    'use strict'

    angular
    .module('app')
    .factory('Message', ['$mdToast', MessageFactory]);

    /** @ngInject */
    function MessageFactory($mdToast) {

        var factory = {
            success : success,
            warning : warning,
            error : error,
            show: show
        };

        return factory;

        function show(type, msg, title, timeout) {
            var typeIcon = {
              'EXITO': 'check',
              'ERROR': 'error',
              'ADVERTENCIA': 'warning',
              'INFORMACION': 'info'
            }

            var messageDefault = {
              'EXITO': 'La operación se realizó correctamente.',
              'ERROR': 'Ocurrió un error al procesar su operación.',
              'ADVERTENCIA': 'Ocurrió algo inesperado al procesar su operación.',
              'INFORMACION': 'La operacion se realizó correctamente, pero hay alguna infromación que no se muestra'
            }

            var titleDefault = {
              'EXITO': 'Correcto',
              'ERROR': 'Error',
              'ADVERTENCIA': 'Advertencia',
              'INFORMACION': 'Información'
            }

            var typeClass = {
              'EXITO': 'success',
              'ERROR': 'danger',
              'ADVERTENCIA': 'warning',
              'INFORMACION': 'info'
            }

            var data = {
                icon : typeIcon[type],
                message : msg || messageDefault[type],
                title : title || titleDefault[type],
                type : typeClass[type],
                timeout: timeout
            };

            render(data);
        }


        function success(msg, title, timeout) {
            var data = {
                icon : 'check',
                message : msg || 'La operación se realizó correctamente.',
                title : title || 'Correcto',
                type : 'success',
                timeout: timeout
            };

            render(data);
        }

        function error(msg, title, timeout) {
            var data = {
                icon : 'error',
                message : msg || 'Ocurrió un error al procesar su operación.',
                title : title || 'Error',
                type : 'danger',
                timeout: timeout
            };

            render(data);
        }

        function warning(msg, title, timeout) {
            var data = {
                icon : 'warning',
                message : msg || 'Ocurrió algo inesperado al procesar su operación.',
                title : title || 'Advertencia',
                type : 'warning',
                timeout: timeout
            };

            render(data);
        }

        function render(data) {
            $mdToast.show({
                controller: ToastController,
                templateUrl: 'app/factories/Messages/layout.toast.html',
                parent : angular.element('#toast-container-main'),
                hideDelay: typeof data.timeout != 'undefined' ? (data.timeout == 0 ? 31536000000 : data.timeout) : 5000,
                position: 'top right',
                locals: data
            });
        }

        function ToastController($scope, $mdToast, icon, message, title, type) {
            var vm = $scope;

            vm.icon = icon;
            vm.message = message;
            vm.title = title;
            vm.type = type;

            vm.close = function() {
                $mdToast.hide()
            };
        }
    }
})();
