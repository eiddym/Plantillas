const sequelizeHandlers = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const logger = require('../../lib/logger');

module.exports = app => {

  const modelos = app.src.db.models;
  const documento = app.src.db.models.documento;
  const unidad = app.src.db.models.unidad;
  const usuario = app.src.db.models.usuario;
  const correlativo = app.src.db.models.correlativo;
  const historial_flujo = app.src.db.models.historial_flujo;
  const util = require('../../lib/util')
  const Op = app.src.db.Sequelize.Op;

  /**
    @apiVersion 2.0.0
    @apiGroup Historial Flujo
    @apiName Get historialFlujo/:id/ultimo
    @api {get} /api/v1/historialFlujo/:id/ultimo Obtiene el último usuario

    @apiDescription Get historialFlujo/:id/ultimo, obtiene el último usuario que intervino en el historial

    @apiParam (Parámetro) {Integer} id Identificador del documento

    @apiSuccess (Respuesta) {Texto} nombres Nombres del último usuario
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del último usuario

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Historial de flujo de un documento",
      "datos": {
        "nombres":"Oso",
        "apellidos":"Pardo",
      }
    }
  */

  app.get('/api/v1/historialFlujo/:id/ultimo', (req, res) => {
    const idDocumento = req.params.id;
    let tipoError = 'ERROR';

    historial_flujo.findAll({
      where: {
        id_documento: idDocumento,
        estado: 'ACTIVO',
      },
      order: [['_fecha_creacion','DESC']],
    })
    .then((hist) => {
      if(hist && hist[0]){
        return usuario.findByPk(hist[0]._usuario_creacion)
      }else {
        tipoError = 'ADVERTENCIA';
        throw new Error('El documento no tiene historial');
      }
    })
    .then((usu) => {
      res.send(util.formatearMensaje("EXITO", "Historial de flujo de un documento", {
        nombres: usu.dataValues.nombres,
        apellidos: usu.dataValues.apellidos,
      }));
    })
    .catch(error =>
      res.status(412).send(util.formatearMensaje(tipoError, error))
    );
  })

  /**
  @apiVersion 2.0.0
  @apiGroup Historial Flujo
  @apiName Get historialFlujo/:id
  @api {get} /api/v1/historialFlujo/:id Obtiene el historial del documento

  @apiDescription Get historialFlujo/:id, obtiene el historial completo de un documento

  @apiParam (Parámetro) {Integer} id Identificador del documento

  @apiSuccess (Respuesta) {Integer} id_historial_flujo Identificador del resgistro en historial_flujo
  @apiSuccess (Respuesta) {Integer} id_documento Identificador del documento
  @apiSuccess (Respuesta) {Texto} accion Acción que se haya o esté realizando en el documento
  @apiSuccess (Respuesta) {Texto} observacion Observación sobre el documento
  @apiSuccess (Respuesta) {Texto} estado Estado del documento
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario de creación del hito
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modificó el hito
  @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del hito
  @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del hito
  @apiSuccess (Respuesta) {Texto} tipo_doc Nombre de la plantilla del documento que forma parte del hito
  @apiSuccess (Respuesta) {Texto} cite Cadena que identifica a un documento.
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario protagonista del hito
  @apiSuccess (Respuesta) {Texto} usuario Nombre de usuario del protagonista del hito
  @apiSuccess (Respuesta) {Objeto} derivado Usuario a quien se ha derivado

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Historial de flujo de un documento",
    "datos":[
      {
        "_fecha_creacion":"1991-01-01T14:20:43.914Z",
        "_fecha_modificacion":"1991-01-01T14:20:43.914Z",
        "accion":"REVISANDO",
        "estado":"ACTIVO",
        "id_documento":0,
        "id_historial_flujo":-1,
        "nombres":"Juana de Arco",
        "observacion":"",
        "usuario":"jarco"
      },
      {
        "id_historial_flujo":123,
        "id_documento":62,
        "accion":"ENVIADO",
        "observacion":"",
        "estado":"ACTIVO",
        "_usuario_creacion":3,
        "_usuario_modificacion":null,
        "_fecha_creacion":"1991-01-01T14:20:43.914Z",
        "_fecha_modificacion":"1991-01-01T14:20:43.914Z",
        "tipo_doc":"Solicitud de Salidas",
        "nombres":"Juan Perez",
        "usuario":"jperez"
      }
    ]
  }
*/
  app.get('/api/v1/historialFlujo/:id', (req, res) => {
    const idDocumento = req.params.id;
    const resultado = {detalle: idDocumento};
    let xdoc, xdocs;
    let tipoError = 'ERROR';
    documento.findByPk(idDocumento)
    .then( doc => {
      xdoc = doc;
      return historial_flujo.findAll({
        where: {
          id_documento: idDocumento,
          estado: 'ACTIVO',
        },
        order: [['_fecha_creacion','DESC']],
      });
    })
    .then((doc) => {

      if (doc != null && doc.length > 0) {
        const promesas = [];
        doc.forEach((pItem, pIndice) => {
          if(['CERRADO','DERIVADO','CREADO'].indexOf(pItem.accion)!=-1){
            pItem.dataValues.cite = xdoc.nombre;
          }
          pItem.dataValues.tipo_doc = xdoc.nombre_plantilla;
          promesas.push(new Promise((resolve, reject) =>
          usuario.findByPk(pItem._usuario_creacion)
            .then(pUsuario => {
              pItem.dataValues.nombres = `${pUsuario.nombres} ${pUsuario.apellidos}`;
              pItem.dataValues.usuario = pUsuario.usuario;
              resolve(pItem);
            })
            .catch(e => reject(e))
          ));
        })
        return Promise.all(promesas);
      }

    })
    .then(doc => {
      if(doc){
        xdocs = doc;
        if( doc[0].accion=='RECHAZADO' )
        return usuario.findByPk(xdoc._usuario_creacion);
        return usuario.findByPk(xdoc.via_actual);
      }else {
        tipoError = 'ADVERTENCIA';
        throw new Error('El documento no tiene historial');
      }
    })
    .then(usu => {
      if( ['CERRADO','CREADO'].indexOf(xdocs[0].accion)==-1 ){
        xdocs.unshift({
          _fecha_creacion: xdocs[0]._fecha_creacion,
          _fecha_modificacion: xdocs[0]._fecha_creacion,
          accion: "REVISANDO",
          estado: "ACTIVO",
          id_documento: 314,
          id_historial_flujo: -1,
          nombres: `${usu.nombres} ${usu.apellidos}`,
          observacion: "",
          usuario: usu.usuario,
        });
      }
      res.send(util.formatearMensaje("EXITO", "Historial de flujo de un documento", xdocs))
    })
    .catch(error =>
      res.status(412).send(util.formatearMensaje(tipoError, error))
    );
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Historial Flujo
  @apiName Get historialFlujo/:id/proceso
  @api {get} /api/v1/historialFlujo/:id/proceso Obtiene el historial del proceso iniciado con el documento

  @apiDescription Get historialFlujo/:id/proceso, obtiene el historial del proceso iniciado con el documento, es decir el historial del flujo que haya seguido el documento.

  @apiParam (Parámetro) {Integer} id Identificador del documento

  @apiSuccess (Respuesta) {Integer} id_historial_flujo Identificador del resgistro en historial_flujo
  @apiSuccess (Respuesta) {Integer} id_documento Identificador del documento
  @apiSuccess (Respuesta) {Texto} accion Acción que se haya o esté realizando en el documento
  @apiSuccess (Respuesta) {Texto} observacion Observación sobre el documento
  @apiSuccess (Respuesta) {Texto} estado Estado del documento
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario de creación del hito
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modificó el hito
  @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha y hora de creación del hito
  @apiSuccess (Respuesta) {Texto} _fecha_modificacion Fecha y hora de modificación del hito
  @apiSuccess (Respuesta) {Texto} tipo_doc Nombre de la plantilla del documento que forma parte del hito
  @apiSuccess (Respuesta) {Texto} cite Cadena que identifica a un documento.
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario protagonista del hito
  @apiSuccess (Respuesta) {Texto} usuario Nombre de usuario del protagonista del hito
  @apiSuccess (Respuesta) {Objeto} derivado Usuario a quien se ha derivado

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Historial de flujo de un proceso",
    "datos":[
      {
        "_fecha_creacion":"1991-01-01T14:20:43.914Z",
        "_fecha_modificacion":"1991-01-01T14:20:43.914Z",
        "accion":"REVISANDO",
        "estado":"ACTIVO",
        "id_documento":0,
        "id_historial_flujo":-1,
        "nombres":"Juana de Arco",
        "observacion":"",
        "usuario":"jarco"
      },
      {
        "id_historial_flujo":123,
        "id_documento":62,
        "accion":"ENVIADO",
        "observacion":"",
        "estado":"ACTIVO",
        "_usuario_creacion":3,
        "_usuario_modificacion":null,
        "_fecha_creacion":"1991-01-01T14:20:43.914Z",
        "_fecha_modificacion":"1991-01-01T14:20:43.914Z",
        "tipo_doc":"Solicitud de Salidas",
        "nombres":"Juan Perez",
        "usuario":"jperez"
      }
    ]
  }
*/

  app.get('/api/v1/historialFlujo/:id/proceso', (req, res) => {
    const historial =[];
    let tipoError ='ERROR';
    let docs;
    let adocs;
    let documentoPrincipal = null;
    let usuariosDe = [];
    let adjuntos = 0;
    // Obtiene todos los documentos del grupo solicitado.
    documento.findByPk(req.params.id)
    .then(pResultadoDocumento => {
      if(!pResultadoDocumento || pResultadoDocumento.dataValues.grupo === null) {
        tipoError = 'ADVERTENCIA';
        throw new Error('No existe el documento solicitado.');
      }
      documentoPrincipal = pResultadoDocumento.dataValues;
      return documento.findAll({
        attributes:['id_documento', 'nombre', 'nombre_plantilla', '_usuario_creacion', 'via_actual','de'],
        where:{ grupo:pResultadoDocumento.dataValues.grupo },
        order: [['_fecha_creacion','DESC']],
        include: [{
          model: modelos.adjunto_aprobacion_cd,
          as: 'adjunto_aprobacion_cd',
          required: false,
        }],
      });
    })
    .then(pResultado => {
      docs = [];
      adocs = {};
      documentos = JSON.parse(JSON.stringify(pResultado));
      documentos.forEach(doc => {
        adocs[doc.id_documento] = doc;
        docs.push(doc.id_documento);
      });
      if(documentos.length>0){
        return historial_flujo.findAll({
          where:{
            id_documento:{ [Op.or]:{ [Op.in]:docs } },
          },
          order:[['_fecha_creacion','DESC']],
        });
      }
      else{
        tipoError = 'ADVERTENCIA';
        throw new Error('No existe el proceso solicitado.');
      }

    })
    .then(respuesta => {
      pResultado = JSON.parse(JSON.stringify(respuesta));
      if (pResultado.length > 0) {
        const historicos = pResultado.map((pItem) => {
          if (
            [
              "FIRMO",
              "CERRADO",
              "DERIVADO",
              "CREADO",
              "ANULADO",
              "APROBADO_CD",
            ].indexOf(pItem.accion) != -1
          ) {
            pItem.cite = adocs[pItem.id_documento].nombre;
          }
          adjuntos = adocs[pItem.id_documento].adjunto_aprobacion_cd.length;
          usuariosDe = JSON.parse(adocs[pItem.id_documento].de);
          if (
            pItem.accion === "APROBADO_CD" &&
            usuariosDe.includes(pItem._usuario_creacion) &&
            adjuntos > 0 &&
            adocs[pItem.id_documento]._usuario_creacion ===
              pItem._usuario_creacion
          ) {
            pItem.mensajeAdjuntos = `Aprobó ${adjuntos} documento(s) adjunto(s)`;
          }
          pItem.tipo_doc = adocs[pItem.id_documento].nombre_plantilla;
          return usuario
            .findByPk(pItem._usuario_creacion)
            .then((pUsuario) => {
              pItem.nombres = `${pUsuario.nombres} ${pUsuario.apellidos}`;
              pItem.usuario = pUsuario.usuario;
            })
            .then(() => {
              if (pItem.accion === "DERIVADO") {
                return documento
                  .findOne({
                    attributes: ["id_documento", "via_actual"],
                    where: { id_documento: pItem.id_documento },
                  })
                  .then((pRespDoc) => usuario.findByPk(pRespDoc.via_actual))
                  .then((pUsuario) => {
                    pItem.derivado = {
                      nombres: `${pUsuario.nombres} ${pUsuario.apellidos}`,
                      usuario: pUsuario.usuario,
                    };
                  });
              }
              if (pItem.accion === "ANULADO") {
                return usuario
                  .findByPk(pItem._usuario_modificacion)
                  .then((pUsuario) => {
                    pItem.aprobado = {
                      nombres: `${pUsuario.nombres} ${pUsuario.apellidos}`,
                      usuario: pUsuario.usuario,
                    };
                  });
              }
            })
            .then(() => Promise.resolve(pItem))
            .catch((pError) => Promise.reject(pError));
        });

        return Promise.all(historicos);
      } else {
        tipoError = "ADVERTENCIA";
        throw new Error("El documento no tiene historial");
      }
    })
    .then(pResultado => {
        if(pResultado){
          docs = pResultado;
          if( docs[0].accion=='RECHAZADO' || docs[0].accion=='ELIMINADO')
            return usuario.findByPk(adocs[docs[0].id_documento]._usuario_creacion);
          return usuario.findByPk(adocs[docs[0].id_documento].via_actual);
        } else {
          tipoError = 'ADVERTENCIA';
          throw new Error('El documento no tiene historial');
        }
    })
    .then(usu => {
      if(documentoPrincipal.aprobaron_cd === null || documentoPrincipal.aprobaron_cd.length ===0) {

      if( ['CERRADO','CREADO'].indexOf(docs[0].accion) === -1 ){
        docs.unshift({
          _fecha_creacion: docs[0]._fecha_creacion,
          _fecha_modificacion: docs[0]._fecha_creacion,
          accion: "REVISANDO",
          estado: "ACTIVO",
          id_documento: 0,
          id_historial_flujo: -1,
          nombres: `${usu.nombres} ${usu.apellidos}`,
          observacion: "",
          usuario: usu.usuario,
        });
      }
      }
      res.send(util.formatearMensaje("EXITO", "Historial de flujo de un proceso", docs));
    })
    .catch(pError => {
      logger.error("Error al obtener el Historial", pError);
      res.status(412).send(util.formatearMensaje(tipoError, pError));
    });
  });

  app.options('/api/v1/historialFlujo/documento', sequelizeFormly.formly(documento, app.src.db.models));
};
