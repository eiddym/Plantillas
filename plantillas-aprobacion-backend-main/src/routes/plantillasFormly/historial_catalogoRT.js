const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = app => {

  const modelos = app.src.db.models;
  const Usuario = modelos.usuario;
  const Documento = modelos.documento;
  const HistorialCatalogo = modelos.historial_catalogo;
  const util = require('../../lib/util')

  // app.get('/historialCatalogo/:id', (req, res) => {
  app.get('/api/v1/historialCatalogo/:id', (req, res) => {
    const idCatalogo = req.params.id;

    let catalogos = [];
    let idDocumentos = [];
    let idUsuarios = [];
    const usuarios = {};
    const documentos = {};
    HistorialCatalogo.findAll({
      where: {
        fid_catalogo: idCatalogo,
      },
      order: [['_usuario_creacion', 'asc']],
    })
    .then(resp => {
      if (!resp ) throw Error('No existe historial');
      catalogos = resp;
      const usuariosTemp = [];
      const documentosTemp = [];

      _.map(resp, item => {
        usuariosTemp.push(_.compact([
          item.dataValues._usuario_creacion,
          item.dataValues._usuario_modificacion,
          item.dataValues.datos._usuario_creacion,
          item.dataValues.datos._usuario_modificacion,
          item.dataValues.datos.fid_usuario,
          item.dataValues.datos.propietario,
        ]));
        documentosTemp.push(item.dataValues.datos.fid_documento);
      });

      idUsuarios = _.uniq(_.flattenDeep(usuariosTemp));
      idDocumentos = _.compact(_.uniq(_.flattenDeep(documentosTemp)));
      return Usuario.findAll({
        attributes: ['id_usuario', 'nombres', 'apellidos'],
        where: { id_usuario: {$in: idUsuarios } },
      });
    })
    .then(respUsuarios => {
      if (respUsuarios) {
        respUsuarios.forEach(item => {
          if (!usuarios[item.id_usuario]) usuarios[item.id_usuario] = `${item.nombres} ${item.apellidos}`;
        });
      }
      return Documento.findAll({
        attributes: ['id_documento', 'nombre'],
        where: { id_documento: {$in: idDocumentos} },
      });
    })
    .then(respDocumentos => {
      if (respDocumentos) {
        respDocumentos.forEach((item) => {
          if (!documentos[item.id_documento])
            documentos[item.id_documento] = item.nombre
        });
      }

      res.send(util.formatearMensaje("EXITO", "Historial de acciones de un catalogo", {catalogos:catalogos.reverse(),usuarios, documentos}));
    })
    .catch(error => {
      logger.error('Error en la obtencion del historial', error);
      res.status(412).send(util.formatearMensaje(tipoError, error, []))
    });
  })

};
