(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcVacioController', CiteController);

  /** @ngInject */
  function CiteController($scope) {
        var vm = this;
        var sc = $scope;
        sc.vm = vm;
        sc.$watch('to.height', function (newValue) {
            if( newValue<0 ) sc.to.style.height = '0cm';
            else if( newValue>30 ) sc.to.style.height = '30cm';
            else if(sc.to.style) sc.to.style.height = sc.to.height+'cm';
        });
  }
})();
