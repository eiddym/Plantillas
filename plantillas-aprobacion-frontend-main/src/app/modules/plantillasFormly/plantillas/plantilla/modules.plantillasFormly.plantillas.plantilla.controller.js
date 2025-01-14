(function() {

  'use strict';

  angular
    .module('app')
    .controller('PlantillaController', PlantillaController);

  /** @ngInject */
  function PlantillaController( UtilFormly, Message, Storage, $stateParams, $location, $log, $mdSidenav, DataService, restUrl, Panel, ArrayUtil, backUrl,  Documento) {
    var vm = this;

    var init_index = null; // indice del item que inicia el efecto dnd
    var to_index = null; // indice al que apunta el efecto dnd

    var init_index_l = null; // indice del item que inicia el efecto dnd y esta dentro de un layout
    var to_index_l = null; // indice al que apunta el efecto dnd y apunta a una posicion dentro de un layout
    var drop_layout = false; // true: indica si se dropeo dentro de un layout, para que dropCallback no se active
    var item_fg = null; // Objeto de referencia para fieldGroup del layout que inicia el efecto dnd
    var data_fg = null; // Objeto de referencia limpio(que tiene la estructura minima de los templates) para fieldGroup del layout que inicia el efecto dnd
    var to_item_fg = null; // Objeto de referencia para fieldGroup del layout al que se esta dropeando
    var to_data_fg = null; // Objeto de referencia limpio(que tiene la estructura minima de los templates) para fieldGroup del layout al que se esta dropeando
    var to_item_fg_num_cols = null; // Numero de columnas que puede soportar el layout al que se esta dropeando

    var cuenta = Storage.getUser();
    vm.id_plantilla = $stateParams.idPlantilla;
    vm.form_model = {};
    vm.items = [];
    vm.data = [];
    vm.existe_documento = false;
    vm.existe_datosGenerales = false;
    vm.existe_certificacionComprometido = false;
    vm.existe_recuperarEntregaAlmacen = false;
    vm.url_img = null;

    //cargamos funciones
    vm.funcionAgregar = funcionAgregar;
    vm.editItem = editItem;
    vm.removeItem = removeItem;
    vm.openEditItem = openEditItem;
    vm.cancelEditItem = cancelEditItem;
    vm.dropCallback = dropCallback;
    vm.endCallback = endCallback;
    vm.startCallback = startCallback;
    vm.dropLayoutCallback = dropLayoutCallback;
    vm.endLayoutCallback = endLayoutCallback;
    vm.startLayoutCallback = startLayoutCallback;
    vm.guardarPlantilla = guardarPlantilla;
    vm.vistaPrevia = vistaPrevia;
    vm.verPdf = verPdf;
    vm.openMenu = openMenu;
    vm.togglePalette = togglePalette;

    inicializarPlantilla();
    function inicializarPlantilla() {
        if ( vm.id_plantilla == 0 ) {
            // Nuevo
            vm.implicados = [];
            vm.items = [ newItem(UtilFormly.newTemplate('cite')) ];
            vm.data = [  UtilFormly.newTemplate('cite') ];
            vm.nombre = "Nueva plantilla";
        } else {
            DataService.get(restUrl + 'plantillasFormly/plantilla_formly/' + vm.id_plantilla)
            .then(function (respuesta) {
                vm.nombre = respuesta.datos.nombre;
                vm.abreviacion = respuesta.datos.abreviacion;
                vm.form_model = angular.fromJson(respuesta.datos.plantilla_valor);
                vm.items = transformGet(angular.fromJson(respuesta.datos.plantilla));
                vm.data = angular.fromJson(respuesta.datos.plantilla);
                for (var i = 0; i < vm.data.length; i++) {
                    if( vm.data[i].type=='datosGenerales' ) vm.existe_datosGenerales = true;
                    if( vm.data[i].type=='certificacionComprometido' ) vm.existe_certificacionComprometido = true;
                    if( vm.data[i].type=='recuperarEntregaAlmacen' ) vm.existe_recuperarEntregaAlmacen = true;
                }
                actualizarPagina(vm.data[0]);
                return DataService.get(restUrl + 'plantillasFormly/documento/?abreviacion='+vm.abreviacion)
            })
            .then(function (respuesta) {
                if(respuesta.datos.total>0){
                    vm.existe_documento = true;
                }
            })
        }
    }

    function togglePalette(ev) {
        $log.log("evento toggle-> ",ev);
        $mdSidenav('right').toggle();
    }

    function vistaPrevia() {
        vm.form_previo = UtilFormly.dataToView(vm.data);
        if (angular.isObject(vm.form_model)) vm.form_model = UtilFormly.clearModel(vm.data, vm.form_model);
        vm.vista_previa = true;
    }

    function guardarPlantilla() {
        var xplantilla_valor = angular.copy(vm.form_model);
        var abreviacion;
        if(vm.nombre){
            for (var k in xplantilla_valor) {
                if(k.indexOf("editorTexto")===-1 &&  k.indexOf("textarea")===-1){
                    delete xplantilla_valor[k];
                }else if(xplantilla_valor[k]==''){
                    delete xplantilla_valor[k];
                }
            }

            var plantilla = {
                nombre: vm.nombre,
                plantilla: angular.toJson(vm.data),
                plantilla_valor: angular.toJson(xplantilla_valor),
                _usuario_creacion: cuenta.id
            };

            abreviacion = (vm.existe_documento)? vm.abreviacion : Documento.generarAbreviacion(vm.nombre);

            DataService.get(restUrl+"plantillasFormly/plantilla_formly/abreviacion/"+abreviacion)
            .then(function (respuesta) {
                if(respuesta && angular.isDefined(respuesta.datos))
                    return respuesta.datos;
                else
                    throw new Error('sin respuesta');
            })
            .then(function (resp) {
                var abc = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];
                var xabc = { 'A':1, 'B':2, 'C':3, 'D':4, 'E':5, 'F':6, 'G':7, 'H':8, 'I':9, 'J':10, 'K':11, 'L':12, 'M':13, 'N':14, 'O':15, 'P':16, 'Q':17, 'R':18, 'S':19, 'T':20, 'U':21, 'V':22, 'W':23, 'X':24, 'Y':25, 'Z':26 };

                var sub_arr, max_num, pun;
                max_num=-1;
                pun = false
                if(resp.rows.count){
                    sub_arr = resp.rows.rows[0].abreviacion.split('-');
                    max_num = xabc[sub_arr[1]];
                    for (var i = 0; i < resp.rows.rows.length; i++) {
                        sub_arr = resp.rows.rows[i].abreviacion.split('-');
                        resp.rows.rows[i].num = sub_arr[1];
                        if( xabc[sub_arr[1]] > max_num )
                            max_num = xabc[sub_arr[1]];
                        if( resp.rows.rows[i].abreviacion==vm.abreviacion )
                            pun = true;

                    }
                    max_num++;
                    abreviacion+='-'+abc[max_num];
                }

                if( vm.id_plantilla>0 && resp.row.rows[0] && resp.row.rows[0].id_plantilla_formly==vm.id_plantilla ){
                    abreviacion = vm.abreviacion;
                }
                if( vm.id_plantilla>0 && pun){
                    abreviacion = vm.abreviacion;
                }
                if( vm.id_plantilla==0 && max_num==-1 && resp.row.count==1 )
                    abreviacion += '-A';
                plantilla.abreviacion = abreviacion;

                if (vm.id_plantilla == 0) {
                    //nuevo
                    plantilla._usuario_creacion = cuenta.id;
                    DataService.post(restUrl + "plantillasFormly/plantilla_formly", plantilla)
                    .then(function (respuesta) {
                        Message.show(respuesta.tipoMensaje, respuesta.mensaje);
                        $location.path('plantillas');
                    });
                }else {
                    //editando
                    plantilla._usuario_modificacion = cuenta.id;
                    DataService.put(restUrl + "plantillasFormly/plantilla_formly/" + vm.id_plantilla, plantilla)
                    .then(function (respuesta) {
                        Message.show(respuesta.tipoMensaje, respuesta.mensaje);
                        $location.path('plantillas');
                    });
                }
            })

        }else {
            Message.error('Debe llenar nombre y abreviacion');
        }

    }

    function transformGet(data) {
        var items = [];
        for (var i = 0; i < data.length; i++) {
            if( data[i].type!=="layout" ){
                items.push(newItem(data[i]));
            }else {
                var elements = [];
                for (var j = 0; j < data[i].fieldGroup.length; j++) {
                    elements.push(newItem( UtilFormly.getConfigItem(data[i].fieldGroup[j]) ));
                }
                data[i].fieldGroup = elements;
                items.push(newItem(data[i]));
            }
        }
        return items;
    }

    /**
        El orden en que se activan las funciones es diferente y para cada uno se construyo un camino
        CG: Contenedor General
        draguear: levantar
        dropear: dejar, poner, añadir
        * En los movimientos Drag And Drop (dnd)
            1.- cuando se jala de la paleta se puede activar dropCallback o bien dropLayoutCallback solo uno
            2.- Si se draguea del CG se activa startCallback y se puede dropear al CG o a un Layout. una vez que se termine de dropear automaticamente se activa endCallback
            3.- Si se draguea de un Layout se activa startLayoutCallback y se puede dropear al CG, al mismo layout o a otr layout, una vezque se termine de dropear automaticamente se activa endLayoutCallback
        * si se añade elementos con el boton + de la paleta, este solo añadira al CG
    */

    /**
      Funcion que guardara los datos de un elemento que se empieza a mover con dnd
      @param {Integer} index Indice del item que se clickeo para drag
      @param {Objeto} item Objeto item que tiene la forma de newItem
    */
    function startCallback(index, item){
        item.notvisualize = true;
        init_index = index;
    }
    /**
      Funcion que se encarga de mover los items
    */
    function endCallback(){
        if( to_index!==null ){
            if( init_index < to_index ) to_index--;
            ArrayUtil.mover( vm.items, init_index, to_index );
            ArrayUtil.mover( vm.data, init_index, to_index );
            delete vm.items[to_index].notvisualize;
            init_index = null;
            to_index = null;
        }else {
            if( to_index_l!==null ){
                if( vm.items[init_index].val.element[0].type!=="layout" ){
                    if( to_item_fg.length < to_item_fg_num_cols ){
                        if( to_item_fg.length==0 ) to_index_l = 0;
                        ArrayUtil.mover( vm.items, init_index, to_index_l, to_item_fg );
                        ArrayUtil.mover( vm.data, init_index, to_index_l, to_data_fg );
                        delete to_item_fg[to_index_l].notvisualize;
                    }else {
                        delete vm.items[init_index].notvisualize;
                        Message.error("No puede añadir mas elementos");
                    }
                }else {
                    delete vm.items[init_index].notvisualize;
                    Message.error("No puede añadir contenedores dentro de contenedores");
                }
            }else {
                delete vm.items[init_index].notvisualize;
            }
            init_index = null;
            to_index_l = null;
        }
    }

    /**
      Funcion que se ejecuta cuando se dropea un elemento a la lista general
      @param {Integer} index Indice del item que se clickeo para drag
      @param {Objeto} template Objeto que es el template del item que se movio
    */
    function dropCallback(index, template) {
        if(!drop_layout){
            
            if( init_index==null && init_index_l==null ){
                // si se esta jalando desde la paleta
                var tipo = template;
                try {
                    var mensajeError = "La plantilla solo puede tener un elemento ";
                  if (vm.existe_datosGenerales && tipo == 'datosGenerales') {
                    throw Error(mensajeError + tipo)
                  }
                  if (vm.existe_certificacionComprometido && tipo == 'certificacionComprometido') {
                    throw Error(mensajeError + tipo)
                  }
                  if (vm.existe_recuperarEntregaAlmacen && tipo == 'recuperarEntregaAlmacen') {
                    throw Error(mensajeError + tipo)
                  }
        
                  if (tipo == 'datosGenerales') vm.existe_datosGenerales = true;
                  if (tipo == 'certificacionComprometido') vm.existe_certificacionComprometido = true;
                  if (tipo == 'recuperarEntregaAlmacen') vm.existe_recuperarEntregaAlmacen = true;
                  template = UtilFormly.newTemplate(tipo);
                  var item = newItem(template);
                  if( vm.data.length==0 ) index = 0;
                  ArrayUtil.insert( vm.items, index, item );
                  ArrayUtil.insert( vm.data, index, UtilFormly.getConfigItem(template) );
                  delete vm.data[index].validation;
                } catch (error) {
                  if (error.name == 'Error') Message.error(error.message);
                }

            }else {
                to_index = index;
            }
        } else {
            drop_layout = false;
        }
    }

    /**
      Funcion que guardara los datos de un elemento que se empieza a mover con dnd
      @param {Integer} index Indice del item que se clickeo para drag
      @param {Objeto} item Objeto item que tiene la forma de newItem
      @param {Integer} index_l Indice del layout que se clickeo para drag
    */
    function startLayoutCallback(index, item, index_l){
        item.notvisualize = true;
        init_index_l = index;
        item_fg = vm.items[index_l].val.element[0].fieldGroup;
        data_fg = vm.data[index_l].fieldGroup;
    }
    /**
      Funcion que guardara los datos de un elemento que se empieza a mover con dnd
    */
    function endLayoutCallback(){
        if( to_index_l!==null ){
            if( to_item_fg===item_fg ){
                if( init_index_l < to_index_l ) to_index_l--;
                ArrayUtil.mover( item_fg, init_index_l, to_index_l );
                ArrayUtil.mover( data_fg, init_index_l, to_index_l );
                delete item_fg[to_index_l].notvisualize;
            }else {
                if( to_item_fg.length==0 ) to_index_l = 0;
                ArrayUtil.mover( item_fg, init_index_l, to_index_l, to_item_fg );
                ArrayUtil.mover( data_fg, init_index_l, to_index_l, to_data_fg );
                delete to_item_fg[to_index_l].notvisualize;
            }
            init_index_l = null;
            to_index_l = null;
        }else {
            if( to_index!==null ){
                ArrayUtil.mover( item_fg, init_index_l, to_index, vm.items );
                ArrayUtil.mover( data_fg, init_index_l, to_index, vm.data );
                delete vm.items[to_index].notvisualize;
            }else {
                delete item_fg[init_index_l].notvisualize;
            }
            init_index_l = null;
            to_index = null;
        }
    }

    /**
      Funcion que se ejecuta cuando se dropea un elemento a la lista
      @param {Integer} index Indice del item que se clickeo para drag
      @param {Objeto} template Objeto que es el template del item que se movio
      @param {Integer} index_l Indice del layout al que se esta dropeando
    */
    function dropLayoutCallback(index, template, index_l){
        drop_layout = true;
        to_item_fg = vm.items[index_l].val.element[0].fieldGroup;
        to_data_fg = vm.data[index_l].fieldGroup;
        to_item_fg_num_cols = vm.items[index_l].val.element[0].elementAttributes['num-cols'];
        if( init_index_l == null && init_index == null ){
            // si se esta jalando desde la paleta
            var tipo = template;
            template = UtilFormly.newTemplate(tipo);
            var item = newItem(template);
            if( tipo!="layout" ){
                if( to_item_fg.length < to_item_fg_num_cols ){
                    if(to_item_fg.length==0) index = 0;
                    ArrayUtil.insert( to_item_fg , index, item );
                    ArrayUtil.insert( to_data_fg, index, UtilFormly.getConfigItem(template) );
                    delete to_data_fg[index].validation;
                }else {
                    Message.error("No puede añadir mas elementos");
                }
            }else {
                Message.error("No puede añadir contenedores dentro de contenedores");
            }
        }else {
            to_index_l = index;
        }
    }

    /**
      Funcion que se dispara al añadir un elemento desde la paleta
      @param {String} tipo Tipo de template que se quiere añadir
    */
    function funcionAgregar(tipo) {
        try {
            if (vm.existe_datosGenerales && tipo == 'datosGenerales') {
                throw Error("La plantilla solo puede tener un elemento " + tipo)
            }
            if (vm.existe_certificacionComprometido && tipo == 'certificacionComprometido') {
                throw Error("La plantilla solo puede tener un elemento " + tipo)
            }
            if (vm.existe_recuperarEntregaAlmacen && tipo == 'recuperarEntregaAlmacen') {
                throw Error("La plantilla solo puede tener un elemento " + tipo)
            }
            
            if(tipo=='datosGenerales') vm.existe_datosGenerales = true;
            if(tipo=='certificacionComprometido') vm.existe_certificacionComprometido = true;
            if(tipo=='recuperarEntregaAlmacen') vm.existe_recuperarEntregaAlmacen = true;
            var template = UtilFormly.newTemplate(tipo);
            var item = newItem(template);
            vm.items.push( item );
            vm.data.push( UtilFormly.getConfigItem(template) );
            delete vm.data[vm.data.length-1].validation;
        } catch (error) {            
            if (error.name == 'Error') Message.error(error.message);
        }
    }

    /**
      Funcion que abre un panel para poder editar
      Si es un elemento radio o select modifica sus funciones al añadir o borrar elementos de los chips que son sus opciones
      @param {Objeto} item Objeto item que tiene la forma de newItem
      @param {Servicio} mdOpenMenu Servicio de angular material para abrir el menu
      @param {Evento} event Evento del servicio mdOpenMenu
    */

    function openEditItem(item, $mdOpenMenu, event){
        var ik;
        if(angular.isDefined($mdOpenMenu)) $mdOpenMenu(event);
        item.init = UtilFormly.getConfigItem(item.val.element[0]);
        if(item.val.element[0].type == "radio" || item.val.element[0].type == "select"){
            item.val.element[0].opciones = [];
            for (ik in item.val.element[0].templateOptions.options) {
                item.val.element[0].opciones.push(item.val.element[0].templateOptions.options[ik].value);
            }
            item.val.element[0].opciones.push = function() {
                Array.prototype.push.apply(this, arguments); // eslint-disable-line angular/controller-as-vm
                item.val.element[0].templateOptions.options.push({
                    value: arguments[0],
                    id: arguments[0]
                });
            };
            item.val.element[0].opciones.splice = function() {
                Array.prototype.splice.apply(this, arguments); // eslint-disable-line angular/controller-as-vm
                item.val.element[0].templateOptions.options.splice(arguments[0],arguments[1]);
            };
        }
        if(item.val.element[0].type == "lista"){
            item.val.element[0].opciones = [];
            for (ik in item.val.element[0].templateOptions.options) {
                item.val.element[0].opciones.push(item.val.element[0].templateOptions.options[ik]);
            }
            item.val.element[0].opciones.push = function() {
                Array.prototype.push.apply(this, arguments); // eslint-disable-line angular/controller-as-vm
                item.val.element[0].templateOptions.options.push( arguments[0] );
            };
            item.val.element[0].opciones.splice = function() {
                Array.prototype.splice.apply(this, arguments); // eslint-disable-line angular/controller-as-vm
                item.val.element[0].templateOptions.options.splice(arguments[0],arguments[1]);
            };
        }
    }

    function actualizarPagina(template_cite) {
        var to = template_cite.templateOptions;
        switch (to.tipoMembrete) {
            case 'sin membrete':
                vm.url_img = null;
            break;
            case 'externo':
                vm.url_img = backUrl+'public/membrete.png';
            break;
            default:
                vm.url_img = null;
            break;
        }
    }

    /**
      Funcion que actualizara la configuracion del template de un item
      @param {Objeto} item Objeto item que tiene la forma de newItem
      @param {Integer} i Indice del item que se clickeo para drag
      @param {Integer} i_l Indice del item que se clickeo para drag
    */
    function editItem(item, i, i_l){
        var xdata, xitem;
        if(angular.isUndefined(i_l)){
            // Si se esta editando elemento del contenedor gral
            xdata = vm.items.splice(i, vm.data.length);
            xdata.shift();

            xitem = newItem();
            xitem.val.element.push(UtilFormly.getConfigItem(item.val.element[0]));
            xdata.unshift(xitem);
            vm.items = vm.items.concat(xdata);

            vm.data[i] = UtilFormly.getConfigItem(item.val.element[0]);
            if(vm.data[i].type=="layout"){
                var elements = [];
                for (var j = 0; j < vm.data[i].fieldGroup.length; j++) {
                    elements.push(UtilFormly.getConfigItem(vm.data[i].fieldGroup[j].val.element[0]));
                    delete elements[elements.length-1].validation;
                }
                vm.data[i].fieldGroup = elements;
            }
            delete vm.data[i].validation;
            if(vm.data[i].type=="cite") actualizarPagina(vm.data[i]);
        }else {
            // si se esta editando elemento dentro de un layout
            xdata = vm.items[i_l].val.element[0].fieldGroup.splice(i, vm.data[i_l].fieldGroup.length);
            xdata.shift();

            xitem = newItem();
            xitem.val.element.push(UtilFormly.getConfigItem(item.val.element[0]));
            xdata.unshift(xitem);
            vm.items[i_l].val.element[0].fieldGroup = vm.items[i_l].val.element[0].fieldGroup.concat(xdata);

            vm.data[i_l].fieldGroup[i] = UtilFormly.getConfigItem(item.val.element[0]);
            delete vm.data[i_l].fieldGroup[i].validation;
            if(vm.data[i_l].fieldGroup[i].type=="cite") actualizarPagina(vm.data[i_l].fieldGroup[i]);
        }

    }

    /**
    Funcioon que elimina un item en la posicion
    @param {Objeto} item Objeto item que tiene la forma de newItem
    @param {Integer} i Indice del item que se clickeo para eliminar
    @param {Integer} i_l Indice del layout en que se encuentra un item
    */
    function removeItem(item, i, i_l){
        if(angular.isUndefined(i_l)){
            // Si se esta eliminando elemento del contenedor gral
            if( vm.data[i].type=='datosGenerales' )
                vm.existe_datosGenerales = false;
            if( vm.data[i].type=='certificacionComprometido' )
                vm.existe_certificacionComprometido = false;
            if( vm.data[i].type=='recuperarEntregaAlmacen' )
                vm.existe_recuperarEntregaAlmacen = false;
            vm.items.splice(i, 1);
            vm.data.splice(i, 1);
        }else {
            // si se esta eliminando elemento dentro de un layout
            if( vm.data[i_l].fieldGroup[i].type=='datosGenerales' )
                vm.existe_datosGenerales = false;
            if (vm.data[i].type == 'certificacionComprometido')
                vm.existe_certificacionComprometido = false;
            if (vm.data[i].type == 'recuperarEntregaAlmacen')
                vm.existe_recuperarEntregaAlmacen = false;
            vm.items[i_l].val.element[0].fieldGroup.splice(i, 1);
            vm.data[i_l].fieldGroup.splice(i, 1);
        }
    }

    /**
        Funcion que no actualizara la configuracion del template de un item
        @param {Objeto} item Objeto item que tiene la forma de newItem
    */
    function cancelEditItem(item){
        item.val.element.shift();
        item.val.element.push(item.init);
    }

    /**
        Funcion que retorna un nuevo objeto con forma de item, si se manda template lo crea junto a el
        @param {Objeto} template Objeto template formly
    */
    function newItem(template) {
        return { val:{ element: (template)? [template] : [] , model:{} }, init: {} };
    }

    function openMenu(item, event, index, index_l) {
        var data = {
            item: item,
            index: index,
            index_l: index_l
        }

        var config = {
            event: event,
            data: data,
            clickOutsideToClose: false,
            escapeToClose:false,
            controller: ['$scope', '$mdPanel', 'data', 'mdPanelRef',PanelItemController],
            templateUrl: 'app/modules/plantillasFormly/plantillas/plantilla/item.panel.html'
        };
        Panel.show(config);
    }

    function PanelItemController($scope, $mdPanel, data, mdPanelRef) {
        var vmp = $scope;
        vmp.item = data.item;
        vmp.input_valid = null;
        vmp.validaciones = null;
        vmp.titulos = {
            datosGenerales: 'Datos generales',
            inputt: 'Asunto',
            editorTexto: 'Editor de texto',
            documentosRelacionados: 'Documentos relacionados',
            titulo: 'Título',
            subtitulo: 'Subtítulo',
            parrafo: 'Párrafo',
            lista: 'Lista',
            layout: 'Contenedor',
            vacio: 'Espacio',
            input: 'Campo de texto ',
            radio: 'Selección radio',
            select: 'Selección simple',
            select_multiple: 'Selección multiple',
            textarea: 'Area de texto',
            checkbox: 'Checkbox',
            datepicker: 'Calendario',
            slider: 'Deslizador',
            switch: 'Interruptor',
            chips: 'Palabras clave',
            cajachica: 'Caja chica',
            consultaAlmacen: 'Consultar Almacen',
            recuperarEntregaAlmacen: 'Recuperar entrega almacen',
            certificacionComprometido: 'Certificación comprometido',
            listaContactos: 'Lista de contactos',
            calendario: 'Mi calendario'
        };

        //cargamos funciones
        vmp.xeditItem = xeditItem;
        vmp.xremoveItem = xremoveItem;
        vmp.xcancelEditItem = xcancelEditItem;

        //iniciamos la edicion
        vm.openEditItem(vmp.item);
        vmp.validaciones = [
            { name: "Ninguno", pattern: "" },
            { name: "Solo texto", pattern: "([a-zA-Zñáéíóú]+ ?)+" },
            { name: "Solo números", pattern: "\\d+" },
            { name: "Texto y números", pattern: "([a-zA-Z0-9ñáéíóú]+ ?)+" },
            { name: "Hora 24hrs", pattern: '^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$' },
            { name: "Email", pattern: '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$' }
        ];

        function xeditItem() {
            vm.editItem(data.item, data.index, data.index_l);
            closePanel();
        }
        function xremoveItem() {
            vm.removeItem(data.item, data.index, data.index_l);
            closePanel();
        }
        function xcancelEditItem() {
            vm.cancelEditItem(data.item);
            closePanel();
        }
        function closePanel() {
            mdPanelRef && mdPanelRef.close().then(function() { mdPanelRef.destroy(); });
        }
    }

    function verPdf(){
        if( UtilFormly.sizeObj(vm.formu_prueba.$error)==0 ){
            Documento.showPdf(angular.toJson(vm.data), angular.toJson(vm.form_model), 'prueba');
        }else {
            UtilFormly.recursiveShowError(vm.formu_prueba.$error);
        }
    }

  }
})();
