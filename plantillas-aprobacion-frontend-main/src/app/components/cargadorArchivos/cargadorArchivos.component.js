(function() {
    'use strict'

    angular
    .module('app')
    .component('cargadorArchivos', {
        templateUrl : 'app/components/cargadorArchivos/cargadorArchivos.html',
        controller : ['$scope', 'restUrl', 'DataService', 'Storage', 'FileUploader','Modal', CargadorArchivosController],
        controllerAs: 'vm',
        bindings: {
            archivos: '=', // Lista de archivos subidos
            permitidos: '=',
            anchoMiniatura: '=',
            altoMiniatura: '=',
            soloImagenes: '=',
            maxArchivosPermitidos: '=',
            mostrar:'='
        }
    });

    function CargadorArchivosController($scope, restUrl, DataService, Storage, FileUploader,Modal) {

        var vm = this;
        vm.uploader = new FileUploader({url: ""});
        vm.restUrl=restUrl;
        vm.fotosEliminar=[];

        if(vm.archivos==null){
            vm.archivos = vm.uploader.queue;
        }else {
            vm.uploader.queue = vm.archivos;
        }
        vm.formatos = vm.permitidos.replace(/(\||,)/g, " ").toUpperCase();
        var uploader = vm.uploader;
        uploader.filters.push({
                name: 'fileFilter',
                fn: function (item) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return vm.permitidos.indexOf(type) !== -1;
                }
            });

        //funcion para unir el drop y select
        vm.clickUp = function () {
            angular.element('#input_seleccionar').trigger('click'); //angular way

        };

        vm.esImagen =  function(file) {
                var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }

        // Funcion que elimina un "archivo".
        vm.eliminar = function(pArchivo){
          // Despliega el modal de confirmacion para eliminar un elemento.
          Modal.confirm('Se eliminará la foto, ¿Está seguro?.', function () {
            var indice=vm.mostrar.indexOf(pArchivo);

            // Si el elemento existe dentro del vector.
            if (indice > -1) {
              // Elimina el elemento, basado en su indice.
              vm.mostrar.splice(indice, 1);
              // Agrega el item eliminado a un vector.
              vm.fotosEliminar.push(pArchivo);
            }

          });

        }



    } //Fin del controller


  })();
