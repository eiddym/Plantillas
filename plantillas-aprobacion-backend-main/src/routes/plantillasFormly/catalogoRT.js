const options = require('sequelize-formly');
const sequelizeHandlers = require('sequelize-handlers');
const logger = require('../../lib/logger');

module.exports = app => {
  const modelos = app.src.db.models;
  const Catalogo = modelos.catalogo;
  const CatalogoUsuarios = modelos.catalogo_usuario;
  const CatalogoDocumentos = modelos.catalogo_documento;
  const util = app.src.lib.util;
  const sequelize = app.src.db.sequelize;
  const Op = app.src.db.Sequelize.Op;

  const bl = require('../../bl/plantillasFormly/catalogoBL');


  const filtros = (req, res, next) => {
    if (req.query.filter != '' && req.query.filter !== undefined) util.consulta(req, res, next, Catalogo);
    else next();
  }

  app.post('/api/v1/plantillasFormly/catalogo', (req, res) => {
    req.body._usuario_creacion= req.body.audit_usuario.id_usuario;
    const datosCatalogo = JSON.parse(JSON.stringify(req.body));
    const datosUsuarios = datosCatalogo.usuarios || [];
    const datosDocumentos = datosCatalogo.documentos || [];
    const usuarios = [];
    const documentos = [];
    delete datosCatalogo.usuarios;
    delete datosCatalogo.documentos;

    datosCatalogo.propietario = datosCatalogo.audit_usuario.id_usuario;
    const metadataHistorial = {
      audit_usuario: req.body.audit_usuario,
      accion: "CREAR",
    };
    let catalogo = null;
    sequelize.transaction().then(t => {
      const tr = { transaction: t };

      return Catalogo.create(datosCatalogo, tr)
      .then(resp => {
        catalogo = resp.dataValues;
        catalogo.audit_usuario = req.body.audit_usuario;
        datosUsuarios.map(item => {
          item.fid_catalogo = catalogo.id_catalogo;
          item.fid_usuario = item.id_usuario;
          item._usuario_creacion = req.body.audit_usuario.id_usuario;
          usuarios.push(item.id_usuario);
        });
        catalogo.accion = "CREAR";
        catalogo.editor = req.body.audit_usuario;
        return Promise.all([
          bl.crearUsuariosCatalogo(modelos, datosUsuarios, metadataHistorial,tr),
          bl.crearHistorico(modelos, catalogo.id_catalogo, catalogo, tr),
        ]);
      })
      .then(() => {
        const promesas = datosDocumentos.map(item => {
          item.fid_catalogo = catalogo.id_catalogo;
          item.fid_documento = item.id_documento;
          item._usuario_creacion = req.body.audit_usuario.id_usuario
          return bl.crearCatalogoDocumento(modelos, item, catalogo, tr)
          .then(resp => {
            resp.dataValues.accion = metadataHistorial.accion,
            resp.dataValues.audit_usuario = metadataHistorial.audit_usuario;
            return bl.crearHistorico(modelos, catalogo.id_catalogo, resp.dataValues, tr);
          })
        });
        return Promise.all(promesas)
        .then(() => Promise.resolve())
        .catch((error) => {
          logger.error('Error al crear documentos', error);
          return Promise.resolve();
        });
      })
      .then(() => t.commit())
      .then(() => res.send(util.formatearMensaje("EXITO", 'Creacion exitosa', { id_catalogo:catalogo.id_catalogo })))
      .catch(error => {
        t.rollback();
        res.status(412).send(util.formatearMensaje('ERROR', error));
      });
    });
  });

  app.put('/api/v1/plantillasFormly/catalogo/:id', (req, res) => {
    const catalogo = JSON.parse(JSON.stringify(req.body));
    const documentos = catalogo.documentos;
    const usuarios = catalogo.usuarios;
    delete catalogo.documentos;
    delete catalogo.usuarios;
    let catalogoBuscado = null;
    let catalogoActualizar = null;
    sequelize.transaction().then(t => {
      const tr = { transaction: t };
      return Catalogo.findOne({
        where: {
          id_catalogo: req.params.id,
        },
        include: [
          {
            model: CatalogoUsuarios,
            as: 'catalogo_usuario',
          },
          {
            model: modelos.catalogo_documento,
            as: 'catalogo_documento',
          },
        ],
        transaction: t,
      })
      .then(respCatalogo => {
        if (!respCatalogo) throw Error ('El catalogo a modificar no se encuentra disponible');
        catalogoActualizar = respCatalogo;
        if (catalogo.nombre !== respCatalogo.nombre) {
          let esComentarioValido = true;
          let esPropietario =  false;
          if (!catalogo.comentario || catalogo.comentario.length < 5) esComentarioValido = false;
          if (respCatalogo.propietario == req.body.audit_usuario.id_usuario ) esPropietario = true;
          if (!esPropietario || !esComentarioValido) {
            throw Error('No se cumplieron los requisitos para el cambio de nombre');
          }
        }
        return bl.validarEditor(respCatalogo.dataValues, req.body.audit_usuario.id_usuario);

      })
      .then(respCatalogo => {
        catalogoBuscado = respCatalogo;
        catalogo.editor = catalogoBuscado.editor;
        return bl.crearActualizarDocumentos(modelos, documentos, catalogo, tr);
      })
      .then(() => bl.crearActualizarUsuarios(modelos, usuarios, catalogo, tr))
      .then(() => {
        delete catalogo._usuario_creacion;
        delete catalogo.estado;
        delete catalogo.id_catalogo;
        return catalogoActualizar.update(catalogo, tr)
      })
      .then((resp) => {
        if (resp.dataValues) {
          catalogoBuscado.audit_usuario = req.body.audit_usuario;
          catalogoBuscado.accion = "MODIFICAR";
          delete resp.dataValues.catalogo_usuario;
          delete resp.dataValues.catalogo_documento;
          return bl.crearHistorico(modelos, catalogoBuscado.id_catalogo, resp.dataValues, tr);
        }
      })
      .then(() => t.commit())
      .then(() => res.send(util.formatearMensaje("EXITO", 'Actualización exitosa')))
      .catch(error => {
        t.rollback();
        res.status(412).send(util.formatearMensaje('ERROR', error));
      });
    });
  });

  app.put('/api/v1/plantillasFormly/catalogo/:id/propietario', (req,res) => {
    sequelize.transaction().then((t) => {
      const tr = { transaction: t };
      return bl.procesarCatalogosATransferir(modelos, req.body, tr)
      .then(() => t.commit())
      .then(() => res.send(util.formatearMensaje("EXITO", "Transferencia exitosa")))
      .catch((error) => {
        t.rollback();
        logger.error("Error al aplicar la transferencia", error);
        res.status(412).send(util.formatearMensaje("ERROR", error));
      });
    });

  });
  app.get('/api/v1/plantillasFormly/catalogo/:id', (req, res) => {
    const datosResp = {
      documentos: [],
      usuarios: [],
    }
    const opcionesCatalogo = {
      where: {
        id_catalogo: req.params.id,
        estado: { [Op.ne]: 'ELIMINADO' },
      },
      include: [
        {
          model: CatalogoUsuarios,
          as: 'catalogo_usuario',
          required: false,
        },
        {
          model: modelos.catalogo_documento,
          as: 'catalogo_documento',
          required: false,
        },
      ],
    };
    if (req.query.filter && (req.query.filter === 'true' || req.query.filter === true)) {
      opcionesCatalogo.include[0].where = {estado: 'ACTIVO'};
      opcionesCatalogo.include[1].where = {estado: 'ACTIVO'};
    }

    return Catalogo.findOne(opcionesCatalogo)
    .then(respCatalogo => {
      if (!respCatalogo) throw Error('El catalogo solicitado no se encuentra disponible.');
      datosResp.id_catalogo = respCatalogo.id_catalogo;
      datosResp.nombre = respCatalogo.nombre;
      datosResp.descripcion = respCatalogo.descripcion;
      datosResp.estado = respCatalogo.estado;
      datosResp._usuario_creacion = respCatalogo._usuario_creacion;
      datosResp.catalogo_documento = respCatalogo.catalogo_documento || [];
      datosResp.catalogo_usuario = respCatalogo.catalogo_usuario || [];
      datosResp.propietario = respCatalogo.propietario;

      if (req.query.filter && (req.query.filter === 'true' || req.query.filter === true)) {
        const usuarios = datosResp.catalogo_usuario;
        let usuarioValido = false;
        for (let i = 0; i < usuarios.length; i++) {
          if (usuarios[i].fid_usuario == req.body.audit_usuario.id_usuario) {
            usuarioValido = true;
          }
        }
        if (usuarioValido == false) throw Error('Usted no se encuentra autorizado');
      }
      else {
        if (datosResp.propietario !== req.body.audit_usuario.id_usuario) {
          throw Error('Usted no cuenta con la autorizacion para ver este catalogo');
        }
      }
    })
    .then(() => bl.obtenerInfoDocumentos(modelos, datosResp.catalogo_documento))
    .then(respDocumentos => {
      datosResp.documentos = respDocumentos;
      return bl.obtenerInfoUsuarios(modelos, datosResp.catalogo_usuario);
    })
    .then(respUsuarios => {
      datosResp.usuarios = respUsuarios;
      delete datosResp.catalogo_usuario;
      delete datosResp.catalogo_documento;
      res.send(util.formatearMensaje("EXITO", 'Obtención de catalogo exitosa.', datosResp));
    })
    .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error)));
  });

  app.get('/api/v1/plantillasFormly/catalogo/:id/miscatalogos', filtros, (req,res) => {
    const opcionesCatalogo = {
      where: {
        estado: "ACTIVO",
        propietario: req.body.audit_usuario.id_usuario,
      },
    };
    if (req.query.fields) {
      opcionesCatalogo.attributes = req.query.fields.split(',');
      opcionesCatalogo.attributes.push('_usuario_creacion');
    }
    if (req.query.filter !== '' && req.xfilter) {
      opcionesCatalogo.where[Op.or] = req.xfilter;
    }
    return Catalogo.findAll(opcionesCatalogo)
    .then(respCatalogos => res.send(util.formatearMensaje("EXITO", 'Obtención de catalogos exitosa.', {
      total: respCatalogos.length,
      resultado: respCatalogos,
    })))
    .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error)));
  });

  app.get('/api/v1/plantillasFormly/catalogo/:id/compartidos', filtros, (req,res) => {
    const opcionesCatUsuario = {
      where: {
        fid_usuario: req.body.audit_usuario.id_usuario,
        estado: 'ACTIVO',
      },
    }
    const opcionesCatalogo = {
      where: {
        estado: 'ACTIVO',
      },
    };
    const catalogos = [];
    return CatalogoUsuarios.findAll(opcionesCatUsuario)
    .then(respCatUsu => {
      respCatUsu.map(item => {
        if(catalogos.indexOf(item.dataValues.fid_catalogo) == -1) catalogos.push(item.dataValues.fid_catalogo);
      });
    })
    .then(() => {
      opcionesCatalogo.where.id_catalogo = {[Op.in]: catalogos};
      if (req.query.filter !== '' && req.xfilter) {
        opcionesCatalogo.where[Op.or] = req.xfilter;
      }
      return Catalogo.findAll(opcionesCatalogo);
    })
    .then(respCatalogos => {
      res.send(util.formatearMensaje("EXITO", 'Obtención de catalogos exitosa.', {
        total: respCatalogos.length,
        resultado: respCatalogos,
      }));
    })
    .catch(error => res.status(412).send(util.formatearMensaje('ERROR', error)));
  });


  /**
    @apiVersion 2.0.0
    @apiGroup Catalogo
    @apiName Delete catalogo
    @api {delete} /api/v1/plantillasFormly/catalogo/:id/miscatalogos Borrar catalogo

    @apiDescription Eliminar catalogo

    @apiParam (Params) {Number} id Identificador del catalogo a eliminar

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
    {
        "tipoMensaje": "EXITO",
        "mensaje": "Eliminacion exitosa"
    }

    @apiSampleRequest off
  */
  app.delete('/api/v1/plantillasFormly/catalogo/:id/miscatalogos', (req, res) => {
    const idCatalogo = req.params.id;
    sequelize.transaction().then(t => {
      const tr = { transaction: t };
      return Catalogo.findOne({
        where: {
          id_catalogo: idCatalogo,
          _usuario_creacion: parseInt(req.body.audit_usuario.id_usuario),
        },
      }, tr)
        .then(respCatalogo => {
          if (!respCatalogo) throw Error('El catalogo no existe o usted no es el propietario!');
          return Catalogo.update({ estado: 'ELIMINADO' }, { where: { id_catalogo: idCatalogo } })
        })
        .then(() => t.commit())
        .then(() => res.send(util.formatearMensaje("EXITO", 'Eliminacion exitosa')))
        .catch(error => {
          t.rollback();
          res.status(412).send(util.formatearMensaje('ERROR', error));
        });
    });

  });

  app.route('/api/v1/plantillasFormly/catalogo').options(options.formly(Catalogo, modelos));
  app.route('/api/v1/plantillasFormly/catalogo/:id/miscatalogos').options(options.formly(Catalogo, modelos));
  app.route('/api/v1/plantillasFormly/catalogo/:id/compartidos').options(options.formly(Catalogo, modelos));
};
