(function() {
    'use strict';

    angular
    .module('app')
    .factory('Modal', ['$mdDialog', ModalFactory]);

    /** @ngInject */
    function ModalFactory($mdDialog) {

        var factory = {
            show : show,
            alert : alert,
            confirm : confirm
        };

        return factory;

        function show(config) {
            var settings = {
                controller: config.dialogController || config.controller || ['$scope', '$mdDialog', 'data', 'fields', 'title', 'add', 'column', 'done', DialogController],
                templateUrl: config.templateUrl || '',
                parent: angular.element('body'),
                clickOutsideToClose:typeof config.clickOutsideToClose == 'undefined' ? true : config.clickOutsideToClose,
                escapeToClose:typeof config.escapeToClose == 'undefined' ? true : config.escapeToClose,
                locals: {
                    data: config.data || '',
                    fields: config.fields || '',
                    title: config.title || '',
                    add: config.add || '',
                    column: config.column || 1,
                    done: config.done || function () {}
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

        function DialogController($scope, $mdDialog, data, fields, title, add, column, done) {
            var vm = $scope;

            vm.data = data;
            vm.fields = fields;
            vm.title = title;
            vm.add = add;
            vm.column = column;
            vm.hide = $mdDialog.hide;
            vm.cancel = $mdDialog.cancel;

            vm.answer = function(answer) {
                done(answer, $mdDialog);
            }
        }

        function alert(text, event) {
            var $alert = $mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Alerta')
                .htmlContent(text)
                .ariaLabel('Alerta')
                .ok('Aceptar');

            if (event) {
                $alert.targetEvent(event);
            }
            $mdDialog.show($alert);
        }

        function confirm(text, done, cancel, event) {
            var $confirm = $mdDialog.confirm()
                .title('Confirmar')
                .textContent(text)
                .ariaLabel('Confirmar')
                .ok('Aceptar')
                .cancel('Cancelar');

            if (event) {
                $confirm.targetEvent(event);
            }

            $mdDialog.show($confirm)
            .then(function() {
                if (done) {
                    done();
                }
            }, function() {
                if (cancel) {
                    cancel();
                }
            });
        }

    }
})();
