(function() {
  'use strict';

  angular
    .module('app')
    .controller('AprobarDocumentoController', AprobarDocumentoController);

  /** @ngInject */
  function AprobarDocumentoController(restUrl, Storage, Documento, Modal, $q, DataService, FirmaticService, $window, Message, Loading, $timeout) {

    var vm = this;
    var cuenta = Storage.getUser();
    vm.cuenta = cuenta;
    vm.usuario = cuenta.id;
    vm.titulo = "Aprobar documentos";
    vm.url = restUrl + 'documento/aprobarCiudadania';
    vm.firmarDocumentos = firmarDocumentos;
    vm.items = {};
    vm.habilitarSeleccion = true;

    verificarNotificacionesCDAprobaciones();

    function verificarNotificacionesCDAprobaciones() {
      if ($window.localStorage.getItem('CD_aprobacion_notificacion') != null && $window.localStorage.getItem('CD_aprobacion_notificacion') != undefined) {
        var notificacionAprobaciones = angular.fromJson($window.localStorage.getItem('CD_aprobacion_notificacion'));
        if (notificacionAprobaciones.type === 'error') {
          Message.error(notificacionAprobaciones.message);
        } else if (notificacionAprobaciones.type === 'success') {
          Message.success(notificacionAprobaciones.message)
        } else {
          Message.warning(notificacionAprobaciones.message)
        }
        $window.localStorage.removeItem('CD_aprobacion_notificacion');
      }
    }

    vm.permission = {
      create: false,
      update: false,
      delete: false
    };

    vm.fields = [
      "id_documento",
      "nombre",
      "nombre_plantilla",
      "fecha",
      "estado",
      "_fecha_modificacion",
      "adjunto_aprobacion_cd",
      "aprobarDocumento"
    ];

    vm.estadoOpciones = [
      { v:'cerra', t:'CERRADO'}
    ];

    vm.buttons = [
      {
        tooltip: 'Ver',
        icon: 'remove_red_eye',
        onclick: vistaPrevia
      },
      {
        tooltip: 'Ver Historial',
        icon: 'timeline',
        onclick: verProgreso
      }
    ];
    vm.habilitarBotonFirma = false;
    vm.obtenerSeleccionados=obtenerNumeroSeleccionados;
    vm.verificarSeleccionados = verificarSeleccionados;
    vm.arrayBufferToBase64 = arrayBufferToBase64;
    vm.obtenerDocumentos = obtenerDocumentos;
    vm.guardarDocumentosFirmados = guardarDocumentosFirmados;
    vm.docDic = {};
    
    /**
     * Funcion que obtiene el número de documentos seleccionados.
     * @param {Integer} cantidad Informacion respecto a la cantidad de documentos seleccionados.
     */
    function obtenerNumeroSeleccionados(cantidad) {
      vm.habilitarBotonFirma = cantidad;
    }

    /**
     * Funcion que permite carga la vista previa de un documento.
     * @param {Function} pEvento Funcion de control del evento(click)
     * @param {Integer} pIdentificador Identificador del documento.
     */
    function vistaPrevia(pEvento, pIdentificador){
      Documento.showPdfId(pIdentificador);
    }

    /**
     * Funcion que permite la carga del progreso del documento seleccionado
     * @param {Function} pEvento Funcion de control del evento(click)
     * @param {Integer} pIdentificador Identificador del documento
     */
    function verProgreso(pEvento, pIdentificador) {
      Documento.showProgressAll(pEvento, pIdentificador);
    }

    
    function obtenerDocumentos(lista) {      
      var respuesta = {
        obtenidos: [],
        noObtenidos: []
      };
      var promesas = lista.map(function (item) {
        return new Promise(function (resolve) {
          return DataService.pdf(restUrl + 'documento/firmar', {
              cite: item.nombre,
              id_documento: item.id_documento
            })
            .then(function (respuestaPdf) {
              if (!respuestaPdf || !respuestaPdf.data) throw Error('No se pudo obtener el documento');
              return arrayBufferToBase64(respuestaPdf.data);
            })
            .then(function (base64) {
              respuesta.obtenidos.push({
                base64: 'data:application/pdf;base64,' + base64,
                name: item.id_documento + '.pdf'
              });
              
              return resolve();
            })
            .catch(function (errorObtener) {
              respuesta.noObtenidos.push({
                documento: item.nombre,
                error: errorObtener
              });
              return resolve();

            });

        });

      });
      return Promise.all(promesas)
        .then(function () {
          return Promise.resolve(respuesta);
        })
        .catch(function (error) {
          return Promise.reject(error);
        });
    }
    function guardarDocumentosFirmados(lista) {
      var respuesta = {
        total: lista.length || 0,
        guardado: [],
        noGuardado: []
      };
      var promesas = lista.map(function(item) {
        return new Promise(function (resolve) {
          var nombreDocumento = item.name          
          if (angular.isUndefined(vm.docDic[nombreDocumento])){
            respuesta.noGuardado.push(nombreDocumento.replace('.pdf', ''));
            return resolve();
          }
          return DataService.post(restUrl + 'documento/firmado/', {
            base64: item.base64,
            id_documento: vm.docDic[nombreDocumento]
          })
          .then(function (respGuardado) {
            if(respGuardado.tipoMensaje !== 'EXITO') throw Error(respGuardado.mensaje);
            respuesta.guardado.push(nombreDocumento);
            return resolve();
          })
          .catch(function () {
            respuesta.noGuardado.push(item.name);
            return resolve();
          });
        });
      });


      return Promise.all(promesas)
      .then(function () {
        return Promise.resolve(respuesta);
      })
      .catch(function(error){
        
        return Promise.reject(error);
      })
    }

    function firmarDocumentos() {
      var verificacion = {};
      var configLoad = {
        data:{
          mensaje: 'Verificando firmador...',
          tipo: 'info'
        }
      };
      Loading.show(configLoad);
      var documentosParaFirmar = vm.verificarSeleccionados(vm.items.data);
      var control = {
        seleccionados: documentosParaFirmar.length,
        obtenidos: 0,
        firmados: 0,
        guardados: 0
      };

      FirmaticService.verificarEstado()
      .then(function (respEstado) {
        if(respEstado.activo === false) throw Error(respEstado.mensaje);
        Loading.cambiar({
          mensaje: 'Obteniendo documentos ...',
          tipo: 'warning'
        });
        return DataService.get(restUrl + 'seguridad/virtual/verificar');
      })
      .then(function (respVerificar) {
        if (angular.isDefined(respVerificar.datos.esVirtual) && respVerificar.datos.esVirtual) verificacion = respVerificar.datos;
        return obtenerDocumentos(documentosParaFirmar);
      })
      .then(function (respDocumentos) {
        if(!respDocumentos) throw Error('No se pudieron obtener documentos.');
        if(!respDocumentos.obtenidos.length === 0) throw Error('No se obtuvieron documentos firmar');
        control.obtenidos = respDocumentos.obtenidos.length || 0;
        Loading.cambiar({
          mensaje: 'Firmando documentos ...',
          tipo: 'info'
        });
        var nroDocumento = cuenta.doc;
        if (verificacion.esVirtual == true) nroDocumento = verificacion.nroDocumento;
        return FirmaticService.firmarPdf(respDocumentos.obtenidos, nroDocumento);
      })
      .then(function (respuestaFirma) {
        
        if (!respuestaFirma || respuestaFirma.status !== 200) {
          throw Error("No se pudo firmar el documento, revise que el firmador se encuentra en ejecución.");
        }
        Loading.cambiar({
          mensaje: 'Guardando documentos firmados ...',
          tipo: 'success'
        });
        control.firmados = respuestaFirma.data.files.length || 0;
        return guardarDocumentosFirmados(respuestaFirma.data.files);
      })
      .then(function (respGuardados) {
        if(respGuardados.guardado.length === 0 && control.seleccionados.length > 0 ) throw Error('No se guardo ningun documento.');
        control.guardados = respGuardados.guardado.length || 0;
        
        if(control.seleccionados === control.guardados) {
          Message.success(control.seleccionados+' documentos firmados y guardados correctamente.');
        }
        else {
          
          Message.show('INFORMACION','De '+control.seleccionados+' se firmaron '+control.firmados+' y se guardaron '+control.guardados);
        }
        
        Loading.cerrar();
        $timeout(function () {
          angular.element('#btn-refresh-crudtable').click();
        });
      })
      .catch(function (error) {
        Message.error(error.message);
        Loading.cerrar();
      });

    }

    function verificarSeleccionados(documentos) {
      var respuesta = []
      vm.docDic = {};
      documentos.map(function (documento) {
        if (documento.selected != null && documento.selected) {
          documento.firmado = false;
          respuesta.push(documento);
          vm.docDic[documento.id_documento+'.pdf'] = documento.id_documento;
        }
      });

      return respuesta;
    }
    /**
     * Funcion que transforma un buffer en base64
     * @param {Buffer} buffer buffer de un archivo
     */
    function arrayBufferToBase64(buffer) {
      var defer = $q.defer();
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      defer.resolve($window.btoa(binary));
      return defer.promise;
    }
  }
})();
