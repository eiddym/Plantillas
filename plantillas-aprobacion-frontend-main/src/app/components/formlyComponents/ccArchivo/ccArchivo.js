(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcConCopiaArchivoController', ConCopiaArchivoController);

  /** @ngInject */
  function ConCopiaArchivoController($scope, $timeout, Storage) {
    var vm = this;
    var sc = $scope;
    sc.vm = vm;
    var cuenta = Storage.getUser();

    $timeout(iniciarController);

    function iniciarController() {
        if(angular.isUndefined(sc.model[sc.options.key])){
            sc.model[sc.options.key] = generarAbreviacion(cuenta.first_name + " " + cuenta.last_name);
            sc.model[sc.options.key] += '\nCc.:archivo';    
        }
    }
        
    function generarAbreviacion(cadena) {        
        cadena = cadena.replace(/[^a-zA-Z ]/g, "");
        var str = cadena.toUpperCase();
        var res = str.split(" ");
        var abreviacion = "";
        for (var i = 0; i < res.length; i++) {            
            abreviacion = abreviacion + res[i][0];            
        }
        return abreviacion;
    }
  }
})();
