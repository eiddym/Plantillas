(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcCiteController', CiteController);

  /** @ngInject */
  function CiteController($scope, Datetime) {
    var vm = this;
    var sc = $scope;
    sc.vm = vm;

    if(sc.model[sc.options.key] && sc.model[sc.options.key]['fecha'])
        sc.model[sc.options.key]["fecha"] = Datetime.format(sc.model[sc.options.key]["fecha"], 'dd de MMM de YYYY');

  }
})();
