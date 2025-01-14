module.exports = app => {
  const modelos = app.src.db.models;
  const CatalogoDocumento = modelos.catalogo_documento;
  const Documento = modelos.documento;
  const util = app.src.lib.util;
  const Op = app.src.db.Sequelize.Op;
  const bl = require('../../bl/plantillasFormly/catalogoBL');


  app.put('/api/v1/plantillasFormly/catalogo/documento/:id', (req, res) => CatalogoDocumento.findOne({
    where: {
      id_catalogo_documento: req.params.id,
      fid_catalogo: req.body.fid_catalogo,
    },
  })
    .then(resp => {
      if (!resp)
        throw Error('No existe el recurso solicitado.');
      // if (resp.propietario !== req.body.audit_usuario.id_usuario) throw Error('Usted no esta autorizado para realizar la modificación.');
      return resp.update(req.body.actualizar);
    })
    .then(resp => {
      resp.dataValues.accion = "MODIFICAR";
      resp.dataValues.audit_usuario = req.body.audit_usuario;
      return bl.crearHistorico(modelos, resp.fid_catalogo, resp.dataValues, {});
    })
    .then(() => res.send(util.formatearMensaje("EXITO", 'Modificación exitosa')))
    .catch(error => res.status(412).send(util.formatearMensaje("ERROR", error))));

  app.post('/api/v1/plantillasFormly/catalogo/documento', (req, res) => {
    if (!req.body.cite) return res.status(412).send(util.formatearMensaje("ERROR", 'No existe parametro de busqueda'));
    let documento = null;
    return Documento.findOne({
      attributes: ['id_documento', 'nombre', '_usuario_creacion', '_usuario_modificacion', 'firmaron', 'via_actual', 'de', 'via', 'para', 'grupo'],
      where: {
        nombre: {
          [Op.iLike]: req.body.cite,
        },
      },
    })
    .then(respDocumento => {
      if (!respDocumento) throw Error('El documento solicitado no esta disponible en estos momentos');
      documento = respDocumento;
      return bl.validarRelacionDocumento(modelos, respDocumento, req.body.audit_usuario);
    })
    .then(respValido => {
      if (respValido == false ) throw Error('Usted no se encuentra autorizado para ver el documento solicitado.')
      const datosResp = {
        id_documento: documento.id_documento,
        nombre: documento.nombre,
        fecha: documento.fecha,
      };
      return res.send(util.formatearMensaje("EXITO", 'Obtencion de documento exitosa.', datosResp));
    })
    .catch(error => res.status(412).send(util.formatearMensaje("ERROR", error)));
  });
}