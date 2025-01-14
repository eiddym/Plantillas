(function() {
    'use strict';

    angular
    .module('app')
    .component('breadcrumb', {
        templateUrl : 'app/components/breadcrumb/breadcrumb.html',
        controller : ['Storage', '$location', 'BreadcrumbFactory', 'Util', BreadcrumbController],
        bindings: {
            // parent: '=',
            // current: '='
        }
    });

    /** @ngInject */
    function BreadcrumbController(Storage, $location, BreadcrumbFactory, Util) {
        var vm = this;

        vm.getParent = getParent;
        vm.getCurrent = getCurrent;

        activate();

        function activate() {
            if (Storage.exist('menu')) {
                var page = Util.getMenuOption(Storage.getSession('menu'), $location.path().replace('/', ''));
                BreadcrumbFactory.setParent(page[0]);
                BreadcrumbFactory.setCurrent(page[1]);
            }
        }

        function getParent() {
            return BreadcrumbFactory.getParent();
        }

        function getCurrent() {
            return BreadcrumbFactory.getCurrent();
        }

    }

})();
