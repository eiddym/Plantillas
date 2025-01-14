process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const config = require('konfig')();
// para base64
const base64 = require('base-64');
const utf8 = require('utf8');
const axios = require('axios');
const Q = require('q');

const servicios = {
  obtenerPersona: (ci, fecha_nacimiento) => {
    const deferred = Q.defer();
      console.log("ci: ", ci);
      console.log("fecha_nacimiento: ", fecha_nacimiento);

      //argumentos para consultar al servicio
      const url = config.app.servicio_segip.host_port;
      const endpoint_base = config.app.servicio_segip.endpoint_base;
      const endpoint_tokens = config.app.servicio_segip.endpoint_tokens;
      const endpoint_personas = "segip/personas/";
      const endpoint_fecha = "?fecha_nacimiento=";
      const usuario = config.app.servicio_segip.usuario;
      const contresena = config.app.servicio_segip.contrasena;
      // header
      const args1 = {
          headers: { "Content-Type": "application/json" },
          data: {
            usuario,
            "contrasena": utf8.decode(base64.decode(contresena)),
          },
      };
      args1.url = url + endpoint_base + endpoint_tokens;
      args1.method = 'post';
      return axios(args1).then((data) => {
        if(data.token){
          const token = data.token;
          const args = {
            headers: { "x-access-token": token },
          };
          args.url = url + endpoint_base + endpoint_personas + ci + endpoint_fecha + fecha_nacimiento;
          args.method = 'get';
          return axios(args).then((data) => {
            if (!data.success) {
              deferred.reject(new Error("No existen resultados para su consulta."));
            } else {
              deferred.resolve(data.persona);
            }
          }).catch((err) => {
            deferred.reject(new Error("No se pudo recuperar datos desde segip."));
          });
        }else {
          deferred.reject(new Error("No se pudo recuperar el token desde segip."));
        }
      }).catch((err) => {
          deferred.reject(new Error("No se pudo obtener el token desde segip."));
      });
      //fin del servicio

    return deferred.promise;
  },
};

module.exports = servicios;
