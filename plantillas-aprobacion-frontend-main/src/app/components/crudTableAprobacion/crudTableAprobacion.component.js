(function() {
    'use strict'

    angular
    .module('app')
    .component('crudTableAprobacion', {
        templateUrl : 'app/components/crudTableAprobacion/crudTableAprobacion.html',
        controller : ['$scope', 'DataService', 'Message', 'Modal', 'Util', '$timeout', 'ArrayUtil', 'Datetime', '$state', '$sce', '$window', CrudTableAprobacionController],
        controllerAs: 'vm',
        bindings: {
            url: '=',
            fields: '=',
            fks: '=',
            titleTable: '=',
            template: '=',
            permission: '=',
            column: '=',
            formly: '=',
            editable: '=',
            eventSave: '=',
            dialogController: '=',
            order: '=',
            optionSelected: '=',
            condiciones: '=',
            buttons: '=',
            buttonAgregar: '=',
            headButtons: '=',
            idShow: '=',
            include: '=',
            queryExtra: '=',
            usuario: '=',
            informacionBienes: '=',
            estadoSw: '=', // TODO solo funciona con estado= 'ACTIVO'|'INACTIVO'
            onlyFields: '=',
            searchPro: '=',
            estadoChecks: '=',
            estadoOpciones: '=',
            items: '=?',
            habilitarSeleccion: '=',
            node: '@',
            seleccionados:'='
        }
    });

    function CrudTableAprobacionController($scope, DataService, Message, Modal, Util, $timeout, ArrayUtil, Datetime, $state, $sce, $window) {
        var vm = this;
        var bookmark;
        var limit = 10;

        vm.headers = [];
        vm.items = null;
        vm.item = null;
        // vm.node = true; // Habilitar para nodejs
        vm.tipo_busqueda='todos';
        vm.campo_seleccionado={};
        vm.busqueda_estado = [];

        vm.prevent = prevent;
        vm.estadoModificado = estadoModificado;
        vm.add = add;
        vm.edit = edit;
        vm.delete = deleteItem;
        vm.print = print;
        vm.save = save;
        vm.saveAll = saveAll;
        vm.removeFilter = removeFilter;
        vm.showFilter = showFilter;
        vm.getItems = getItems;
        vm.buttonEvent = buttonEvent;
        vm.dataGrid = {};
        vm.seleccionar = false;
        vm.seleccionarTodos = seleccionarTodos;
        vm.seleccionando = seleccionando;
        vm.objs = {};
        vm.adjunto = {"id": 0};
        vm.aprobarAdjunto = aprobarAdjunto;
        vm.aprobarDocumento = aprobarDocumento;
        // para permitir ver informacion pequeña de documentos
        vm.sw_cite = ['/documentos', '/impresion', '/aprobacion', '/en_curso', '/firmar'].indexOf($state.current.url) !== -1;

        vm.permissions = {
            create: true,
            read: true,
            update: true,
            delete: true,
            print: false,
            filter: true
        }

        vm.limitOptions = [limit, 25, 50];
        // vm.limitOptions = [limit];

        vm.options = {
            rowSelection: false,
            multiSelect: false,
            autoSelect: true,
            decapitate: false,
            largeEditDialog: true,
            boundaryLinks: true,
            limitSelect: true,
            pageSelect: false
        }

        vm.query = {
            order: (vm.fields.indexOf('_fecha_modificacion'))? '-_fecha_modificacion': '',
            limit: limit,
            page: 1,
            filter: ''
        }

        vm.filter = {
            options: {
                debounce: 500
            }
        };

        activate();

        function activate() {
            getFields();
        }

        function aprobarAdjunto (id_adjunto) {  
            openDialogConfirAdjunto(event, id_adjunto);
            
        }

        function aprobarDocumento (id_documento) {
            openDialogConfirDocumento(event, id_documento);
        }

        function seleccionando (){
          if(angular.isFunction(vm.seleccionados)) $timeout(function(){ vm.seleccionados(existeSeleccionado()); });
        }

        function estadoModificado(item) {
            item._usuario_modificacion = vm.usuario;
            DataService.put(vm.url+Util.getId(item, vm.fieldsData), angular.copy(item));
            if(vm.fields.indexOf('_usuario_modificacion')===-1) delete item._usuario_modificacion;
        }

        function seleccionarTodos() {
            if(!vm.seleccionar) {
                vm.items.data.map (function (item) {
                    item.selected = true;
                });
            } else {
                vm.items.data.map (function (item) {
                    item.selected = false;
                });
            }
            if(angular.isFunction(vm.seleccionados)) vm.seleccionados(existeSeleccionado());
        }

        function prevent(ev) {
            ev.stopPropagation();
        }

        function getItems () {
            if (vm.fieldsData) {
                vm.promise = getData();
            }
        }

        function add(event, item) {
            var id = Util.getId(item, vm.fieldsData);
            if (id) {
                getItem(event, false, id);
            } else {
                item = {};
                item._usuario_creacion = vm.usuario;
                item._fecha_creacion = new Date();
                item._fecha_modificacion = new Date();
                openDialog(event, true, item);
            }
        }

        function save (data) {

            var obj = {};

            for (var i in data) {
                obj[i] = vm.dataGrid[data[i]];
            }

            DataService.save(vm.url, Util.parseSave(obj, vm.fieldsData))
            .then(function(data) {
                if (data) {
                    Message.show(data.tipoMensaje,data.mensaje);
                }
            });
        }


        function saveAll () {
            var data = vm.dataGrid,
                c = 0,
                length = vm.headers.length,
                dataSave = [],
                obj = {},
                promises = [];

            for (var i in data) {
                var key = i.split('_');
                key.shift();
                key = key.join('_');
                obj[key] = data[i];
                c++;
                if (c % length == 0) {
                    dataSave.push(obj);
                    promises.push(savePromise(obj));
                    obj = {};
                }
            }
            Promise.all(promises)
            .then(function (response) {
                for (var i in response) {
                    if (response[i] === false) {
                        Message.error('Se produjo un error al grabar todos los datos.');
                        throw new Error('Error al grabar todos los datos');
                    }
                }
                Message.success('Se guardaron todos los datos');
            });
        }

        function savePromise(data) {
            return new Promise(function (resolve, reject) {
                DataService.save(vm.url, Util.parseSave(data, vm.fieldsData))
                .then(function(data) {
                    if (data) {
                        resolve(true);
                    } else {
                        reject(false);
                    }
                }).catch(function () {
                    reject(false);
                });
            });
        }

        function edit (event, item) {
            vm.add(event, item);
        }

        function deleteItem (event, item) {
            Modal.confirm('Se eliminará el registro de forma permanente, ¿Está seguro?.', function () {
                DataService.delete( vm.url , Util.getId(item, vm.fieldsData))
                .then(function() {
                    Message.success('El registro se eliminó correctamente.');
                    vm.getItems();
                })
                .catch(function () {
                    Message.error();
                });
            }, null, event);
        }

        function getItem(event, add, id) {
            DataService.get( vm.url, id + (vm.include ? '?include=' + vm.include: ''))
            .then(function(data) {
              if (data && data.datos[Util.getId(data, vm.fieldsData, true)]) {
                    data.datos._usuario_modificacion = vm.usuario;
                    data.datos._fecha_modificacion = new Date();
                    openDialog(event, add, Util.filterItem(data.datos));
                }
            });
        }

        function openDialog(event, add, item) {
            var config = {
                event: event,
                data: item,
                title: add ? 'Agregar' : 'Editar',
                add: add,
                fields: vm.fieldsData,
                column: vm.column || 1,
                templateUrl : vm.template || 'app/components/crudTableAprobacion/dialog.crudTable.html',
                done : function (answer, $mdDialog) {
                    if (answer == 'save') {
                        delete item._fecha_creacion;
                        delete item._fecha_modificacion;
                        DataService.save( vm.url, Util.parseSave(item, vm.fieldsData))
                        .then(function(data) {
                            if (data) {
                                Message.show(data.tipoMensaje,'', null, 0);
                                $mdDialog.hide();
                                vm.getItems();
                                if (vm.eventSave) {
                                    vm.eventSave(data);
                                }
                            }
                        });
                    }
                }
            };
            if (vm.dialogController) {
                config.controller = vm.dialogController;
            }
            Modal.show(config);
        }

        function openDialogConfirAdjunto(event, id_adjunto) {
            var config = {
                event: event,
                title: 'Confirmar Aprobación de Documento Adjunto',
                column: vm.column || 1,
                templateUrl : vm.template || 'app/components/crudTableAprobacion/dialog.confirmarAprobacionAdjunto.html',
                done : function (answer, $mdDialog) {
                    if (answer == 'save') {
                        DataService.post(vm.url + '/adjunto', { id_adjunto: id_adjunto })
                        .then(function (response) {
                            if(response && response &&  response.finalizado) {
                                vm.urlAbrir = $sce.trustAsResourceUrl(response.link);
                                $mdDialog.hide();
                                $window.location.href = vm.urlAbrir;
                            } else {
                                Message.error('Error en la solicitud.');
                            }
                        })
                        .catch(function (error) {
                            Message.error(error.mensaje || error.data.mensaje || 'Error en la solicitud.');
                        })
                    }
                }
            };
            if (vm.dialogController) {
                config.controller = vm.dialogController;
            }
            Modal.show(config);
        }

        function openDialogConfirDocumento(event, id_documento) {
            var config = {
                event: event,
                title: 'Confirmar Aprobación de Documento',
                column: vm.column || 1,
                templateUrl : vm.template || 'app/components/crudTableAprobacion/dialog.confirmarAprobacionDocumento.html',
                done : function (answer, $mdDialog) {
                    if (answer == 'save') {
                        DataService.post(vm.url, { id_documento: id_documento })
                        .then(function (response) {
                            if(response && response &&  response.finalizado) {
                                vm.urlAbrir = $sce.trustAsResourceUrl(response.link);
                                $mdDialog.hide();
                                $window.location.href = vm.urlAbrir;
                            } else {
                                Message.error('Error en la solicitud.');
                            }
                        })
                        .catch(function (error) {
                            Message.error(error.mensaje || error.data.mensaje || 'Error en la solicitud.');
                        })
                    }
                }
            };
            if (vm.dialogController) {
                config.controller = vm.dialogController;
            }
            Modal.show(config);
        }

        function getData() {
            if (vm.include) {
                vm.query.include = vm.include;
            }
            if (vm.queryExtra) {
                for (var k in vm.queryExtra) {
                    vm.query[k] = vm.queryExtra[k];
                }
            }
            if(vm.onlyFields){
                vm.query['fields'] = '';
                for (var i = 0; i < vm.fields.length; i++) {
                    vm.query['fields'] += vm.fields[i]+",";
                }
                vm.query['fields'] = vm.query['fields'].substring(0, vm.query['fields'].length-1);
            }
            if(vm.estadoChecks){
                if(vm.busqueda_estado.length>0) vm.query['estado'] = vm.busqueda_estado.toString();
                else delete vm.query['estado'];
            }
            
            if(vm.searchPro){
                vm.query['searchPro'] = 1;
                vm.query['tipoBus'] = vm.tipo_busqueda;
                if(vm.tipo_busqueda!='todos' || vm.tipo_busqueda!='documento'){
                    if(vm.tipo_busqueda=='campo'){
                        vm.query['campoSel'] = vm.campo_seleccionado.name || vm.headers[1].name;
                    }
                }else {
                    delete vm.query['tipoBus'];
                    delete vm.query['campoSel'];
                    delete vm.query['fFin'];
                }
                if(vm.check_fechas){
                    if (!Datetime.isDate(vm.fecha_inicio))
                    vm.fecha_inicio = new Date(Datetime.subtractDays(new Date(), 365));
                    if(!Datetime.isDate(vm.fecha_final))
                    vm.fecha_final = new Date();
                    vm.query['fIni'] = vm.fecha_inicio;
                    vm.query['fFin'] = new Date(Datetime.addDays(vm.fecha_final, 1));
                    vm.query['fIni'].setHours(0);
                    vm.query['fFin'].setHours(0);
                }else {
                    delete vm.query['fIni'];
                    delete vm.query['fFin'];
                }
            }
            return DataService.list( vm.url, vm.query)
            .then(function(data) {
                if (data) {
                  var items = {};
                  var datos = data.datos;
                  items.count = datos.total;
                  items.results = datos.resultado;
                  items.data = datos.resultado;
                  items.data = filterItems(datos.resultado);
                  vm.items = items;
                  if (items.count === 0) {
                    Message.show(
                      "INFORMACION",
                      "Usted no tiene documentos pendientes para aprobar con Ciudadanía Digital",
                      null,
                      0
                    );
                  }
                  if (angular.isFunction(vm.seleccionados))
                    vm.seleccionados(existeSeleccionado());
                }
            });
        }

        function existeSeleccionado() {
          var cont = 0;
          var respuesta = false;
          vm.items.data.map (function (item) {
            if(item.selected === true) cont++;
          });
          if(cont > 0) respuesta = true;
          return respuesta;
        }

        function getFields() {
            DataService.fields(vm.url)
            .then(function(data) {
                if (data) {
                    vm.fieldsData = Util.filterFields(data, vm.fields);
                    vm.fieldsData = Util.addPropertiesFormly(vm.fieldsData, vm.formly);

                    var arr = ["_usuario_creacion","_usuario_modificacion","_fecha_creacion","_fecha_modificacion"];
                    for (var i in vm.fieldsData) {
                      var xfield = vm.fieldsData[i];
                      var arrindex = arr.indexOf(xfield.key);
                      if( arrindex != -1){
                        xfield.templateOptions.required = false;
                        xfield.templateOptions.disabled = true;
                        if(arrindex == 2) xfield.templateOptions.label = "Fecha de creación";
                        if(arrindex == 3) xfield.templateOptions.label = "Fecha de modificación";
                      }else if(xfield.templateOptions.label == "ID"){
                        xfield.templateOptions.required = false;
                      }else if (xfield.key.indexOf("fid_") == 0) {
                        var object = {};
                        var options = xfield.templateOptions.options;
                        for (var k in options) {
                          object[options[k].value] = options[k].name  ;
                        }
                        xfield.templateOptions.fkeys = object;
                      }
                    }

                    addOptionSelected(vm.fieldsData, vm.optionSelected);
                    DataService.setFormly(vm.fieldsData);

                    setHeaders(vm.fieldsData);
                    if (vm.editable) {
                        vm.types = Util.getKeys(vm.fieldsData);
                    }
                    if (vm.permission) {
                        vm.permissions = angular.merge(vm.permissions, vm.permission);
                    }
                    if (vm.condiciones) {
                        vm.query = angular.merge(vm.query, vm.condiciones);
                    }
                    vm.getItems();
                }
            });
        }

        function addOptionSelected(data, options) {
            for (var i in data) {
                if (data[i].type == 'select') {
                    var item = Util.searchField(options, data[i].key);
                    if (item) {
                        ArrayUtil.insert(data[i].templateOptions.options, 0, {
                            name: item.text || 'Seleccione',
                            value: item.value || ''
                        });
                    }
                }
            }
        }

        function filterItems(data) {
            var fields = typeof vm.fields != 'undefined';
            var fks = typeof vm.fks != 'undefined';
            var array = [];
            for (var i in data) {
                for (var j in data[i]) {
                    if (fields && vm.fields.indexOf(j) == -1) {
                        delete data[i][j];
                    } else {
                        if (typeof vm.editable == 'undefined') {
                            if (fks && vm.fks.indexOf(j) != -1) {
                                if (Util.toType(data[i][j]) == 'array') {
                                    var l = Util.lengthOptions(vm.fieldsData, j);
                                    if (l > 1 && l == data[i][j].length) {
                                        data[i][j] = 'Todos';
                                    } else {
                                        var text = [];
                                        /*eslint-disable no-unused-vars*/
                                        data[i][j].map(function (e, i) {
                                          /*eslint-enable no-unused-vars*/
                                           text.push(Util.getFkData(vm.fieldsData ,j, e));
                                        });
                                        data[i][j] = text.join(', ');
                                    }
                                } else {
                                    data[i][j] = Util.getFkData(vm.fieldsData ,j, data[i][j]);
                                }
                            } else if (typeof data[i][j] == 'string' && !/[a-zA-Z]+/g.test(data[i][j]) && /^-?[0-9.]+\-?[0-9]+\-?[0-9]*$/g.test(data[i][j]) && data[i][j].length == 10) {
                                data[i][j] = Util.formatDate(data[i][j]);
                            } else if (typeof data[i][j] == 'string' && !/[a-zA-Z]+/g.test(data[i][j]) && /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/g.test(data[i][j]) && data[i][j].length == 8) {
                              data[i][j] = formatTime(data[i][j])
                            }
                        }
                    }
                }
                array.push(orderItem(data[i], vm.fieldsData, i));
            }
            return array;
        }

        function orderItem(data, fields, pos) {

            if (typeof fields == 'undefined' || fields.length == 0) {
                return data;
            }

            var item = {};

            for (var i in fields) {
                var field = fields[i].key;
                if (typeof data[field] != 'undefined') {
                    if (vm.editable) {
                        if (typeof data[field] == 'string' && !/[a-zA-Z]+/g.test(data[field]) && /^-?[0-9.]+\-?[0-9]+\-?[0-9]*$/g.test(data[field]) && data[field].length == 10) {
                            var date = data[field].split('-');
                            vm.dataGrid[pos + '_' + field] = new Date(date[0], date[1]-1, date[2]);
                        } else {
                            vm.dataGrid[pos + '_' + field] = data[field];
                        }
                        item[field] = pos + '_' + field;
                    } else {
                        item[field] = data[field];
                    }
                }
            }
            return item;
        }

        function formatTime(time) {
            time = time.split(':')
            return [time[0], time[1]].join(':')
        }

        function setHeaders(data) {
            var headers = [];
            var order = typeof vm.order == 'undefined';
            for (var i in data) {
                headers.push({
                    name: data[i].key,
                    title: data[i].templateOptions.label,
                    order: order || (vm.order && vm.order.indexOf(data[i].key) != -1)
                });
            }
            vm.headers = headers;
        }

        function print(event, item) {
            DataService.pdf(vm.url + 'print/' + Util.getId(item, vm.fieldsData) + '/')
            .then(function (data) {
                Modal.show({
                    event: event,
                    data: data.url,
                    title: 'Impresión',
                    templateUrl : 'app/components/crudTableAprobacion/dialog.pdf.html',
                    controller: ['$scope', '$mdDialog', 'data', 'title', PdfController]
                });
            });
        }

        function PdfController($scope, $mdDialog, data, title) {
            var vm = $scope;

            vm.title = title;
            vm.data = data;
            vm.hide = $mdDialog.hide;
            vm.cancel = $mdDialog.cancel;
        }

        function showFilter() {
            vm.filter.show = true;
            $timeout(function () {
                angular.element('#crud-table-input').focus();
            }, 300);
        }

        function removeFilter () {
            vm.filter.show = false;
            vm.query.filter = '';
            vm.tipo_busqueda='todos';

            if(vm.filter.form.$dirty) {
                vm.filter.form.$setPristine();
            }
        }

        $scope.$watch('vm.query.filter', function (newValue, oldValue) {
            if(!oldValue) {
                bookmark = vm.query.page;
            }

            if(newValue !== oldValue) {
                vm.query.page = 1;
            }

            if(!newValue) {
                vm.query.page = bookmark;
            }

            vm.getItems();
        });

        //New Bottons
        function buttonEvent(event, item, callback) {
            callback(event, Util.getId(item, vm.fieldsData));
        }

    }

})();
