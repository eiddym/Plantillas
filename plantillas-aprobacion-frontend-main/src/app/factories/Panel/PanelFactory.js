(function() {
    'use strict';

    angular
    .module('app')
    .factory('Panel', ['$mdPanel', '$document',PanelFactory]);

    /** @ngInject */
    function PanelFactory($mdPanel, $document) {

        var factory = {
            show : show
        };

        return factory;

        function show(config) {

            var position = null;
            // delete config.event;
            if(config.event){
                position = $mdPanel.newPanelPosition()
                .relativeTo(config.event.currentTarget)
                .addPanelPosition($mdPanel.xPosition.ALIGN_END, $mdPanel.yPosition.BELOW);
            }else {
                position = $mdPanel.newPanelPosition().absolute().center();
            }

            var default_template = 'app/factories/Panel/defaultPanelTemplate.html';

            var settings = {
                    attachTo: angular.element($document[0].body),
                    controller: config.controller || ['$scope', '$log', PanelController],
                    templateUrl: config.templateUrl || default_template,
                    panelClass: 'md-panel',
                    position: position,
                    locals: {
                        data: config.data || ''
                    },
                    openFrom: config.event,
                    clickOutsideToClose: angular.isUndefined(config.clickOutsideToClose) ? true : config.clickOutsideToClose,
                    escapeToClose: angular.isUndefined(config.clickOutsideToClose) ? true : config.clickOutsideToClose,
                    focusOnOpen: true
                    // zIndex: 2
                };

            if (config.event) {
                settings.targetEvent = config.event;
            }

            $mdPanel.open(settings);

        }

        function PanelController($scope, $log) {
            $log.info("hola desde controller default, introduzca su controller");
        }
    }
})();
