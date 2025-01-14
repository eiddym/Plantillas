(function() {
  'use strict';

  angular
    .module('app')
    .config(ThemeConfig);

    /** @ngInject */
    function ThemeConfig($mdThemingProvider) {
        
        $mdThemingProvider.theme('default')
                .primaryPalette('teal') // red, pink, purple, deep-purple, indigo, blue, light-blue, cyan, teal, green, light-green, lime, yellow, amber, orange, deep-orange, brown, grey, blue-grey
                .accentPalette('orange')
               
    }

})();
