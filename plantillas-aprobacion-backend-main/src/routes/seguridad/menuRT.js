const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const util = require('../../lib/util');


module.exports = app => {
  const menu= app.src.db.models.menu;
  const sequelizeHandlers = new ModelHandler(menu);
  /**
  @apiVersion 1.0.0
  @apiGroup Menu
  @apiName Post menu
  @api {post} /api/v1/seguridad/menu Crear menu

  @apiParam (Petición) {Texto} nombre  Nombre del menu
  @apiParam (Petición) {Texto} descripcion Descripción del menu
  @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario que crea.

  @apiParamExample {json} Ejemplo para enviar:
  {
    "nombre":"menu TEST2",
    "descripcion":"Menu de prueba",
    "_usuario_creacion": 1
  }

  @apiSuccess (Respuesta) {Integer} id_menu Identificador del menu
  @apiSuccess (Respuesta) {Integer} fid_menu_padre Identificador del menu padre
  @apiSuccess (Respuesta) {Texto} nombre Nombre del menu
  @apiSuccess (Respuesta) {Texto} descripcion Descripcion del menu
  @apiSuccess (Respuesta) {Integer} orden Orden del menu
  @apiSuccess (Respuesta) {Texto} ruta Ruta del menu
  @apiSuccess (Respuesta) {Texto} icono Icono del menu
  @apiSuccess (Respuesta) {Texto} estado Estado del menu
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario de creación
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario de modificación
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion fecha de creación
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion fecha de modificación

  @apiSuccessExample {json} Respuesta del ejemplo:
  HTTP/1.1 200 OK
  {
    "id_menu": 13,
    "fid_menu_padre": null,
    "nombre": "MENU TEST2",
    "descripcion": "Menu de prueba",
    "orden": null,
    "ruta": null,
    "icono": null,
    "estado": "ACTIVO",
    "_usuario_creacion": 1,
    "_usuario_modificacion": null
    "_fecha_modificacion": "2016-12-19T23:02:06.994Z",
    "_fecha_creacion": "2016-12-19T23:02:06.994Z",
  }

  @apiSampleRequest off

  */

  app.post('/api/v1/seguridad/menu', sequelizeHandlers.create(menu));

  /**

  @apiVersion 1.0.0
  @apiGroup Menu
  @apiName Get menu
  @api {get} /api/v1/seguridad/menu/:id Obtiene la información de menu

  @apiParam {Integer} id Identificador del menu

  @apiSuccess (Respuesta) {Integer} id_menu Identificador del menu
  @apiSuccess (Respuesta) {Integer} fid_menu_padre Identificador del menu padre
  @apiSuccess (Respuesta) {Texto} nombre Nombre del menu
  @apiSuccess (Respuesta) {Texto} descripcion Descripcion del menu
  @apiSuccess (Respuesta) {Integer} orden Orden del menu
  @apiSuccess (Respuesta) {Texto} ruta Ruta del menu
  @apiSuccess (Respuesta) {Texto} icono Icono del menu
  @apiSuccess (Respuesta) {Texto} estado Estado del menu
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario de creación
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario de modificación
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion fecha de creación
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion fecha de modificación

  @apiSuccessExample Success-Response:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_menu": 13,
      "fid_menu_padre": null,
      "nombre": "MENU TEST2",
      "descripcion": "Menu de prueba",
      "orden": null,
      "ruta": null,
      "icono": null,
      "estado": "ACTIVO",
      "_usuario_creacion": 1,
      "_usuario_modificacion": null,
      "_fecha_creacion": "2016-12-19T23:02:06.994Z",
      "_fecha_modificacion": "2016-12-19T23:02:06.994Z"
    }
  }

 */
  app.get('/api/v1/seguridad/menu/:id', sequelizeHandlers.get(menu));

  /**
    @apiVersion 1.0.0
    @apiGroup Menu
    @apiName Get menu
    @api {get} /api/v1/seguridad/unidad/ Obtiene la lista completa de menu

    @apiDescription Get menu

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
        "total": 12,
        "resultado": [
        {
        "id_menu": 1,
        "fid_menu_padre": null,
        "nombre": "CONFIGURACIÓN",
        "descripcion": "Configuracion",
        "orden": 1,
        "ruta": "",
        "icono": "build",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T22:50:11.174Z",
        "_fecha_modificacion": "2016-12-19T22:50:11.174Z"
        },
        {
          "id_menu": 2,
          "fid_menu_padre": 1,
          "nombre": "PLANTILLAS",
          "descripcion": "Bandeja de plantillas de documentos",
          "orden": 1,
          "ruta": "plantillas",
          "icono": "settings",
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-19T22:50:11.174Z",
          "_fecha_modificacion": "2016-12-19T22:50:11.174Z"
        }, ...
      ]
    }
  */

  /**
    @apiVersion 1.0.0
    @apiGroup Menu
    @apiName Get unidad/?order=&limit=&page=&filter=
    @api {get} /api/v1/seguridad/unidad/?order=&limit=&page=&filter= Obtiene la lista paginada de menu

    @apiDescription Get menu

    @apiParam (Query) {Texto} order Campo por el cual se ordenará el resultado
    @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
    @apiParam (Query) {Integer} page Número de página de resultados
    @apiParam (Query) {Texto} filter Texto a buscar en los registros

    @apiSuccess (Respuesta) {Texto} tipoMensaje Tipo del mensaje de respuesta.
    @apiSuccess (Respuesta) {Texto} mensaje Mensaje de respuesta.
    @apiSuccess (Respuesta) {Objeto} datos Objeto de con los datos de respuesta
    @apiSuccess (Respuesta) {Integer} total Numero de objetos categoria
    @apiSuccess (Respuesta) {Array} resultado Array de objetos categoria


    @apiSuccessExample {json} Respuesta:
      HTTP/1.1 200 OK
      {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "total": 12,
      "resultado": [
        {
        "id_menu": 1,
        "fid_menu_padre": null,
        "nombre": "CONFIGURACIÓN",
        "descripcion": "Configuracion",
        "orden": 1,
        "ruta": "",
        "icono": "build",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T22:50:11.174Z",
        "_fecha_modificacion": "2016-12-19T22:50:11.174Z"
        },
        {
          "id_menu": 2,
          "fid_menu_padre": 1,
          "nombre": "PLANTILLAS",
          "descripcion": "Bandeja de plantillas de documentos",
          "orden": 1,
          "ruta": "plantillas",
          "icono": "settings",
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-19T22:50:11.174Z",
          "_fecha_modificacion": "2016-12-19T22:50:11.174Z"
        }, ...
      ]
    }

  */
  app.get('/api/v1/seguridad/menu', sequelizeHandlers.query(menu));

  /**
  @apiVersion 1.0.0
  @apiGroup Menu
  @apiName Delete menu
  @api {delete} /api/v1/seguridad/menu/:id Elimina menu
  @apiParam {Integer} id Identificador del menu

  @apiSuccessExample Success-Response:
  HTTP/1.1 200 OK
  {
  }
  */
  app.delete('/api/v1/seguridad/menu/:id', sequelizeHandlers.remove(menu));

  /**
  @apiVersion 1.0.0
  @apiGroup Menu
  @apiName Put menu
  @api {put} /seguridad/menu/:id Actualiza la información de menu

  @apiParam {Integer} id Identificador del menu

  @apiSuccess {Texto} nombre Nombre del menu

  @apiParamExample {json} Ejemplo para enviar:
  {
  	"nombre":"menu actualizado"
  }

  @apiSuccess (Respuesta) {Integer} id_menu Identificador del menu
  @apiSuccess (Respuesta) {Integer} fid_menu_padre Identificador del menu padre
  @apiSuccess (Respuesta) {Texto} nombre Nombre del menu
  @apiSuccess (Respuesta) {Texto} descripcion Descripcion del menu
  @apiSuccess (Respuesta) {Integer} orden Orden del menu
  @apiSuccess (Respuesta) {Texto} ruta Ruta del menu
  @apiSuccess (Respuesta) {Texto} icono Icono del menu
  @apiSuccess (Respuesta) {Texto} estado Estado del menu
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario de creación
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario de modificación
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion fecha de creación
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion fecha de modificación


  @apiSuccessExample {json} Respuesta del ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_menu": 13,
      "fid_menu_padre": null,
      "nombre": "MENU ACTUALIZADO",
      "descripcion": "Menu de prueba",
      "orden": null,
      "ruta": null,
      "icono": null,
      "estado": "ACTIVO",
      "_usuario_creacion": 1,
      "_usuario_modificacion": null,
      "_fecha_creacion": "2016-12-19T23:02:06.994Z",
      "_fecha_modificacion": "2016-12-19T23:22:13.560Z"
    }
  }
  @apiSampleRequest off
   */
  app.put('/api/v1/seguridad/menu/:id', sequelizeHandlers.update(menu));

  /**
  @apiVersion 1.0.0
  @apiGroup Menu
  @apiName Options menu
  @api {options} /seguridad/menu Extrae formly de menu

  @apiDescription Options de menu

  @apiSuccess (Respuesta) {Texto} key Llave para el campo
  @apiSuccess (Respuesta) {Texto} type Tipo de etiqueta este puede ser input, select, datepicker, etc
  @apiSuccess (Respuesta) {Objeto} templateOptions Objeto de opciones para la etiqueta, el cual varia de acuerdo el tipo de etiqueta


  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  [
    {
      "key": "id_unidad",
      "type": "input",
      "templateOptions": {
        "type": "number",
        "label": "Id unidad",
        "required": true
      },
    },
    {
      "key": "campo",
      "type": "input",
      "templateOptions": {
        "type": "text",
        "label": "nombre",
        "required": true
      }
    }
  ]

  @apiSampleRequest off
   */
  app.options('/api/v1/seguridad/menu', sequelizeFormly.formly(menu, app.src.db.models));

};
