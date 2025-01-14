const Q = require('q');
const rolesMenusBl = require('../../bl/seguridad/roles_menusBL');
const util = require('../../lib/util');


module.exports = app => {

  const Rol = app.src.db.models.rol;
  const RolMenu = app.src.db.models.rol_menu;
  const Menus = app.src.db.models.menu;
  const sequelize = app.src.db.sequelize;

    app.route("/api/v1/seguridad/rol/:idRol/menu")
    /**
    @apiVersion 1.0.0
    @apiGroup Roles_Menus
    @apiName Get rol-menu
    @api {get} /api/v1/seguridad/rol/:idRol/menu Obtiene los roles_menus para un rol.

    @apiDescription Get para rol-menu, obtiene los menus asignados a un determinado rol.

    @apiParam (Parámetro) {Integer} idRol Identificador del rol sobre el cual se quiere obtener los menus.

    @apiSuccess (Respuesta) {Integer} id_rol_menu Identificador del rol-menu.
    @apiSuccess (Respuesta) {Integer} fid_rol Identificador del rol.
    @apiSuccess (Respuesta) {Integer} fid_menu Identificador del menu.
    @apiSuccess (Respuesta) {Texto} estado Estado por defecto ACTIVO.
    @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador.
    @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario que modifica.
    @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación..
    @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación.


    @apiSuccessExample {json} Respuesta :
    HTTP/1.1 200 OK
    [
      {
        "id_rol_menu": 1,
        "fid_rol": 1,
        "fid_menu": 2,
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T18:51:02.935Z",
        "_fecha_modificacion": "2016-12-19T18:51:02.935Z"
      },
      {
        "id_rol_menu": 2,
        "fid_rol": 1,
        "fid_menu": 3,
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-19T18:51:02.935Z",
        "_fecha_modificacion": "2016-12-19T18:51:02.935Z"
      }, .....
    ]
     */
    .get((req,res) => {
      RolMenu.findAll({
        where: {fid_rol: req.params.idRol},
      })
      .then(respuesta => {
        res.send(util.formatearMensaje("EXITO","La operación se realizó correctamente.", respuesta));
      })
      .catch(e => {
        res.status(412).send(util.formatearMensaje("ERROR",e));
      })
    })

    /**
    @apiVersion 1.0.0
    @apiGroup Roles_Menus
    @apiName Post rol-menu
    @api {post} /api/v1/seguridad/rol/0/menu Crea los roles_menus para un rol.

    @apiDescription Post para rol-menu.

    @apiParam (Petición) {Objeto} rol Objeto con informacion sobre el rol a crear.
    @apiParam (Petición) {Vector} menus Vector con informacion de los menus asignados para el rol a crear.
    @apiParam (Petición) {Texto} nombre Nombre del rol.
    @apiParam (Petición) {Texto} descripcion descripcion del rol a crear.
    @apiParam (Petición) {Integer} peso Peso del rol.
    @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario creador.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "rol":{
        "nombre" : Test,
        "descripcion" : Rol asignado para el equipo de QA,
        "peso" : 5,
        "estado" : ACTIVO,
        "_usuario_creacion" : 1
      },
      "menus" : [2,4,5,6,8,9,10]
    }

    @apiSuccessExample {json} Respuesta :
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente."
    }
    */
    .post((req,res) => {

      const nuevo_rol = req.body.rol;
      const rol_menus = req.body.menus;

      sequelize.transaction().then(t => {
        const tr = { transaction: t };
        Rol.create(nuevo_rol, tr)
          .then((rol) => {
            const menus = [];
            for (let i = 0; i < rol_menus.length; i++) {
              menus.push({
                fid_rol: rol.id_rol,
                fid_menu: rol_menus[i],
                _usuario_creacion: rol._usuario_creacion,
              });
            }
            return RolMenu.bulkCreate(menus, tr);
          })
          .then(() => t.commit())
          .then(() =>
            res.send(
              util.formatearMensaje(
                "EXITO",
                "La operación se realizó correctamente."
              )
            )
          )
          .catch((e) => {
            t.rollback();
            res.status(412).send(util.formatearMensaje("ERROR", e));
          });
      });
    })

    /**
    @apiVersion 1.0.0
    @apiGroup Roles_Menus
    @apiName Put rol-menu
    @api {put} /api/v1/seguridad/rol/:idRol/menu Actualiza los roles_menus para un rol.

    @apiDescription Put para rol-menu.

    @apiParam (Parámetro) {Integer} idRol Identificador del rol sobre el cual se quiere obtener los menus.

    @apiParam (Petición) {Objeto} rol Objeto con informacion sobre el rol que se quiere actualizar.
    @apiParam (Petición) {Objeto} menus Objeto con informacion sobre los menus a mantener e inactivar.
    @apiParam (Petición) {Vector} menus_nuevos Vector con informacion de los nuevos menus asignados para el rol a crear.
    @apiParam (Petición) {Integer} id_rol Identificador del rol.
    @apiParam (Petición) {Texto} nombre Nombre del rol.
    @apiParam (Petición) {Texto} descripcion descripcion del rol.
    @apiParam (Petición) {Integer} peso Peso del rol.
    @apiParam (Petición) {Texto} estado informacion del estado del rol.
    @apiParam (Petición) {Integer} _usuario_modificacion Identificador del usuario que modifica.

    @apiParam (Petición) {Integer} fid_rol_menu Identificador del rol-menu.
    @apiParam (Petición) {Integer} fid_rol Identificador del rol.
    @apiParam (Petición) {Integer} fid_menu Identificador del menu.
    @apiParam (Petición) {Texto} estado informacion del estado del rol.
    @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario creador.
    @apiParam (Petición) {Integer} _usuario_modificacion Identificador del usuario que modifica.

    @apiParamExample {json} Ejemplo para enviar:
    {
      "rol" : {
        "id_rol" : 7,
        "nombre" : "QA",
        "descripcion" : "Rol asignado para el equipo de QA",
        "peso" : 5,
        "estado" : "ACTIVO",
        "_usuario_modificacion" : 1
      },
      "menus" : [
        {
          "id_rol_menu" : 36,
          "fid_rol" : 7,
          "fid_menu" : 2,
          "estado" : "ACTIVO",
          "_usuario_creacion" : 1,
          "_usuario_modificacion" : 1
        },
        {
          "id_rol_menu" : 37,
          "fid_rol" : 7,
          "fid_menu" : 4,
          "estado" : "INACTIVO",
          "_usuario_creacion" : 1,
          "_usuario_modificacion" : 1
        }
      ],
      "menus_nuevos" : [8,9]
    }

    @apiSuccessExample {json} Respuesta :
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente."
    }
    */
    .put((req,res) => {
      const nuevo_rol = req.body.rol;
      const menus = req.body.menus;
      const rol_menus = req.body.menus_nuevos;

      sequelize.transaction().then(t => {
          const tr = { transaction: t };
          Rol.update(nuevo_rol, {
            where: {
              id_rol: nuevo_rol.id_rol,
            },
            transaction: t,
          })
          .then(rol => {
            const menus_nuevos = [];
            for (let i = 0; i < rol_menus.length; i++) {
              menus_nuevos.push({fid_rol: nuevo_rol.id_rol, fid_menu: rol_menus[i], _usuario_creacion: nuevo_rol._usuario_modificacion});
            }
            return RolMenu.bulkCreate(menus_nuevos, tr);
          })
          .then(rol => {
            const promesas = [];
            for (let i = 0; i < menus.length; i++) {
              promesas.push(
                new Promise((resolve, reject) => {
                  RolMenu.update(menus[i], {
                    where: {
                      id_rol_menu: menus[i].id_rol_menu,
                    },
                    transaction: t,
                  })
                  .then(respuesta => {
                    resolve(respuesta);
                  })
                  .catch(e => {
                    reject(e);
                  });
                })
              );
            }
            return Promise.all(promesas);
          })
          .then( (respuesta) => t.commit())
          .then(() =>  res.send(util.formatearMensaje("EXITO","La operación se realizó correctamente.")))
          .catch( e => {
            t.rollback();
            res.status(412).send(util.formatearMensaje("ERROR",e));
          })
      });

    })

}
