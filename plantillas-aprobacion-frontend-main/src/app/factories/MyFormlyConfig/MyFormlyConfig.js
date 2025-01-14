(function() {
    'use strict'

    angular
    .module('app')
    .factory('MyFormlyConfig', FormlyConfigFactory);

    /** @ngInject */
    function FormlyConfigFactory() {

        var factory = {
            init: init
        };

        return factory;


        /**
          Funcion que inicia los elementos formly extras que se usaran en la aplicacion
          @param {formlyConfig} ProveedorServicio Objeto el cual angular-formly provee para poder configurar nuevos elementos y wrappers
        */
        function init(formlyConfig){
            formlyConfig.setType({
                name: 'texto',
                templateUrl: 'app/components/formlyComponents/texto/texto.html'
            });
            formlyConfig.setType({
              name: 'lista',
              templateUrl: 'app/components/formlyComponents/listas/listas.html'
            });
            formlyConfig.setType({
                name: 'vacio',
                templateUrl: 'app/components/formlyComponents/vacio/vacio.html',
                controller: 'fcVacioController'
            });
            formlyConfig.setType({
                name: 'cite',
                templateUrl: 'app/components/formlyComponents/cite/cite.html',
                controller: 'fcCiteController'
            });
            formlyConfig.setType({
                name: 'inputt',
                templateUrl: 'app/components/formlyComponents/inputt/inputt.html'
            });
            formlyConfig.setType({
                name: 'editorTexto',
                templateUrl: 'app/components/formlyComponents/editorTexto/editorTexto.html'
            });
            formlyConfig.setType({
              name: 'datosGenerales',
              templateUrl: 'app/components/formlyComponents/datosGenerales/datosGenerales.html',
              controller: 'fcDatosGeneralesController'
            });
            formlyConfig.setType({
              name: 'encabezado',
              templateUrl: 'app/components/formlyComponents/encabezado/encabezado.html',
              controller: 'fcEncabezadoController'
            });
            formlyConfig.setType({
              name: 'documentosRelacionados',
              templateUrl: 'app/components/formlyComponents/documentosRelacionados/documentosRelacionados.html',
              controller: 'fcDocumentosRelacionadosController'
            });
            formlyConfig.setType({
              name: 'documentosAnular',
              templateUrl: 'app/components/formlyComponents/documentosAnular/documentosAnular.html',
              controller: 'fcDocumentosAnularController'
            });
            formlyConfig.setType({
              name: 'ccArchivo',
              templateUrl: 'app/components/formlyComponents/ccArchivo/ccArchivo.html',
              controller: 'fcConCopiaArchivoController'
            });
            formlyConfig.setType({
              name: 'archivo',
              templateUrl: 'app/components/formlyComponents/archivo/archivo.html',
              controller: 'fcArchivoController'
            });
            formlyConfig.setType({
              name: 'pdfsAprobacionCD',
              templateUrl: 'app/components/formlyComponents/aprobacionCD/pdfsAprobacionCD.html',
              controller: 'fcPdfsAprobacionCDController'
            });
            formlyConfig.setType({
              name: 'cajachica',
              templateUrl: 'app/components/formlyComponents/cajachica/cajachica.html',
              controller: 'fcCajaChicaController'
            });
            formlyConfig.setType({
              name: 'certificacionComprometido',
              templateUrl: 'app/components/formlyComponents/certificacionComprometido/certificacionComprometido.html'
            });
            formlyConfig.setType({
              name: 'listaContactos',
              templateUrl: 'app/components/formlyComponents/listaContactos/listaContactos.html',
              controller: 'fcListaContactosController'
            });
            formlyConfig.setType({
              name: 'consultaAlmacen',
              templateUrl: 'app/components/formlyComponents/almacen/consultaAlmacen/consultaAlmacen.html',
              controller: 'fcConsultaAlmacenController'
            });
            formlyConfig.setType({
              name: 'recuperarEntregaAlmacen',
              templateUrl: 'app/components/formlyComponents/almacen/recuperarEntregaAlmacen/recuperarEntregaAlmacen.html',
              controller: 'fcRecuperarEntregaAlmacenController'
            });
            formlyConfig.setType({
              name: 'ingresoAlmacen',
              templateUrl: 'app/components/formlyComponents/almacen/ingreso/ingreso.html',
              controller: 'fcIngresoAlmacenController'
            });
            formlyConfig.setType({
              name: 'consultaActivo',
              templateUrl: 'app/components/formlyComponents/activo/consultaActivo/consultaActivo.html',
              controller: 'fcConsultaActivoController'
            });
            formlyConfig.setType({
              name: 'asignacionActivo',
              templateUrl: 'app/components/formlyComponents/activo/asignacionActivo/asignacionActivo.html',
              controller: 'fcAsignacionActivoController'
            });
            formlyConfig.setType({
              name: 'devolucionActivo',
              templateUrl: 'app/components/formlyComponents/activo/devolucionActivo/devolucionActivo.html',
              controller: 'fcDevolucionActivoController'
            });
            formlyConfig.setType({
              name: 'tablaActivos',
              templateUrl: 'app/components/formlyComponents/activo/tablaActivos/tablaActivos.html',
              controller: 'fcTablaActivosController'
            });
            formlyConfig.setType({
              name: 'ingresoActivos',
              templateUrl: 'app/components/formlyComponents/activo/ingresoActivos/ingresoActivos.html',
              controller: 'fcIngresoActivosController'
            });
            formlyConfig.setType({
              name: 'bajaActivos',
              templateUrl: 'app/components/formlyComponents/activo/bajaActivos/bajaActivos.html',
              controller: 'fcBajaActivosController'
            });
        }
    }
})();
