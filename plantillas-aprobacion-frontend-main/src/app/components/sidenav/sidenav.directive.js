(function() {
    'use strict'

    angular
    .module('app')
    .directive('acmeSidenav', SidenavDirective);

    /** @ngInject */
    function SidenavDirective() {
        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/sidenav/sidenav.html',
            scope: {},
            controller: ['$timeout', '$mdSidenav', 'SideNavFactory', '$location', 'Storage', 'Util', 'BreadcrumbFactory', '$log', SidenavController],
            controllerAs: 'vm',
            bindToController: true,
            link: function(scope, elem) {
                var $sidenav = elem

                $sidenav.on('click', '.md-button-href', function () {
                    $sidenav.find('.md-button-href').removeClass('active');
                    angular.element(this).addClass('active');
                })

                $sidenav.on('click', '.md-button-toggle', function () {
                    if ($sidenav.hasClass('collapsed')) {
                        return false;
                    }
                    $sidenav.find('.sidenav-sublist').slideUp(300);
                    $sidenav.find('.sidenav-list > li').removeClass('active');

                    var $this = angular.element(this);
                    $this.addClass('active');
                    if(!$this.next().is(":visible")) {
                        $this.next().slideToggle(300);
                        $this.closest('li').addClass('active');
                    }
                })
            }
        }

        return directive

        /** @ngInject */
        function SidenavController($timeout, $mdSidenav, SideNavFactory, $location, Storage, Util, BreadcrumbFactory, $log) {
            var vm = this;
            var color = ['info', 'success', 'danger', 'warning', 'primary'];

            vm.user = {};
            vm.menu = [];

            vm.toggleLeft = buildDelayedToggler('left');

            vm.send = function (url, submenu) {
                if (typeof submenu == 'undefined') {
                    if (Storage.exist('menu')) {
                        var page = Util.getMenuOption(Storage.getSession('menu'), url);
                        BreadcrumbFactory.setParent(page[0]);
                        BreadcrumbFactory.setCurrent(page[1]);
                    }
                    Storage.setSession('last_route', url);
                    // vm.toggleLeft();
                    $location.path(url);
                }
                vm.reset();
            }

            vm.reset = function () {
                angular.element('#toast-container-main').find('md-toast').fadeOut();
            }

            activate();

            function activate() {
                if(Storage.existUser()) {
                    SideNavFactory.setUser(Storage.getUser());
                    SideNavFactory.setMenu(Storage.getSession('menu'));
                }
                vm.menu = SideNavFactory.getMenu();
                Storage.setSession('menu', vm.menu);

                vm.active = $location.path().replace('/', '');
                SideNavFactory.userColor = color[parseInt(Math.random()*color.length)];

                $timeout(function () {
                    angular.element('#sidenav').find('.md-button-href.active').parent().parent().prev().click();
                }, 1000);
            }

            vm.getColor = function () {
                return SideNavFactory.userColor;
            }

            vm.getName = function () {
                var user = SideNavFactory.getUser();
                return user.first_name + ' ' + user.last_name;
            }

            vm.getEmail = function () {
                return SideNavFactory.getUser().email;
            }

            vm.getInitial = function () {
                var firstName = SideNavFactory.getUser().first_name;
                return firstName.length ? firstName[0].toUpperCase() : '?';
            }

            vm.getMenu = function () {
                return SideNavFactory.getMenu();
            }

            /**
            * Supplies a function that will continue to operate until the
            * time is up.
            */
            function debounce(func, wait) {
                var timer
                return function debounced() {
                    var context = vm,
                    args = Array.prototype.slice.call(arguments);
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        timer = undefined;
                        func.apply(context, args);
                    }, wait || 10);
                }
            }
            /**
            * Build handler to open/close a SideNav when animation finishes
            * report completion in console
            */
            function buildDelayedToggler(navID) {
                return debounce(function() {
                    $mdSidenav(navID)
                    .toggle()
                    .then(function () {
                        $log.debug("toggle " + navID + " is done");
                    })
                }, 200);
            }
        }
    }
})();
