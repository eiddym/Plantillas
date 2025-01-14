require('colors');
const axios = require('axios');
const _ = require('lodash');
const logger = require('./logger');
const config = require('../config/config')();

const headers = {
  'Authorization': config.aprobacionCD.token,
};

module.exports = {
    verificarDocumento: (archivo, cite) => new Promise((resolve, reject) => {
        const datos = {
          archivo
        }
        
        return axios({
          method: 'post',
          url: config.aprobacionCD.url_validar_documento,
          headers,
          data: datos,
        })
        .then(resp => {
          if (resp.status !== 200) throw Error('Estado diferente al de exito.');
          if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');

          logger.info(`verificación de documento con cite: ${cite} fue exitoso`);
          return resolve(resp.data);
        })
        .catch(error => {
          let respError = error;
          logger.error(error);
          if (error.response && error.response.request && error.response.request.res && error.response.request.res.statusMessage) {
            respError = 'Ocurrio un Error a procesar su petición';
            logger.error(error.response.request.res.statusMessage);
          }
          else respError = 'El sistema de aprobación de documentos no se encuentra disponible en estos momentos.';

          return reject(respError);
        });
    })
}
