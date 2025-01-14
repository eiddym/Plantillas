/* eslint-disable no-unused-vars */
(function() {
'use strict'

angular
.module('app')
.factory('Documento', DocumentoFactory);

/** @ngInject */
function DocumentoFactory(DataService, restUrl, backUrl, Datetime, UtilFormly, Modal, $window, $location, Storage, $log) {

    var factory = {
        showPdfId: showPdfId,
        showPdf: showPdf,
        showPdfx: showPdfx,
        showProgress: showProgress,
        showProgressAll: showProgressAll,
        generarAbreviacion: generarAbreviacion,
        isMobile: isMobile
    }

    var detalleAdjuntos;

    return factory;

    function generarAbreviacion(cadena) {
        cadena = cadena.replace(/[^a-zA-Z ]/g, "");
        var str = cadena.toUpperCase();
        var res = str.split(" ");
        var abreviacion = "";
        for (var i = 0; i < res.length; i++) {
            if(res[i] !== "DE" && res[i] !== "PARA" && res[i] !== "Y" && res[i] !== "LA") {
                if (angular.isDefined(res[i][0])) {
                    abreviacion = abreviacion + res[i][0];
                }
            }
        }
        return abreviacion;
    }


    function showPdfx(nombre) {
        var datosEnviar = { nombre:nombre, html:'<p>Este es un documento externo, no puede transformarse en texto.</p>' };
        var new_url =  $location.absUrl();
        datosEnviar.esDocumentoExterno = true;
        new_url = new_url.substring(0, new_url.indexOf('#/')+2);
        Storage.setSession('datos_enviar', datosEnviar);
        $window.open(new_url+'vista_pdf');
    }


    /**
      Funcion que descarga un documento y lo muestra en pdf
      @param {Integer} id_documento Id de documento
    */
    function showPdfId(id_documento, sw_url) {
        DataService.get(restUrl + 'plantillasFormly/documento/'+id_documento)
        .then(function (respuesta) {
            showPdf(respuesta.datos.plantilla, respuesta.datos.plantilla_valor, respuesta.datos.nombre, sw_url, id_documento);
        });
    }


    /**
      Funcion que muestra pdf de documento
      @param {String} plantilla Cadena de json que contiene la estructura de un documento
      @param {String} plantilla_valor Valores de los campos del documento
      @param {String} nombre Nombre del documento
    */
    function showPdf(plantilla, plantilla_valor, nombre, sw_url,id_documento) {
        var abrirDialogPDF = (angular.isUndefined(sw_url))? true : sw_url;
        var datosEnviar = {doc:{}};
        datosEnviar.model_actual = angular.fromJson(plantilla_valor);
        var model = datosEnviar.model_actual;
        if( model["cite-0"] && model["cite-0"]["fecha"] )
            model["cite-0"]["fecha"] = Datetime.format(model["cite-0"]["fecha"], 'dd de MMM de YYYY');
        datosEnviar.form_actual = UtilFormly.dataToView(angular.fromJson(plantilla), model);
        datosEnviar.doc.nombre = nombre;
        datosEnviar.doc.plantilla = plantilla;
        DataService.post(restUrl+ "plantillasFormly/generarDocumento/",datosEnviar)
        .then(function(respuesta){
            datosEnviar = { html: respuesta.datos.html, nombre: respuesta.datos.nombre};
            datosEnviar.esDispositivoMovil = factory.isMobile();
            if(abrirDialogPDF){
                //abrimos dialogPDF
                DataService.pdf(restUrl+'plantillasFormly/documentoPDF/',{cite: datosEnviar.nombre})
                .then(function (respuestaPdf) {
                  if(!respuestaPdf) return;
                    datosEnviar.pdf = respuestaPdf.url;
                    datosEnviar.pdf_buffer = respuestaPdf.data;
                    if(id_documento !== null && id_documento) {
                      $log.log("Obteniendo firmas");
                      return DataService.get(restUrl +'documento/firmado/'+id_documento);
                    }

                })
                .then(function (firmas) {
                  if(firmas) datosEnviar.firmas = firmas.datos || [];
                  var config = {
                    data: datosEnviar,
                    templateUrl: 'app/factories/Documento/dialogPDF.html',
                    controller: ['data', '$scope', '$mdDialog', 'Util', DialogPDFController]
                  };
                  Modal.show(config);
                });
            }else {
                var new_url =  $location.absUrl();
                new_url = new_url.substring(0, new_url.indexOf('#/')+2);
                Storage.setSession('datos_enviar', datosEnviar);
                $window.open(new_url+'vista_pdf');
            }
        });
    }

    function isMobile() { return angular.isDefined($window.orientation)
        || navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    }

    /**
      Funcion que muestra pdf de documento
      @param {Objeto} data Objeto que tiene valores que llegan de la configuracion
      @param {Objeto} scope Scope del controlador
      @param {Objeto} mdDialog mdDialog usado para cerrar el modal
    */
    function DialogPDFController(data, $scope, $mdDialog, Util){
    //   $log.log("CHECK DATA ", data);
        var vmd = $scope;
        vmd.data={};
        vmd.data.html=data.html;
        vmd.data.pdf=data.pdf;
        vmd.data.flag_html=true;
        vmd.data.firmas=data.firmas || [];
        vmd.data.show_pdf=!data.esDispositivoMovil;
        if (data.esDispositivoMovil) {
            Util.loadCanvas(data.pdf_buffer, '#canvasContainer');
        }

        //funciones
        vmd.mostrarPdf = function (id, sw){ if(sw) showPdfx(id); else showPdfId(id, false); }
        vmd.cerrar = function (){ $mdDialog.cancel(); }
        vmd.verHtml = function(){ vmd.data.flag_html=true; }
        vmd.verPdf = function(){ vmd.data.flag_html=false; }

    }


    /**
      Funcion que muestra el historial del flujo del documento
      @param {Evento} ev Evento que se activa al hacer click
      @param {Integer} id_doc Id del documento
    */
    function showProgress(ev, id_doc){
        DataService.get(restUrl + 'historialFlujo/'+id_doc)
        .then(function (respuesta) {
            if(respuesta){
                setAttrs(respuesta.datos);
                var config = {
                    event: ev,
                    data: { id: id_doc, datos: respuesta.datos },
                    templateUrl: 'app/factories/Documento/dialog.progreso.html',
                    controller: ['$scope','$mdDialog', 'data', DialogProgreso]
                };
                Modal.show(config);
            }
        });


    }
    function setAttrs(arr, total) {
        arr.forEach(function (it) {
            it.fecha_mos = Datetime.dateLiteral(it._fecha_creacion);
            it.hora_mos = Datetime.time(it._fecha_creacion);
            switch (it.accion) {
                case 'ENVIADO':
                it.acc = 'Envió';
                it.icon = 'send';
                it.bg_color = 'envio';
                break;
                case 'APROBADO':
                it.acc = 'Aprobó';
                it.icon = 'done_all';
                it.bg_color = 'success';
                break;
                case 'RECHAZADO':
                it.acc = 'Observó';
                it.icon = 'error';
                it.bg_color = 'danger';
                it.observacion = it.observacion.substring(it.observacion.indexOf('Observaciones:'), it.observacion.length);
                break;
                case 'DERIVADO':
                it.acc = 'Derivó';
                it.icon = 'trending_down';
                it.bg_color = 'envio';
                break;
                case 'CERRADO':
                it.acc = 'Cerró';
                it.icon = 'assignment_turned_in';
                it.bg_color = 'warning';
                break;
                case 'CREADO':
                it.acc = 'Respondió';
                it.icon = 'undo';
                it.bg_color = 'success';
                break;
                case 'ELIMINADO':
                it.acc = 'Eliminó';
                it.icon = 'clear';
                it.bg_color = 'danger';
                break;
                case 'FIRMO':
                it.acc = 'Firmó';
                it.icon = 'fingerprint';
                it.bg_color = 'firmo';
                break;
                case 'ANULADO':
                it.acc = 'Anuló';
                it.icon = 'cancel';
                it.bg_color = 'danger';
                break;
                case 'APROBADO_CD':
                it.acc = 'Aprobó con ciudadanía digital';
                it.icon = 'fingerprint';
                it.bg_color = 'firmo';
                break;
                default:
                it.acc = 'Sin respuesta';
                it.icon = 'visibility';
                it.bg_color = 'bold';
            }
        });
    }

    function showProgressAll(ev, id_doc){
        DataService.get(restUrl + 'historialFlujo/'+id_doc+'/proceso')
        .then(function (respuesta) {
            if(respuesta){
                setAttrs(respuesta.datos);
                var config = {
                    event: ev,
                    data: { id: id_doc, datos: respuesta.datos },
                    templateUrl: 'app/factories/Documento/dialog.progreso.html',
                    controller: ['$scope','$mdDialog', 'data', 'moment', DialogProgreso]
                };
                Modal.show(config);
            }
        });
    }

    function DialogProgreso( $scope, $mdDialog, data, moment) {
        var vmd = $scope;
        vmd.data = data;
        vmd.mostrarContenido = false;
        vmd.adjuntos = [];
        vmd.titleModal = "Progreso del documento";

        //funciones
        vmd.cerrar = cerrar;
        vmd.verDocumento = verDocumento;
        vmd.mostrarHistorial = mostrarHistorial;
        vmd.verHistorial = verHistorial;
        vmd.getDate = getDate;

        function cerrar(){ $mdDialog.cancel(); }
        function verDocumento(id_doc) { showPdfId(id_doc, false); }

        function mostrarHistorial(id_historial_flujo) {
            vmd.mostrarContenido = true;
            vmd.titleModal = "Detalle de documentos adjuntos aprobados";

            DataService.get(restUrl+'documento/adjuntos?id='+id_historial_flujo)
            .then(function(response) {
                vmd.adjuntos = response.datos.resultado.adjunto_aprobacion_cd;
                vmd.adjuntos.forEach(function (it) {
                    var fecha = moment(it.solicitud_aprobacion_cd[0].fecha, 'DD/MM/YYYY HH:mm:ss').format();
                    it.fecha_mos = Datetime.dateLiteral(fecha);
                    it.hora_mos = Datetime.times(fecha);
                });
            })
            
        }

        function getDate(valor) {
            var fecha = new Date(valor.substring(1, valor.length-4));
            return fecha;
        }

        function verHistorial(valor) {
            vmd.titleModal = "Progreso del documento";
            vmd.mostrarContenido = valor;
        }
    
    }


}

})();
