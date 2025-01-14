(function() {
    'use strict'

    angular
    .module('app')
    .factory('Util', ['$window', '$injector', UtilFactory]);

    /** @ngInject */
    function UtilFactory($window, $injector) {

        var $document = $window.document;

        var tmpl_print ='<!DOCTYPE html>' +
                        '<html lang="en">' +
                        '<head>' +
                            '<meta charset="UTF-8"/>' +
                            '<title>Document</title>' +
                            '<style>{css}</style>' +
                        '</head>' +
                        '<body>{body}' +
                        '</body>' +
                        '</html>';

        var factory = {
            toType: toType,
            isJson: isJson,
            getParams: getParams,
            print: print,
            fullscreen: fullscreen,
            nano: nano,
            popup: popup,
            filterFields: filterFields,
            addPropertiesFormly: addPropertiesFormly,
            size: size,
            getFkData: getFkData,
            serialize: serialize,
            serializeToJson: serializeToJson,
            getMenuOption: getMenuOption,
            searchField: searchField,
            lengthOptions: lengthOptions,
            formatDate: formatDate,
            filterItem: filterItem,
            getKeys: getKeys,
            getId: getId,
            parseSave: parseSave,
            truncate: truncate,
            loadCanvas: loadCanvas,
            stripHTML: stripHTML
        };

        return factory;

        function nano (template, data) {
            return template.replace(/\{([\w\.]*)\}/g, function (str, key) {
                var keys = key.split("."), v = data[keys.shift()];
                for (var i = 0, l = keys.length;i < l;i++)
                    v = v[keys[i]];
                return (typeof v !== "undefined" && v !== null) ? v : "";
            });
        }

        function toType (obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }

        function isJson (text) {
            return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
                replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
        }

        function truncate (text, length) {
            return text.length > length ? (text.substring(0, Math.min(length, text.length)) + '...') : text;
        }

        function stripHTML(texto) {
            return texto.replace(/(<([^>]+)>)/ig,"");
        }

        function getParams (p, args) {
            var first = p.first.defaultValue,
            second = p.second.defaultValue;

            p.first.position = p.first.position || 0;
            p.second.position = p.second.position || 1;

            var type = toType(args[p.first.position]);
            if (type != 'undefined') {
                if (type == p.first.type) {
                    first = args[p.first.position];
                    second = toType(args[p.second.position]) == p.second.type ? args[p.second.position] : p.second.defaultValue;
                } else {
                    if (type == p.second.type) {
                        first = toType(args[p.second.position]) == p.first.type ? args[p.second.position] : p.first.defaultValue;
                        second = args[p.first.position];
                    }
                }
            }
            return {
                first : first,
                second : second
            };
        }

        function print (html, css) {
            if (typeof css == 'string') {
                angular.element.get(css, function (response) {
                    var popup = $window.open('', 'print');
                    popup.document.write(nano(tmpl_print, {body : html, css : response}));
                    popup.document.close();
                    popup.focus();
                    popup.print();
                    popup.close();
                });
            } else {
                var popup = $window.open('', 'print');
                popup.document.write(nano(tmpl_print, {body : html, css : css}));
                popup.document.close();
                popup.focus();
                popup.print();
                popup.close();
            }

            return true;
        }

        function popup(url) {
            $window.open(url, 'print');
        }

        function fullscreen () {
            if (!$document.fullscreenElement &&    // alternative standard method
                !$document.mozFullScreenElement && !$document.webkitFullscreenElement && !$document.msFullscreenElement ) {  // current working methods
                if ($document.documentElement.requestFullscreen) {
                    $document.documentElement.requestFullscreen();
                } else if ($document.documentElement.msRequestFullscreen) {
                    $document.documentElement.msRequestFullscreen();
                } else if ($document.documentElement.mozRequestFullScreen) {
                    $document.documentElement.mozRequestFullScreen();
                } else if ($document.documentElement.webkitRequestFullscreen) {
                    $document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if ($document.exitFullscreen) {
                    $document.exitFullscreen();
                } else if ($document.msExitFullscreen) {
                    $document.msExitFullscreen();
                } else if ($document.mozCancelFullScreen) {
                    $document.mozCancelFullScreen();
                } else if ($document.webkitExitFullscreen) {
                    $document.webkitExitFullscreen();
                }
            }
        }

        function filterFields(data, fields) {
            if (typeof fields == 'undefined' || fields.length == 0) {
                return data;
            }
            var filter = [];
            for (var i in fields) {
                var field = searchField(data, fields[i]);
                if (field) {
                    filter.push(field);
                }
            }
            return filter;
        }

        function searchField(fields, field) {
            for (var i in fields) {
                if (fields[i].key == field) {
                    return fields[i];
                }
            }
            return null;
        }

        function addPropertiesFormly(data, formly) {
            if (typeof formly == 'undefined' || formly.length == 0) {
                return data;
            }
            for (var i in data) {
                var field = searchField(formly, data[i].key);
                if (field) {
                    //data[i] = angular.element.extend(true, data[i], field);
                    data[i] = angular.element.extend(true, {}, data[i], field);
                }
            }
            return data;
        }

        function size(obj) {
            return Object.keys(obj).length;
        }

        function parseSave(data, formly) {
            var Datetime = $injector.get('Datetime');
            var item = {};
            for (var i in data) {
                if (toType(data[i]) == 'date') {
                    item[i] = Datetime.format(data[i], 'YYYY-MM-dd');
                } else {
                    if (typeof data[i] == 'string' && (data[i] == 'true' || data[i] == 'false')) {
                        item[i] = item[i] == 'true';
                    } else {
                        item[i] = data[i];
                    }
                }
            }
            item.id = getId(item, formly);
            return item;
        }

        function getId(item, formly, key) {            
            if (item) {
                for (var i in formly) {
                    if (formly[i].templateOptions.label && formly[i].templateOptions.label == 'ID') {
                        if (key) {
                            return formly[i].key;
                        } else {
                            return item[formly[i].key];
                        }
                    }
                }
            }
            return null;
        }

        function getFkData(fieldsData, key, value) {
            fieldsData.filter(function (e) {
                if (e.key == key && e.templateOptions.options) {
                    e.templateOptions.options.filter(function(elem) {
                        if (elem.value == value) {
                            value = elem.name;
                        }
                    })
                }
            });
            return value;
        }

        function serialize(json) {
            var string = [];
            for (var i in json) {
                string.push(i + '=' + json[i]);
            }
            return string.join('&');
        }

        function serializeToJson(json, limpiar) {
            var string = [];
            for (var i in json) {
                if(limpiar){
                    for (var j in json[i]) {
                        if ( json[i][j]==null || json[i][j]==undefined || json[i][j]=='' ) {
                            delete json[i][j];
                        }
                    }
                }
                if(Object.keys(json[i]).length > 0)
                    string.push(i + '=' + angular.toJson(json[i]));
            }
            return string.join('&');
        }

        function getMenuOption(menu, url) {
            for (var i in menu) {
                if (typeof menu[i].submenu != 'undefined') {
                    var pages = menu[i].submenu;
                    for (var j in pages) {
                        if (pages[j].url == url) {
                            return [menu[i].label, pages[j].label];
                        }
                    }
                }
            }
            for (var k in menu) {
                if (menu[k].url == url) {
                    return [menu[k].label, false];
                }
            }
            return [false,false];
        }

        function lengthOptions(data, key) {
            for (var i in data) {
                if (data[i].key == key && data[i].templateOptions && data[i].templateOptions.options) {
                    return data[i].templateOptions.options.length;
                }
            }
            return 0;
        }

        function formatDate(date) {
            date = date.split('-')
            return [date[2], date[1], date[0]].join('/');
        }

        function filterItem(data) {
            var Datetime = $injector.get('Datetime');            
            for (var i in data) {
                if (typeof data[i] == 'string') {
                    if (Datetime.isDate(data[i])) {
                      if (!(/^[0-9]\s*$/).test(data[i]))
                        data[i] = new Date();
                    } else if (!/[a-zA-Z]+/g.test(data[i]) && /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/g.test(data[i]) && data[i].length == 8) {                        
                        data[i] = formatTime(data[i]);
                    }
                }
            }
            return data;
        }

        function formatTime(time) {
            time = time.split(':')
            return [time[0], time[1]].join(':')
        }

        function getKeys(data) {
            var types = {};

            data.map(function(el) {
                types[el.key] = el;
            });

            return types;
        }
        /**
         * Funcion para cargar pdf a un canvas
         * @param {texto o array} url data del pdf a renderizar
         * @param {texto} idCanvasContainer selectorID del div padre
         */

         /* eslint-disable */
        function loadCanvas(url, idCanvasContainer) {
            PDFJS.workerSrc = $injector.get('backUrl') + 'flibs/pdfjs/pdf.worker.js';
            var scale= 1.5;  //"zoom" factor for the PDF
            function renderPage(page) {
                var viewport = page.getViewport(scale);
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style = "width:100%; height:100%;";

                document.querySelector(idCanvasContainer).appendChild(canvas);
                page.render(renderContext);
            }

            function renderPages(pdfDoc) {
                for(var num = 1; num <= pdfDoc.numPages; num++)
                    pdfDoc.getPage(num).then(renderPage);
            }
            PDFJS.disableWorker = true;
            PDFJS.getDocument(url).then(renderPages);
        }
        /* eslint-enable */
    }
  })();
