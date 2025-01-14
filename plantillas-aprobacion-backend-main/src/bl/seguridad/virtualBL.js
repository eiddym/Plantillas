const blu = require('./usuarioBL');
const moment = require('moment');
const Uuid = require('uuid');
const jwt = require('jwt-simple');
const logger = require('../../lib/logger');


module.exports = {
  obtenerToken: (modelos, usuarioActivar, usuarioTitular, app) => {
    const cfg = app.src.config.config;
    return new Promise((resolve, reject) => {
      if(!usuarioActivar) return reject('No existen datos  del usuario a activar.');
      return blu.obtenerRoles(modelos.usuario_rol, modelos.rol, usuarioActivar.id_usuario)
      .then(rolesResp => {
        if(!rolesResp) throw Error('No se pudo obtener los roles del usuario a activar.');
        return blu.obtenerMenus(modelos.rol_menu, modelos.menu, rolesResp);
      })
      .then(menuRolesResp => {
        const cifrar = {
          id_usuario: usuarioActivar.id_usuario,
          usuario: usuarioActivar.usuario,
          secret: jwt.encode({
            fecha: moment().tz('America/La_Paz').add(cfg.tiempo_token, 'minutes').format(),
            clave: Uuid.v4(),
          }, cfg.jwtSecret),
          clave: Uuid.v4(),
          tiempo: cfg.tiempo_token,
          virtual: usuarioActivar.virtual,
          roles: menuRolesResp.rol,
        };
        const token = jwt.encode(cifrar, cfg.jwtSecret);
        const respuesta =  {
          user: {
            id: usuarioActivar.id_usuario,
            username: usuarioActivar.usuario,
            first_name: usuarioActivar.nombres,
            last_name: usuarioActivar.apellidos,
            cargo: usuarioActivar.cargo,
            doc: usuarioActivar.numero_documento,
            email: usuarioActivar.email,
            date_joined: usuarioActivar._fecha_creacion,
          },
          menu: menuRolesResp.menu,
          menurEntrar: menuRolesResp.menurEntrar,
          roles: menuRolesResp.rol,
          // virtual: usuarioActivar.virtual,
          token,
        };

        const sesion = app.get('sesion');
        sesion[usuarioActivar.id_usuario] = {
          fecha: moment(moment().tz('America/La_Paz').format()).add(1, 'minutes'),
          backup: null,
          token,
        };

        if ( usuarioActivar.virtual === true ) {
          const sesionVirtual = app.get('virtual');
          sesionVirtual[usuarioActivar.id_usuario] = {
            titular: usuarioTitular.id_usuario,
            docTitular: usuarioTitular.numero_documento,
            token,
          }
          app.set("virtual", sesionVirtual);
        }
        return resolve(respuesta);
      })
      .catch(error => {
        logger.error('Error en la obtencion del token', error);
        return reject(error)
      });
    });
  },
};