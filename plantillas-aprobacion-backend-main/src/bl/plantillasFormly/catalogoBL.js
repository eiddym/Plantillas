require('colors');
const _ = require('lodash');
const util = require('../../lib/util');
const logger = require('../../lib/logger');
const hash = require('object-hash');


module.exports = {
  filtrarDocumentosRelacionados: (modelos, lista, id_usuario, tr) => {
    const Documento = modelos.documento;

    return new Promise((resolve, reject) => {});
  },

  obtenerInfoDocumentos: (modelos, lista) => {
    const Documento = modelos.documento;
    const documentosRespuesta = [];
    const promesas = lista.map(
      (item) =>
        new Promise((resolve) =>
          Documento.findOne({
            attributes: ["id_documento", "nombre", "fecha"],
            where: {
              id_documento: item.fid_documento,
            },
          })
            .then((respDocumento) => {
              if (!respDocumento) throw Error("El documento no existe");
              const temp = JSON.parse(JSON.stringify(item));
              temp.nombre = respDocumento.dataValues.nombre;
              temp.nombre_pdf = `${util.formatoNombreDoc(temp.nombre)}.pdf`;
              documentosRespuesta.push(temp);
              return resolve();
            })
            .catch(() => resolve())
        )
    );

    return Promise.all(promesas)
      .then(() => Promise.resolve(documentosRespuesta))
      .catch((error) => Promise.reject(error));
  },

  obtenerInfoUsuarios: (modelos, lista) => {
    const Usuario = modelos.usuario;
    const usuariosRespuesta = [];
    const promesas = lista.map(
      (item) =>
        new Promise((resolve) =>
          Usuario.findOne({
            attributes: ["id_usuario", "nombres", "apellidos", "cargo"],
            where: {
              id_usuario: item.fid_usuario,
            },
          })
            .then((respusuario) => {
              if (!respusuario) throw Error("El usuario no existe");
              const temp = JSON.parse(JSON.stringify(item));
              temp.nombres = respusuario.nombres;
              temp.apellidos = respusuario.apellidos;
              temp.cargo = respusuario.cargo;
              usuariosRespuesta.push(temp);
              return resolve();
            })
            .catch(() => resolve())
        )
    );

    return Promise.all(promesas)
      .then(() => Promise.resolve(usuariosRespuesta))
      .catch(() => Promise.reject("No se pudo obtener resultados"));
  },

  tieneRelacion: (documento, usuario) => {
    const de = JSON.parse(documento.de) || [];
    const via = JSON.parse(documento.via) || [];
    const via_actual = documento.via_actual;
    const para = JSON.parse(documento.para) || [];
    const id = usuario.id_usuario;
    return new Promise((resolve) => {
      if (
        de.indexOf(id) > -1 ||
        via.indexOf(id) > -1 ||
        para.indexOf(id) > -1 ||
        via_actual == id
      )
        return resolve(true);
      else return resolve(false);
    });
  },

  validarMultiple: (lista, usuario) => {
    let existeRelacion = false;
    const promesas = lista.map((item) =>
      module.exports
        .tieneRelacion(item, usuario)
        .then((resp) => {
          if (resp == true) existeRelacion = true;
        })
        .catch((error) => {})
    );

    return Promise.all(promesas).then(() => Promise.resolve(existeRelacion));
  },

  validarRelacionDocumento: (modelos, documento, usuario) => {
    const Documento = modelos.documento;
    return new Promise((resolve, reject) =>
      module.exports
        .tieneRelacion(documento, usuario)
        .then((resp) => {
          if (resp == true) return resolve(resp);
          return Documento.findAll({
            attributes: [
              "id_documento",
              "nombre",
              "_usuario_creacion",
              "_usuario_modificacion",
              "firmaron",
              "via_actual",
              "de",
              "via",
              "para",
              "grupo",
            ],
            where: {
              grupo: documento.grupo,
            },
          });
        })
        .then((respDocumentos) =>
          module.exports.validarMultiple(respDocumentos, usuario)
        )
        .then((respMultiple) => resolve(respMultiple))
        .catch(() => reject("Error en la busqueda de documentos"))
    );
  },

  crearActualizarDocumentos: (modelos, lista, catalogo, tr) => {
    const promesas = lista.map(
      (item) =>
        new Promise((resolve, reject) => {
          if (!item.id_catalogo_documento) {
            return module.exports
              .crearCatalogoDocumento(modelos, item, catalogo, tr)
              .then((resp) => {
                resp.dataValues.accion = 'MODIFICAR';
                resp.dataValues.audit_usuario = catalogo.audit_usuario;
                return module.exports.crearHistorico(modelos, catalogo.id_catalogo, resp.dataValues, tr);
              })
              .then(resolve)
              .catch((error) => reject(error));
          }
          if (item._usuario_creacion == catalogo.editor.id_usuario) {
            return module.exports
              .actualizarCatalogoDocumento(modelos, item, catalogo, tr)
              .then(resolve)
              .catch((error) => reject(error));
          }
          return resolve();
        })
    );

    return Promise.all(promesas)
      .then(() => Promise.resolve())
      .catch((error) => Promise.reject(error));
  },

  crearCatalogoDocumento: (modelos, datos, catalogo, tr) => {
    const Documento = modelos.documento;
    const CatalogoDocumento = modelos.catalogo_documento;
    const opcionesDocumento = {
      attributes: [
        "id_documento",
        "nombre",
        "_usuario_creacion",
        "_usuario_modificacion",
        "firmaron",
        "via_actual",
        "de",
        "via",
        "para",
        "grupo",
      ],
      where: {
        id_documento: datos.fid_documento,
      },
      transaction: tr.transaction,
    };
    return new Promise((resolve, reject) =>
      Documento.findOne(opcionesDocumento)
        .then((respDocumento) =>
          module.exports.validarRelacionDocumento(
            modelos,
            respDocumento,
            catalogo.editor
          )
        )
        .then((respRelacion) => {
          if (respRelacion == false)
            throw Error("El documento no presenta relacion con el usuario");
          return CatalogoDocumento.findOne({
            where: {
              fid_documento: datos.fid_documento,
              fid_catalogo: catalogo.id_catalogo,
            },
          });
        })
        .then((respCatDoc) => {
          if (respCatDoc) return resolve(respCatDoc);
          datos.fid_catalogo = catalogo.id_catalogo;
          if (!datos._usuario_creacion)
            datos._usuario_creacion = catalogo.audit_usuario.id_usuario;
          return CatalogoDocumento.create(datos, tr);
        })
        .then((resp) => resolve(resp))
        .catch((error) => reject(error))
    );
  },

  actualizarCatalogoDocumento: (modelos, datos, catalogo, tr) => {
    const CatalogoDocumento = modelos.catalogo_documento;
    const condicionBusqueda = {
      id_catalogo_documento: datos.id_catalogo_documento,
      fid_catalogo: catalogo.id_catalogo,
      _usuario_creacion: catalogo.audit_usuario.id_usuario,
    };
    return new Promise((resolve, reject) =>
      CatalogoDocumento.findOne({
        where: condicionBusqueda,
        transaction: tr.transaction,
      })
      .then((resp) => {
        if (!resp)
          throw Error("El catalogo a actualizar no se encuentra disponible");
        return resp.update(datos, tr);
      })
      .then((resp) => resolve(resp))
      .catch((error) => reject(error))
    );
  },

  crearActualizarUsuarios: (modelos, lista, catalogo, tr) => {
    const promesas = lista.map(
      (item) =>
        new Promise((resolve) => {
          if (!item.id_catalogo_usuario) {
            return module.exports
              .crearCatalogoUsuario(modelos, item, catalogo, tr)
              .then((resp) => {
                resp.dataValues.accion = "MODIFICAR";
                resp.dataValues.audit_usuario = catalogo.audit_usuario;
                return module.exports.crearHistorico(modelos, catalogo.id_catalogo, resp.dataValues, tr);
              })
              .then(() => resolve())
              .catch((error) => {
                logger.error('Error en la adicion de usuariuos a un catalogo', error);
                return resolve();
              });
          }
          return module.exports
            .actualizarCatalogoUsuario(modelos, item, catalogo, tr)
            .then(() => resolve())
            .catch(() => resolve());
        })
    );
    return Promise.all(promesas)
      .then(() => Promise.resolve())
      .catch((error) => Promise.reject(error));
  },

  crearCatalogoUsuario: (modelos, datos, catalogo, tr) => {
    const opcionesUsuario = {
      attributes: ["id_usuario", "nombres", "apellidos"],
      where: {
        id_usuario: datos.fid_usuario,
      },
      transaction: tr.transaction,
    };
    const CatalogoUsuario = modelos.catalogo_usuario;
    const Usuario = modelos.usuario;
    return new Promise((resolve, reject) =>
      Usuario.findOne(opcionesUsuario)
      .then((respUsuario) => {
        const usuarioEntrante = hash({
          id_usuario: datos.fid_usuario,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
        });
        const usuarioBuscado = hash(respUsuario.dataValues);
        if (usuarioEntrante !== usuarioBuscado) return resolve();
        datos._usuario_creacion = catalogo.audit_usuario.id_usuario;
        datos.fid_catalogo = catalogo.id_catalogo;
        return CatalogoUsuario.findOne({
          where: {
            fid_usuario: datos.fid_usuario,
            fid_catalogo: catalogo.id_catalogo,
          },
        });
      })
      .then((respCatUsu) => {
        if (respCatUsu) return resolve(respCatUsu);
        return CatalogoUsuario.create(datos, tr);
      })
      .then((resp) => resolve(resp))
      .catch((error) => reject(error))
    );
  },

  actualizarCatalogoUsuario: (modelos, datos, catalogo, tr) => {
    const CatalogoUsuario = modelos.catalogo_usuario;
    return new Promise((resolve, reject) =>
      CatalogoUsuario.findOne({
        where: {
          id_catalogo_usuario: datos.id_catalogo_usuario,
          fid_usuario: datos.fid_usuario,
          _usuario_creacion: catalogo.audit_usuario.id_usuario,
        },
        transaction: tr.transaction,
      })
        .then((resp) => {
          if (!resp)
            throw Error(
              "El usuario a actulizar para el catalogo no se encuentra disponible"
            );
          return resp.update({ estado: datos.estado }, tr);
        })
        .then(() => resolve())
        .catch((error) => reject(error))
    );
  },
  validarEditor: (catalogo, editorId) => {
    const usuarios = catalogo.catalogo_usuario;
    catalogo.editor = {
      id_usuario: catalogo.propietario,
    };
    return new Promise((resolve, reject) => {
      const usuarioEditor = usuarios.filter(
        (item) => item.dataValues.fid_usuario == editorId
      );
      if (catalogo.propietario === editorId) return resolve(catalogo);
      if (catalogo._usuario_creacion == editorId) return resolve(catalogo);
      if (usuarioEditor && usuarioEditor[0].dataValues.escritura) {
        catalogo.editor = {
          id_usuario: usuarioEditor[0].dataValues.fid_usuario,
        };
        return resolve(catalogo);
      } else return reject("El usuario no posee permisos de edición");
    });
  },
  procesarCatalogosATransferir: (modelos, datos, tr) => {
    const Catalogo = modelos.catalogo;
    const condiciones = {
      attributes: ['id_catalogo', 'propietario'],
      where: {
        propietario: datos.audit_usuario.id_usuario,
        id_catalogo: {
          $in: _.map(datos.catalogos, "id_catalogo"),
        },
      },
    };
    return Catalogo.findAll(condiciones)
    .then((respCatalogos) => {
      if (respCatalogos.length !== datos.catalogos.length) throw Error("Usted no es propietario de los catalogos a transferir.");
      return module.exports.transferirCatalogos(modelos, respCatalogos, datos.propietario, datos.audit_usuario, tr);
    })
    .catch((error) => {
      logger.error("Error en la transferencia", error);
      return error;
    });
  },
  transferirCatalogos: (modelos, catalogos, nuevoPropietario, usuario, tr) => {
    const promesas = catalogos.map(catalogo => {
      const datosActualizar = { propietario: nuevoPropietario };
      return catalogo.update(datosActualizar, tr)
      .then((resp) => {
        resp.dataValues.accion = "MODIFICAR";
        resp.dataValues.audit_usuario = usuario;
        return module.exports.crearHistorico(modelos, catalogo.id_catalogo, resp.dataValues, tr);
      });
    });
    return Promise.all(promesas);
  },

  crearHistorico: (modelos, id, datos, tr) => {
    const Historial = modelos.historial_catalogo;
    const datosCatalogo = JSON.parse(JSON.stringify(datos));
    delete datosCatalogo.audit_usuario;
    delete datosCatalogo.accion;
    delete datosCatalogo.editor;

    const datosInsertar = {
      fid_catalogo: id,
      accion: datos.accion,
      _usuario_creacion: datos.audit_usuario.id_usuario,
      datos: datosCatalogo,
    }
    return Historial.create(datosInsertar, tr);

  },

  crearUsuariosCatalogo: (modelos, usuarios, metadata, tr) => {
    const promesas = usuarios.map(usuario =>
      modelos.catalogo_usuario.create(usuario, tr)
      .then(resp => {
        resp.dataValues.accion = metadata.accion;
        resp.dataValues.audit_usuario = metadata.audit_usuario;
        return module.exports.crearHistorico(modelos, resp.fid_catalogo, resp.dataValues, tr);
      })
    );
    return Promise.all(promesas);
  },
};