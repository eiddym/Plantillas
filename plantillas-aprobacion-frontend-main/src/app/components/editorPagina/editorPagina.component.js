(function () {
    'use strict';

    angular
        .module('app')
        .constant('simditorConfig', {
            placeholder: 'Ingrese contenido aquí...',
            toolbar: [ 'underline', 'ols', '|', 'indent', 'outdent', 'alignment', '|', 'table', 'link', 'hr' ],
            allowedTags: ['br', 'u', 'p', 'li', 'div'],
            toolbarHidden: true
        })
        .directive('ngSimditor', ['$timeout', 'simditorConfig', function ($timeout, simditorConfig) {
            Simditor.locale = 'en-US';  // eslint-disable-line no-undef
            Simditor.i18n['en-US'] = {  // eslint-disable-line no-undef
                'bold': 'Negrita',
                'italic': 'Itálica',
                'underline': 'Subrayar',
                'color': 'Color',
                'indent': 'Aumentar sangría',
                'outdent': 'Quitar sangría',
                'alignment': 'Alinear',
                'table': 'Tabla',
                'link': 'Enlace',
                'hr': 'Línea',
                'deleteRow': 'Eliminar fila',
                'insertRowAbove': 'Insertar fila arriba',
                'insertRowBelow': 'Insertar fila abajo',
                'deleteColumn': 'Eliminar columna',
                'insertColumnLeft': 'Insertar columna a la izquierda',
                'insertColumnRight': 'Insertar columna a la derecha',
                'paintRow': 'Pintar fila',
                'paintCell': 'Pintar celda',
                'dissolveRow': 'Despintar fila',
                'dissolveCell': 'Despintar celda',
                'deleteTable': 'Eliminar tabla',
                'addBorder': 'Agregar bordes',
                'removeBorder': 'Eliminar bordes',
                'listDisc': 'Circulos llenos',
                'listCircle': 'Circulos vacios',
                'listSquare': 'Cuadrados llenos',
                'listDecimal': '1, 2, 3, 4...',
                'listDecimal0': '01, 02, 03, 04...',
                'listUpperRoman': 'I, II, III, IV...',
                'listLowerRoman': 'i, ii, iii, iv...',
                'listUpperAlpha': 'A, B, C, D...',
                'listLowerAlpha': 'a, b, c, d...',
                'listGreek': 'Letras griegas',
                'toggleList': 'Añadir/quitar Lista'
            };

            // Runs during compile
            return {
                // name: '',
                // priority: 1,
                // terminal: true,
                scope: {
                    content: '=',
                    disabled: '=',
                    save: '@'
                }, // {} = isolate, true = child, false/undefined = no change
                // controller: function($scope, $element, $attrs, $transclude) {},
                // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
                restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
                template: '<textarea data-autosave="editor-content"></textarea>',
                // templateUrl: '',
                replace: true,
                // transclude: true,
                // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
                link: function ($scope, iElm, iAttrs, controller) { // eslint-disable-line no-unused-vars
                    var sc = $scope;
                    var editor = new Simditor( // eslint-disable-line no-undef
                        angular.extend({ textarea: iElm }, simditorConfig)
                    );

                    //cargar valor inicial si tiene
                    $timeout(function() {
                        editor.body[0].contentEditable = (angular.isDefined(sc.disabled))? !sc.disabled : true;
                        if(angular.isDefined(sc.content))  editor.setValue(sc.content);
                    })

                    //actualizar el content
                    var changed = function (ev) {  // eslint-disable-line no-unused-vars
                        sc.content = editor.getValue();
                    };

                    editor.on('valuechanged', changed);

                    editor.on('focus', function (ev) {  // eslint-disable-line no-unused-vars
                        angular.element(iElm).prev().prev().prev().addClass('active-editor');
                    });

                    editor.on('blur', function (ev) {  // eslint-disable-line no-unused-vars
                        $timeout(function () {
                            angular.element(iElm).prev().prev().prev().removeClass('active-editor');
                        }, 200);
                    });
                }
            };
        }]);

})();
