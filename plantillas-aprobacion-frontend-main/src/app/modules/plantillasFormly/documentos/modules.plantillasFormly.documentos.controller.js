(function() {
  'use strict';

  angular
    .module('app')
    .controller('DocumentosController', DocumentosController);

  /** @ngInject */
  function DocumentosController(DataService, restUrl, Storage, Datetime, $location, Modal, Documento) {
    var vm = this;
    vm.titulo = "Bandeja de documentos";
    var cuenta = Storage.getUser();

    vm.usuario=cuenta.id;
    vm.url = restUrl + 'plantillasFormly/documento/'+cuenta.id+'/misdocumentos/';
    vm.permission = {
      create:false,
      update:false,
      delete:true
    };
    vm.fields = [
      "id_documento",
      "nombre",
      "nombre_plantilla",
      "fecha",
      "estado",
      "impreso",
      "_fecha_creacion",
      "_fecha_modificacion"
    ];

    vm.estadoOpciones = [
        { v:'nuevo', t:'NUEVO'},
        { v:'firme', t:'FIRMÉ'},
        { v:'envia', t:'ENVIADO'},
        { v:'cerra', t:'CERRADO'},
        { v:'deriv', t:'DERIVADO'},
        { v:'derive', t:'DERIVE'},
        { v:'respondi', t:'RESPONDI'}
    ];
    if(cuenta.es_jefe){
        vm.estadoOpciones.push( { v:'aprobe', t:'APROBE'} );
        vm.estadoOpciones.push( { v:'rechace', t:'RECHACE'} );
    }

    vm.buttons = [
        {
          multiple: true,
          key_item: 'estado',
          opcion: {
            'NUEVO': { tooltip: 'Editar', icon: 'checked', onclick: irDocumento },
            'ENVIADO': { tooltip: 'Editar', icon: 'checked', onclick: irDocumento},
            'CERRADO': { tooltip: 'Editar', icon: 'checked', onclick: irDocumento},
            'DERIVADO': { tooltip: 'Editar', icon: 'checked', onclick: irDocumento},
            'DEFAULT': { tooltip: 'Ver', icon: 'remove_red_eye', onclick: irDocumento}
          }
        },
        {
            tooltip: 'Ver Historial',
            icon: 'timeline',
            onclick: verProgreso
        }
    ];
    vm.buttonAgregar = {
        tooltip: 'Añadir',
        icon: 'add',
        onclick: nuevoDocumento
    };

    function irDocumento(pEvento, pIdentificador){
        DataService.get(restUrl+'plantillasFormly/documento/?id_documento='+pIdentificador+'&fields=_usuario_creacion')
        .then(function (respuesta) {
            if(respuesta.datos.resultado[0]._usuario_creacion==cuenta.id)
                $location.path('documento/' + pIdentificador);
            else
                Documento.showPdfId(pIdentificador);
        })
    }
    function verProgreso(pEvento, pIdentificador) {
        Documento.showProgressAll(pEvento, pIdentificador);
    }

    function nuevoDocumento(pEvento){
        var config = {
            event: pEvento,
            templateUrl: 'app/modules/plantillasFormly/documentos/documento.dialog.html',
            controller: ['$scope','$mdDialog','DataService','Message','restUrl', 'Storage', DialogEscojerPlantilla]
        };
        Modal.show(config);
    }

    function DialogEscojerPlantilla( $scope, $mdDialog, DataService, Message, restUrl, Storage ) {
        var vmd = $scope;

        vmd.elegir = elegir;
        vmd.urlBase = 'plantillasFormly/plantilla_formly/?fields=id_plantilla_formly,nombre,abreviacion&sort=nombre&estado=ACTIVO&limit=10000'
        
        iniciarDialog();

        function iniciarDialog() {
            DataService.get(restUrl + vmd.urlBase)
            .then(function (data) {
                vmd.plantillas_disponibles = data.datos.resultado;
                vmd.plantilla_seleccionada = data.datos.resultado[0].id_plantilla_formly;
            });
        }

        function elegir() {
            DataService.get(restUrl + 'plantillasFormly/plantilla_formly/'+vmd.plantilla_seleccionada)
            .then(function (data) {
                Storage.setSession("pl", data.datos);
                $location.path('documento/0');
                $mdDialog.cancel();
            });
        }
    }

  }
})();
