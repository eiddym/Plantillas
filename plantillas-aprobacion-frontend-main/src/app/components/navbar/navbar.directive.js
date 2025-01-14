(function() {
    'use strict'

    angular
    .module('app')
    .directive('acmeNavbar', acmeNavbar);

    /** @ngInject */
    function acmeNavbar() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/navbar/navbar.html',
            scope: {},
            controller: ['ExpirationTime', '$location', 'Storage', 'SideNavFactory', 'Util', 'DataService', '$window', 'restUrl', NavbarController],
            controllerAs: 'vm',
            bindToController: true
        }

        return directive

        /** @ngInject */
        function NavbarController(ExpirationTime, $location, Storage, SideNavFactory, Util, DataService, $window, restUrl) {
            var vm = this;

            vm.toggle = function () {
                angular.element('#sidenav-main').toggleClass('collapsed');
            }

            vm.openMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            }

            vm.profile = function () {
                $location.path("profile");
            }

            vm.settings = function () {
                $location.path("configuracion");
            }

            vm.getFirstName = function () {
                if (Storage.existUser()) {
                    return Storage.getUser().first_name;
                }
                return SideNavFactory.getUser().first_name;
            }

            vm.getColor = function () {
                return SideNavFactory.userColor;
            }

            vm.getInitial = function () {
                var firstName = SideNavFactory.getUser().first_name;
                return firstName.length ? firstName[0].toUpperCase() : '?';
            }

            vm.logout = function () {
              var codigo = $window.localStorage.getItem('oauth2_state');
              if (codigo) {
                  // this.$log.log('------------------------------codigo', codigo);
                  DataService.get(restUrl + 'salir?codigo=' + codigo)
                  .then(function (response) {
                      $window.location.href = response.datos;
                  });
              } else {
                  ExpirationTime.logout();
              }
            }

            vm.fullscreen = function () {
                angular.element('body').toggleClass('fullscreen');
                Util.fullscreen();
            }

            vm.cambiarUsuario = function () {
                $location.path("elegir");
            }
        }
    }

})();
