(function() {
  'use strict';

  angular
    .module('app')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/modules/dashboard/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      })
      .state('usuario', {
        url: '/usuario',
        templateUrl: 'app/modules/admin/usuarios/modules.admin.usuarios.html',
        controller: 'UsuariosController',
        controllerAs: 'usuarios'
      })
      .state('menu', {
        url: '/menu',
        templateUrl: 'app/modules/seguridad/menu/modules.seguridad.menu.html',
        controller: 'MenuController',
        controllerAs: 'menu'
      })
      .state('rol', {
        url: '/rol',
        templateUrl: 'app/modules/seguridad/rol/modules.seguridad.rol.html',
        controller: 'RolController',
        controllerAs: 'rol'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'app/modules/admin/login/modules.admin.login.html',
        controller: 'LoginController',
        controllerAs: 'login'
      })
      .state('elegir', {
        url: '/elegir',
        templateUrl: 'app/modules/admin/virtual/virtual.html',
        controller: 'VirtualController',
        controllerAs: 'virtual'
      })
      .state('verificar', {
        url: '/verificar',
        templateUrl: 'app/modules/verificacion/modules.verificar.html',
        controller: 'VerificarController',
        controllerAs: 'verificar'
      })
      .state('profile', {
        url: '/profile',
        templateUrl: 'app/modules/admin/profile/modules.admin.profile.html',
        controller: 'ProfileController',
        controllerAs: 'profile'
      })
      .state('contactos', {
        url: '/contactos',
        templateUrl: 'app/modules/plantillasFormly/contactos/modules.plantillasFormly.contactos.html',
        controller: 'ContactosController',
        controllerAs: 'contactos'
      })
      .state('plantillas', {
        url: '/plantillas',
        templateUrl: 'app/modules/plantillasFormly/plantillas/modules.plantillasFormly.plantillas.html',
        controller: 'PlantillasController',
        controllerAs: 'plantillas'
      })
      .state('plantilla', {
        url: '/plantilla/:idPlantilla',
        templateUrl: 'app/modules/plantillasFormly/plantillas/plantilla/modules.plantillasFormly.plantillas.plantilla.html',
        controller: 'PlantillaController',
        controllerAs: 'plantilla'
      })
      .state('documentos', {
        url: '/documentos',
        templateUrl: 'app/modules/plantillasFormly/documentos/modules.plantillasFormly.documentos.html',
        controller: 'DocumentosController',
        controllerAs: 'documentos'
      })
      .state('documento', {
        url: '/documento/:idDocumento',
        templateUrl: 'app/modules/plantillasFormly/documentos/documento/modules.plantillasFormly.documentos.documento.html',
        controller: 'DocumentoController',
        controllerAs: 'documento'
      })
      .state('aprobacion', {
        url: '/aprobacion',
        templateUrl: 'app/modules/plantillasFormly/aprobacion/modules.plantillasFormly.aprobacion.html',
        controller: 'AprobacionController',
        controllerAs: 'aprobacion'
      })
      .state('impresion', {
        url: '/impresion',
        templateUrl: 'app/modules/plantillasFormly/impresion/modules.plantillasFormly.impresion.html',
        controller: 'ImpresionController',
        controllerAs: 'impresion'
      })
      .state('progreso', {
        url: '/progreso',
        templateUrl: 'app/modules/plantillasFormly/progreso/modules.plantillasFormly.progreso.html',
        controller: 'ProgresoController',
        controllerAs: 'progreso'
      })
      .state('enCurso', {
        url: '/en_curso',
        templateUrl: 'app/modules/plantillasFormly/enCurso/modules.plantillasFormly.enCurso.html',
        controller: 'EnCursoController',
        controllerAs: 'enCurso'
      })
      .state('firmar', {
        url: '/firmar',
        templateUrl: 'app/modules/plantillasFormly/firmar/modules.plantillasFormly.firmar.html',
        controller: 'FirmarController',
        controllerAs: 'firmar'
      })
      .state('aprobarDocumento', {
        url: '/aprobar_documento',
        templateUrl: 'app/modules/plantillasFormly/aprobarDocumento/modules.plantillasFormly.aprobarDocumento.html',
        controller: 'AprobarDocumentoController',
        controllerAs: 'aprobarDocumento'
      })
      .state('vistaPdf', {
        url: '/vista_pdf',
        templateUrl: 'app/modules/plantillasFormly/vistaPdf/modules.plantillasFormly.vistaPdf.html',
        controller: 'VistaPdfController',
        controllerAs: 'vistaPdf'
      })
      .state('monitoreo', {
        url: '/monitoreo',
        templateUrl: 'app/modules/plantillasFormly/monitoreo/modules.plantillasFormly.monitoreo.html',
        controller: 'MonitoreoController',
        controllerAs: 'monitoreo'
      })
      .state('catalogos', {
        url: '/catalogos',
        templateUrl: 'app/modules/plantillasFormly/catalogos/modules.plantillasFormly.catalogos.html',
        controller: 'CatalogosController',
        controllerAs: 'catalogos'
      })
      .state('catalogo', {
        url: '/catalogo/:idCatalogo',
        templateUrl: 'app/modules/plantillasFormly/catalogos/catalogo/modules.plantillasFormly.catalogos.catalogo.html',
        controller: 'CatalogoController',
        controllerAs: 'catalogo'
      })
      .state('compartidos', {
        url: '/compartidos',
        templateUrl: 'app/modules/plantillasFormly/compartidos/modules.plantillasFormly.compartidos.html',
        controller: 'CompartidosController',
        controllerAs: 'compartidos'
      })
      .state('compartido', {
        url: '/compartido/:idCompartido',
        templateUrl: 'app/modules/plantillasFormly/compartidos/compartido/modules.plantillasFormly.compartidos.compartido.html',
        controller: 'CompartidoController',
        controllerAs: 'compartido'
      })
    $urlRouterProvider.otherwise('/');
  }

})();
