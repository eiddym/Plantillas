(function() {
    'use strict'

    angular
    .module('app')
    .component('visorImagenes', {
        templateUrl : 'app/components/visorImagenes/visorImagenes.html',
        controller : ['$scope', 'restUrl', 'DataService', 'Storage', 'FileUploader','Modal', VisorImagenesController],
        controllerAs: 'vm',
        bindings: {
            titulo: '=', 
            imagenes: '=', // Lista de archivos subidos
            ancho: '=',
            alto: '=',            
            eliminar: '=',
            imagenesEliminar: '='            
        }
    });

    function VisorImagenesController($scope, restUrl, DataService, Storage, FileUploader,Modal) {

        var vm = this;
        vm.restUrl = restUrl;
   
        // Funcion que elimina una imagen   
        vm.eliminarImagen = function(pArchivo){
          // Despliega el modal de confirmacion para eliminar un elemento.
          Modal.confirm('Se eliminará la foto, ¿Está seguro/a?.', function () {
            var indice=vm.imagenes.indexOf(pArchivo);

            // Si el elemento existe dentro del vector.
            if (indice > -1) {
              // Elimina el elemento, basado en su indice.
              vm.imagenes.splice(indice, 1);
              // Agrega el item eliminado a un vector.
              vm.imagenesEliminar.push(pArchivo);
            }

          });

        }
        
        vm.mostrarImagen = function (ruta) {
            var config = {                
                data: ruta,
                templateUrl: 'app/components/visorImagenes/visorImagenes.dialog.html',
                controller: ['data', '$scope', '$mdDialog', DialogImagenController]
            };
            Modal.show(config);           
        }
               
        function DialogImagenController(data, $scope, $mdDialog) {
            var vmd = $scope;
            vmd.cerrar = cerrar;

            vmd.data = data ? data : {};

            // Funcion que cierra el modal.
            function cerrar() {
                $mdDialog.hide();
            }
        }


    } //Fin del controller


  })();
