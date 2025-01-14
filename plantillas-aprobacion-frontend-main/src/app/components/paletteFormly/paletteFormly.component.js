(function() {
    'use strict'

    angular
    .module('app')
    .component('paletteFormly', {
        templateUrl : 'app/components/paletteFormly/paletteFormly.html',
        controller : PaletteFormlyController,
        controllerAs: 'vm',
        bindings: {
            menu: '=',
            funcionAgregar: '=',
            options: '=',
            node: '@'
        }
    });

    function PaletteFormlyController(){
        var vm = this;
        //contador de templates
        // var cont_templates = 0;

        //cargamos funcion
        vm.addItem = addItem;

        //variable que contiene la lista de menus con templates cada uno
        vm.elementos = [
            {
                "expanded": true,
                "titulo" : "DOCUMENTOS",
                "submenu": [
                    { name: "Datos generales", tipo: "datosGenerales" },
                    { name: "Encabezado", tipo: "encabezado" },
                    { name: "Asunto" , tipo: "inputt" },
                    // { name: "Cite", tipo: "cite" },
                    { name: "Documentos relacionados", tipo: "documentosRelacionados" },
                    { name: "Documentos a anular", tipo: "documentosAnular" },
                    { name: "Cc.:archivo", tipo: "ccArchivo" },
                    { name: "Caja chica", tipo: "cajachica" },
                    { name: "Certificacion comprometido", tipo: "certificacionComprometido" },
                    { name: "Lista de contactos", tipo: "listaContactos" },
                    { name: "Editor de texto", tipo: "editorTexto" }
                ]
            },
            {
                "expanded": true,
                "titulo": "SERVICIOS WEB",
                "submenu": [
                    { name: "Consulta a almacenes", tipo: "consultaAlmacen" },
                    { name: "Recuperar entrega de almacenes", tipo: "recuperarEntregaAlmacen" },
                    { name: "Ingreso de suministros y/o materiales", tipo: "ingresoAlmacen" },
                    { name: "Tabla de Activos Fijos", tipo: "tablaActivos" },
                    { name: "Ingreso de Activos Fijos", tipo: "ingresoActivos" },
                    { name: "Baja de Activos Fijos", tipo: "bajaActivos" }
                ]
            },
            {
                "expanded": true,
                "titulo" : "TEXTOS",
                "submenu": [
                    { name: "Título", tipo: "titulo" },
                    { name: "Subtítulo", tipo: "subtitulo" },
                    { name: "Párrafo", tipo: "parrafo" },
                    { name: "Lista", tipo: "lista" }
                ]
            },
            {
                "expanded": true,
                "titulo" : "LAYOUTS",
                "submenu": [
                    { name: "Contenedor", tipo: "layout" },
                    { name: "Espacio", tipo: "vacio" }
                ]
            },
            {
                "expanded": true,
                "titulo" : "ELEMENTOS FORMULARIO",
                "submenu": [
                   // { name: "Archivo", tipo: "archivo" },
                    { name: "Campo de texto" , tipo: "input" },
                    { name: "Selección radio", tipo: "radio" },
                    { name: "Selección simple", tipo: "select" },
                    { name: "Selección multiple", tipo: "select_multiple" },
                    { name: "Area de texto", tipo: "textarea" },
                    { name: "Checkbox", tipo: "checkbox" },
                    { name: "Calendario", tipo: "datepicker" },
                    // { name: "Calendario", tipo: "calendario" },
                    { name: "Deslizador", tipo: "slider" },
                    { name: "Interruptor", tipo: "switch" },
                    { name: "Palabras clave", tipo: "chips" },
                    { name: "Aprobación de pdf", tipo: "pdfsAprobacionCD" }

                ]
            }
        ];

        function addItem(tipo){
            if(angular.isDefined(vm.funcionAgregar)){
                vm.funcionAgregar(tipo);
            }
        }

    }
  })();
