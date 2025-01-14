(function() {
    'use strict'

    angular
    .module('app')
    .component('menuCard', {
        templateUrl : 'app/components/menuCard/menuCard.html',
        controller : [MenuCardController],
        controllerAs: 'vm',
        bindings: {
            items: '=',
            titleTable: '=',
            node: '@'
        }
    });

    function MenuCardController(){
    }
  })();
