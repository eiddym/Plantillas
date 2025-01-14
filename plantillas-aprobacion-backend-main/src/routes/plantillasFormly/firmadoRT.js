const fs = require('fs');
const _ = require('lodash');
const Uuid = require('uuid');
const sequelizeFormly = require("sequelize-formly");
const logger = require('../../lib/logger');

module.exports = app => {
  const bl = require('../../bl/plantillasFormly/documentoBL');
  const blFirmado = require('../../bl/plantillasFormly/firmadoBL');
  const notificar = require('../../lib/notificacion');
  const Config = app.src.config.config;
  const Util = app.src.lib.util;
  const FirmaUtil = app.src.lib.firma;
  const Archivo = app.src.lib.archivos;
  const Documento = app.src.db.models.documento;
  const Firma = app.src.db.models.firma;
  const Usuario = app.src.db.models.usuario;
  const HistorialFlujo = app.src.db.models.historial_flujo;
  const SolicitudAprobacioCD = app.src.db.models.solicitud_aprobacion_cd;
  const rutaExternos = app.src.config.config.host;
  const dirDocumento = app.src.config.config.ruta_documentos;
  const Modelos = app.src.db.models;
  const Op = app.src.db.Sequelize.Op;

  /**
    @apiVersion 1.0.0
    @apiGroup Documento
    @apiName Post firmar
    @api {post} /api/v1/documento/firmado Guardar documento firmado

    @apiDescription Post para documento firmado

    @apiParam (Petición) {Base64} base64 Documento firmado digitalmente a guardar.
    @apiParam (Petición) {Integer} id_documento Identificador del documento firmado.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "base64": "",
      "id_documento": 123456
    }

    @apiSuccess (Respuesta) {Texto} tipoMensaje Indica el tipo de mensaje de respuesta obtenido.
    @apiSuccess (Respuesta) {Texto} mensaje Describe el estado de la solicitud

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
      {
        "tipoMensaje": "EXITO",
        "mensaje": "Documento firmado correctamente."
      }

    @apiSampleRequest off
  */
  app.post('/api/v1/documento/firmado', (req,res) => {
    const usuarioFirmante = req.body.audit_usuario.id_usuario;
    const estadosValidos = ['CERRADO', 'DERIVADO'];
    let documento= null;
    let datos = {};
    let firmantes = [];
    let firmanteValido = true;
    let documentoInstancia = null;
    Documento.findOne({
      where: {
        firmante_actual: usuarioFirmante,
        id_documento: req.body.id_documento,
      },
    })
    .then(documentoResp => {
      if(!documentoResp) throw Error('Usted no esta autorizado a firmar el documento.');
      documento = documentoResp.dataValues;
      documentoInstancia = documentoResp;
      const firmaron = documento.firmaron || [];
      firmantes = JSON.parse(documento.de).concat(JSON.parse(documento.via)).concat(JSON.parse(documento.para));
      if (documento.firmaron === null) documento.firmaron = [];
      // if(documento.firmaron.indexOf(usuarioFirmante) > -1 ) throw new Error('Usted ya firmo el documento');
      if(documento.firmaron.indexOf(usuarioFirmante) > -1 ) {
        datos = bl.validarYaFirmo(firmantes, documento.firmaron, usuarioFirmante);
        firmanteValido = false;
        return;
      }
      if(estadosValidos.indexOf(documento.estado) === -1) throw new Error('El documento aun no puede ser firmado por su estado.');
      let firmanteActual= null;
      if(firmantes.indexOf(usuarioFirmante) === -1 ) {

        if(firmaron.length === 0) {
          firmanteActual = firmantes[0];
        }
        else {
          const faltantes = _.xor(firmaron, firmantes);
          firmanteActual = faltantes[0];
        }

        datos = { firmante_actual: firmanteActual, firmaron };
        firmanteValido = false;
        return;
      }

      if(firmaron.length === 0) firmaron.push(usuarioFirmante);
      else firmaron.push(usuarioFirmante);
      const indiceFirmante = firmantes.indexOf(usuarioFirmante);
      const nuevoFirmante = null;
      if(indiceFirmante < firmantes.length -1) {
        firmanteActual = firmantes[indiceFirmante+1];
      }
      datos = { firmante_actual: firmanteActual, firmaron };

      if(indiceFirmante === firmantes.length -1) {
        datos.firmado = true;
      }
      return;

    })
    .then(() => {
      if(firmanteValido === false) return;
      const nombre_privado= Util.formatoNombreDoc(documento.nombre);
      const nombreDocumento = `${Util.formatoNombreDoc(documento.nombre)}.pdf`;
      return Archivo.guardarFirmado(dirDocumento, new Buffer(req.body.base64, "base64"), nombreDocumento, true);
    })
    .then(() =>
      Documento.update(datos, { where: { id_documento: req.body.id_documento }}))
      //documentoInstancia.update(datos))
    .then(() => Documento.findOne({ where: { id_documento: req.body.id_documento }}))
    .then((documento) => {
      if(documento.firmado)
        return notificar.enviar(Modelos, documento, 'aprobados_ciudadania',{})
      else
        return notificar.enviar(Modelos, documento, 'aprobar_ciudadania',{})
    })
    .then((resp) => {
      if(firmanteValido === false) return;
      return HistorialFlujo.create({
        id_documento: documento.id_documento,
        accion:'FIRMO',
        observacion:'',
        estado: 'ACTIVO',
        _usuario_creacion: usuarioFirmante,
      });
    })
    .then(() => bl.obtenerCrearHash(documento, req))
    .then(hash => bl.actualizarFirmaHash(Modelos, hash, documento, usuarioFirmante))
    .then( () => {

      res.status(200).send(Util.formatearMensaje('EXITO', 'Documento firmado correctamente.'));
    })
    .catch(error => {
      logger.error("Error al escribir el documento firmado", error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get documento/firmar
    @api {get} /api/v1/documento/firmar  Obtiene los documentos a firmar

    @apiDescription Get documento, obtiene los documentos a firmar
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
  app.get('/api/v1/documento/firmar', filtros, (req, res) => {
    let order;
    const usuario = req.body.audit_usuario.id_usuario;
    const estadosValidos = ['CERRADO', 'DERIVADO'];
    const opcionesDocumento = {
      attributes: ['id_documento', 'nombre', 'nombre_plantilla', 'fecha', 'estado', 'impreso', '_fecha_creacion', '_fecha_modificacion', '_usuario_creacion', 'firmado', 'firmaron'],
      where: {
        firmante_actual: usuario,
        estado: { [Op.in]: estadosValidos},
        firmado: false,
      },
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
      res.send(Util.formatearMensaje("EXITO", "La busqueda fue exitosa", {total:resp.count,resultado:resp.rows}));
    })
    .catch(error => {
      logger.error("Error en la obtención de documento para firmar", error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });

  function filtros (req,res,next){
      if(req.query.filter!='')
        Util.consulta(req,res,next,Documento);
      else next();
  }

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Post Documento para firmar
    @api {post} /api/v1/documento/firmar Obtener pdf válido para firma

    @apiDescription Post para obtener un documento válido para firma

    @apiParam (Petición) {Texto} cite Cite del documento a firmar
    @apiParam (Petición) {Integer} id_documento Identificador del documento que se desea firmar

    @apiParamExample {json} Ejemplo para enviar:
    {
      "cite":"AGETIC/SS/0002/2020",
      "id_documento":86281
    }

    @apiSuccess (Respuesta) {Base64} Documento pdf a ser firmado en base 64

    @apiSuccessExample {Base64} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
    "JVBERi0xL......"

    @apiSampleRequest off
  */

  app.post('/api/v1/documento/firmar', (req,res) => {
    if(!req.body.cite) return res.status(412).send(Util.formatearMensaje('ERROR', 'Es necesario que proporcione el cite del documento.'));
    if(!req.body.id_documento) return res.status(412).send(Util.formatearMensaje('ERROR', 'Es necesario que proporcione el identificador del documento.'));

    const nombre= req.body.cite.substr(0,req.body.cite.indexOf('.pdf'));
    const usuarioPeticion = req.body.audit_usuario;
    const msg = "Usted no esta autorizado para ver este documento.";
    let dirArch = '.';
    const enFirma = false;
    let nombreDocumento;
    let documento;
    Documento.findOne({
      attributes: ['id_documento', 'nombre', 'firmado', 'firmaron', 'plantilla', 'plantilla_valor', 'grupo', 'anulado'],
      where: {
        id_documento: req.body.id_documento,
        firmante_actual: usuarioPeticion.id_usuario,
        estado: { [Op.in]: ['CERRADO', 'DERIVADO'] },
      },
      include:[
        {
          model: Firma,
          as: 'firma',
          required: false,
        },
      ],
    })
    .then(documentoResp => {
      if(!documentoResp) throw new Error('El documento solicitado no esta disponible para usted.');

      documento = documentoResp;
      nombreDocumento = `${Util.formatoNombreDoc(documento.dataValues.nombre)}`;
      dirArch += `/public/documentos/${nombreDocumento}.pdf`;
      if (!documento.dataValues.firma) return bl.crearCodigoFirma(Modelos, documento.dataValues, req);
      return documento.dataValues.firma.dataValues.codigo;
    })
    .then(() => {
      const documentoExiste =fs.existsSync(dirArch);
      if(!documentoExiste || documentoExiste === false) throw Error('No se pudo obtener el documento a firmar.');
      return fs.readFile(dirArch, (error, data) => {
        if(error) {
          throw Error(process.env.NODE_ENV==='production'?'No se pudo obtener el documento a firmar.': error);
        }
        return res.send(data);
      });
    })
    .catch(error => {
      logger.error("Error en la busqueda del documento", error, req.body);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get documento/firmado/:id
    @api {get} /api/v1/documento/firmado/:id Obtiene información de las firmas del documento

    @apiDescription Get documento/firmado/:id, obtiene información de las firmas del documento

    @apiParam (Parámetro) {Integer} id Identificador del documento

    @apiSuccess (Respuesta) {Texto} tipoMensaje Texto que define el éxito de la petición
    @apiSuccess (Respuesta) {Texto} mensaje Texto detallado del resultado de la petición
    @apiSuccess (Respuesta) {Array} datos Array de firmas

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Firmas obtenidas correctamente.",
      "datos": []
    }
  */

  app.get('/api/v1/documento/firmado/:id', (req,res) => {
    const dirDocumento = app.src.config.config.ruta_documentos;
    const usuarioPeticion = req.body.audit_usuario;

    let nombreDocumento = null;
    let usuarios = [];
    let idDocumento = null;
    Documento.findOne({
      attributes: ['id_documento', 'nombre', 'firmado', 'firmaron', 'de', 'via', 'para', 'aprobado_cd', 'aprobaron_cd'],
      where: { id_documento : req.params.id },
    })
    .then(documento => {
      if(!documento) return ([]);
      idDocumento = documento.id_documento;
      nombreDocumento = `${Util.formatoNombreDoc(documento.nombre)}.pdf`;
      const firmantes = JSON.parse(documento.de).concat(JSON.parse(documento.via)).concat(JSON.parse(documento.para));
      return Usuario.findAll({
        attributes: ['id_usuario', 'numero_documento', 'nombres', 'apellidos'],
        where: { id_usuario: { [Op.in]: firmantes}},
      });
    })
    .then((usuariosResp = []) => {
      usuarios = usuariosResp;
      return SolicitudAprobacioCD.findAll({
        attributes: ['id', 'uuid_solicitud', 'respuesta_servicio_aprobacion', '_usuario_creacion'],
        where: { fid_documento: idDocumento, estado: 'APROBADO_CD', tipo: 'DOCUMENTO'},
      });
    })
    .then((data) => {
      const aprobados = data || [];
      return blFirmado.procesarAprobacion(usuarios, aprobados);
    })
    .then((filtrado = []) => {
      res.send(Util.formatearMensaje('EXITO', 'Firmas obtenidas correctamente.', filtrado.reverse()));
    })
    .catch(e => {
      res.status(412).send(Util.formatearMensaje('ERROR', e));
    });
  });

  app.options('/api/v1/documento/firmar', sequelizeFormly.formly(Documento, app.src.db.models));

};
