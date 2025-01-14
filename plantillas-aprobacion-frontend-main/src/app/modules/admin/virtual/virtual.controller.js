(function () {
  'use strict';

  angular
  .module('app')
  .controller('VirtualController', VirtualController);

  /** @ngInject */
  function VirtualController($location, Message, DataService, restUrl, SideNavFactory, ExpirationTime, Storage, Loading, $timeout, $auth, Util, BreadcrumbFactory) {
  
    var vm = this;
    vm.usuariosVirtuales = [];

    vm.seleccionar = function (item) {
      Loading.show({
        data: {
          mensaje: 'Cambiando de usuario...',
          tipo: 'success'
        }
      });
      
      DataService.get(restUrl + 'seguridad/virtual/cambiar/' + item.id_usuario)
      .then(function (respVirtual) {
        if(angular.isUndefined(respVirtual)) {
          throw Error('Error en el cambio de usuario.');
        }
        var user = respVirtual.datos.user;
        var menu = respVirtual.datos.menu;
        var roles = respVirtual.datos.roles;
        var path = Storage.getSession('path');
        user.es_jefe = false;
        if(path == null ) {
          var max = 10;
          roles.forEach(function(item) {
            if (item.rol.peso < max && item.rol.peso !== 0) max = item.rol.peso;
            if (item.rol.nombre == 'JEFE')  user.es_jefe = true;
          });
          path = ['documentos', 'aprobacion', 'impresion', 'documentos', 'documentos'][max];
        }
        SideNavFactory.setUser(user);
        Storage.setUser(user);
        SideNavFactory.setMenu(menu.menu);
        Storage.setSession('menu', SideNavFactory.getMenu());
        if(path) {
          var route = path.replace('/', '');
          var page = Util.getMenuOption(Storage.getSession('menu'), route);
          BreadcrumbFactory.setParent(page[0]);
          BreadcrumbFactory.setCurrent(page[1]);
        }
        $timeout(function () {
          var $sidenav = angular.element('#sidenav')
          $sidenav.find('.md-button-href').removeClass('active');
          $sidenav.find('.sidenav-sublist').hide();
          $sidenav.find(".md-button-href[data-url='" + route + "']")
          .addClass('active').parent().parent().prev().click();
        });
        $auth.setToken(respVirtual.datos.token);
        $timeout(ExpirationTime.init(), 800);
        angular.element('#toast-container-main').find('md-toast').fadeOut();
        $timeout($location.path(path && path.indexOf('login') == -1 ? path : '/'), 10000);
        $timeout(Loading.cerrar(), 8000);
      })
      .catch(function(){
        Message.show('ERROR', 'Error en el cambio de usuario.');
      });
    };

    vm.obtenerVirtuales = function () {
      DataService.get(restUrl + 'seguridad/virtual')
      .then(function (respVirtual) {
        if (angular.isUndefined(respVirtual)) {
          $location.path("documentos");          
          return;
        }
        Message.show(respVirtual.tipoMensaje, respVirtual.mensaje);
        vm.usuariosVirtuales = respVirtual.datos.resultado;
      })
      .catch(function () {
        Message.show('ERROR', 'Error en la obtencion de datos virtuales');
      })
    };
    vm.obtenerVirtuales();
  }

})();