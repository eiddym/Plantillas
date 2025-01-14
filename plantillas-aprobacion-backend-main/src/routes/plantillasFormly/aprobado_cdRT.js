const fs = require('fs');
const _ = require('lodash');
const Uuid = require('uuid');
const sequelizeFormly = require("sequelize-formly");
const { documento_enviar } = require('../../bl/plantillasFormly/documentoBL');
const {forEach} = require('lodash');
const sequelize = require('sequelize')
const logger = require('../../lib/logger');

module.exports = app => {
  const aprobado_cdBL = require('../../bl/plantillasFormly/aprobado_cdBL');
  const notificar = require('../../lib/notificacion');
  const Util = app.src.lib.util;
  const Documento = app.src.db.models.documento;
  const Adjunto = app.src.db.models.adjunto_aprobacion_cd;
  const SolicitudAprobacionCD = app.src.db.models.solicitud_aprobacion_cd;
  const HistorialFlujo = app.src.db.models.historial_flujo;
  const modelos = app.src.db.models;
  const Op = app.src.db.Sequelize.Op;
  let cliente;

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get documento/firmar
    @api {get} /api/v1/documento/firmar  Obtiene los documentos a aprobar con Ciudadania Digital.

    @apiDescription Get documento, obtiene los documentos a aprobar con Ciudadania Digital.
    @apiParam (Parámetro) {Texto} order Campo por el cual se ordenara
    @apiParam (Parámetro) {Integer} limit Establece el limite de resultados a obtener
    @apiParam (Parámetro) {Integer} page Define la pagina de resultados a obtener
    @apiParam (Parámetro) {Texto} fields Campos a obtener
    @apiParam (Parámetro) {Texto} filter Parametro de busqueda


    @apiSuccess (Respuesta) {Integer} id_documento Identificador de documento
    @apiSuccess (Respuesta) {Texto} nombre Nombre del documento
    @apiSuccess (Respuesta) {Texto} nombre_plantilla Nombre de la plantilla base del documento
    @apiSuccess (Respuesta) {Texto} plantilla Plantilla del documento
    @apiSuccess (Respuesta) {Texto} plantilla_valor Valores de la plantilla
    @apiSuccess (Respuesta) {FechaHora} fecha Fecha y hora de aprobación
    @apiSuccess (Respuesta) {Texto} estado Estado del registro
    @apiSuccess (Respuesta) {Texto} impreso Si el documento fue o no impreso
    @apiSuccess (Respuesta) {Boolean} firmado Si el documento está o no firmado
    @apiSuccess (Respuesta) {Array} firmaron Usuarios que firmaron el documento
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
    @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de documento
    @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de documento
    @apiSuccess (Respuesta) {Array} adjunto_aprobacion_cd Documentos adjuntos de cada documento.
    
    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La busqueda fue exitosa",
      "datos": {
        "total": 2,
        "resultado": [
          {
            "id_documento": 12345,
            "nombre": "MiSistema/SS/00002/2018",
            "nombre_plantilla": "Solicitud de Salidas",
            "fecha": "2018-03-19T13:40:46.000Z",
            "estado": "DERIVADO",
            "impreso": "NO",
            "_fecha_creacion": "2018-03-19T13:39:28.193Z",
            "_fecha_modificacion": "2018-03-19T13:40:46.702Z",
            "_usuario_creacion": 1,
            "firmantes": [
              1,
              101
            ],
            "firmaron": null
          },
          {
            "id_documento": 23590,
            "nombre": "MiSistema/RSPO/00002/2018",
            "nombre_plantilla": "Requerimiento de Servicios Personales y Otros",
            "fecha": "2018-02-28T23:32:51.000Z",
            "estado": "CERRADO",
            "impreso": "NO",
            "_fecha_creacion": "2018-02-28T13:04:46.616Z",
            "_fecha_modificacion": "2018-02-28T23:32:51.224Z",
            "_usuario_creacion": 35,
            "firmantes": [
              35
            ],
            "firmaron": null
          }
        ]
      }
    }
  */
  app.get('/api/v1/documento/aprobarCiudadania', filtros, (req, res) => {
    let order;
    const usuario = req.body.audit_usuario.id_usuario;
    const estadosValidos = ['CERRADO', 'DERIVADO'];
    const estados = ['NUEVO'];
    const estadoSolicitud = ['APROBADO_CD'];
    const opcionesDocumento = {
      attributes: ['id_documento', 'nombre', 'nombre_plantilla', 'fecha', 'estado', 'impreso', '_fecha_creacion', '_fecha_modificacion', '_usuario_creacion', 'firmado', 'firmaron', 'de'],
      where: {
        aprobador_cd_actual: usuario,
        estado: { [Op.in]: estadosValidos},
        firmado: false,
      },
      include: [{
        model: modelos.adjunto_aprobacion_cd,
        as: 'adjunto_aprobacion_cd',
        where: {
          estado: {[Op.in]: estados},
        },
        required: false,
        include: [{
          model: modelos.solicitud_aprobacion_cd,
          as: 'solicitud_aprobacion_cd',
          where: {
            estado: {[Op.in]: estadoSolicitud},
            _usuario_creacion: usuario,
          },
          required: false,
        }],
      }],
    };
    if(req.query.limit) opcionesDocumento.limit=req.query.limit;
    if(req.query.page) opcionesDocumento.offset=(req.query.limit * ((req.query.page || 1) - 1)) || 0;
    if(req.query.order) {
      order = (req.query.order.charAt(0)=='-')? 'DESC': 'ASC';
      req.query.order = (req.query.order.charAt(0)=='-')? req.query.order.substring(1,req.query.order.length) : req.query.order;
      opcionesDocumento.order = [[req.query.order, order]];
    }
    if(req.query.filter) {
      opcionesDocumento.where[Op.or] = req.xfilter;
    }
    Documento.findAndCountAll(opcionesDocumento)
    .then(resp => {
      const documentos = JSON.parse(JSON.stringify(resp.rows));
      documentos.forEach((documento) => {
        documento.aprobarDocumento = documentoListoAprobarCD(documento);
        if (!documento.de.includes(usuario)) {
          documento.adjunto_aprobacion_cd = [];
        }
      });
      res.send(
        Util.formatearMensaje("EXITO", "La busqueda fue exitosa", {
          Usuariotoken: usuario,
          total: resp.count,
          resultado: documentos,
        })
      );
    })
    .catch(error => {
      logger.error("Error en la obtención de documento para firmar", error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });


  function documentoListoAprobarCD(documento) {
    let aprobarCD = true;
    documento.adjunto_aprobacion_cd.forEach((adjunto) => {
      if (adjunto.solicitud_aprobacion_cd.length > 0 && aprobarCD) {
        const solicitudAprobacion = adjunto.solicitud_aprobacion_cd.some(
          (solicitud) => solicitud.estado === "APROBADO_CD"
        );
        if (!solicitudAprobacion) {
          aprobarCD = false;
        }
      } else aprobarCD = false;
    });
    return aprobarCD;
  }
/**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get documento/firmar
    @api {get} /api/v1/documento/adjuntos  Obtiene los documentos a aprobar con Ciudadania Digital.

    @apiDescription Get documento, obtiene los documentos a aprobar con Ciudadania Digital.
    @apiParam (Parámetro) {Texto} order Campo por el cual se ordenara
    @apiParam (Parámetro) {Integer} limit Establece el limite de resultados a obtener
    @apiParam (Parámetro) {Integer} page Define la pagina de resultados a obtener
    @apiParam (Parámetro) {Texto} fields Campos a obtener
    @apiParam (Parámetro) {Texto} filter Parametro de busqueda


    @apiSuccess (Respuesta) {Array} adjunto_aprobacion_cd Documentos adjuntos de cada documento.
    @apiSuccess (Respuesta) {Integer} id Identificador del archivo adjunto 
    @apiSuccess (Respuesta) {Texto} nombre_publico Nombre del archivo adjunto
    @apiSuccess (Respuesta) {Array} solicitud_aprobacion_cd Solicitud de aprobacion  archivo adjunto
    @apiSuccess (Respuesta) {Texto} uuid_solicitud 
    @apiSuccess (Respuesta) {Texto} fecha Fecha de aprobacion con ciudadanía del adjunto.
    
    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
     "tipoMensaje": "EXITO",{
         "tipoMensaje": "EXITO",
           "mensaje": "La busqueda fue exitosa",
           "datos": {
           "resultado": {
              "adjunto_aprobacion_cd": [
            {
              "id": 1,
              "nombre_publico": "03df0645-9006-4960-b12d-c8af361967b0.pdf",
              "solicitud_aprobacion_cd": [
                {
                  "uuid_solicitud": "395d6248-604a-473e-96ab-9d40936ce462",
                  "fecha": "13/12/2021 16:49:39.000"
                }
              ]
            }
           ]
         }
       }
     }
  */

  app.get('/api/v1/documento/adjuntos', (req, res) => {
    const usuario = req.body.audit_usuario.id_usuario;
    const estados = ['APROBADO', 'NUEVO'];
    const estadoSolicitud = ['APROBADO_CD'];
    HistorialFlujo.findOne( {where: {id_historial_flujo: req.query.id}})
    .then(historial => {
      const opcionesDocumento = {
        attributes: [],
        where: {
          id_documento: historial.id_documento,
        },  
        include: [{
          attributes: ['nombre_publico'],
          model: modelos.adjunto_aprobacion_cd,
          as: 'adjunto_aprobacion_cd',
          where: {
            estado: {[Op.in]: estados},
          },
          required: false,
          include: [{
            model: modelos.solicitud_aprobacion_cd,
            as: 'solicitud_aprobacion_cd',
            attributes: ['uuid_solicitud', [sequelize.literal(`"adjunto_aprobacion_cd->solicitud_aprobacion_cd"."respuesta_servicio_aprobacion"::json->\'fechaHoraSolicitud\'` ), 'fecha']],
            where: {
              estado: {[Op.in]: estadoSolicitud},
              _usuario_creacion: historial._usuario_creacion,
            },
            required: false,
          }],
        }],
      };
      Documento.findOne(opcionesDocumento)
      .then(documento => {
        res.send(Util.formatearMensaje("EXITO", "La busqueda fue exitosa", {resultado:documento}));
      })
    })
    .catch(error => {
      logger.error("Error en la obtención de archivos adjuntos", error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });
  
/**
  @apiVersion 2.0.0
  @apiGroup Aprobacion ciudadania digital
  @apiName Post Aprobacion CD
  @api {post} /api/v1/documento/aprobarCiudadania Aprobar documento

  @apiDescription Post para documento

  @apiBody {Number} id_documento Id del documento

  @apiParamExample {json} Ejemplo para enviar:
  {
    "id_documento":3
  }

  @apiSuccess (Respuesta) {Texto} link Link de redirección para la aprobacion con ciudadanía digital
  @apiSuccess (Respuesta) {Texto} estadoProceso Estado de la solicitud para aprobacion de ciudadanía digital
  @apiSuccess (Respuesta) {Boolean} finalizado Bandera para finalizacion de adicion de solicitud de aprobacion con cd

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
{
  "link": "https://test.agetic.gob.bo/ciudadania-firma/tramite/e2813f35-5806-4658-aed2-49aaebcb8dca",
  "estadoProceso": "exito",
  "finalizado": true
}
  @apiSampleRequest off
*/

  app.post('/api/v1/documento/aprobarCiudadania', async (req, res) => {
    try {
      if(!req.body.id_documento) return res.status(412).send(Util.formatearMensaje('ERROR', 'Es necesario que proporcione el identificador del documento.'));
      if(!req.body.audit_usuario.id_usuario) return res.status(401).send();
      const idUsuario = req.body.audit_usuario.id_usuario;
      const documento = await Documento.findOne({
        attributes: ['id_documento', 'nombre', 'de', 'firmado', 'firmaron', 'plantilla', 'plantilla_valor', 'grupo', 'anulado'],
        where: {
          id_documento: req.body.id_documento,
          aprobador_cd_actual: idUsuario,
          estado: { [Op.in]: ['CERRADO', 'DERIVADO'] },
        },
        include: [{
          model: modelos.adjunto_aprobacion_cd,
          as: 'adjunto_aprobacion_cd',
          required: false,
          where: {
            estado: { [Op.ne]: 'ELIMINADO' },
          },
          include: [{
            model: modelos.solicitud_aprobacion_cd,
            as: 'solicitud_aprobacion_cd',
            where: {
              estado: 'APROBADO_CD',
              _usuario_creacion: idUsuario,
            },
            required: false,
          }],
        }],
      })
      if(!documento) throw new Error('Usted no esta autorizado para ver este documento.');
      // Validación todos los adjuntos deben estar aprobados para los usuarios de
      if(documento.dataValues.adjunto_aprobacion_cd && documento.de.indexOf(idUsuario) !== -1) {
        for (const adjunto of documento.dataValues.adjunto_aprobacion_cd) {
          if (!adjunto.dataValues.solicitud_aprobacion_cd || adjunto.dataValues.solicitud_aprobacion_cd.length === 0) {
            throw new Error('Faltan aprobar todos los documentos adjuntos')
          }
        }
      }
      const documentoObtenido = await Util.obtenerArchivo(documento.dataValues.nombre);
      const base64Pdf = Buffer.from(documentoObtenido).toString('base64');
      cliente = cliente || await app.src.openid;
      const respuestaAprobacionCD = await aprobado_cdBL.aprobarPdfConCiudadaniaDigital(
        modelos,
        `DOCUMENTO - ${documento.dataValues.nombre}`,
        base64Pdf,
        idUsuario,
        cliente,
        'DOCUMENTO',
        null,
        documento.dataValues.id_documento
      );
      if (respuestaAprobacionCD.statusCode === 200) {
        return res.send(respuestaAprobacionCD.body);
      } else if (
        respuestaAprobacionCD.statusCode &&
        typeof respuestaAprobacionCD.statusCode === 'number'
      ) {
        return res
          .status(respuestaAprobacionCD.statusCode)
          .send(Util.formatearMensaje('ERROR',respuestaAprobacionCD.body));
      } else return res.status(500).send('Error de conexion con el servidor');
    } catch (error) {
      logger.error("Error en la busqueda del documento", error, req.body);
      return res.status(412).send(Util.formatearMensaje('ERROR', error));
    }
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Aprobacion ciudadania digital
  @apiName Post Aprobacion CD adjunto
  @api {post} /api/v1/documento/aprobarCiudadania/adjunto Aprobar documento adjunto

  @apiDescription Post para documento

  @apiBody {Number} id_documento Id del documento

  @apiParamExample {json} Ejemplo para enviar:
  {
    "id_adjunto":3
  }

  @apiSuccess (Respuesta) {Texto} link Link de redirección para la aprobacion con ciudadanía digital
  @apiSuccess (Respuesta) {Texto} estadoProceso Estado de la solicitud para aprobacion de ciudadanía digital
  @apiSuccess (Respuesta) {Boolean} finalizado Bandera para finalizacion de adicion de solicitud de aprobacion con cd

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
{
  "link": "https://test.agetic.gob.bo/ciudadania-firma/tramite/e2813f35-5806-4658-aed2-49aaebcb8dca",
  "estadoProceso": "exito",
  "finalizado": true
}
  @apiSampleRequest off
*/
  app.post('/api/v1/documento/aprobarCiudadania/adjunto', async (req, res) => {
    try {
      if(!req.body.id_adjunto) return res.status(412).send(Util.formatearMensaje('ERROR', 'Es necesario que proporcione el identificador del documento.'));
      if(!req.body.audit_usuario.id_usuario) return res.status(401).send();
      const adjunto = await Adjunto.findOne({
        where : {
          id: req.body.id_adjunto,
        },
        raw: true,
      })
      if (!adjunto) {
        throw new Error('No se pudo validar la petición')
      }
      const solicitudesAprobadas = await SolicitudAprobacionCD.findOne({
        where: {
          fid_adjunto_aprobacion_cd: req.body.id_adjunto,
          estado: 'APROBADO_CD',
          _usuario_creacion: req.body.audit_usuario.id_usuario,
        },
      })
      if (solicitudesAprobadas) {
        throw new Error('Este documento ya fué aprobado, no se puede aprobar mas de una vez')
      }
      const estados = ['APROBADO', 'NUEVO'];
      const idUsuario = req.body.audit_usuario.id_usuario;
      const documento = await Documento.findOne({
        attributes: ['id_documento', 'nombre', 'firmado', 'de', 'firmaron', 'plantilla', 'plantilla_valor', 'grupo', 'anulado'],
        where: {
          id_documento: adjunto.fid_documento,
          aprobador_cd_actual: idUsuario,
          estado: { [Op.in]: ['CERRADO', 'DERIVADO'] },
        },
        include: [{
          model: modelos.adjunto_aprobacion_cd,
          as: 'adjunto_aprobacion_cd',
          where: {
            estado: { $in: estados },
          },
          required: false,
        }],
      })
      if (!documento ||!documento.de ||!documento.de.includes(idUsuario)) throw new Error('Usted no esta autorizado para ver este documento.');
      const adjuntoObtenido = await Util.obtenerArchivoAprobacionAdjunto(adjunto.nombre_privado);
      const base64Pdf = Buffer.from(adjuntoObtenido).toString('base64');
      cliente = cliente || await app.src.openid;
      const respuestaAprobacionCD = await aprobado_cdBL.aprobarPdfConCiudadaniaDigital(
        modelos,
        // adjunto.nombre_privado,
        `ADJUNTO - ${documento.dataValues.nombre}`,
        base64Pdf,
        idUsuario,
        cliente,
        'ADJUNTO',
        adjunto.id,
        null
      );
      if (respuestaAprobacionCD.statusCode === 200) {
        return res.send(respuestaAprobacionCD.body);
      } else if (
        respuestaAprobacionCD.statusCode &&
        typeof respuestaAprobacionCD.statusCode === 'number'
        && respuestaAprobacionCD.body
      ) {
        const mensajeError = respuestaAprobacionCD.body.estadoProceso || respuestaAprobacionCD.body;
        return res
          .status(respuestaAprobacionCD.statusCode)
          .send(Util.formatearMensaje('ERROR', mensajeError));
      } else return res.status(500).send('Error de conexion con el servidor');
    } catch (error) {
      logger.error('Error en la busqueda del documento', error, req.body);
      return res.status(412).send(Util.formatearMensaje('ERROR', error));
    }
  });

  function filtros (req,res,next){
      if(req.query.filter!='')
        Util.consulta(req,res,next,Documento);
      else next();
  }

  app.options('/api/v1/documento/aprobarCiudadania', sequelizeFormly.formly(Documento, app.src.db.models));
};
