
const options = require('sequelize-formly');
const {ModelHandler} = require('sequelize-handlers');
const logger = require('../../lib/logger');
module.exports = app => {
  const modelos = app.src.db.models;
  const util = app.src.lib.util;
  const Op = app.src.db.Sequelize.Op;
  const sequelizeHandlers = new ModelHandler(modelos.contacto);

  /**
    @apiVersion 2.0.0
    @apiGroup Contactos
    @apiName Get plantillasFormly/contactos
    @api {get} /api/v1/plantillasFormly/contactos Obtiene la lista de contactos

    @apiDescription Get plantillasFormly/contactos,  obtiene la lista de los contactos que fueron almacenados para la generación de documentos por lote

    @apiSuccess (Respuesta) {Integer} id_contacto Identificador el contacto.
    @apiSuccess (Respuesta) {Texto} nombres Nombres del contacto.
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del contacto.
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiSuccess (Respuesta) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La busqueda de datos fue exitosa.",
      "datos": {
        "total": 100,
        "resultado": [
          {
            "id_contacto": 8,
            "nombres": "Nombre Test",
            "apellidos": "Contacto Prueba",
            "cargo": "Director General Ejecutivo",
            "entidad": "Instituto Boliviano de Metrología",
            "sigla": "IBMETRO",
            "direccion": "Av. Camacho N° 1488 - Edificio anexo planta baja",
            "grado": "Ing."
          },
          {
            "id_contacto": 9,
            "nombres": "Verónica",
            "apellidos": "Barrios",
            "cargo": "Directora General Ejecutiva a.i.",
            "entidad": "Entidad de prueba",
            "sigla": "ENPB",
            "direccion": "Av. Camacho N° 1488 - Edificio anexo planta baja",
            "grado": null
          },
          {...}
        ]
      }
    }
  */

  // app.get('/contacto', (req, res) => {
  app.get('/api/v1/plantillasFormly/contactos', (req, res) => {
    const consulta = {};
    if(req.query.filter) {
      const buscarTexto = req.query.filter;
      consulta[Op.or] = [
        {
          nombres: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
        {
          apellidos: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
        {
          cargo: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
        {
          entidad: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
        {
          tipo_entidad: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
        {
          sigla: {
            [Op.iLike]: `%${buscarTexto}%`,
          },
        },
      ];
    }
    consulta.estado = 'ACTIVO'

    modelos.contacto.findAndCountAll({
      attributes: ['id_contacto', 'nombres', 'apellidos', 'cargo', 'entidad', 'sigla', 'direccion', 'grado'],
      where: consulta,
    })
    .then(contactoResp => res.send(util.formatearMensaje('EXITO', 'La busqueda de datos fue exitosa.', {
      total: contactoResp.count,
      resultado: contactoResp.rows,
    })))
    .catch(error => {
      logger.error('Error en la busqueda de contactos', error);
      return res.status(412).send(util.formatearMensaje('ERROR', error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Contactos
    @apiName Get plantillasFormly/contactos/tiposEntidad
    @api {get} /api/v1/plantillasFormly/contactos/tiposEntidad Obtiene la lista de tipos de entidad

    @apiDescription Get plantillasFormly/contactos/tiposEntidad,  obtiene la lista de todos los tipos de entidad que se tengan registrados

    @apiSuccess (Respuesta) {Texto} tipo_entidad Tipo de entidad registrado

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La obtención de los tipos de entidad fue correcta",
      "datos": [
        {
          "tipo_entidad": "Autárquica"
        },
        {
          "tipo_entidad": "Dependencia MEFP"
        },
        {
          "tipo_entidad": "Descentralizada Departamental"
        },
        {
          "tipo_entidad": "Descentralizada Municipal"
        },
        {
          "tipo_entidad": "Empresa Departamental"
        },
        {
          "tipo_entidad": "Empresa Municipal"
        },
        ...
      ]
    }
  */

  app.get('/api/v1/plantillasFormly/contactos/tiposEntidad', (req,res) => {
    const sequelize = app.src.db.sequelize;
    modelos.contacto.findAll({
      attributes: [
        [sequelize.literal('DISTINCT ON("contacto"."tipo_entidad") "contacto"."tipo_entidad"'), 'tipo_entidad'],
      ],
    })
    .then(tiposResp => {
      if(!tiposResp) tiposResp = [];
      return res.send(util.formatearMensaje('EXITO', 'La obtención de los tipos de entidad fue correcta', tiposResp));
    })
    .catch(error => {
      logger.error('Error en la obtencion de los tipos de entidad', error);
      return res.status(412).send(util.formatearMensaje('ERROR', error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Contactos
    @apiName Get plantillasFormly/contacto
    @api {get} /api/v1/plantillasFormly/contacto/?order=&limit=&page=&filter= Obtiene la lista de todos los contactos en orden, paginado y con filtros

    @apiDescription Get plantillasFormly/contacto,  obtiene la lista con datos completos de todos los contactos que fueron almacenados para la generación de documentos por lote

    @apiParam (Query) {Texto} order Campo por el cual se desea ordenar
    @apiParam (Query) {Integer} limit Cantidad de registros a mostrar
    @apiParam (Query) {Integer} page Paginado
    @apiParam (Query) {Texto} filter Argumentos de filtro

    @apiSuccess (Respuesta) {Integer} id_contacto Identificador el contacto.
    @apiSuccess (Respuesta) {Texto} nombres Nombres del contacto.
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del contacto.
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiSuccess (Respuesta) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiSuccess (Respuesta) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto.
    @apiSuccess (Respuesta) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiSuccess (Respuesta) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiSuccess (Respuesta) {Texto} estado Estado del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que haya modificado del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La busqueda de datos fue exitosa.",
      "datos": {
        "total": 100,
        "resultado": [
          {
            "id_contacto": 8,
            "nombres": "Nombre Test",
            "apellidos": "Contacto Prueba",
            "cargo": "Director General Ejecutivo",
            "entidad": "Instituto Boliviano de Metrología",
            "sigla": "IBMETRO",
            "direccion": "Av. Camacho N° 1488 - Edificio anexo planta baja",
            "grado": "Ing.",
            "tipo_entidad": "Entidades desconcentradas",
            "telefono": "2372046",
            "departamento": "LA PAZ",
            "estado": "ACTIVO",
            "_usuario_creacion": 94,
            "_usuario_modificacion": null,
            "_fecha_creacion": "2018-11-06T14:41:02.114Z",
            "_fecha_modificacion": "2018-11-06T14:41:02.114Z"
          },
          {
            "id_contacto": 9,
            "nombres": "Verónica",
            "apellidos": "Barrios",
            "cargo": "Directora General Ejecutiva a.i.",
            "entidad": "Entidad de prueba",
            "sigla": "ENPB",
            "direccion": "Av. Camacho N° 1488 - Edificio anexo planta baja",
            "grado": null,
            "tipo_entidad": "Entidades desconcentradas",
            "telefono": "222222",
            "departamento": "LA PAZ",
            "estado": "ACTIVO",
            "_usuario_creacion": 94,
            "_usuario_modificacion": null,
            "_fecha_creacion": "2018-11-06T14:41:02.114Z",
            "_fecha_modificacion": "2018-11-06T14:41:02.114Z"
          },
          {...}
        ]
      }
    }
  */

  app.get('/api/v1/plantillasFormly/contacto', util.validarContactos, sequelizeHandlers.query(modelos.contacto));

  /**
    @apiVersion 2.0.0
    @apiGroup Contactos
    @apiName Get plantillasFormly/contacto/:id
    @api {get} /api/v1/plantillasFormly/contacto/:id Obtiene un contacto específico

    @apiDescription Get plantillasFormly/contacto/:id,  obtiene el contacto basado en su identificador único.

    @apiParam (Parámetro) {Integer} id_contacto Identificador el contacto.

    @apiSuccess (Respuesta) {Integer} id_contacto Identificador el contacto.
    @apiSuccess (Respuesta) {Texto} nombres Nombres del contacto.
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del contacto.
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiSuccess (Respuesta) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiSuccess (Respuesta) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto
    @apiSuccess (Respuesta) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiSuccess (Respuesta) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiSuccess (Respuesta) {Texto} estado Estado del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que haya modificado del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente.",
      "datos": {
        "id_contacto": 8,
        "nombres": "Nombre Test",
        "apellidos": "Contacto Prueba",
        "cargo": "Director General Ejecutivo",
        "entidad": "Instituto Boliviano de Metrología",
        "sigla": "IBMETRO",
        "direccion": "Av. Camacho N° 1488 - Edificio anexo planta baja",
        "grado": "Ing.",
        "tipo_entidad": "Entidades desconcentradas",
        "telefono": "2372046",
        "departamento": "LA PAZ",
        "estado": "ACTIVO",
        "_usuario_creacion": 94,
        "_usuario_modificacion": null,
        "_fecha_creacion": "2018-11-06T14:41:02.114Z",
        "_fecha_modificacion": "2018-11-06T14:41:02.114Z"
      }
    }
  */
  
  app.get('/api/v1/plantillasFormly/contacto/:id', util.validarContactos, sequelizeHandlers.get(modelos.contacto));

  /**
    @apiVersion 2.0.0
    @apiGroup Contactos
    @apiName Post contacto
    @api {post} /api/v1/plantillasFormly/contacto Crear contacto

    @apiDescription Post para contacto, crea un contacto.

    @apiParam (Petición) {Texto} nombres Nombres del contacto.
    @apiParam (Petición) {Texto} apellidos Apellidos del contacto.
    @apiParam (Petición) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiParam (Petición) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiParam (Petición) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto
    @apiParam (Petición) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} estado Estado del contacto
    @apiParam (Petición) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiParam (Petición) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiParam (Petición) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiParam (Petición) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "nombres":"Mery",
      "apellidos":"Meriles",
      "cargo":"Profesional",
      "telefono":"2123456",
      "tipo_entidad":"Empresas Públicas",
      "entidad":"Entida de prueba",
      "sigla":"EMPB",
      "direccion":"Una dirección inventada",
      "estado":"ACTIVO",
      "departamento":"LA PAZ",
      "_usuario_creacion":94,
      "_fecha_creacion":"2020-01-10T19:12:24.563Z",
      "_fecha_modificacion":"2020-01-10T19:12:24.564Z"
    }

    @apiSuccess (Respuesta) {Integer} id_contacto Identificador el contacto.
    @apiSuccess (Respuesta) {Texto} nombres Nombres del contacto.
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del contacto.
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiSuccess (Respuesta) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiSuccess (Respuesta) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto
    @apiSuccess (Respuesta) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiSuccess (Respuesta) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiSuccess (Respuesta) {Texto} estado Estado del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que haya modificado del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
      {
        "tipoMensaje": "EXITO",
        "mensaje": "La operación se realizó correctamente.",
        "datos": {
          "id_contacto": 8,
          "nombres":"Mery",
          "apellidos":"Meriles",
          "cargo":"Profesional",
          "telefono":"2123456",
          "tipo_entidad":"Empresas Públicas",
          "entidad":"Entida de prueba",
          "sigla":"EMPB",
          "direccion":"Una dirección inventada",
          "estado":"ACTIVO",
          "departamento":"LA PAZ",
          "_usuario_creacion":94,
          "_usuario_modificacion": null,
          "_fecha_creacion":"2020-01-10T19:12:24.563Z",
          "_fecha_modificacion":"2020-01-10T19:12:24.564Z"

        }
      }

    @apiSampleRequest off
  */

  app.post('/api/v1/plantillasFormly/contacto', util.validarContactos, sequelizeHandlers.create(modelos.contacto));

  /**
    @apiVersion 1.0.0
    @apiGroup Contactos
    @apiName Put contactos/:id
    @api {put} /api/v1/plantillasFormly/contacto/:id Actualiza datos contacto

    @apiDescription Put contactos/:id, actualiza los datos de un contacto específico

    @apiParam (Parámetro) {Integer} id Identificador del contacto

    @apiParam (Petición) {Texto} nombres Nombres del contacto.
    @apiParam (Petición) {Texto} apellidos Apellidos del contacto.
    @apiParam (Petición) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiParam (Petición) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiParam (Petición) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto
    @apiParam (Petición) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiParam (Petición) {Texto} estado Estado del contacto
    @apiParam (Petición) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiParam (Petición) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiParam (Petición) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiParam (Petición) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "nombres":"Mery Mery",
      "apellidos":"Meriles",
      "grado": "DOCTORA",
      "cargo":"Profesional",
      "telefono":"2123456",
      "tipo_entidad":"Empresas Públicas",
      "entidad":"Entida de prueba",
      "sigla":"EMPB",
      "direccion":"Una dirección inventada",
      "estado":"ACTIVO",
      "departamento":"LA PAZ",
      "_usuario_creacion":94,
      "_fecha_creacion":"2020-01-10T19:12:24.563Z",
      "_fecha_modificacion":"2020-01-10T19:12:24.564Z"
    }

    @apiSuccess (Respuesta) {Integer} id_contacto Identificador el contacto.
    @apiSuccess (Respuesta) {Texto} nombres Nombres del contacto.
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del contacto.
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el contacto en su entidad.
    @apiSuccess (Respuesta) {Texto} entidad Entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} sigla Sigla de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} direccion Dirección de la entidad en la que trabaja el contacto.
    @apiSuccess (Respuesta) {Texto} grado Grado de instrucción del contacto para su referencia. Ejemplo: "Lic.", "Ing.", etc.
    @apiSuccess (Respuesta) {Texto} tipo_entidad Tipo de entidad a la que pertenece el contacto
    @apiSuccess (Respuesta) {Texto} telefono Número de teléfono de la entidad del contacto
    @apiSuccess (Respuesta) {Texto} departamento Departamento en el que se encuentra trabajando el contacto.
    @apiSuccess (Respuesta) {Texto} estado Estado del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador del registro.
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que haya modificado del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del registro.
    @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del registro.

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
      {
        "tipoMensaje": "EXITO",
        "mensaje": "La operación se realizó correctamente.",
        "datos": {
          "id_contacto": 8,
          "nombres":"Mery",
          "apellidos":"Meriles",
          "cargo":"Profesional",
          "grado": "DOCTORA",
          "telefono":"2123456",
          "tipo_entidad":"Empresas Públicas",
          "entidad":"Entida de prueba",
          "sigla":"EMPB",
          "direccion":"Una dirección inventada",
          "estado":"ACTIVO",
          "departamento":"LA PAZ",
          "_usuario_creacion":94,
          "_usuario_modificacion": null,
          "_fecha_creacion":"2020-01-10T19:12:24.563Z",
          "_fecha_modificacion":"2020-01-10T19:12:24.564Z"

        }
      }

    @apiSampleRequest off
  */
  app.put('/api/v1/plantillasFormly/contacto/:id', util.validarContactos, sequelizeHandlers.update(modelos.contacto));

  app.route('/api/v1/plantillasFormly/contacto').options(options.formly(modelos.contacto, modelos));

};