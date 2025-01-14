const logger = require('../../lib/logger');

module.exports = app => {
  const modelos = app.src.db.models;
  const CatalogoUsuario = modelos.catalogo_usuario;
  const Catalogo = modelos.catalogo;
  const Usuario = modelos.Usuario;
  const util = app.src.lib.util;
  const blCatalogo = require("../../bl/plantillasFormly/catalogoBL");

  app.put('/api/v1/plantillasFormly/catalogo/usuario/:id', (req, res) => {
    console.log('Iniciando con la modificacion de un catalogo_usuario', req.body);
    let catalogoUsuarioBuscado = null;
    let propietario = null;
    return Catalogo.findOne({
      attributes: ['propietario'],
      where: {
        id_catalogo: req.body.fid_catalogo,
      },
    })
    .then(respCatalogo => {

      propietario = respCatalogo.propietario;
      return CatalogoUsuario.findOne({
        where: {
          id_catalogo_usuario: req.params.id,
          fid_catalogo: req.body.fid_catalogo,
        },
      })
    })
    .then(resp => {
      if (!resp) throw Error('No existe el recurso solicitado.');
      catalogoUsuarioBuscado = resp;
      console.log('Revisando la resp', resp.dataValues);
      if (propietario !== req.body.audit_usuario.id_usuario) throw Error('Usted no esta autorizado para realizar la modificación.');
      return resp.update(req.body.actualizar);
    })
    .then((resp) => {
      req.body.accion = "MODIFICAR";
      req.body.id_catalogo_usuario = catalogoUsuarioBuscado.id_catalogo_usuario
      req.body.fid_usuario = catalogoUsuarioBuscado.fid_usuario
      console.log("Revisando la modificacion/ACTUALIZACION CATALOGO USUARIO", resp);
      resp.dataValues.accion = "MODIFICAR";
      resp.dataValues.audit_usuario = req.body.audit_usuario;
      return blCatalogo.crearHistorico(modelos, req.body.fid_catalogo, resp.dataValues, {});
    })
    .then(res.send(util.formatearMensaje("EXITO", 'Modificación exitosa')))
    .catch(error => {
      logger.error('Error en la modificacion de un catalogo_usuario');
      res.status(412).send(util.formatearMensaje("ERROR", error));
    })
  });



}