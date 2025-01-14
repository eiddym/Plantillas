(function () {
    'use strict';

    angular
        .module('app')
        .controller('fcPdfsAprobacionCDController', archivos);

    /** @ngInject */
    function archivos($scope, $timeout, Documento, Message, maxPdfSizeAprobacion) {
        var vm = this;
        var sc = $scope;
        sc.vm = vm;
        vm.alert = {};
        vm.cargando = false;
        //funciones
        vm.elegirPdf = elegirPdf;
        vm.limpiarPdf = limpiarPdf;
        vm.showPdf = showPdf;
        vm.redondear = redondear;
        vm.onLoadModel = onLoadModel;
        vm.getTotalFilesSize = getTotalFilesSize;
        vm.onLoadStart = onLoadStart;
        vm.loaded = false;
        $timeout(iniciarController);

        function iniciarController() {
            vm.form_nuevo = angular.isUndefined(sc.model[sc.options.key]);
        }

        function showPdf(nombre) { Documento.showPdfx(nombre); }


        function elegirPdf(ev) {
            angular.element(ev.currentTarget).next().click();
        }

        function onLoadModel(ev, afiles) {
            vm.cargando = false;
            var tipoArchivo = false;
            var tamanioArchivo = false;
            var tamanio = maxPdfSizeAprobacion / 1024 / 1024;
            if (!sc.model[sc.options.key]) {
                sc.model[sc.options.key] = []
            }
            afiles.forEach(function (f) {
                if (f.filetype !== 'application/pdf') tipoArchivo = true;
                else if (f.filesize > maxPdfSizeAprobacion) tamanioArchivo = true;
                else {
                    sc.model[sc.options.key].push(f);
                }
            })
            if (tipoArchivo)
              Message.error('No se pudo subir uno o más documentos ya que sólo se pueden adjuntar archivos PDF');
            if (tamanioArchivo)
              Message.error('No se pudo subir uno o más documentos ya que alguno tiene un tamaño mayor a ' + tamanio + ' MB');
        }

        function onLoadStart() {
            vm.cargando = true;
        }

        function limpiarPdf(index) {
            if (index) {
                sc.model[sc.options.key].splice(index, 1);
            } else {
                sc.model[sc.options.key].splice(0, 1);
            }
        }
        function getTotalFilesSize() {
            var total = 0;
            for (var i = 0; i < sc.model[sc.options.key].length; i++) {
                var file = sc.model[sc.options.key][i];
                total += vm.redondear(file.filesize / 1024, 2);
            }
            return total;
        }

        function redondear(x, a) {
            return Math.round(x * Math.pow(10, a)) / Math.pow(10, a);
        }
    }
})();
