(function () {
  'use strict';

  angular
  .module('app')
  .controller('VerificarController', VerificarController);


  function VerificarController(Message, backUrl, DataService, $window, Documento, Util, $location, $scope, reCaptchaSiteKey) {

    var claveSitio = reCaptchaSiteKey;

    var vm = this;

    vm.sc = $scope;
    vm.currentNavItem= 'verificar';
    vm.deshabilitado = true;
    vm.datos = {
      recaptcha: null
    };


    vm.recaptchaSolucion = function (token) {
      vm.datos.recaptcha = token;
    };

    vm.recaptchaVencimiento = function () {
      vm.datos.recaptcha = null;
    };

    vm.goto= function(page) {
      vm.status = 'Go to '+page;
    };

    activate();
    vm.data = {
      selectedIndex: 0
    };

    vm.next = function () {
      vm.data.selectedIndex = Math.min(vm.data.selectedIndex +1, 2);
    };
    vm.previous = function () {
      vm.data.selectedIndex = Math.max(vm.data.selectedIndex -1, 0);
    };


    vm.esMovil = Documento.isMobile();


    vm.buscar = buscar;
    vm.irInicio = irInicio;
    vm.verificarDocumento = verificarDocumento;



    function activate() {
      angular.element('body').addClass('no-login');
      angular.element('body').removeClass('principal');

      var configRecaptcha = {
        sitekey: claveSitio,
        callback: vm.recaptchaSolucion.bind(vm),
        "expired-callback": vm.recaptchaVencimiento.bind(vm),
        hl:'es',
        size: 'normal'
      };

      $window.grecaptcha.ready(function(){
        $window.grecaptcha.render('recaptcha', configRecaptcha);
      });
      
    }
   
    function buscar() {
      if(vm.datosDocumento) {
        vm.datosDocumento = {};
        vm.pdf = null;
        vm.pdf_buffer = null;
      }
      vm.datos.codigo = vm.datos.codigo.toUpperCase();

      DataService.post(backUrl + 'verificar', vm.datos)
      .then(function (respPost) {
        if(respPost && respPost.tipoMensaje !== 'ERROR') {
          vm.datosDocumento = respPost.datos;
          vm.datos.token = respPost.datos.token;
        }
        if(respPost ) {
          DataService.pdf(backUrl + 'pdfVerificado', vm.datos)
          .then(function (response) {
            if(response) {
              vm.pdf = response.url;
              vm.pdf_buffer = response.data;
              if (vm.esMovil) {
                Util.loadCanvas(response.data, '#canvasContainerVerificado');
              }
            }

          });
        }
        $window.grecaptcha.reset();
      })
      .catch(function (error) {
        Message.error(error);
        $window.grecaptcha.reset();
      })
    }

    function verificarDocumento() {
      if (!vm.datos.recaptcha) {
        Message.show('ADVERTENCIA', 'Debe completar el reCaptcha');
        return;
      }

      if(vm.datosDocumento) {
        vm.datosDocumento = {};
        vm.pdf = null;
        vm.pdf_buffer = null;
      }
      vm.datos.codigo = vm.datos.codigo.toUpperCase();

      DataService.post(backUrl + 'verificarDocumento', vm.datos)
      .then(function (respPost) {
        if(respPost && respPost.tipoMensaje !== 'ERROR') {
          vm.datosDocumento = respPost.datos;
          vm.datos.token = respPost.datos.token;
        }
        if(respPost ) {
          Message.show(respPost.tipoMensaje, respPost.mensaje);
          DataService.pdf(backUrl + 'pdfVerificado', vm.datos)
          .then(function (response) {
            if(response) {
              vm.pdf = response.url;
              vm.pdf_buffer = response.data;
              if (vm.esMovil) {
                Util.loadCanvas(response.data, '#canvasContainerVerificado');
              }
            }
          });
        }
        $window.grecaptcha.reset();
      })
      .catch(function (error) {
        Message.error(error);
        $window.grecaptcha.reset();
      })
    }

    function irInicio() {
      $location.path('login');
    }

    
  }
})();
