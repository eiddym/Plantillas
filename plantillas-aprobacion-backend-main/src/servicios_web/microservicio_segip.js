process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const config = require('konfig')();
const base64 = require('base-64');
const utf8 = require('utf8');
const axios = require('axios');

const servicios = {
  obtenerPersona: (req, res) => {
    if (!req.query.ci) {
      res.status(412).json({msg: "El parámetro Documento de Identidad es requerido."});
    } else if (!req.query.fecha_nacimiento) {
      res.status(412).json({msg: "El parámetro Fecha de Nacimiento es requerido (formato = dd/mm/yyyy)."});
    } else {
r
      console.log(`ci: ${eq.query.ci}`);
      console.log(`fecha_nacimiento: ${req.query.fecha_nacimiento}`);

      //argumentos para consultar al microservicio
      const url = config.app.microservicio_segip.host_port;
      const endpoint_base = config.app.microservicio_segip.endpoint_base;
      const endpoint_tokens = config.app.microservicio_segip.endpoint_tokens;
      const endpoint_personas = "personas?ci=";
      const endpoint_fecha = "&fecha_nacimiento=";
      const usuario = config.app.microservicio_segip.usuario;
      const contresena = config.app.microservicio_segip.contrasena;
      // header
      const args1 = {
          headers: { "Content-Type": "application/json" },
          // data: { "usuario": usuario, "contrasena": utf8.decode(base64.decode(contresena)) }
          data: { usuario, "contrasena": utf8.decode(contresena) },
      };
      args1.url = url + endpoint_base + endpoint_tokens;
      args1.method = 'post';
      // client.post(url + endpoint_base + endpoint_tokens, args1, function(data, response) {
      return axios(args1).then((data) => {
        if(data.token){
          const token = data.token;
          const args = {
              headers: { "x-access-token": token },
          };
          args.url = url + endpoint_base + endpoint_personas + req.query.ci + endpoint_fecha + req.query.fecha_nacimiento;
          args.method = 'get';
          // client.get(url + endpoint_base + endpoint_personas + req.query.ci + endpoint_fecha + req.query.fecha_nacimiento, args, function(data, response) {
          return axios(args).then((data) => {
            res.json(data);
          }).catch((err) => {
              logger.error('No se pudo recuperar datos del microservicio del segip', err.request.options);
              res.status(404).json({ mensaje: "No se pudo recuperar datos del microservicio del segip." });
          });
        }else {
          res.json(data);
        }
      // }).on('errror', function(err) {
      }).catch((er) => {
          logger.error('No se pudo obtener el token del microservicio del segip', err.request.options);
          res.status(404).json({ mensaje: "No se pudo obtener el token del microservicio del segip." });
      });
      //fin del servicio
    }
  },
};

module.exports = servicios;
