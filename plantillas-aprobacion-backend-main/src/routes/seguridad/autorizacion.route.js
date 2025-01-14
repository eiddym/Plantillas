const { raw } = require("body-parser");
const _ = require('lodash');
const notificar = require('../../lib/notificacion');
const logger = require('../../lib/logger');

module.exports = (app) => {
  const sequelize = app.src.db.sequelize;
  app.get('/codigo', app.controller.autorizacion.codigo);
  app.get('/autorizar', app.controller.autorizacion.autorizar);
  app.get('/api/v1/salir', app.controller.autorizacion.salir);
  app.post('/aprobacion-callback', async (req, res, next) => {
  const Modelos = await app.src.db.models;
  let transaction;
    try {
      const solicitud = await app.src.db.models.solicitud_aprobacion_cd.findOne({
        where: {
          uuid_solicitud: req.body.requestUuid,
          estado: 'SOLICITADO',
        },
      });
      if (!solicitud) {
        return res.status(404).send();
      }
      if (req.body.aceptado) {
        await solicitud.update({
          estado: 'APROBADO_CD',
          respuesta_servicio_aprobacion: JSON.stringify(req.body),
          fecha_aprobacion: new Date(),
          _fecha_modificacion: new Date(),
        });
      } else {
        await solicitud.update({
          estado: 'FALLIDO',
          respuesta_servicio_aprobacion: JSON.stringify(req.body),
          _fecha_modificacion: new Date(),
        });
        return res.status(200).send();
      }
      if (solicitud.dataValues.fid_documento) {
        let datos = {};
        const doc = await app.src.db.models.documento.findOne({
          where: {
            id_documento: solicitud.dataValues.fid_documento,
          },
        })
        if (!doc) {
          return res.status(400).send()
        }
        const aprobaron_cd = doc.dataValues.aprobaron_cd || [];
        aprobadores = JSON.parse(doc.dataValues.de).concat(JSON.parse(doc.dataValues.via)).concat(JSON.parse(doc.dataValues.para));
        if(['CERRADO', 'DERIVADO'].indexOf(doc.dataValues.estado) === -1) throw new Error('El documento aun no puede ser aprobado con ciudadanía digital por su estado.');
        let aprobadorActual= null;
        aprobaron_cd.push(solicitud.dataValues._usuario_creacion)
        transaction = await sequelize.transaction();
        await app.src.db.models.historial_flujo.create({
          id_documento: doc.dataValues.id_documento,
          accion:'APROBADO_CD',
          observacion:'',
          estado: 'ACTIVO',
          _usuario_creacion: solicitud.dataValues._usuario_creacion,
        }, { transaction });
        const faltantes = _.xor(aprobaron_cd, aprobadores);
        if (faltantes.length > 0){
          aprobadorActual = faltantes[0];
        } else {
          aprobadorActual = null
        }
        datos = { aprobador_cd_actual: aprobadorActual, aprobaron_cd };
        if (faltantes.length === 0) {
          datos.aprobado_cd = true
        }
        await app.src.db.models.documento.update(datos, { where: { id_documento: solicitud.dataValues.fid_documento }, transaction });
        await transaction.commit();
        const documento = await Modelos.documento.findOne({ where: { id_documento: solicitud.dataValues.fid_documento }});
        // Si aprobadorActual !== null enviar notificaiciones
        if(documento.aprobado_cd){
          await notificar.enviar(Modelos, documento, 'aprobados_ciudadania',{})
        }
        else{
          await notificar.enviar(Modelos, documento, 'aprobar_ciudadania',{})
        }
      }
      return res.send();
    } catch (error) {
      logger.error('error :>> ', error);
      if (transaction) {
        await transaction.rollback();
      }
      return res.status(500).send();
    }
  });
  // express-validation
  app.use((err, req, res, next) => {
    res.status(400).json(err);
  });
};
