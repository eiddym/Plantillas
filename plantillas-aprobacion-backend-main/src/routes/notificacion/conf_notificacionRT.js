const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");

module.exports = app => {
  const conf_notificacion = app.src.db.models.conf_notificacion;
  const sequelizeHandlers = new ModelHandler(conf_notificacion);
  const usuario = app.src.db.models.usuario;
  const util = app.src.lib.util;

  const verificar = (idConfNotificacion, idUsuario) =>
    conf_notificacion
      .findOne({
        where: {
          id_conf_notificacion: idConfNotificacion,
          fid_usuario: idUsuario,
        },
      })
      .then((respuesta) => {
        if (!respuesta) {
          throw new Error(
            "No puede modificar las configuraciones de otros usuarios"
          );
        }
        return respuesta;
      })
      .catch((error) => {
        throw new Error(error);
      });

  const verificarUsuario = (req, res, next) => {
    const idUsuarioToken = req.body.audit_usuario.id_usuario;
    const idUsuarioParametros = parseInt(req.query.fid_usuario);
    
    if(idUsuarioToken !== idUsuarioParametros){
      return res.status(400).json({
        status: 'Error',
        message: 'No puede obtener los datos de configuracion de otros usuarios',
      })
    }
    next()
  }

/**
  @apiVersion 1.0.0
  @apiGroup Notificación
  @apiName Get conf_notificacion
  @api {get} /api/v1/notificacion/conf_notificacion/ Obtiene la lista completa de conf_notificacion

  @apiDescription Get conf_notificacion

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "total": 21,
      "resultado":[
        {
          "id_conf_notificacion": "1",
          "campo": "xxx",
          "_usuario_creacion": "1",
          "_fecha_creacion": " << fecha y hora >> ",
          "_fecha_modificacion": " << fecha y hora >> "
        },
        {
          "id_conf_notificacion": "2",
          "campo": "zzz",
          "_usuario_creacion": "1",
          "_fecha_creacion": " << fecha y hora >> ",
          "_fecha_modificacion": " << fecha y hora >> "
        },
        ...
      ]

  }

*/

/**
  @apiVersion 1.0.0
  @apiGroup Notificación
  @apiName Get configuración_notificacion
  @api {get} /api/v1/notificacion/conf_notificacion/?order=&limit=&page=&filter= Obtiene la lista paginada de conf_notificacion

  @apiDescription Get conf_notificacion

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
        "total": 21,
        "resultado":[
          {
            "id_conf_notificacion": 1,
            "codigo": "CI",
            "descripcion": "Carnet de identidad",
            "estado": "ACTIVO",
            "_usuario_creacion": 5,
            "_usuario_modificacion": null,
            "_fecha_creacion": "2016-08-29T13:59:22.788Z",
            "_fecha_modificacion": "2016-08-29T13:59:22.788Z"
          },
          {
            "id_conf_notificacion": 2,
            "codigo": "PAS",
            "descripcion": "Pasaporte",
            "estado": "ACTIVO",
            "_usuario_creacion": 5,
            "_usuario_modificacion": null,
            "_fecha_creacion": "2016-08-29T14:02:19.060Z",
            "_fecha_modificacion": "2016-08-29T14:02:19.060Z"
          },
          ...
        ]
    }

*/
  app.get('/api/v1/notificacion/conf_notificacion',verificarUsuario, sequelizeHandlers.query(conf_notificacion));

/**
  @apiVersion 1.0.0
  @apiGroup Notificación
  @apiName Put actualiza
  @api {put} /api/v1/notificacion/conf_notificacion/:id Actualiza la configuración de notificaciones

  @apiDescription Put actualiza

  @apiParam (Parámetro) {Integer} id Identificador de  la tabla conf_notificacion que se quiere actualizar

  @apiParam (Petición) {Texto} campo Decripción del campo

  @apiParamExample {json} Ejemplo para enviar:
  {
    aprobados_ciudadania: true
    aprobar_ciudadania: true
    canal: "CORREO"
    canal_habilitado: true
    derivado: true
    email: "apaza@yopmail.com"
    enviado: false
    id_conf_notificacion: 2
    observado: false
  }

  @apiSuccess (Respuesta) {Texto} tipoMensaje Tipo del mensaje de respuesta 
  @apiSuccess (Respuesta) {Texto} mensaje Descripcion de la operación realizada

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Modificación exitosa.",
  }

  @apiSampleRequest off
*/
  app.put("/api/v1/notificacion/conf_notificacion/:id", (req, res) => {
    const data = {
      id_conf_notificacion: req.body.id_conf_notificacion,
      canal: req.body.canal,
      enviado: req.body.enviado,
      observado: req.body.observado,
      derivado: req.body.derivado,
      aprobar_ciudadania: req.body.aprobar_ciudadania,
      aprobados_ciudadania: req.body.aprobados_ciudadania,
      canal_habilitado: req.body.canal_habilitado,
    };
    verificar(req.params.id, req.body.audit_usuario.id_usuario)
      .then(() =>
        conf_notificacion.update(data, {
          where: { id_conf_notificacion: req.params.id },
        })
      )
      .then(() =>
        res.send(util.formatearMensaje("EXITO", "Modificación exitosa"))
      )
      .catch((error) =>
        res.status(412).send(util.formatearMensaje("ERROR", error))
      );
  });

  /**
  @apiVersion 1.0.0
  @apiGroup Notificación
  @apiName Options conf_notificacion
  @api {options} /api/v1/notificacion/conf_notificacion Extrae formly de conf_notificacion

  @apiDescription Options de conf_notificacion

  @apiSuccess (Respuesta) {Texto} key Llave para el campo
  @apiSuccess (Respuesta) {Texto} type Tipo de etiqueta este puede ser input, select, datepicker, etc
  @apiSuccess (Respuesta) {Objeto} templateOptions Objeto de opciones para la etiqueta, el cual varia de acuerdo el tipo de etiqueta

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  [
    {
      "key": "id_conf_notificacion",
      "type": "input",
      "templateOptions": {
        "type": "number",
        "label": "Id conf_notificacion",
        "required": true
      },
    },
    {
      "key": "campo",
      "type": "input",
      "templateOptions": {
        "type": "text",
        "label": "Campo",
        "required": true
      }
    }
  ]

  @apiSampleRequest off
*/
  app.options('/api/v1/notificacion/conf_notificacion', sequelizeFormly.formly(conf_notificacion, app.src.db.models));
};
