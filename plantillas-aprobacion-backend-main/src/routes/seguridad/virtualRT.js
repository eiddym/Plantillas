const util = require('../../lib/util');
const _ = require('lodash');
const bl = require('../../bl/seguridad/virtualBL');
const logger = require('../../lib/logger');

module.exports = app => {
  const modelos = app.src.db.models;
  const sequelize = app.src.db.sequelize;
  const Op = app.src.db.Sequelize.Op;

  /**
    @apiVersion 2.0.0
    @apiGroup Seguridad
    @apiName Get seguridad/virtual/todos
    @api {get} /api/v1/seguridad/virtual/todos Obtiene todos los usuarios virtuales existentes

    @apiDescription Get seguridad/virtual/todos, obtiene todos los usuarios virtuales existentes, así como al usuario real que puede acceder al usuario virtual

    @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
    @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
    @apiSuccess (Respuesta) {Texto} cargo Cargo del usuario
    @apiSuccess (Respuesta) {Texto} numero_documento Número de CI del usuario
    @apiSuccess (Respuesta) {Texto} email Correo electrónico del usuario
    @apiSuccess (Respuesta) {Texto} unidad Unidad en la que trabaja el usuario
 
    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitosa",
      "datos": {
        "total": 3,
        "resultado": [
          {
            "id_usuario":10,
            "cargo":"Correspondencia",
            "nombres":"Correspondencia",
            "libre":false,
            "titular": {
              "id_usuario":12,
              "nombres":"Juan",
              "apellidos":"Perez",
              "usuario":"jperez"
            }
          },
          {
            "id_usuario":15,
            "cargo":"Responsable de caja chica",
            "nombres":"Caja chica",
            "libre":true
          },
          {
            "id_usuario":17,
            "cargo":"Responsable de caja chica dos",
            "nombres":"Caja Chica Dos",
            "libre":true
          }
        ]
      }
    }
  */
  // app.get('/todos', (req, res) => {
  app.get('/api/v1/seguridad/virtual/todos', (req, res) => {
    let usuariosVirtuales = [];
    let virtuales = [];
    let titulares = [];
    const respuesta = [];
    modelos.usuario.findAll({
      attributes: ['id_usuario', 'cargo', 'nombres'],
      where:{
        virtual: true,
        estado: 'ACTIVO',
      },
    })
    .then(respUsuariosVirtuales => {
      usuariosVirtuales = respUsuariosVirtuales;
      const idVirtuales = _.map(usuariosVirtuales, 'id_usuario');
      return modelos.virtual.findAll({
        where: {
          fid_usuario_virtual: {
            [Op.in]: idVirtuales,
          },
        },
      });
    })
    .then(respVirtuales => {
      virtuales = respVirtuales;
      const idTitulares = _.map(respVirtuales, 'fid_usuario_titular');
      return modelos.usuario.findAll({
        attributes: ['id_usuario', 'nombres', 'apellidos', 'usuario'],
        where: {
          id_usuario: {
            [Op.in]: idTitulares,
          },
        },
      });
    })
    .then(respTitulares => {
      titulares = respTitulares;
      // Filtrando si los usuarios usuariosVirtuales estan libres, en base a los registrados
      _.map(usuariosVirtuales, item => {
        const temp = JSON.parse(JSON.stringify(item));
        if(!virtuales || virtuales.length === 0) {
          temp.libre = true;
        }
        else {
          const buscado = _.find(virtuales, ['dataValues.fid_usuario_virtual', temp.id_usuario]);
          if(buscado && buscado.estado === 'ACTIVO') {
            temp.libre = false;
            const titular = _.find(titulares, ['dataValues.id_usuario', buscado.fid_usuario_titular]);
            if(titular) temp.titular = titular.dataValues;
          }
          else temp.libre = true;
        }
        respuesta.push(temp);
      });
    })
    .then(() => res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", {
      total: respuesta.length,
      resultado: respuesta,
    })))
    .catch(error => {
      logger.error('Revisando el error', error);
      return res.status(412).send(util.formatearMensaje("ERROR", "Error en la obtencion de usuarios virtuales.", error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Seguridad
    @apiName Get seguridad/virtual
    @api {get} /api/v1/seguridad/virtual Obtiene los usuarios virtuales asignados a un usuario

    @apiDescription Get seguridad/virtual,  obtiene los datos de los usuario virtuales asignados

    @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
    @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el usuario
    @apiSuccess (Respuesta) {Boolean} virtual Si es o no un usuario virtual
    @apiSuccess (Respuesta) {Boolean} activo Si está o no activo ese usuario en este momento

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitosa.",
      "datos": {
        "total": 2,
        "resultado": [
          {
            "id_usuario":12,
            "nombres":"Juana",
            "cargo":"Secretaria de ..",
            "virtual":false,
            "activo":true
          },
          {
            "id_usuario":16,
            "nombres":"Correspondencia",
            "cargo":"Correspondencia",
            "virtual":true
          }
        ]
      }
    }
  */

  app.get('/api/v1/seguridad/virtual', (req,res) => {
    
    let solicitante = {};
    let titular = {};
    let virtual = false;

    modelos.usuario.findOne({
      where: {
        id_usuario: req.body.audit_usuario.id_usuario,
        estado: 'ACTIVO',
      },
    })
    .then(solicitanteResp => {
      if(!solicitanteResp) throw Error('No existe el usuario solicitante o se encuentra inactivo.');
      solicitante = solicitanteResp;
      const consultaUsuarios = {
        where: {
          fid_usuario_titular: solicitante.dataValues.id_usuario,
          estado: 'ACTIVO',
        },
      };
      
      if (solicitante.dataValues.virtual === true) {
        virtual = true;
        const sesionVirtual = app.get('virtual');
        const tokenVirtual = req.headers.authorization.split(" ")[1];
        const usuarioTitularAlmacenado = _.find(sesionVirtual, { 'token': tokenVirtual});
        titular = { id_usuario: usuarioTitularAlmacenado.titular };
        consultaUsuarios.where.fid_usuario_titular = usuarioTitularAlmacenado.titular;
      }
      return modelos.virtual.findAll(consultaUsuarios)
    })
    .then(virtualesResp => {
      if(!virtualesResp || virtualesResp.length === 0) throw Error('El usuario no tiene usuarios virtuales asignados.');
      const idVirtuales = _.map(virtualesResp, 'fid_usuario_virtual');
      if (virtual === true) idVirtuales.push(titular.id_usuario);
      idVirtuales.push(solicitante.id_usuario);

      return modelos.usuario.findAll({
        attributes: ['id_usuario', 'nombres', 'cargo', 'virtual'],
        where: {
          id_usuario: { [Op.in]: idVirtuales },
        },
      });
    })
    .then(virtualesResp => {
      _.map(virtualesResp, item => {
        if (item.dataValues.id_usuario === solicitante.id_usuario) item.dataValues.activo = true;
      });

      return res.status(200)
      .send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", {
        total: virtualesResp.length,
        resultado: virtualesResp,
      }));
    })
    .catch(error => {
      logger.error('Error en la busqueda de usuarios virtuales', error);
      return res.status(412)
      .send(util.formatearMensaje("ERROR", "No se encontraron usuarios virtuales asignados.", {
        total: 0,
        resultado: [],
      }));
      
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Seguridad
    @apiName Get seguridad/virtual/cambiar/:usuario
    @api {get} /api/v1/seguridad/virtual/cambiar/:usuario Cambia de usuario a un usuario virtual 

    @apiDescription Get seguridad/virtual/cambiar/:usuario,  cambia de un usuario a un usuario virtual o fisico asignado.

    @apiParam (Parámetro) {Integer} usuario Identificador del usuario virtual al que se desea cambiar

    @apiSuccess (Respuesta) {Objeto} user Nombres del usuario
    @apiSuccess (Respuesta) {Objeto} menu Cargo que ocupa el usuario
    @apiSuccess (Respuesta) {Array} roles Cargo que ocupa el usuario
    @apiSuccess (Respuesta) {Texto} token Si es o no un usuario virtual

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Cambio de usuario correcto",
      "datos": {
        "user": {
          "id":160,
          "username":"correspondencia",
          "first_name":"Correspondencia",
          "last_name":"AGETIC",
          "cargo":"Correspondencia",
          "doc":"sinCI"
        },
        "menu": {
          "menu":[
            {
              "id_menu":7,
              "label":"DOCUMENTOS",
              "url":"",
              "icon":"folder",
              "submenu":[...],
            }, 
            {...}
          ],
          "menuEntrar":"/firmar"
        },
        "roles":[
          {
            "fid_rol":6,
            "rol":{"peso":2,"nombre":"CORRESPONDENCIA"}
          }
        ],
        "token":"eyJ0eXAiOiJKV..."
      }
    }
  */

  app.get('/api/v1/seguridad/virtual/cambiar/:usuario', (req, res) => {
    if (!req.params.usuario) return res.status(412).send(util.formatearMensaje('ERROR', 'No existen los datos necesarios para procesar la solicitud.'));
    let usuarioActivar = null;
    let usuarioSolicitante = null;
    let usuarioTitular = null;

    modelos.usuario.findAll({
      attributes: ['id_usuario', 'nombres', 'apellidos', 'usuario', 'cargo', 'virtual', 'numero_documento'],
      where: {
        id_usuario: { [Op.in]: [req.params.usuario, req.body.audit_usuario.id_usuario] },
        estado: 'ACTIVO',
      },
    })
    .then(usuariosResp => {
      if(!usuariosResp || usuariosResp.length !== 2) throw Error('El usuario a usar activar no fue encontrado o no es valido para usted.');
      const consulta = {
        where: {
          fid_usuario_titular: null,
          estado: 'ACTIVO',
        },
      };
      _.map(usuariosResp, item => {
        if (item.dataValues.id_usuario == req.params.usuario) {
          usuarioActivar = item.dataValues;
        }
        if (item.dataValues.id_usuario === req.body.audit_usuario.id_usuario) {
          usuarioSolicitante = item.dataValues;
        }
      });
      // Procesando flujos
      // 1. fisico -> virtual
      if (usuarioSolicitante.virtual === false && usuarioActivar.virtual === true) {
        usuarioTitular = usuarioSolicitante;
        consulta.where = {
          fid_usuario_titular: usuarioSolicitante.id_usuario,
          fid_usuario_virtual: usuarioActivar.id_usuario,
        };
      }
      // 2. virtual -> fisico
      if (usuarioSolicitante.virtual === true && usuarioActivar.virtual === false) {
        usuarioTitular = usuarioActivar;
        consulta.where = {
          fid_usuario_titular: usuarioActivar.id_usuario,
          fid_usuario_virtual: usuarioSolicitante.id_usuario,
        };
      }
      // 3. virtual -> virtual
      if (usuarioSolicitante.virtual === true && usuarioActivar.virtual === true) {
        const sesionVirtual = app.get('virtual');
        const tokenVirtual = req.headers.authorization.split(" ")[1];
        const usuarioAlmacenado = _.find(sesionVirtual, {
          'token': tokenVirtual,
        });
        consulta.where = {
          fid_usuario_titular: usuarioAlmacenado.titular,
          fid_usuario_virtual: usuarioActivar.id_usuario,
        };
        usuarioTitular = {
          id_usuario: usuarioAlmacenado.titular,
          numero_documento: usuarioAlmacenado.docTitular,
        }

      }
      return modelos.virtual.findOne(consulta);
    })
    .then(virtualResp => {
      if(!virtualResp) throw Error('Usted no cuenta con la autorizacion para activar este usuario.');
      return bl.obtenerToken(modelos, usuarioActivar, usuarioTitular, app);
    })
    .then(tokenResp => {
      if(!tokenResp) throw Error('No se pudo generar el token de acceso para el usuario a activar.');
      return res.send(util.formatearMensaje('EXITO', 'Cambio de usuario correcto', tokenResp))
    })
    .catch(error => {
      logger.error('Revisando el error ', error);
      return res.status(412).send(util.formatearMensaje('ERROR', error))
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Seguridad
    @apiName Get seguridad/virtual/verificar
    @api {get} /api/v1/seguridad/virtual/verificar Obtiene una confirmación de que el usuario es virtual 

    @apiDescription Get seguridad/virtual/verificar,  valida si el usuario es virtual

    @apiSuccess (Respuesta) {Boolean} esVirtual Si es o no un usuario virtual

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Verificación de datos exitosa",
      "datos": {
        "esVirtual": false
      }
    }
  */

  app.get('/api/v1/seguridad/virtual/verificar', (req, res) => modelos.usuario.findOne({
    attributes: ['virtual', 'estado'],
    where: {
      id_usuario: req.body.audit_usuario.id_usuario,
    },
  })
    .then(respUsuario => {
      if (!respUsuario)
        throw Error('No se puede verificar este usuario.');
      if (respUsuario.estado == 'INACTIVO')
        throw Error('El usuario no se encuentra activo.');
      const sesion = app.get('sesion');
      sesion[req.body.audit_usuario.id_usuario].virtual = respUsuario.dataValues.virtual;
      const sesionVirtual = app.get('virtual');
      const tokenVirtual = req.headers.authorization.split(" ")[1];
      const usuarioAlmacenado = _.find(sesionVirtual, {
        'token': tokenVirtual,
      });
      const respuesta = {
        esVirtual: respUsuario.dataValues.virtual,
      };
      if (respuesta.esVirtual === true)
        respuesta.nroDocumento = usuarioAlmacenado.docTitular;
      return res.send(util.formatearMensaje('EXITO', 'Verificación de datos exitosa', respuesta));
    })
    .catch(error => {
      logger.error('Error en la verificacion de usuario virtual', error);
      return res.status(412).send(util.formatearMensaje('ERROR', error));
    }))
};