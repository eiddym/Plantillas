(function() {
  'use strict';

  angular
  .module('app')
  .component('actionTable', {
    templateUrl: 'app/components/actionTable/actionTable.html',
    controller: ['$scope', actionTableController],
    controllerAs: 'vm',
    bindings: {
      fields: '=',
      buttons: '=',
      items: '='
    }
  });

  function actionTableController($scope) {
    var vm = this;
    vm.sc = $scope
    vm.buttonEvent = buttonEvent;

    function buttonEvent(event, item, callback, index) {
      callback(event, item, index);
    }
    
  }
})();