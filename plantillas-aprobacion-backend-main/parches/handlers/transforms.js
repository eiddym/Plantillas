const _ = require('lodash');

module.exports = {
  raw
};

function raw(req, res, next) {
  if (!_.isFunction(res.transform)) {
    res.transform = transform;
  }

  next();

  function transform(data) {
    const resp = {
      tipoMensaje: 'EXITO',
      mensaje: 'Procesamiento exitoso',
      datos: data || {}
    }
    return resp;
  }
}