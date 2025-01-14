const _ = require('lodash');
const moment = require('moment');

const util = require('../../lib/util');
const libActivos = require('../../lib/activos');
const logger = require('../../lib/logger');

module.exports = app => {
  const modelos = app.src.db.models;
  const Op = app.src.db.Sequelize.Op;

  app.get('/api/v1/activos/consulta', (req, res) => libActivos.consultar(req.query.filter)
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    }));

  app.get('/api/v1/activos/proveedor', (req, res) => libActivos.consultarProveedor(req.query.filter || '')
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    }));

  app.get('/api/v1/activos/consulta/:tipo', (req, res) => libActivos.consultar(req.query.filter, req.params.tipo)
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    }));

  app.get('/api/v1/activos/consulta/usuario/:ci', (req, res) => {
    const Usuario = modelos.usuario;
    const resultado = {
      propio: false,
    };
    return Usuario.findOne({
      fields: ['id_usuario', 'numero_documento', 'estado'],
      where: {
        id_usuario: req.body.audit_usuario.id_usuario,
      },
    })
    .then(respUsuario => {
      let ci_responsable = null;
      if (!respUsuario) throw Error('El usuario solicitante no es valido.');
      if (respUsuario.estado !== 'ACTIVO') throw Error('El usuario solicitante no se encuentra activo.');
      ci_responsable = respUsuario.numero_documento;
      console.log('comparando')
      console.log('respUsuario.numero_documento', typeof respUsuario.numero_documento, respUsuario.numero_documento);
      console.log('CI a buscar', typeof req.params.ci, req.params.ci);
      if (ci_responsable === req.params.ci) {
        resultado.propio = true;

      }
      return libActivos.consultarPorUsuario(req.params.ci, ci_responsable);
    })
    .then(resp => {
      resultado.items = resp || [];
      return res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resultado));
    })
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    });
  });

  app.post('/api/v1/activos/asignacion', (req, res) => libActivos.asignar(req.body)
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    }));

  app.post('/api/v1/activos/devolucion', (req, res) => libActivos.devolver(req.body)
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    }));

  app.post('/api/v1/activos/recuperar', (req, res) => {
    const Documento = modelos.documento;
    return Documento.findOne({
      fields: ['id_documento', 'plantilla', 'estado', 'plantilla_valor', 'anulado'],
      where: {
        nombre: {
          [Op.like]: req.body.cite,
        },
      },
    })
    .then(docResp => {
      if (!docResp) throw new Error('No existe el documento solicitado');

      const datosPlantilla = JSON.parse(docResp.plantilla_valor);
      let listaActivosSolicitados = null;
      let tipoFormulario = null;

      let documentoDe   = { nombre: null, cargo: null };
      let documentoPara = { nombre: null, cargo: null };

      for (const key in datosPlantilla) {
        if (key.indexOf('tablaActivos-') > -1) {
          listaActivosSolicitados = datosPlantilla[key].filas;
          tipoFormulario = datosPlantilla[key].tipoFormulario;
        }
        if (key.indexOf('datosGenerales-') > -1) {
          documentoDe = datosPlantilla[key].de[0];
          documentoPara = datosPlantilla[key].para;
        }
      }

      if (!tipoFormulario || tipoFormulario !== 'SOLICITUD') {
        throw new Error('Debe ingresar el CITE de un documento de tipo SOLICITUD de activos fijos.');
      }

      const cabecera = {
        documentoDe,
        documentoPara,
      };
      return { items: listaActivosSolicitados, cabecera };
    })
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => {
      logger.error('[activosRT] Error: ', error);
      return res.status(400).send(util.formatearMensaje('ERROR', error.message ? error.message : error));
    });
  });
};
