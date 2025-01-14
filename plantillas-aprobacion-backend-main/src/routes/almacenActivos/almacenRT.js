require('colors');
const _ = require('lodash');
const libAlmacen = require('../../lib/almacen');

module.exports = app => {
  const util = require('../../lib/util');
  const modelos = app.src.db.models;
  const Op = app.src.db.Sequelize.Op;
  app.get('/api/v1/almacen/consulta', (req,res) => libAlmacen.consultar(req.query.filter || '', req.query.todos || 0)
    .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
    .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error))));

  app.get('/api/v1/almacen/proveedor', (req,res) => libAlmacen.consultarProveedores(req.query.filter || '')
  .then(resp => res.status(200).send(util.formatearMensaje('EXITO', 'Consulta exitosa', resp)))
  .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error))));

  app.post('/api/v1/almacen/recuperar', (req,res) => {
    const Documento = modelos.documento;
    let solicitante;
    let idSolicitud = null;
    return Documento.findOne({
      fields: ['id_documento', 'plantilla_valor', 'estado', 'plantilla_valor', 'anulado'],
      where: {
        nombre: {
          [Op.like]: req.body.cite,
        },
      },
    })
    .then(docResp => {
      const datosPlantilla = JSON.parse(docResp.plantilla_valor);
      for (const key in datosPlantilla) {
        if (key.indexOf('consultaAlmacen-') > -1) {
          idSolicitud = datosPlantilla[key].solicitud;
        }
        if (key.indexOf('datosGenerales-') > -1) {
          solicitante = `${datosPlantilla[key].de[0].nombres} ${datosPlantilla[key].de[0].apellidos}`;
        }
      }
      return libAlmacen.recuperar(idSolicitud);
    })
    .then(respItems => {
      respItems.cabecera.solicitado_por = solicitante;
      respItems.cite_sms = req.body.cite;
      respItems.id_solicitud = idSolicitud;
      return res.status(200).send(util.formatearMensaje('EXITO', 'Recuperacion exitosa de la entrega.', respItems));
    })
    .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error)));
  });
};