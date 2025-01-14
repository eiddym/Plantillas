require ('colors');
const options = require('sequelize-formly');
const util = require('../../lib/util');
const correo = require('../../lib/correo');
const _ = require('lodash');
const moment = require('moment');
const logger = require('../../lib/logger');
const crypto = require("crypto");
const bl = require('../../bl/seguridad/usuarioBL');


module.exports = app => {

  const Usuario = app.src.db.models.usuario;
  const UsuarioHis = app.src.db.models.usuario_his;
  const Rol = app.src.db.models.rol;
  const UsuarioRol = app.src.db.models.usuario_rol;
  const UsuarioOficina = app.src.db.models.usuario_oficina;
  const ConfNotificacion = app.src.db.models.conf_notificacion;
  const Oficina = app.src.db.models.oficina;
  const director = app.src.config.config.sistema.director;
  const direccion = app.src.config.config.sistema.direccion;
  const sequelize = app.src.db.sequelize;
  const Modelos = app.src.db.models;
  const Op = app.src.db.Sequelize.Op;
  const filtros = (req, res, next) => {
    if (req.query.filter != '' && req.query.filter !== undefined) util.consulta(req, res, next, Usuario);
    else next();
  }

  /**
  @apiVersion 1.0.0
  @apiGroup Usuario
  @apiName Get usuario
	@api {get} /api/v1/seguridad/usuario Obtiene listado de usuarios

  @apiDescription Get para usuario, obtiene todos los datos del modelo usuario, con su rol y oficina.

  @apiSuccessExample {Array} Respuesta :
  HTTP/1.1 200 OK
  [
    {
     "id_usuario": 72,
     "fid_unidad": 9,
     "usuario": "acampos",
     "numero_documento": "12345678",
     "nombres": "Ariel",
     "apellidos": "campos",
     "cargo": "Profesional de Desarrollo de Sistemas",
     "email": "acampos@agetic.gob.bo",
     "estado": "ACTIVO",
     "_usuario_creacion": 1,
     "_usuario_modificacion": 1,
     "_fecha_creacion": "2016-12-16T14:47:56.104Z",
     "_fecha_modificacion": "2016-12-16T19:24:17.857Z",
     "usuario_rol": [
       {
         "fid_rol": 3,
         "fid_usuario": 72,
         "id_usuario_rol": 72,
         "estado": "ACTIVO",
         "rol": {
           "id_rol": 3,
           "nombre": "OPERADOR",
           "estado": "ACTIVO"
         }
       }
     ]
   }, ...
  ]
	*/
  /**
  @apiVersion 1.0.0
  @apiGroup Usuario
  @apiName Get usuario/?order=&limit=&page=&filter=
	@api {get} /api/v1/seguridad/usuario/?order=&limit=&page=&filter=  Obtiene la lista paginada de usuarios

  @apiDescription Get para usuario, obtiene todos los datos del modelo usuario.

  @apiParam (Query) {Texto} order Campo por el cual se ordenara el resultado
  @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
  @apiParam (Query) {Integer} page Número de página de resultados
  @apiParam (Query) {Texto} filter Texto a buscar en los registros

  @apiSuccessExample {Array} Respuesta :
  HTTP/1.1 200 OK
  [
    {
     "id_usuario": 72,
     "fid_unidad": 9,
     "usuario": "acampos",
     "contrasena": "672caf27f5363dc833bda5099d775e89a1",
     "numero_documento": "12345678",
     "nombres": "Ariel",
     "apellidos": "campos",
     "cargo": "Profesional de Desarrollo de Sistemas",
     "email": "acampos@agetic.gob.bo",
     "estado": "ACTIVO",
     "_usuario_creacion": 1,
     "_usuario_modificacion": 1,
     "_fecha_creacion": "2016-12-16T14:47:56.104Z",
     "_fecha_modificacion": "2016-12-16T19:24:17.857Z",
     "usuario_rol": [
       {
         "fid_rol": 3,
         "fid_usuario": 72,
         "id_usuario_rol": 72,
         "estado": "ACTIVO",
         "rol": {
           "id_rol": 3,
           "nombre": "OPERADOR",
           "estado": "ACTIVO"
         }
       }
     ]
   }, ...
  ]
  */
  /**
  @apiVersion 2.0.0
  @apiGroup Usuario
  @apiName Get usuario/?fields=id_usuario,usuario,nombres,apellidos&order=&estado=
	@api {get} /api/v1/seguridad/usuario/?fields=id_usuario,usuario,nombres,apellidos&order=&estado=  Obtiene la lista de usuarios segun estado

  @apiDescription Get para usuario, obtiene la lista de usuarios segun su estado con los campos id_usuario,usuario,nombres,apellidos.

  @apiParam (Query) {Texto} order Campo por el cual se ordenara el resultado
  @apiParam (Query) {Texto} fields Campos que se mostrarán en el resultado
  @apiParam (Query) {Texto} estado Estado de los usuarios que se requieran

  @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
  @apiSuccess (Respuesta) {Texto} usuario Nombre de usuario

  @apiSuccessExample {json} Respuesta :
  HTTP/1.1 200 OK
  {
    "tipoMensaje":	"EXITO",
    "mensaje":	"Obtención de datos exitosa.",
    "datos":	{
      "total":	16,
      "resultado": [
        {
          "id_usuario":	153,
          "usuario":	"jperez",
          "nombres":	"Juan",
          "apellidos":	"Perez"
        },
        {...}
      ]	
    }
  }
	*/
  app.get('/api/v1/seguridad/usuario', (req,res) => {
    // Si existe consultas.
    if(Object.keys(req.query).length != 0){
      if(req.query.limit && req.query.page){
        req.query.offset = (req.query.page - 1) * req.query.limit;
      }
      if(req.query.filter){
        req.query.where = {usuario: {[Op.iLike]: `%${req.query.filter}%`} };
      }
      if(req.query.order) {
        if(req.query.order.charAt(0) == '-'){
          req.query.order = `${req.query.order.substring(1, req.query.order.length)} DESC`;
        }
      }
      req.query.order = [req.query.order.split(' ')];

      if(req.query.where && req.query.estado) req.query.where.estado={[Op.in]:req.query.estado.split(',')};
      else if(req.query.estado) req.query.where= {estado:{[Op.in]:req.query.estado.split(',')}};
      req.query.attributes = { exclude: ['contrasena']};

      Usuario.findAndCountAll(req.query)
        .then(result => {

          if(result.count>0){
            res.status(200).send(util.formatearMensaje("EXITO","Obtención de datos exitosa.",{total:result.count,resultado:result.rows}));
          }else{
            res.status(200).send(util.formatearMensaje("INFORMACION","No se encontraron registros."));
          }

        })
        .catch(error => {
          res.status(412).send(util.formatearMensaje("ERROR",error));
        });
    }
    // Si no existe consultas, obtiene todos los usuarios.
    else {
      const condicion={ estado:'ACTIVO' };

      // Realiza un llamado a la funcion "buscarRolTodos", declarado en el modelo.
      bl.buscarRolTodos(UsuarioRol, Rol, Usuario, Oficina, condicion)
      .then(usuarios => {
        if(usuarios){
          res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.",usuarios));
        }
        else{
          res.status(200).send(util.formatearMensaje("INFORMACION","No existen usuarios."));
        }

      })
      .catch(error => {
        res.status(412).send(util.formatearMensaje("ERROR",error));

      })

    }
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Usuario
    @apiName Get seguridad/usuario/catalogo
    @api {get} /api/v1/seguridad/usuario/catalogo  Obtiene catalogo de usuarios

    @apiDescription Get para usuario/catalogo, obtiene datos de los usuarios activos, en un solo nivel.

    @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
    @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
    @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
    @apiSuccess (Respuesta) {Texto} usuario Nombre de usuario
    @apiSuccess (Respuesta) {Integer} fid_unidad Identificador de la unidad a la que pertenece el usuario
    @apiSuccess (Respuesta) {Texto} numero_documento Es el número de cédula de identidad
    @apiSuccess (Respuesta) {Texto} cargo Cargo que ocupa el usuario
    @apiSuccess (Respuesta) {Texto} email Correo electrónico del usuario
    @apiSuccess (Respuesta) {Boolean} virtual Si el usuario es o no virtual
    @apiSuccess (Respuesta) {Texto} estado Estado del usuario
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario que creó el registro
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modificó el registro
    @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha y Hora de creación del registro
    @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha y Hora de modificación del registro

    @apiSuccessExample {json} Respuesta :
    HTTP/1.1 200 OK
    {
      "tipoMensaje":	"EXITO",
      "mensaje":	"Obtención de datos exitosa.",
      "datos":	{
        "total":	16,
        "resultado": [
          {
            "id_usuario":	153,
            "usuario":	"jperez",
            "nombres":	"Juan",
            "apellidos":	"Perez"
            "fid_unidad": 9,
            "numero_documento": "12345678",
            "cargo": "JEFE DE UNIDAD",
            "email": "juan.perez@agetic.gob.bo",
            "virtual": false,
            "estado": "ACTIVO",
            "_usuario_creacion": 3,
            "_usuario_modificacion": 3,
            "_fecha_creacion": "2015-01-08T21:22:11.774Z",
            "_fecha_modificacion": "2015-01-09T22:20:26.783Z"
          },
          {...}
        ]	
      }
    }
  */

  app.get('/api/v1/seguridad/usuario/catalogo', filtros, (req, res) => {
    const opciones = {};
    opciones.where = {
      estado: {
        [Op.ne]: 'INACTIVO',
      },
    }
    if (req.query.filter !== '' && req.xfilter) {
      opciones.where[Op.or] = req.xfilter;
    }
    if (req.query.fields) {
      opciones.attributes = req.query.fields.split(',');
      opciones.attributes.push('_usuario_creacion');
    }

    if (req.query.limit)
      opciones.limit = req.query.limit;
    if (req.query.page)
      opciones.offset = (req.query.limit * ((req.query.page || 1) - 1)) || 0;
    let order;
    if (req.query.order) {
      order = (req.query.order.charAt(0) == '-') ? ' DESC' : '';
      req.query.order = (req.query.order.charAt(0) == '-') ? req.query.order.substring(1, req.query.order.length) : req.query.order;
      opciones.order = req.query.order + order;
    }

    return Usuario.findAndCountAll(opciones)
      .then(resp => {
        res.send(util.formatearMensaje("EXITO", "La busqueda fue exitosa", {
          total: resp.count,
          resultado: resp.rows,
        }));
      })
      .catch(error => {
        res.status(412).send(util.formatearMensaje("ERROR", error));
      });
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Usuario
  @apiName Get seguridad/usuario_rol/
  @api {get} /api/v1/seguridad/usuario_rol/ Obtiene lista de usuarios y sus roles

  @apiDescription Get seguridad/usuario_rol, obtiene lista de usuarios y sus roles

  @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
  @apiSuccess (Respuesta) {Texto} cargo Cargo del usuario
  @apiSuccess (Respuesta) {Texto} usuario_rol Array de relación usuario-rol
  @apiSuccess (Respuesta) {Texto} estado Estado de plantillas_formly

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Obtención de datos exitosa.",
    "datos": {
      [
        {
          "id_usuario":	153,
          "nombres":	"Juan",
          "apellidos":	"Perez",
          "cargo":	"Asistente Jurídico",
          "usuario_rol": [
            {
              "fid_rol":	3
              "fid_usuario":	153
              "id_usuario_rol":	166
              "estado":	"ACTIVO"
              "rol":	{
                "id_rol":	3
                "nombre":	"OPERADOR"
                "estado":	"ACTIVO"
              }
            }
          ]
        },
        {...}
      ]
    }
  }
*/

  app.get('/api/v1/seguridad/usuario_rol', (req,res) => {
    let campos = ['id_usuario', 'nombres', 'apellidos', 'cargo'];
    if(req.query.fields){
      campos = req.query.fields.split(',');
      if(campos.indexOf('contrasena')>-1) campos.splice(campos.indexOf('contrasena'), 1);

    }
    Usuario.findAll({
      attributes:campos,
      where:{estado:'ACTIVO'},
      order:[['nombres','ASC']],
      include:[{
        model:UsuarioRol,
        as:'usuario_rol',
        attributes:['fid_rol','fid_usuario','id_usuario_rol','estado'],
        where:{estado:'ACTIVO'},
        include:[{
          model:Rol,
          as:'rol',
          attributes:['id_rol', 'nombre','estado'],
        }],
      }],
    })
    .then(pUsuarios => {
      if(pUsuarios){
        res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.",pUsuarios));
      }
      else{
        res.status(200).send(util.formatearMensaje("INFORMACION","No existen usuarios."));
      }
    })
    .catch(pError => res.status(412).send(util.formatearMensaje("ERROR",pError)))
  });

  /**

  @apiVersion 2.0.0
  @apiGroup Usuario
  @apiName Get usuario/:id
  @api {get} /api/v1/seguridad/usuario/:id Obtiene un usuario

  @apiDescription Get para usuario, obtiene la información sobre un usuario basado en su id.

  @apiParam (Parámetro) {Integer} id Identificador de usuario que se quiere obtener.

  @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Texto} usuario nombre de usuario
  @apiSuccess (Respuesta) {Integer} numero_documento Número de documento del usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
  @apiSuccess (Respuesta) {Texto} cargo Cargo del usuario
  @apiSuccess (Respuesta) {Integer} fid_unidad Identificador de la unidad del usuario
  @apiSuccess (Respuesta) {Texto} estado Estado por defecto ACTIVO
  @apiSuccess (Respuesta) {Boolean} virtual Si el usuario es virtual
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador de usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modifica
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificacion del usuario
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación del usuario
  @apiSuccess (Respuesta) {Array} usuario_rol Lista de los roles que pueda tener el usuario

  @apiSuccessExample {json} Respuesta :
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Obtención de datos exitosa.",
    "datos": {
      "id_usuario": 141,
      "fid_unidad": null,
      "usuario": "test90",
      "numero_documento": "12345678",
      "nombres": "Juan",
      "apellidos": "Perez Cortez",
      "cargo": "tester",
      "email": "test@test.test",
      "estado": "ACTIVO",
      "virtual": false,
      "_usuario_creacion": 1,
      "_usuario_modificacion": null,
      "_fecha_creacion": "2016-12-19T21:14:47.419Z",
      "_fecha_modificacion": "2016-12-19T21:14:47.419Z",
      "usuario_rol": [
        {
          "fid_rol": 1,
          "estado": "ACTIVO",
          "rol": {
            "id_rol": 1,
            "nombre": "ADMIN",
            "estado": "ACTIVO"
          }
        },
        {
          "fid_rol": 2,
          "estado": "ACTIVO",
          "rol": {
            "id_rol": 2,
            "nombre": "JEFE",
            "estado": "ACTIVO"
          }
        }
      ]
    }
  }
  */
  app.get('/api/v1/seguridad/usuario/:id',(req,res) => {
    const id_usuario = req.params.id;
    let usuarioResp = null;
    bl.buscarRolUno(id_usuario,UsuarioRol,Rol, Usuario, Oficina)
    .then(usuario => {
      if (!usuario) throw Error("No existe el usuario solicitado.");
      usuarioResp = usuario;
      return Modelos.virtual.findAll({
        attributes: ['id_virtual', 'fid_usuario_virtual', 'estado' ],
        where: {
          fid_usuario_titular: usuarioResp.id_usuario,
        },
      });

    })
    .then(virtualesResp => {
      usuarioResp.dataValues.virtuales = virtualesResp;
      // delete usuarioResp.dataValues.contrasena
      // delete usuarioResp.contrasena
      res.status(200).send(util.formatearMensaje("EXITO","Obtención de datos exitosa.",usuarioResp));
      
    })
    .catch(error => {
      res.status(412).send(util.formatearMensaje("ERROR",error));

    })

  });

  /**
  @apiVersion 2.0.0
  @apiGroup Seguridad
  @apiName Get seguridad/usuario/:id/informacion
  @api {get} /api/v1/seguridad/usuario/:id/informacion Obtiene los usuarios de la unidad del usuario

  @apiDescription Get seguridad/usuario/:id/informacion, obtiene los usuarios pertenecientes a la unidad del usuario

  @apiParam (Parámetro) {Integer} id Identificador del usuario

  @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario dependiente
  @apiSuccess (Respuesta) {Texto} nombres Nombres del dependiente
  @apiSuccess (Respuesta) {Texto} apellidos Apellidos del dependiente
  @apiSuccess (Respuesta) {Texto} cargo Cargo del dependiente

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La busqueda fue exitosa",
    "datos": {
      "total":	52,
      "resultado":	[
        {
          "id_usuario":	11,
          "nombres":	"Alberto",
          "apellidos"	"Plaza",
          "cargo":	"Profesional de .." 
        },
        {
          "id_usuario":	22,
          "nombres":	"Joan Manuel",
          "apellidos"	"Serrat",
          "cargo":	"Profesional de .." 
        }
      ]
    }
  }
*/

  app.get('/api/v1/seguridad/usuario/:id/informacion', (req,res) =>
    Usuario.findOne({
      attributes:['fid_unidad'],
      where:{ id_usuario:req.params.id},
      include:[{
        model:UsuarioRol,
        as:'usuario_rol',
        include:[{
          model:Rol,
          as:'rol',
        }],
      }],
    })
    .then(pUnidad => {

      if(pUnidad.fid_unidad != null){

        if(pUnidad.fid_unidad == direccion && req.params.id==director){

          // Busca los Identificadores de usuarios con el rol jefe.
          Usuario.findAll({
            id_usuario:{ [Op.ne]:req.params.id },
            attributes:['id_usuario','nombres', 'apellidos', 'cargo'],
            where:{
              estado:'ACTIVO',
            },
            order:[['nombres','ASC']],
          })
          .then(pUsuarios =>
            res.status(201).send(util.formatearMensaje("EXITO","Obtencion de dependientes correcta.",{total:pUsuarios.length, resultado:pUsuarios}))
          )

        }
        else{

          if(pUnidad.fid_unidad == direccion && pUnidad.usuario_rol[0].rol.nombre =="CORRESPONDENCIA"){
            const jefes =[];
            Usuario.findAll({
              id_usuario:{ [Op.ne]:req.params.id },
              attributes:['id_usuario','nombres', 'apellidos', 'cargo'],
              where:{
                estado:'ACTIVO',
              },
              order:'nombres ASC',
            })
            .then(pUsuarios =>
              res.status(201).send(util.formatearMensaje("EXITO","Obtencion de dependientes correcta.",{total:pUsuarios.length, resultado:pUsuarios}))
            )

          } else {
            return Usuario.findAll({
              attributes:['id_usuario','nombres','apellidos', 'cargo'],
              where:{
                estado: 'ACTIVO',
                id_usuario:{ [Op.ne]:req.params.id },
                fid_unidad:pUnidad.fid_unidad,
              },
              order:[['nombres','ASC']],
            })
            .then(pResultado =>
              res.status(201).send(util.formatearMensaje("EXITO","Obtencion de dependientes correcta.",{total:pResultado.length, resultado:pResultado}))
            )
          }


        }
      }
      else res.status(201).send(util.formatearMensaje("EXITO","No tiene dependientes.",{total:0, datos:[]}));


    })
    .catch(pError => {

      res.status(412).send(util.formatearMensaje("ERROR",pError));
    })
  )

  /**
    @apiVersion 2.0.0
    @apiGroup Usuario
    @apiName Post usuario
    @api {post} /api/v1/seguridad/usuario Crear usuario

    @apiDescription Post para usuario, crea un usuario

    @apiParam (Petición) {Texto} usuario Nombre de usuario asignado
    @apiParam (Petición) {Integer} fid_usuario Identificador de la unidad del usuario
    @apiParam (Petición) {Texto} contrasena Contraseña del usuario.
    @apiParam (Petición) {Texto} numero_documento Número de CI del usuario.
    @apiParam (Petición) {Texto} nombres Nombres del usuario.
    @apiParam (Petición) {Texto} apellidos Apellidos del usuario.
    @apiParam (Petición) {Texto} cargo Cargo que ocupa el usuario.
    @apiParam (Petición) {Texto} email Correo electrónico del usuario.
    @apiParam (Petición) {Texto} estado Estado del usuario.
    @apiParam (Petición) {Array} roles Array de roles identificados por su id.
    @apiParam (Petición) {Array} oficinas Array de oficinas a la sque pertenece el usuario.
    @apiParam (Petición) {Array} virtuales Array de usuarios virtuales.
    @apiParam (Petición) {FechaHora} _fecha_creacion Fecha y hora de creación del registro.
    @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario que creó el registro.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "usuario":"jjperez",
      "fid_unidad":8,
      "contrasena":" ",
      "numero_documento":"123456789",
      "nombres":"Juan",
      "apellidos":"Perez",
      "cargo":"Profesional en ...",
      "email":"jperez@correo.com",
      "estado":"ACTIVO",
      "roles":[3],
      "oficinas":[],
      "virtuales":[
        {
          "id_usuario":10,
          "cargo":"Correspondencia",
          "nombres":"Correspondencia",
          "libre":false,
          "valor":false,
          "titular":{
            "id_usuario":12,
            "nombres":"Juana",
            "apellidos":"Rodriguez",
            "usuario":"jrodriguez"
          }
        },
        {...}
      ],
      "_usuario_creacion":5,
      "_fecha_creacion":"2020-01-13T15:04:25.729Z"
    }

    @apiSuccessExample Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje":"EXITO",
      "mensaje":"Creación de usuario correcto.",
      "datos":{}
    }

  */
  app.post('/api/v1/seguridad/usuario', (req,res) => {

    const usuarioCrear = req.body;
    let usuarioDevolver = {};

    // Inicia una transaccion.
    sequelize.transaction().then((t) =>  {
      Usuario.findOne({
          where: { usuario: usuarioCrear.usuario },
          transaction: t,
        })
        .then((usuarioEncontrado) =>  {
          if (usuarioEncontrado) {
            throw new Error("Ya existe un usuario registrado.");
          }
          else {

            if(!usuarioCrear.roles || usuarioCrear.roles.length==0){
              throw new Error("Debe elegir minimamente un rol.");
            }
            return Usuario.create(usuarioCrear, {
                transaction: t,
              });

          }
        })
        .then(usuario => {

          usuarioDevolver=usuario;
          const usuarioRol=[];
          const roles=usuarioCrear.roles;
          if(roles && roles.length>0){
            roles.forEach((item,indice) => {

              const crear={
                fid_rol:item,
                fid_usuario:usuario.id_usuario,
                estado:'ACTIVO',
                _usuario_creacion:usuario._usuario_creacion,
                _fecha_creacion:usuario._fecha_creacion }
              usuarioRol.push(crear);

            })

            // Crea las relaciones de usuario - rol.
            return UsuarioRol.bulkCreate(usuarioRol,{transaction:t});

          }
          else{
            return true;
          }

        })
        // eslint-disable-next-line arrow-body-style
        .then(usuario => {
          return ConfNotificacion.create({
            fid_usuario: usuarioDevolver.id_usuario,
            _usuario_creacion: usuarioDevolver._usuario_creacion,
          }, {
            transaction: t,
          });
        })
        .then(() => t.commit())
        .then(() => res.status(201).send(util.formatearMensaje("EXITO","Creación de usuario correcto.",usuarioDevolver)))
        .catch(error  =>  {
          t.rollback();
          res.status(412).send(util.formatearMensaje("ERROR",error));
        });
      });
  });

  /**
  @apiVersion 1.0.0
  @apiGroup Usuario
  @apiName Put usuario
  @api {put} /api/v1/seguridad/usuario/:id Actualiza un usuario

  @apiDescription Put para usuario

  @apiParam (Parámetro) {Integer} id Identificador del usuario que se quiere actualizar

  @apiParam (Petición) {Texto} usuario Nombre de usuario

  @apiParamExample {json} Ejemplo para enviar:
  {
    "usuario": "jperezc"
  }

  @apiSuccess (Respuesta) {Integer} id_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Integer} fid_unidad Identificador de la unidad del usuario
  @apiSuccess (Respuesta) {Texto} usuario nombre de usuario
  @apiSuccess (Respuesta) {Integer} numero_documento Número de documento del usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellidos del usuario
  @apiSuccess (Respuesta) {Texto} cargo Cargo del usuario
  @apiSuccess (Respuesta) {Texto} estado Estado por defecto ACTIVO
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador de usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modifica
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificacion del usuario
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación del usuario

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "id_usuario": 142,
    "fid_unidad": null,
    "usuario": "jperezc",
    "numero_documento": "12345678",
    "nombres": "Juan",
    "apellidos": "Perez Cortez",
    "cargo": "tester",
    "email": "test@test.test",
    "estado": "ACTIVO",
    "_usuario_creacion": 1,
    "_usuario_modificacion": null,
    "_fecha_creacion": "2016-12-19T21:21:23.567Z",
    "_fecha_modificacion": "2016-12-19T21:28:18.016Z"
  }

  @apiSampleRequest off

  */
  app.put('/api/v1/seguridad/usuario/:id',(req,res) => {
    const usuario = req.body;

    let usuarioDevolver = {};
    let usuarioRespuesta = {};
    let pwd=null;

    // Este dato es recepcionado en el caso de regeneracion de contraseña, ejecutado por el administrador.
    if(usuario.regenerar!= undefined){

      // Genera aleatoriamente una cadena alfanumerica de 8 digitos.
      pwd=Math.random().toString(36).slice(-8);

      // Encripta la contraseña.
      usuario.contrasena=crypto.createHash("SHA256").update(pwd).digest("hex");
    }

    // Declara la condicion de busqueda.
    const condiciones = { where: { id_usuario: req.params.id } };


    // Este dato es recepcionado en el caso de cambio de contraseña por el usuario.
    if(usuario.verificarContrasena!= undefined){
      usuario.contrasena = crypto.createHash("SHA256").update(usuario.contrasena).digest("hex");
      condiciones.where.contrasena = crypto.createHash("SHA256").update(usuario.verificarContrasena).digest("hex");
    }
    else{
      delete usuario.contrasena;
    }


    sequelize.transaction().then((t) =>  {
    // Busca al usuario.
    Usuario.findOne(condiciones)
    .then((usuarioRespuestaBusqueda) =>  {
      if(usuarioRespuestaBusqueda){
        usuarioRespuesta=usuarioRespuestaBusqueda;
        if(usuario.roles && usuario.roles.length>0){
          return UsuarioRol.destroy({
            where: {fid_usuario: req.params.id},
            transaction: t,
          });
        }
      }
      else throw new Error("La contraseña actual no es valida.");
    })
    // Actualiza la informacion del usuario.
    .then(filas => {
      const actual=JSON.parse(JSON.stringify(usuario));
      return usuarioRespuesta.update(usuario,{transaction:t});
    })
    // Inserta las relaciones usuario - rol del usuario.
    .then(respuesta => {
      usuarioDevolver = respuesta;

      if(usuario.roles && usuario.roles.length>0){

        const usuarioRol=[];
        usuario.roles.forEach((item, indice) => {
          const crear={
            fid_rol:item,
            fid_usuario:usuarioDevolver.id_usuario,
            _usuario_creacion:usuarioDevolver._usuario_modificacion }
          usuarioRol.push(crear);
        });

        return UsuarioRol.bulkCreate(usuarioRol,{transaction:t})

      }
      else return true;

    })
      .then(() => {
        // registro, actualizacion de usuarios virtuales.
        const idVirtualesActivar = _.map(usuario.virtuales, 'id_usuario');
        return Modelos.virtual.findAll({
          attributes: ['id_virtual', ['fid_usuario_virtual', 'id_usuario'], 'estado', 'fid_usuario_titular'],
          where: {
            [Op.or]: [
              {
                fid_usuario_virtual: {
                  [Op.in]: idVirtualesActivar,
                },
              },
            ],
          },
        });
      })
      .then(respVirtuales => {
        // Creacion y actualizacion de asignaciones virtuales.
        const crear = [];
        const actualizar = [];
        const historico = []
        _.map(usuario.virtuales, (item, indice) => {
          const activos = _.filter(respVirtuales, ['dataValues.estado', 'ACTIVO']);
          const inactivos = _.filter(respVirtuales, ['dataValues.estado', 'INACTIVO']);
          const tr = { transaction: t };
          const objCrear = {
            fid_usuario_titular: usuarioRespuesta.id_usuario,
            fid_usuario_virtual: item.id_usuario,
            _usuario_creacion: req.body.audit_usuario.id_usuario,
          };
          const tempInactivo = _.find(activos, vTemp => {
            if (vTemp.dataValues.id_usuario == item.id_usuario && vTemp.dataValues.fid_usuario_titular == usuarioRespuesta.id_usuario) {
              return vTemp;
            }
          });
          const tempActivo = _.find(inactivos, vTemp => {
            if (vTemp.dataValues.id_usuario == item.id_usuario && vTemp.dataValues.fid_usuario_titular == usuarioRespuesta.id_usuario) {
              return vTemp;
            }
          });

          if (item.valor && item.valor === true) {
            const idActivos = _.map(activos, 'dataValues.id_usuario');
            const idInactivos = _.map(inactivos, 'dataValues.id_usuario');
            const indiceActivo = idActivos.indexOf(item.id_usuario);
            const indiceInactivo = idInactivos.indexOf(item.id_usuario);
            
            if (indiceActivo > -1 && idActivos[indiceActivo] === item.id_usuario) throw Error('El usuario  virtual ya se encuentra en uso.');
            // if (indiceActivo > -1 && idActivos[indiceActivo] !== item.id_usuario) throw Error('El usuario  virtual ya se encuentra en uso.');
            if (indiceActivo === -1 && indiceInactivo === -1) {
              crear.push(objCrear);
              return;
            }
            // ACTUALIZACION
            if (indiceActivo === -1 && indiceInactivo > -1 ) {
 
              if (tempActivo) {
                if ( tempActivo.dataValues.fid_usuario_titular !== usuarioRespuesta.id_usuario) {
                  crear.push(objCrear);
                  return;
                }
                historico.push({
                  fid_virtual: tempActivo.id_virtual,
                  id_titular: tempActivo.fid_usuario_titular,
                  id_virtual: tempActivo.dataValues.id_usuario,
                  accion: tempActivo.estado,
                  _usuario_creacion: req.body.audit_usuario.id_usuario,
                });
                actualizar.push(tempActivo.update({
                  estado: (item.valor === true? 'ACTIVO':'INACTIVO'),
                  _usuario_modificacion: req.body.audit_usuario.id_usuario,
                }, tr));
              }
              else {
                crear.push(objCrear);
                return;
              }
            }
          }
          if (!item.valor || item.valor == false ) {
            if(tempInactivo) {
              historico.push({
                fid_virtual: tempInactivo.id_virtual,
                id_titular: tempInactivo.fid_usuario_titular,
                id_virtual: tempInactivo.dataValues.id_usuario,
                accion: tempInactivo.estado,
                _usuario_creacion: req.body.audit_usuario.id_usuario,
              });
              actualizar.push(tempInactivo.update({
                estado: 'INACTIVO',
                _usuario_modificacion: req.body.audit_usuario.id_usuario,
              }, tr));
            }
          }
        });
        const crearNuevas = Modelos.virtual.bulkCreate(crear, {transaction: t });
        const crearHistorico = Modelos.virtual_his.bulkCreate(historico, {transaction: t });
        return Promise.all([actualizar, crearNuevas, crearHistorico]);
      })
      // Realiza el commit de la transacción.
      .then(() => t.commit())
      .then(() => res.status(200).send(util.formatearMensaje("EXITO","Actualización de datos exitosa.",usuarioRespuesta)))
      .catch(error  =>  {
        logger.error('Error en la actualizacion de datos del usuario', error);
        t.rollback();
        res.status(412).send(util.formatearMensaje("ERROR",error));
      });
    });
  });

  /**
  @apiVersion 1.0.0
  @apiGroup Usuario
  @apiName Delete usuario
  @api {delete} /api/v1/seguridad/usuario/:id Eliminar un usuario

  @apiDescription Delete para usuario

  @apiParam (Parámetro) {Integer} id Identificador de usuario que se quiere eliminar.

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
  }
  */
  app.delete('/api/v1/seguridad/usuario/:id',(req,res) => {
    const idUsuario=req.params.id;

    UsuarioRol.findAll({ where:{ fid_usuario:idUsuario } })
    .then(resultado => {
      if(resultado.length>0){
          res.status(405).send(util.formatearMensaje("ERROR","No se puede eliminar el usuario, por integridad."));
      }

      else{
        Usuario.destroy({ where:{ id_usuario:idUsuario } })
        .then(resultadoEliminar => {
          if(resultadoEliminar==0)
            resultadoEliminar="0, El usuario a eliminar no existe."
            res.status(200).send(util.formatearMensaje("EXITO",`Registros eliminados ${resultadoEliminar}`));

        })
        .catch(error => {
          logger.error("Error al eliminar usuario.",error);
            res.status(412).send(util.formatearMensaje("ERROR",error));

        });
      }
    })
    .catch(errorBusqueda => {
      logger.error("Error en la busqueda de usuario-rol",errorBusqueda);
      res.status(412).send(util.formatearMensaje("ERROR",error));

    });


  });

  /**
    @apiVersion 2.0.0
    @apiGroup Seguridad
    @apiName Get seguridad/usuario_unidad/:ci
    @api {get} /api/v1/seguridad/usuario_unidad/:ci Obtiene datos de un usuario basado en su CI

    @apiDescription Get seguridad/usuario_unidad/:ci, obtiene los datos de un usuario basado en su CI, principalmente la unidad en la que trabaja

    @apiParam (Parámetro) {Integer} ci Cédula de identidad del usuario

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
      "mensaje": "Usuario validado correctamente",
      "datos": {
        "id_usuario":	11,
        "nombres":	"Alberto",
        "apellidos"	"Plaza",
        "numero_documento": "1234567",
        "cargo":	"Profesional de .." 
        "email": "aplaza@correo.com",
        "unidad": "Unidad Administrativa Financiera"
      }
    }
  */

  app.get('/api/v1/seguridad/usuario_unidad/:ci', (req, res) => {
    Usuario.findOne({
      attributes: ['id_usuario', 'nombres', 'apellidos', 'numero_documento', 'cargo', 'email', 'estado'],
      where: {
        numero_documento: req.params.ci,
      },
      include: [
        {
          model: Modelos.unidad,
          as: 'unidad',
        },
      ],
    })
    .then(respUsuario => {
      if (!respUsuario) throw Error('El usuario no puede ser validado en este momento.');
      if (!respUsuario.unidad) throw Error('El usuario no es valido, por su unidad.');
      if (respUsuario.estado !== 'ACTIVO') throw Error('El usuario no es valido, por el estado de su registro.');
      const ci = parseInt(respUsuario.numero_documento);
      if ((typeof ci === 'number') && isNaN(ci))  throw Error('El usuario no es valido, por su numero de documento.');

      const resp = {
        id_usuario: respUsuario.id_usuario,
        nombres: respUsuario.nombres,
        apellidos: respUsuario.apellidos,
        numero_documento: respUsuario.numero_documento,
        cargo: respUsuario.cargo,
        email: respUsuario.email,
        unidad: respUsuario.unidad.dataValues.nombre,
      };
      return res.status(200).send(util.formatearMensaje("EXITO", 'Usuario validado correctamente', resp));
    })
    .catch(error => {
      logger.error('Error en la obtención del usuario y su unidad', error);
      res.status(412).send(util.formatearMensaje("ERROR",error));
    });
  });

  /**
   * @apiVersion 1.0.0
   * @api {options} /api/v1/seguridad/usuario Options
   * @apiName OptionsUsuarios
   * @apiGroup Usuario
   * @apiDescription Para devolver el options de Usuario
   *
   * @apiParam {Ninguno} Sin Parámetros
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *
   * [
   *    {
   *      "key": "id_usuario",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "number",
   *        "label": "id_usuario",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "nombres",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "text",
   *        "label": "nombres",
   *        "required": false
   *      }
   *    },
   *    {
   *      "key": "apellidos",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "text",
   *        "label": "apellidos",
   *        "required": false
   *      }
   *    },
   *    {
   *      "key": "email",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "text",
   *        "label": "email",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "usuario",
   *      "type": "input",
   *        "type": "text",
   *      "templateOptions": {
   *        "label": "usuario",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "contrasena",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "text",
   *        "label": "contrasena",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "estado",
   *      "type": "input",
   *      "templateOptions": {
   *        "type": "text",
   *        "label": "Estado",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "fecha_creacion",
   *      "type": "datepicker",
   *      "templateOptions": {
   *        "type": "datetime-local",
   *        "label": "fecha_creacion",
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "fecha_modificacion",
   *      "type": "datepicker",
   *      "templateOptions": {
   *        "type": "datetime-local",
   *"label": "fecha_modificacion", usuario
   *        "required": true
   *      }
   *    },
   *    {
   *      "key": "id_medico",
   *      "type": "select",
   *      "templateOptions": {
   *        "type": "number",
   *        "label": "id_medico",
   *        "required": false,
   *        "options": [
   *          {
   *            "name": "2 null",
   *            "value": 4
   *          },
   *          {
   *            "name": "1 foto.png",
   *            "value": 1
   *          }
   *        ]
   *      }
   *    },
   *    {
   *      "key": "id_persona",
   *      "type": "select",
   *      "templateOptions": {
   *        "type": "number",
   *        "label": "id_persona",
   *        "required": true,
   *        "options": [
   *          {
   *            "name": "AGETIC AGETIC",
   *            "value": 1
   *          },
   *          {
   *            "name": "JUDITH ALEJANDRA CALIZAYA",
   *            "value": 2
   *          }
   *        ]
   *      }
   *    }
   * ]
   *
   */
  app.route('/api/v1/seguridad/usuario').options(options.formly(Usuario, app.src.db.models));
  app.route('/api/v1/seguridad/usuario_rol').options(options.formly(Usuario, app.src.db.models));
}
