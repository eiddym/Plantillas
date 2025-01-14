const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");

module.exports = app => {
  const unidad = app.src.db.models.unidad;
  const sequelizeHandlers = new ModelHandler(unidad);

/**
  @apiVersion 1.0.0
  @apiGroup Unidad
  @apiName Get unidad
  @api {get} /api/v1/seguridad/unidad/ Obtiene la lista completa de unidad

  @apiDescription Get unidad

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
  "tipoMensaje": "EXITO",
  "mensaje": "La operación se realizó correctamente.",
  "datos": {
    "total": 12,
    "resultado": [
      {
        "id_unidad": 1,
        "nombre": "Area de Auditoria Interna",
        "abreviacion": "AAI",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T19:49:55.922Z",
        "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
      },
      {
        "id_unidad": 2,
        "nombre": "Area de Comunicación",
        "abreviacion": "AC",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T19:49:55.922Z",
        "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
      },
      {
        "id_unidad": 3,
        "nombre": "Area de Planificación",
        "abreviacion": "AP",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T19:49:55.922Z",
        "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
      }, ...
    ]
  }
*/

/**
  @apiVersion 1.0.0
  @apiGroup Unidad
  @apiName Get unidad/?order=&limit=&page=&filter=
  @api {get} /api/v1/seguridad/unidad/?order=&limit=&page=&filter= Obtiene la lista paginada de unidad

  @apiDescription Get unidad

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
          "id_unidad": 1,
          "nombre": "Area de Auditoria Interna",
          "abreviacion": "AAI",
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-19T19:49:55.922Z",
          "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
        },
        {
          "id_unidad": 2,
          "nombre": "Area de Comunicación",
          "abreviacion": "AC",
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-19T19:49:55.922Z",
          "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
        },
        {
          "id_unidad": 3,
          "nombre": "Area de Planificación",
          "abreviacion": "AP",
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-19T19:49:55.922Z",
          "_fecha_modificacion": "2016-12-19T19:49:55.922Z"
        }, ...
      ]
    }
  }

*/
  app.get('/api/v1/seguridad/unidad', sequelizeHandlers.query(unidad));

/**
  @apiVersion 1.0.0
  @apiGroup Unidad
  @apiName Options unidad
  @api {options} /api/v1/seguridad/unidad Extrae formly de unidad

  @apiDescription Options de unidad

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
  app.options('/api/v1/seguridad/unidad', sequelizeFormly.formly(unidad, app.src.db.models));
};
