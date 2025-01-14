(function () {
  'use strict';

  angular
    .module('app')
    .controller('MonitoreoController', MonitoreoController);

  /** @ngInject */
  function MonitoreoController(charColors, DataService, restUrl, Modal, $window, $filter, Documento) {
    var vm = this,
      fecha_actual = new Date(),
      limite_inferior = 1990,
      limite_inferior_contable = 2018,
      limite_superior = 2130;
      

    iniciar();
    reiniciarChart();
    vm.refrescarChart = refrescarChart;
    vm.reiniciarChart = reiniciarChart;
    vm.paginar = paginar;
    vm.mostrarOcultar = mostrarOcultar;
    vm.generarPDF = generarPDF;
    var date = new Date(),
      y = date.getFullYear(),
      m = date.getMonth();
    vm.fechaInicial = new Date(y, m, 1);
    vm.fechaFinal = new Date();
    vm.cabeceraPresupuesto = cabeceraPresupuesto;
    vm.generarNombre = generarNombre;
    vm.filasPresupuesto = filasPresupuesto;
    vm.consultarComprometido = consultarComprometido;
    vm.consultarPagado = consultarPagado;
    vm.vistaPrevia = vistaPrevia;
    vm.busqueda = {};

    function iniciar() {
      vm.chart = {};

      vm.graficos = [
        { cod: 0, nombre: 'Cantidad de documentos por mes', labelChart: '# Visitas por día', tipoChart: 'line' },
        { cod: 4, nombre: 'Presupuesto', labelChart: 'Presupuesto', tipoChart: 'presupuesto' },
        { cod: 5, nombre: 'Documentos por estado y usuario', labelChart: 'estados', tipoChart: 'estados' },
        { cod: 6, nombre: 'Documentos pendientes por usuario', labelChart: 'pendientes', tipoChart: 'pendientes' },
        { cod: 7, nombre: 'Comprometido', labelChart: 'Comprometido', tipoChart: 'comprometido' },
        { cod: 8, nombre: 'Pagado', labelChart: 'Pagado', tipoChart: 'pagado' },
        { cod: 9, nombre: 'Reporte contable', labelChart: 'Reporte contable', tipoChart: 'reporteContable' }
      ];
      vm.grafico = vm.graficos[0];
      vm.mes = fecha_actual.getMonth();
      vm.meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      vm.docsContables = ['IPBS', 'IPV', 'IPSPCL-A'];
      vm.tipoInformePago = 1;
      vm.anio = fecha_actual.getFullYear() - limite_inferior;
      vm.anios = [];
      vm.aniosContables = [];
      for (var i = limite_inferior - 1; i < limite_superior; i++) vm.anios.push(i + 1);
      for (var j = limite_inferior_contable - 1; j < fecha_actual.getFullYear(); j++) vm.aniosContables.push(j + 1);
      
      vm.anioContable = vm.aniosContables.length -1;
      DataService.get(restUrl + 'seguridad/usuario/?fields=id_usuario,usuario,nombres,apellidos&order=nombres&estado=ACTIVO')
        .then(function (respuesta) {
          vm.usuarios = respuesta.datos.resultado;
          vm.usuario = vm.usuarios[0].id_usuario;
        })

      DataService.get(restUrl + 'presupuesto/gestiones')
        .then(function (respuesta) {
          vm.gestiones = respuesta.datos;
          vm.gestionActual = vm.anio + limite_inferior;
          vm.gestion = 0;
        })
    }

    function reiniciarChart() {
      vm.busqueda = {};
      vm.ordenInverso = false;
      vm.chart.tipo = vm.grafico.tipoChart;
      vm.gestion = 0;
      if (vm.chart.tipo === 'presupuesto') {
        vm.ordenarPor = 'descripcion';
        consultarPresupuesto(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'estados') {
        vm.ordenarPor = 'nombres';
        consultarDocumentosUsuarioEstados(vm.fechaInicial, vm.fechaFinal);
      } else if (vm.chart.tipo === 'pendientes') {
        vm.ordenarPor = 'nombres';
        consultarDocumentosPendientes();
      } else if (vm.chart.tipo === 'comprometido') {
        vm.ordenarPor = 'descripcion';
        consultarComprometido(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'pagado') {
        vm.ordenarPor = 'descripcion';
        consultarPagado(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'reporteContable') {
        vm.ordenarPor = '-cite';
        consultarReporteContable(vm.tipoInformePago, vm.anioContable);

      } else {
        vm.chart.datos = {
          labels: [],
          datasets: [
            {
              label: vm.grafico.labelChart + ' total.',
              data: [],
              backgroundColor: charColors.bg.amarillo,
              borderColor: charColors.bo.amarillo,
              borderWidth: 1
            },
            {
              label: vm.grafico.labelChart + ' con relación.',
              data: [],
              backgroundColor: charColors.bg.verde,
              borderColor: charColors.bo.verde,
              borderWidth: 1
            },
            {
              label: vm.grafico.labelChart + ' sin relación.',
              data: [],
              backgroundColor: charColors.bg.azul,
              borderColor: charColors.bo.azul,
              borderWidth: 1
            }
          ]
        };
        vm.chart.reiniciar = !vm.chart.reiniciar;
        vm.page = 1;
        vm.page_cant = 20;
        vm.page_text = '' + ((vm.page - 1) * vm.page_cant + 1) + '-' + (vm.page * vm.page_cant);
        vm.page_tot = 1;
        refrescarChart();
      }
    }

    function consultarPresupuesto(gestion) {
      DataService.get(restUrl + 'presupuesto/saldos?gestion=' + gestion)
      .then(function (respuesta) {
        vm.headers = [
          { name: 'numero', title: 'Número', mostrar: true },
          { name: 'descripcion', title: 'Descripción', mostrar: true },
          { name: 'inicial', title: 'Inicial', mostrar: true },
          { name: 'comprometido', title: 'Comprometido', mostrar: true },
          { name: 'pagado', title: 'Pagado', mostrar: true },
          { name: 'modificado', title: 'Modificado', mostrar: true },
          { name: 'vigente', title: 'Vigente', mostrar: true },
          { name: 'saldo', title: 'Saldo', mostrar: true }
        ];
        vm.items = [];
        respuesta.datos.map(function (item) {
          vm.items.push({
            comprometido: $filter('number')(parseFloat(item.comprometido), 2).replace(/,/g, "").replace(".", ","),
            descripcion: item.descripcion == null ? '-' : item.descripcion,
            inicial: $filter('number')(parseFloat(item.inicial), 2).replace(/,/g, "").replace(".", ","),
            modificado: $filter('number')(parseFloat(item.modificado), 2).replace(/,/g, "").replace(".", ","),
            numero: !isNaN(item.numero) ? $filter('number')(parseFloat(item.numero), 2).replace(/,/g, "").replace(".", ",") : item.numero,
            pagado: $filter('number')(parseFloat(item.pagado), 2).replace(/,/g, "").replace(".", ","),
            saldo: $filter('number')(parseFloat(item.saldo), 2).replace(/,/g, "").replace(".", ","),
            vigente: $filter('number')(parseFloat(item.vigente), 2).replace(/,/g, "").replace(".", ",")
          })
        });
      })
    }

    function consultarReporteContable(tipoInforme, gestion) {
      var datosConsulta = {
        tipoInforme: vm.docsContables[tipoInforme],
        gestion: vm.aniosContables[gestion]
      };
      
      DataService.post(restUrl + 'reportes/contables', datosConsulta)
      .then(function (respuesta) {
        vm.headers = [
          { name: 'cite', title: 'Cite', mostrar: true },
          { name: 'detalle', title: 'Detalle', mostrar: true },
          { name: 'c31', title: 'C-31', mostrar: true },
          { name: 'importe', title: 'Importe', mostrar: true }
        ];
        vm.items = respuesta.datos.documentos;
      });
    }

    function generarNombre() {
      var nombre = 'reporte_' + vm.docsContables[vm.tipoInformePago];
      return nombre;
    }

    function cabeceraPresupuesto() {
      var cabecera = [];
      for (var i = 0; i < vm.headers.length; i++) {
        if (vm.headers[i].mostrar) cabecera.push(vm.headers[i].title);
      }
      return cabecera;
    }

    function filasPresupuesto() {
      vm.filas = [];
      vm.items.map(function (item) {
        var nuevo = {};
        for (var i = 0; i < vm.headers.length; i++) {
          if (vm.headers[i].mostrar) {
            if (!isNaN(item[vm.headers[i].name])) {
              nuevo[vm.headers[i].name] = $filter('number')(item[vm.headers[i].name], 2);
            } else {
              nuevo[vm.headers[i].name] = item[vm.headers[i].name];
            }
          }
        }
        vm.filas.push(nuevo);
      });
      return vm.filas;
    }

    function mostrarOcultar(columna) {
      for (var i = 0; i < vm.headers.length; i++) {
        if (vm.headers[i].name === columna) return vm.headers[i].mostrar;
      }
      return true;
    }

    function consultarDocumentosUsuarioEstados(fechaInicial, fechaFinal) {
      DataService.get(restUrl + 'monitoreo/estados?fechaInicial=' + fechaInicial + '&&fechaFinal=' + fechaFinal)
      .then(function (respuesta) {
        vm.estados = respuesta.datos;
      })
    }

    function consultarDocumentosPendientes() {
      DataService.get(restUrl + 'monitoreo/pendientes')
      .then(function (respuesta) {
        vm.pendientes = [];
        respuesta.datos[0].map(function (item) {
          vm.pendientes.push({
            nombres: item.nombres,
            apellidos: item.apellidos,
            ENVIADO: item.ENVIADO,
            RECHAZADO: item.RECHAZADO,
            DERIVADO: item.DERIVADO,
            total: (item.ENVIADO + item.RECHAZADO + item.DERIVADO)
          })
        });
      });
    }

    function consultarComprometido(gestion) {
      DataService.get(restUrl + 'presupuesto/comprometido?gestion=' + gestion)
        .then(function (respuesta) {
          vm.comprometido = [];
          respuesta.datos.map(function (item) {
            vm.comprometido.push({
              _fecha_creacion: $filter('date')(item._fecha_creacion, "dd/MM/yyyy"),
              cite: item.cite,
              descripcion: item.descripcion == null ? '-' : item.descripcion,
              id_documento: item.id_documento,
              monto: $filter('number')(parseFloat(item.monto), 2).replace(/,/g, "").replace(".", ","),
              numero: item.numero
            })
          });
        })
    }

    function consultarPagado(gestion) {
        DataService.get(restUrl + 'presupuesto/pagado?gestion=' + gestion)
        .then(function (respuesta) {
            vm.pagado = [];
            respuesta.datos.map(function (item) {
            vm.pagado.push({
                _fecha_creacion: $filter('date')(item._fecha_creacion, "dd/MM/yyyy"),
                cite: item.cite,
                descripcion: item.descripcion == null ? '-' : item.descripcion,
                id_documento: item.id_documento,
                monto: $filter('number')(parseFloat(item.monto), 2).replace(/,/g, "").replace(".", ","),
                numero: item.numero
            })
            });
        })
    }

    function vistaPrevia(pIdentificador) {
      Documento.showPdfId(pIdentificador);
    }

    function generarPDF() {
      var presupuesto = {};
      presupuesto.cabecera = cabeceraPresupuesto();
      presupuesto.filas = filasPresupuesto();
      presupuesto.gestion = vm.anio + limite_inferior;
      var datosEnviar = {
        doc: {}
      };
      datosEnviar.esDispositivoMovil = angular.isDefined($window.orientation);
      DataService.pdf(restUrl + 'presupuesto/pdf', presupuesto)
        .then(function (respuesta) {
          datosEnviar.pdf = respuesta.url;
          datosEnviar.pdf_buffer = respuesta.data;
          var config = {
            data: datosEnviar,
            templateUrl: 'app/modules/plantillasFormly/monitoreo/dialogPresupuestoPDF.html',
            controller: ['data', '$scope', '$mdDialog', 'Util', DialogPDFController]
          }
          Modal.show(config);
        })
    }

    function DialogPDFController(data, $scope, $mdDialog, Util) {
      var vmd = $scope;
      vmd.data = {};
      vmd.data.html = data.html;
      vmd.data.pdf = data.pdf;
      vmd.data.flag_html = false;
      vmd.data.show_pdf = !data.esDispositivoMovil;
      if (data.esDispositivoMovil) {
        Util.loadCanvas(data.pdf_buffer, '#canvasContainer');
      }

      //funciones
      /*vmd.mostrarPdf = function (id, sw){ 
          if(sw) showPdfx(id); 
          else showPdfId(id, 
          false); 
      }*/
      vmd.cerrar = function () {
        $mdDialog.cancel();
      }
      vmd.verHtml = function () {
        vmd.data.flag_html = true;
      }
      vmd.verPdf = function () {
        vmd.data.flag_html = false;
      }
    }

    function refrescarChart() {
      vm.busqueda = {};
      vm.ordenInverso = false;
      if (vm.chart.tipo === 'presupuesto') {
        vm.ordenarPor = 'descripcion';
        consultarPresupuesto(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'estados') {
        vm.ordenarPor = 'nombres';
        consultarDocumentosUsuarioEstados(vm.fechaInicial, vm.fechaFinal);
      } else if (vm.chart.tipo === 'pendientes') {
        vm.ordenarPor = 'nombres';
        consultarDocumentosPendientes();
      } else if (vm.chart.tipo === 'comprometido') {
        vm.ordenarPor = 'descripcion';
        consultarComprometido(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'pagado') {
        vm.ordenarPor = 'descripcion';
        consultarPagado(vm.gestionActual - vm.gestion);
      } else if (vm.chart.tipo === 'reporteContable') {
        vm.ordenarPor = 'cite';
        consultarReporteContable(vm.tipoInformePago, vm.anioContable);
      } else {
        var anio = vm.anio + limite_inferior,
          mes = vm.mes + 1;
        
        var url_get = [
          restUrl + 'monitoreo/global/?anio=' + anio + '&mes=' + mes,
          restUrl + 'monitoreo/usuario/?anio=' + anio + '&mes=' + mes + '&page=' + vm.page,
          restUrl + 'monitoreo/documento/?anio=' + anio + '&mes=' + mes + '&page=' + vm.page,
          restUrl + 'monitoreo/' + vm.usuario + '/documento/?anio=' + anio + '&mes=' + mes
        ];
        DataService.get(url_get[vm.grafico.cod])
        .then(function (respuesta) {
          vm.chart.datos.labels = respuesta.datos.nombres;
          vm.chart.datos.datasets[0].data = respuesta.datos.global;
          vm.chart.datos.datasets[1].data = respuesta.datos.relacionado;
          vm.chart.datos.datasets[2].data = respuesta.datos.no_relacionado;
          vm.chart.actualizar = !vm.chart.actualizar;
          vm.page_tot = respuesta.datos.total;
        });
      }
    }

    function paginar(acc) {
      if (acc == 'aa')
        vm.page = 1;
      if (acc == 'a')
        vm.page--;
      if (acc == 's')
        vm.page++;
      if (acc == 'ss')
        vm.page = Math.ceil(vm.page_tot / vm.page_cant);
      vm.page_text = '' + ((vm.page - 1) * vm.page_cant + 1) + '-' + (((vm.page * vm.page_cant) > vm.page_tot) ? vm.page_tot : vm.page * vm.page_cant);
      refrescarChart();
    }

  }
})();
