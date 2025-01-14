(function() {
    'use strict'

    angular
    .module('app')
    .factory('SideNavFactory', SideNavFactory);

    function SideNavFactory() {

        var factory = {
            user: {
                id: '',
                first_name: '',
                last_name: '',
                cargo: '',
                email: '',
                photo: ''
            },
            userColor: '',
            visible: false,
            menu: [],
            getMenu: function () {
                return this.menu;
            },
            getUser: function () {
                return this.user;
            },
            getVisible: function () {
                return this.visible;
            },
            setMenu: function (menu) {
                this.menu = menu;
            },
            setUser: function (user) {
                this.user = user;
            },
            setVisible: function (visible) {
                this.visible = visible;
            }
        };

        return factory;

    }

})();