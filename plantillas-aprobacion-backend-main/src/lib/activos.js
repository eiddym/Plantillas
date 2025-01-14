const _ = require('lodash');
const axios = require('axios');
const logger = require('./logger');

const config = require('../config/config')();
const headers = {
  'Authorization': config.activos.token,
};

module.exports = {
  consultar: (textoBuscar = '', tipo = 'asignacion') => {
    console.log('[libActivos] consultar ...');

    return _buscar(textoBuscar, 'codigo', tipo)
      .then(resp1 => _buscar(textoBuscar, 'descripcion', tipo).then(resp2 => resp1.concat(resp2)))
      .catch(error => {
        logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
        const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
        throw new Error(errMsg);
      });
  },

  consultarPorUsuario: (ci = '', ci_responsable) => {
    console.log('[libActivos] consultarPorUsuario ...');

    return new Promise((resolve, reject) => {
      const url = encodeURI(`${config.activos.url_consulta_por_usuario}/${ci}?responsable_ci=${ci_responsable}`);
      console.log('[libActivos] url = ', url);
      return axios({ method: 'get', url, headers: { 'Authorization': config.activos.token } })
        .then(resp => {
          if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
            return resolve(resp.data.data || []);
          }
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
          const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
          return reject(errMsg);
        })
        .catch(error => {
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
          const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
          return reject(errMsg);
        });
    });
  },

  asignar: (data) => {
    console.log('[libActivos] asignar ....'.blue, data);
    return new Promise((resolve, reject) => {
      const url = encodeURI(config.activos.url_asignacion);
      console.log('[libActivos] url = '.blue, url);
      return axios({ method: 'post', url, data, headers: { 'Authorization': config.activos.token } })
        .then(resp => {
          console.log('[libActivos] revisando respuesta'.blue, resp);
          if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
            return resolve();
            // return resolve(resp.data.pdf);
          }
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
          const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
          return reject(new Error(errMsg));
        })
        .catch(error => {
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
          const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
          return reject(new Error(errMsg));
        });
    });
  },

  devolver: (data) => {
    console.log('[libActivos] devolver _________...'.yellow);
    return new Promise((resolve, reject) => {
      const url = encodeURI(config.activos.url_devolucion);
      return axios({ method: 'post', url, data, headers: { 'Authorization': config.activos.token } })
      .then(resp => {
        console.log('[libActivos] revisando la resp', resp)
        if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
          return resolve();
          // return resolve(resp.data.pdf);
        }
        logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
        const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
        return reject(new Error(errMsg));
      })
      .catch(error => {
        logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
        const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
        return reject(new Error(errMsg));
      });
    });
  },

  crearIngresoActivos: (data) => {
    console.log('[libActivos] INGRESAR _________...'.yellow);

    return new Promise((resolve, reject) => {
      const url = encodeURI(config.activos.url_ingreso);
      console.log('[libActivos] url = ', url);
      return axios({ method: 'post', url, data, headers: { 'Authorization': config.activos.token } })
        .then(resp => {
          console.log('[libActivos] revisando la resp', resp)
          if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
            return resolve();
          }
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
          const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
          return reject(new Error(errMsg));
        })
        .catch(error => {
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
          const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
          return reject(new Error(errMsg));
        });
    });
  },

  consultarProveedor: (textoBuscar) => new Promise((resolve, reject) => {
    if (!textoBuscar || textoBuscar.length == 0) return resolve([]);
    return axios({
      method: 'get',
      url: `${config.activos.url_proveedor}?descripcion=${textoBuscar}`,
      headers,
    })
      .then(resp => {
        if (resp.status !== 200) throw Error('Estado diferente al de exito.');
        if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
        return resolve(resp.data.datos);
      })
      .catch(error => {
        let respError = error;
        if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
        return reject(respError);
      });
  }),

  registrarBaja: (data) => {
    console.log('[libActivos] INGRESAR _________...'.yellow);

    return new Promise((resolve, reject) => {
      const url = encodeURI(config.activos.url_baja);
      console.log('[libActivos] url = ', url);
      return axios({ method: 'post', url, data, headers: { 'Authorization': config.activos.token } })
        .then(resp => {
          console.log('[libActivos] revisando la resp', resp)
          if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
            return resolve();
          }
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
          const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
          return reject(new Error(errMsg));
        })
        .catch(error => {
          logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
          const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
          return reject(new Error(errMsg));
        });
    });
  },
};

function _buscar(textoBuscar, campo = 'descripcion', tipo) {
  return new Promise((resolve, reject) => {
    const url = encodeURI(`${config.activos.url_consulta}?${campo}=${textoBuscar}&plantilla=${tipo}`);

    console.log('[libActivos] url = ', url);
    return axios({ method: 'get', url, headers: { 'Authorization': config.activos.token } })
      .then(resp => {
        if ((resp.status === 200 || resp.status === 202) && resp.data.finalizado) {
          return resolve(resp.data.data || []);
        }
        logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', resp.data);
        const errMsg = (resp.data && resp.data.mensaje) ? resp.data.mensaje : 'Error al consultar en el Servicio de Activos';
        return reject(errMsg);
      })
      .catch(error => {
        logger.error('[libActivos] Error al consultar en el Servicio de Activos: ', error);
        const errMsg = (error.response && error.response.data && error.response.data.mensaje) ? error.response.data.mensaje : `${error}`;
        return reject(errMsg);
      });
  });
}
