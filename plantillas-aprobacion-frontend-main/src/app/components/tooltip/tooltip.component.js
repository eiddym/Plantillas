(function() {
    'use strict'

    angular
    .module('app')
    .directive('tooltip', ['DataService', 'restUrl', linkTooltipController])


    function linkTooltipController(DataService, restUrl){

        var directive = {
            scope: {
                doc: '='
            },
            restrict: 'E',
            link: function (sc, elm, attrs, controller) { // eslint-disable-line no-unused-vars
                elm.hide();
                DataService.get(restUrl+'plantillasFormly/documento/'+sc.doc.id_documento+'/info')
                .then(function (respuesta) {
                    if(respuesta){
                        var $td = elm.parent().parent().parent().parent().parent().parent().parent();
                        $td.append(createTooltip(respuesta.datos));
                        var $card = $td.children('md-card');
                        $card.hide();
                        elm.parent().mouseover(function () {
                            $card.show();
                            elm.parent().css('cursor','pointer');
                        })
                        elm.parent().mouseout(function () {
                            $card.hide();
                            elm.parent().css('cursor','normal');
                        })
                    }

                })
            }
        };
        function createTooltip(html) {
            var new_html = '';
            new_html += '<md-card class="ap-tooltip"><md-card-content>';
            new_html += html;
            new_html += '</md-card-content></md-card>';
            return new_html;
        }

        return directive;
    }

  })();
