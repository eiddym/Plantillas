(function() {
    'use strict';

    angular
    .module('app')
    .controller('LoginController', LoginController);

    /** @ngInject */
    function LoginController($auth, $location, Message, SideNavFactory, Storage, $timeout, Util, BreadcrumbFactory, $window, Datetime, $mdDialog, Modal, ExpirationTime, backUrl, DataService) {

        var vm = this;
        vm.login = login;
        vm.iniciarSesion= iniciarSesion;
        vm.irAVerificar= irAVerificar;
        vm.backUrl = backUrl;
        Storage.destroySession();
        activate();
            
        function activate() {
            angular.element('body').addClass('no-login');
            angular.element('body').removeClass('principal');
            if ($window.localStorage.getItem('error') != null && $window.localStorage.getItem('error') != undefined) {
                Message.error($window.localStorage.getItem('error'));
                $window.localStorage.removeItem('error');
            }
        }

        function login () {
            $auth.login({
                username: vm.username,
                password: vm.password
            })
            .then(function(response) {
                var user = response.data.datos.user;
                var menu = response.data.datos.menu;
                var roles = response.data.datos.roles;

                angular.element('body').removeClass('no-login');
                angular.element('body').addClass('principal');

                var path = Storage.getSession('path');
                user.es_jefe=false;
                if(path==null){
                    var max = 10;
                    roles.forEach(function (it) {
                        if(it.rol.peso<max && it.rol.peso!==0){ max = it.rol.peso; }
                        if(it.rol.nombre=='JEFE') user.es_jefe=true;
                    })
                    path = ['documentos','aprobacion','aprobacion', 'impresion', 'documentos', 'documentos'][max];
                }

                // Set user
                SideNavFactory.setUser(user);
                Storage.setUser(user);


                // Set Menu
                SideNavFactory.setMenu(menu);
                Storage.setSession('menu', SideNavFactory.getMenu());


                if (path) {
                    var route = path.replace('/', '');

                    // Set breadcrumb
                    var page = Util.getMenuOption(Storage.getSession('menu'), route);
                    BreadcrumbFactory.setParent(page[0]);
                    BreadcrumbFactory.setCurrent(page[1]);

                    // Select menu option
                    $timeout(function () {
                        var $sidenav = angular.element('#sidenav')
                        $sidenav.find('.md-button-href').removeClass('active');
                        $sidenav.find('.sidenav-sublist').hide();
                        $sidenav.find(".md-button-href[data-url='" + route + "']")
                                .addClass('active').parent().parent().prev().click();
                    });

                }
                ExpirationTime.init();

                angular.element('#toast-container-main').find('md-toast').fadeOut();

                // Redirect to dashboard
                $location.path(path && path.indexOf('login') == -1? path : '/');

            })
            .catch(function(error) {
                if (error.status == 400 || error.status == 401) {
                    Message.error('Nombre de usuario y/o contraseña no válidos.');
                }
                if(error.status == 412){
                    Message.show(error.data.tipoMensaje,error.data.mensaje);
                }

                if (error.status == -1) {
                    Message.error('Servidor no Disponible.');
                }
            });
        }


        vm.abrirDialog= function(pEvento){

          var config={
            event: pEvento,
            title: 'Recuperar contraseña',
            templateUrl: 'app/modules/admin/login/recuperar.dialog.html',
            controller: ['$scope','$mdDialog','DataService','Message','restUrl', DialogRecuperarController]
          };
          Modal.show(config);
        }

        /**
         Funcion Controlador para el dialogo de recuperacion de contraseña.
         */
        function DialogRecuperarController($scope,$mdDialog, DataService, Message, restUrl){
          var vmd=$scope;
          vmd.usuario=null;
          vmd.email=null;
          vmd.numero_documento=null;

          // Funcion que recupera los datos y los envia al servicio rest.
          vmd.recuperar=function(){

            var datosEnviar={
              usuario:vmd.usuario,
              email:vmd.email,
              numero_documento:vmd.numero_documento
            }

            DataService.put(restUrl+"seguridad/recuperar/", datosEnviar)
            .then(function(pRespuesta){
              Message.show(pRespuesta.tipoMensaje,pRespuesta.mensaje);
              vmd.cerrar();
            })

          }
          vmd.cerrar= function(){
            $mdDialog.cancel();
          }
        }

      function iniciarSesion() {
          var ruta =  vm.backUrl + 'codigo';
          DataService.get(ruta)
          .then(function(response) {
            if (response) {
              $window.localStorage.setItem('oauth2_state', response.datos.codigo);
              $window.location.href = response.datos.url;
            }

        })
        .catch(function (err) {
          Message.error(err);
        });
      }

      function irAVerificar() {
          $location.path('verificar');
      }
    }

})();
