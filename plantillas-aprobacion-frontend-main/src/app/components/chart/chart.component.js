(function () {
    'use strict';

    angular
        .module('app')
        .constant('charColors', {
            bo: {
                rojo: 'rgba(211, 47, 47, 0.7)',
                azul: 'rgba(48, 79, 254, 0.7)',
                amarillo: 'rgba(255, 171, 0, 0.7)',
                celeste: 'rgba(0, 184, 212, 0.7)',
                lila: 'rgba(123, 31, 162, 0.7)',
                naranja: 'rgba(230, 74, 25, 0.7)',
                verde: 'rgba(104, 159, 56, 0.7)'
            },
            bg: {
                rojo: 'rgba(211,47,47, 0.1)',
                azul: 'rgba(48, 79, 254, 0.1)',
                amarillo: 'rgba(255, 171, 0, 0.1)',
                celeste: 'rgba(0, 184, 212, 0.1)',
                lila: 'rgba(123, 31, 162, 0.1)',
                naranja: 'rgba(230, 74, 25, 0.1)',
                verde: 'rgba(104, 159, 56, 0.1)'
            }
        })
        .directive('chartGraph', ['$timeout', '$window', function ($timeout, $window) {
            var options_default = {
                line: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                autoSkip: false
                            }
                        }]
                    },
                    legend: {
                        labels: {
                            boxWidth: 15
                        }
                    },
                    tooltips: {
                        mode: 'x-axis'
                    }
                },
                bar: {
                    legend: {
                        labels: {
                            boxWidth: 15
                        }
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                autoSkip: false
                            }
                        }]
                    }

                }
            };
            // Runs during compile
            return {
                scope: {
                    ancho: '=',
                    alto: '=',
                    tipo: '=',
                    datos: '=',
                    actualizar: '=', // flag disparador del watch actualizar
                    reiniciar: '=', // flag disparador del watch reiniciar
                    opciones: '='
                },
                restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
                link: function (sc, elm, attrs, controller) { // eslint-disable-line no-unused-vars
                    $timeout(function () {
                        var canvas, xchart;
                        elm.wrap('<div></div>');
                        elm.parent().css('overflow','auto');
                        // elm.parent().css('border','1px solid #c3c3c3');
                        // elm.parent().css('box-shadow','3px 3px 3px 0 solid #e3e3e3');

                        iniciar();
                        /**
                          Funcion que inicia o reinicia el componente chart
                        */
                        function isMobile() { return angular.isDefined($window.orientation); }

                        function iniciar() {
                            if(isMobile()){
                                if(sc.ancho>750) sc.ancho=750;
                                if(sc.alto>320) sc.alto=320;
                            }
                            elm.parent().css('width',((sc.ancho)||400));
                            elm.parent().css('height',((sc.alto)||250));
                            elm.html('<div class="chart-graph" style="width:'+(sc.ancho-25 || 400)+'px;height:'+(sc.alto-25||250)+'px;"><canvas></canvas></div>');
                            canvas = elm.children('div').children('canvas');
                            canvas.attr('width',(sc.ancho-20||400));
                            canvas.attr('height',(sc.alto-20||250));
                            xchart = new Chart(canvas, { // eslint-disable-line no-undef
                                type: sc.tipo || 'line',
                                data: sc.datos,
                                options: sc.opciones || options_default[sc.tipo || 'line']
                            });
                        }
                        /**
                          Funcion que se debe activar cambiando solo datos o labels del objeto sc.datos
                          vm.ch.datos.labels.shift();
                          vm.ch.datos.labels.push(newRandom()+'-02-2017');
                          vm.ch.datos.datasets[0].data.shift();
                          vm.ch.datos.datasets[0].data.push(newRandom());
                          o bien actuializar los arrays completos
                          vm.chart.datos.labels = createLabels(anio,mes);
                          vm.chart.datos.datasets[0].data = getDataRandom(vm.chart.datos.labels.length);
                        */
                        sc.$watch('actualizar', function () { if(angular.isDefined(sc.actualizar)) xchart.update(); })
                        /**
                          Funcion que reinicia el objeto xchart con los parametros ocnfigurados (mas que todo cuando se quiere cambiar de tipo)
                        */
                        sc.$watch('reiniciar', function () { if(angular.isDefined(sc.reiniciar)) iniciar(); });

                    })
                }
            };
        }]);

})();
