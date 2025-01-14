(function() {
    'use strict'

    angular
    .module('app')
    .factory('BreadcrumbFactory', BreadcrumbFactory)

    function BreadcrumbFactory() {

        var factory = {
            parent: '',
            current: '',
            setParent: function (parent) {
                this.parent = parent;
            },
            setCurrent: function (current) {
                this.current = current;
            },
            getParent: function () {
                return this.parent;
            },
            getCurrent: function () {
                return this.current;
            }
        };

        return factory;

    }

})();