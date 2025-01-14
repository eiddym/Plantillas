(function() {
  'use strict';

  angular
    .module('app')
    .controller('DocumentoController', DocumentoController);

  /** @ngInject */
  function DocumentoController(DataService, restUrl, Modal, Message, UtilFormly, Storage, $stateParams, $location, backUrl, Panel, Documento, ExpirationTime) {
    var vm = this;
    var cuenta = Storage.getUser();

    vm.id_documento = $stateParams.idDocumento;
    vm.load = false;
    vm.model_actual = {};
    vm.form_actual = [];
    vm.doc = {};
    vm.sw_enviado = true;
    vm.sw_rechazado = false;
    vm.url_img = null;

    // cargamos funciones
    vm.cargarPlantilla = cargarPlantilla;
    vm.guardarDocumento = guardarDocumento;
    vm.enviarMultiple = enviarMultiple;
    vm.vistaPrevia = vistaPrevia;
    vm.firmar = firmar;
    vm.volverAtras = volverAtras;
    vm.verObservaciones = verObservaciones;
    vm.verDocumento = verDocumento;
    vm.copearDocumento = copearDocumento;

    iniciar();

    function iniciar() {
      vm.enviarEjecutandose=0;
        if (vm.id_documento==0) {
            if(Storage.getSession("pl")!=null){
                cargarPlantilla(Storage.getSession("pl"));
                vm.sw_enviado = false;
                verificarZonaHoraria();
                vm.load = true;
                ExpirationTime.initAutoSave(guardar, false);
                Message.show('INFORMACION', 'No olvide guardar sus cambios cada 40 minutos, de lo contrario se perderán.');
            } else $location.path('documentos');
        }else {
            DataService.get(restUrl + 'plantillasFormly/documento/'+vm.id_documento)
            .then(function (resultado) {
                Storage.setSession('pl', resultado.datos);
                if(resultado.datos._usuario_creacion!=cuenta.id)
                    $location.path('documentos');
                cargarPlantilla(resultado.datos, true);
                vm.sw_rechazado = (resultado.datos.estado=="RECHAZADO")? true : false;
                vm.sw_enviado = ( resultado.datos.estado!="NUEVO" && !vm.sw_rechazado)? true : false;
                // deshabilitamos todos los campos para
                UtilFormly.disableForm(vm.form_actual, vm.sw_enviado);
                if(vm.sw_enviado){
                    var flujo = {
                        via_actual: resultado.datos.via_actual,
                        para: angular.fromJson(resultado.datos.para),
                        via: angular.fromJson(resultado.datos.via)
                    };
                    Storage.setSession('flujo_doc',flujo);
                }
                ExpirationTime.initAutoSave(guardar, vm.sw_enviado);
                Message.show('INFORMACION', 'No olvide guardar sus cambios cada 40 minutos, de lo contrario se perderán.');
                verificarZonaHoraria();
                vm.load = true;
            });
        }
    }
    function verificarZonaHoraria() {
      var es_zona_horaria_bolivia = true, offset;
      var data = angular.fromJson(vm.doc.plantilla);
      for (var i = 0; i < data.length; i++) {
        if (data[i].type=="layout") {
            for (var j = 0; j < data[i].fieldGroup.length; j++) {
              if (vm.form_actual[i].fieldGroup[j].type=='datepicker'){
                offset = new Date().getTimezoneOffset();
                es_zona_horaria_bolivia = (offset==240);
              }
            }
        } else {
          if (vm.form_actual[i].type=='datepicker'){
            offset = new Date().getTimezoneOffset();
            es_zona_horaria_bolivia = (offset==240);
          }
        }
        if (!es_zona_horaria_bolivia) break;
      }

      if (!es_zona_horaria_bolivia && !vm.sw_enviado) abrirDialogError('timeZone');
    }

    function copearDocumento() {
        Modal.confirm('¿Esta seguro de que quiere crear otro documento igual a este?', function () {
            var model = angular.copy(vm.model_actual);
            delete model['cite-0'];
            
            if (model['listaContactos-0'] && model['listaContactos-0'].contacto) {
                delete model['listaContactos-0'].contacto;
            }
            
            var pl = {
                nombre: vm.doc.nombre_plantilla,
                nombre_plantilla: vm.doc.nombre_plantilla,
                abreviacion: vm.doc.abreviacion,
                plantilla: vm.doc.plantilla,
                plantilla_valor: angular.toJson(model),
                observaciones: null
            };
            
            
            var verificar = {
              nombre: pl.nombre,
              abreviacion: pl.abreviacion,
              plantilla: pl.plantilla
            };
            
            DataService.post(restUrl + 'plantillasFormly/plantilla_formly/verificar', verificar)
            .then(function respuesta (respuesta) {
              if(respuesta.datos.valido === true) {
                Storage.setSession('pl',pl);
                $location.path('documento/0');
              }
              else {
                Message.show('ERROR', 'La plantilla ya no existe o no se encuetra activa. El documento no se puede duplicar.');
              }
            });
        });
    }

    function cargarPlantilla(pl, model) {

        vm.model_actual = (pl.plantilla_valor==null)? {} : angular.fromJson(pl.plantilla_valor);
        if(model)
            vm.form_actual = UtilFormly.dataToView(angular.fromJson(pl.plantilla), vm.model_actual);
        else
            vm.form_actual = UtilFormly.dataToView(angular.fromJson(pl.plantilla));

        actualizarPagina(vm.form_actual[0]);

        vm.doc.nombre = (model)? pl.nombre : pl.nombre+' - '+cuenta.first_name+' '+cuenta.last_name;
        vm.doc.nombre_plantilla = (model)? pl.nombre_plantilla : pl.nombre;
        vm.doc.abreviacion = pl.abreviacion;
        vm.doc.plantilla = pl.plantilla;
        vm.doc.observaciones = (model)? pl.observaciones : null;
        vm.sw_es_respuesta = pl.documento_padre || false;
        if(vm.sw_es_respuesta) {
            vm.doc.documento_padre = pl.documento_padre;
        }

        vm.sw_grupo = pl.grupo || false;
        if(vm.sw_grupo) {
            // obtener documentos de grupo
            DataService.get(restUrl + 'plantillasFormly/documento/?fields=id_documento,nombre,nombre_plantilla&estado=DERIVADO,CERRADO,APROBADO&sort=_fecha_creacion&grupo='+pl.grupo)
            .then(function (resultado) {
                vm.docs_grupo = resultado.datos.resultado;
            });
        }

    }

    function verDocumento(id_doc) { Documento.showPdfId(id_doc, false); }

    function actualizarPagina(template_cite) {
        var to = template_cite.templateOptions || 'sin membrete';
        switch (to.tipoMembrete) {
            case 'sin membrete':
                vm.url_img = null;
            break;
            case 'externo':
                vm.url_img = backUrl+'public/membrete.png';
            break;
        }
    }

    function agregarFlujo(documento, enviar) {
        if(enviar){
            var k, key, arr, i;
            k = key = "para";
            documento[k] = angular.toJson([vm.model_actual["datosGenerales-0"][key].id_usuario]);

            k = key = "via";
            arr = vm.model_actual["datosGenerales-0"][key] || [];
            documento[k] = [];
            for (i = 0; i < arr.length; i++) {
                documento[k].push(arr[i].id_usuario);
            }
            documento[k] = angular.toJson(documento[k].reverse());

            k = key = "de";
            arr = vm.model_actual["datosGenerales-0"][key];
            documento[k] = [];
            for (i = 0; i < arr.length; i++) {
                documento[k].push(arr[i].id_usuario);
            }
            documento[k] = angular.toJson(documento[k]);

            k = "referencia" ; key = "ref";
            documento[k] = vm.model_actual["datosGenerales-0"][key];
        }
    }
    function transformarModel(model) {
        // archivos
        var i = 0, arch;
        while (i!=-1) {
            arch = model['archivo-'+i];
            if(angular.isUndefined(arch)) break;
            if(angular.isUndefined(arch.length)){
                model['archivo-'+i] = [arch];
            }
            i++;
        }
        return angular.toJson(model);
    }

    function guardar(enviar, sw_location){
      if(vm.enviarEjecutandose > 1) {
        return;
      }
      var documento = {
          nombre: vm.doc.nombre,
          nombre_plantilla: vm.doc.nombre_plantilla,
          abreviacion: vm.doc.abreviacion,
          plantilla: vm.doc.plantilla,
          plantilla_valor: transformarModel(angular.copy(vm.model_actual))
      };

      if(vm.sw_es_respuesta) {
        documento.documento_padre = vm.doc.documento_padre;
      }

      if (!vm.sw_enviado) agregarFlujo(documento, enviar);
      if ( vm.id_documento==0 ) {
          documento._usuario_creacion = cuenta.id;
      }else {
          documento._usuario_modificacion = cuenta.id;
          documento.id = vm.id_documento;
      }
      documento.sw = {
          enviar: enviar,
          enviado: vm.sw_enviado,
          es_respuesta: vm.sw_es_respuesta
      };

      DataService.save( restUrl+'plantillasFormly/documento/', documento)
      .then(function (respuesta) {
        if (respuesta) {
          if(!sw_location){
              Message.show(respuesta.tipoMensaje, respuesta.mensaje);
              $location.path('documentos');
              Storage.removeSession('pl');
          }else if(vm.id_documento==0) $location.path('documento/'+respuesta.datos.id_documento);
        }
          vm.enviarEjecutandose=0;
      });
    }

    function guardarDocumento(enviar) {
      vm.enviarEjecutandose += 1;
        // Valida si es para enviar.
        if(enviar){
          if( UtilFormly.sizeObj(vm.formu.$error)==0 ){
              guardar(enviar);
          }else {
            var adjuntoCD = false;
            if (vm.formu.$error.accept && UtilFormly.sizeObj(vm.formu.$error)==1) {
              var json = vm.formu.$error.accept[0] || {};
              for (var key in json) {
                if (json.hasOwnProperty(key) && key.indexOf('pdfsAprobacionCD') != -1)
                  adjuntoCD = true;
              }
            }
            if (adjuntoCD) guardar(enviar);
            else {
            UtilFormly.recursiveShowError(vm.formu.$error);
            Message.show("ERROR", 'Debe llenar todos los campos marcados con rojo porque son requeridos'.toUpperCase());
            abrirDialogError('formu');
            vm.enviarEjecutandose=0;
            }
          }
        }
        else{
          guardar();

        }

    }
    
    function enviarMultiple() {
        if (vm.enviarEjecutandose > 1) {
          return;
        }
        var documento = {
          nombre: vm.doc.nombre,
          nombre_plantilla: vm.doc.nombre_plantilla,
          abreviacion: vm.doc.abreviacion,
          plantilla: vm.doc.plantilla,
          plantilla_valor: transformarModel(angular.copy(vm.model_actual))
        };

        if (vm.sw_es_respuesta) {
          documento.documento_padre = vm.doc.documento_padre;
        }

        if (!vm.sw_enviado) agregarFlujo(documento, true);
        if (vm.id_documento == 0) {
          documento._usuario_creacion = cuenta.id;
        } else {
          documento._usuario_modificacion = cuenta.id;
          documento.id = vm.id_documento;
        }
        documento.sw = {
          enviar: true,
          enviado: vm.sw_enviado,
          es_respuesta: vm.sw_es_respuesta
        };

        DataService.save(restUrl + 'plantillasFormly/documento/', documento)
        .then(function (respuesta) {
            if (vm.id_documento == 0) $location.path('documento/' + respuesta.datos.id_documento);
            vm.enviarEjecutandose = 0;
        });
    }


    function abrirDialogError(tipo){
      var config = {
        data: tipo,
        templateUrl: 'app/modules/plantillasFormly/documentos/documento/dialogError.html',
        controller: ['data', '$scope', '$mdDialog', DialogErrorController]
      }
      Modal.show(config);
    }

    function DialogErrorController(data, $scope, $mdDialog){
      var vmd = $scope;
      vmd.data={tipo:data};

      vmd.cerrar= function(){
        $mdDialog.cancel();
      }
    }

    function volverAtras() {
        $location.path('documentos');
    }

    function vistaPrevia(){
      if ( UtilFormly.sizeObj(vm.formu.$error)==0 ){
        Documento.showPdf(vm.doc.plantilla, angular.toJson(vm.model_actual), vm.doc.nombre);
      }
      else if (vm.sw_enviado && vm.id_documento) {
        Documento.showPdfId(vm.id_documento);
      }
      else {
        Message.show('INFORMACION', 'Antes de visualizar el documento debe llenar todos los campos requeridos.');
        UtilFormly.recursiveShowError(vm.formu.$error);
      }
    }

    function firmar(){
        var config = {
            data: "", //datosEnviar,
            templateUrl: 'app/modules/firmador/modules.firmador.html',
            controller: ['data', '$scope', '$mdDialog', 'Util', 'DemofiService', DialogFirmadorController]
        }
        Modal.show(config);
    }

    function DialogFirmadorController(data, $scope, $mdDialog, Util, DemofiService){
        var vmd = $scope;
        vmd.data={};

        //valores para firma digital
        vmd.iniciado = false;
        vmd.pin = undefined;
        vmd.tokens = [];
        vmd.certificados = [];
          //this.$scope.firmados = 0;
        vmd.iniciado = false;
        vmd.iniciando = false;
        vmd.certificado_seleccionado = undefined;
          //this.$scope.solicitudes = data.solicitudes;
        vmd.autenticado = false;
        vmd.autenticando = false;
          //this.$scope.firmando = false;
        vmd.demofi_ejecutandose = false;
        vmd.token_conectado = false;
        vmd.boton_autenticar_habilitado = false;
        vmd.mostrar_progress = false;


        vmd.data.html=data.html;
        vmd.data.pdf=data.pdf;
        vmd.data.flag_html=true;
        vmd.data.show_pdf=!data.esDispositivoMovil;
        if (data.esDispositivoMovil) {
            Util.loadCanvas(data.pdf_buffer, '#canvasContainer');
        }

        //funciones

        /*vmd.cerrar = function (){ $mdDialog.cancel(); }
        vmd.verHtml = function(){ vmd.data.flag_html=true; }
        vmd.verPdf = function(){ vmd.data.flag_html=false; }*/


        vmd.verificarTokenConectado = verificarTokenConectado;
        vmd.autenticar = autenticar;
        vmd.cancelar = cancelar;
        vmd.verificarServidor = verificarServidor;

        verificarTokenConectado();

        function verificarTokenConectado() {
            if (vmd.iniciando === false) {
                vmd.iniciando = true;
                DemofiService.listTokens()
                .then( function (response) {
                    // this.$log.log('verificarTokenConectado-then', response)
                    vmd.iniciando = false;
                    vmd.iniciado = true;
                    vmd.demofi_ejecutandose = true;
                    vmd.tokens = response.datos;
                    vmd.token_conectado = response.datos.length > 0;
                })
                .catch( function () {
                    // this.$log.log('verificarTokenConectado-catch', error)
                    vmd.iniciando = false;
                    vmd.iniciado = true;
                    vmd.token_conectado = false;
                    vmd.demofi_ejecutandose = false;
                });
            }
        }

        function autenticar() {
            vmd.mostrar_progress = true;
            vmd.autenticando = true;
            //this.cancelInterval();
            //this.Loading.show('Cargando', true);
            DemofiService.login(vmd.pin)
            .then(function (respLogin) {
                //this.$log.log(respLogin);
                vmd.mostrar_progress = false;
                vmd.autenticando = false;
                if (respLogin.finalizado === true) {
                    vmd.boton_autenticar_habilitado = false;
                    // Obtener certificados
                    vmd.autenticado = true;
                    // Una ves autenticado actualizamos la lista de certificados
                    DemofiService.listCertificates()
                    .then(function (respCert) {
                        vmd.certificados = respCert.datos;
                        if (vmd.certificados[0]) {
                            vmd.certificado_seleccionado = vmd.certificados[0];
                        }
                    });
                }
            })
            .catch( function () {
                // this.$log.log(error);
                vmd.mostrar_progress = false;
                vmd.autenticando = false;
                vmd.pin = undefined;
                vmd.autenticado = false;
                vmd.boton_autenticar_habilitado = true;
                //this.Message.warning(error.mensaje);
                //this.initInterval();
            });
        }

        function verificarServidor() {
            DemofiService.verificarServidor();
        }

        function cancelar() {
            $mdDialog.cancel();
        }
    }


    function verObservaciones(event) {
        var data = {
            observacion: vm.doc.observaciones || 'El documento esta mal'
        }
        var config = {
            event: event,
            data: data,
            controller: ['$scope', 'data', 'mdPanelRef',PanelItemController],
            templateUrl: 'app/modules/plantillasFormly/documentos/documento/observacion.panel.html'
        };
        Panel.show(config);
    }

    function PanelItemController($scope, data, mdPanelRef) {
        var vmp = $scope;
        vmp.observacion = data.observacion;

        //cargamos funciones
        vmp.closePanel = closePanel;

        function closePanel() {
            mdPanelRef && mdPanelRef.close().then(function() { mdPanelRef.destroy(); });
        }
    }


  }
})();
