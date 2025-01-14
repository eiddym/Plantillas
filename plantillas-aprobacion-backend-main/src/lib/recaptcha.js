const axios = require('axios');
const config = require('../config/config')();

module.exports = {
  validar: (req, res) => {
    const {recaptcha}= req.body
    const { secretKey, url } = config.recaptcha;
    // let respuesta = {};
    return new Promise((resolve, reject) => axios({
      method: 'post',
      url: `${url}?secret=${secretKey}&response=${recaptcha}&remoteip=${req.connection.remoteAddress}`,
    })
      .then(resp => resolve(resp))
      .catch(error => {
        console.log('Error en el captcha', error);
        return reject(error);
      }));
  },
}