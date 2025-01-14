  (function (){
    'use strict';
    angular
    .module('app')
    .controller('fcCalendarioController', calendario);

    /** @ngInject */
    function calendario($scope, $log) {
      var vm = this;
      var sc = $scope;
      $log.log('Iniciando el controlador del componente calendario', sc);
      sc.vm = vm;
      vm.minDate= '';
      vm.maxDate= '';
      
      
      sc.actualizarLimites = function(diasAntes, diasDespues) {        
        var fechaActualMin = new Date();
        var fechaActualMax = new Date();
        if (diasAntes!= undefined && diasAntes >= 0) {
          sc.to.minDate= new Date(fechaActualMin.setDate(fechaActualMin.getDate()- (diasAntes)));
        }
        if (diasDespues != undefined && diasDespues >= 0) {
          sc.to.maxDate = new Date(fechaActualMax.setDate(fechaActualMax.getDate() + (diasDespues)));
        }
        
      }

      sc.actualizarLimites(sc.to.diasAntes, sc.to.diasDespues);

      sc.filterBookings = function() {
        return function (date, bookedDates) {
          for (var i = 0; i < bookedDates.length; i++) {
            return date.toString() !== bookedDates[i];
          }
        };
      }
    }
  })();