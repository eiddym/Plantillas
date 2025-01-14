(function() {
  'use strict';

  angular
    .module('app')
    .controller('fcArchivoController', archivos);

  /** @ngInject */
  function archivos($scope, $timeout, Documento) {
    var vm = this;
    var sc = $scope;
    sc.vm = vm;

    //funciones
    vm.elegirPdf = elegirPdf;
    vm.limpiarPdf = limpiarPdf;
    vm.showPdf = showPdf;
    vm.redondear = redondear;
    vm.onLoadModel = onLoadModel;

    $timeout(iniciarController);

    function iniciarController() {
        vm.form_nuevo = angular.isUndefined(sc.model[sc.options.key]);
        if(!vm.form_nuevo){
            if(!sc.to.multiple){
                sc.model[sc.options.key] = sc.model[sc.options.key][0];
            }
        }
    }

    function showPdf(nombre) { Documento.showPdfx(nombre); }
    

    function elegirPdf(ev) {
        angular.element(ev.currentTarget).next().click();
    }

    function onLoadModel(ev, afiles) {
        afiles.forEach(function (f, i, arr) {
            if(f.filetype!="application/pdf"){
                arr.splice(i, 1);
                if(sc.to.multiple){
                    sc.model[sc.options.key].splice(i,1);
                }else {
                    delete sc.model[sc.options.key];
                }
            }
        })
    }

    function limpiarPdf(index) {
        if(!sc.to.multiple){
            delete sc.model[sc.options.key]
        }else {
            if (index) {
                sc.model[sc.options.key].splice(index, 1);
            }else {
                sc.model[sc.options.key].splice(0, 1);
            }
        }
    }

    function redondear(x, a) {
        return Math.round(x*Math.pow(10,a))/Math.pow(10,a);
    }

  }
})();
