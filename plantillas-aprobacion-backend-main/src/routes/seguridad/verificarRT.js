const blFirmado = require('../../bl/plantillasFormly/firmadoBL');
const logger = require('../../lib/logger');

module.exports = app => {
  const Modelos = app.src.db.models;
  const util = app.src.lib.util;
  const archivos = app.src.lib.archivos;
  const recaptcha = app.src.lib.recaptcha;
  const firmaUtil = app.src.lib.firma;
  const dirDocumento = app.src.config.config.ruta_documentos;
  const Op = app.src.db.Sequelize.Op;
  const libDocumento = require('../../lib/documento');
  const logger = require('../../lib/logger');

  app.post('/verificarDocumento', (req, res) => {

    const Documento = Modelos.documento;
    const Firma = Modelos.firma;
    const Usuario = Modelos.usuario;
    const respuesta = {};
    try {
      if (!req.body.cite) throw Error('No se puede realizar la busqqueda sin el cite.');
      if (!req.body.codigo) throw Error('No se puede realizar la busqueda sin el código.');
      if (!req.body.recaptcha) throw Error('Complete la solución del reCaptcha.');
      recaptcha.validar(req,res)
      .then(resp => {
        if (resp.status !== 200) {
          throw new Error('Error en la validacion del recaptcha');
        }
        if (resp.data.success !== true) {
          throw new Error('Error en la validacion de data recaptcha');
        }

        return Documento.findOne({
          attributes: ['id_documento', 'nombre', 'firmado', 'firmaron', 'aprobado_cd', 'aprobaron_cd', 'de', 'via', 'para'],
          where: {
            nombre: { [Op.iLike]: req.body.cite },
          },
          include: {
            required: false,
            attributes: ['hash', 'codigo', '_usuario_modificacion', '_usuario_creacion'],
            model: Firma,
            as: 'firma',
            where: { codigo: req.body.codigo },
          },
        });
      })
      .then(respDocumento => {

        if (!respDocumento) throw Error('No se encontró el documento en el sistema de plantillas.');
        if (!respDocumento.firma) throw Error('No se encontró el documento en el sistema de plantillas.');
        if (respDocumento.aprobado_cd === false) throw Error('El documento no fue aprobado con Ciudadanía Digital por todos los actores del mismo.');

        respuesta.cite = respDocumento.nombre;
        respuesta.hash = respDocumento.firma.hash;
        respuesta.codigo = respDocumento.firma.codigo;

        //obtiene el archivo para enviar para su verificación
        return util.obtenerArchivo(respuesta.cite);
      })
      .then((documentoObtenido) =>
        //verifica el documento si se encuentra registrado en aprobación de documentos
        libDocumento.verificarDocumento(Buffer.from(documentoObtenido).toString('base64'), respuesta.cite)
      )
      .then((respuestaVerificacion) => {
        //verifica si en la respuesta de verificación el documento esta registrado
        if(respuestaVerificacion==undefined) {
          throw Error('Ocurrio un Error en la solicitud de la verificación del documento');
        }
        else if (respuestaVerificacion.verificacionCorrecta===false)
        {
          logger.info('El documento existe en el Sistema de Plantilas, pero no esta aprobado con Ciudadanía Digital');
          throw Error('El documento no está aprobado con Ciudadanía Digital');
        }else{
          if(respuestaVerificacion.registros==undefined) {
            throw Error('Ocurrio un error al obtener los firmantes del documento');
          }
          respuesta.firmantes = respuestaVerificacion.registros;
        }
        return util.generarTokenVerificacion();
      })
      .then(respToken => {
        respuesta.token = respToken;
        return res.send(util.formatearMensaje("EXITO", 'El documento está aprobado con Ciudadanía Digital', respuesta));
      })
      .catch(errorDocumento => {
        logger.error('Error', errorDocumento);
        return res.status(412).send(util.formatearMensaje("ERROR", errorDocumento));
      });
    } catch (error) {
      logger.error(`Ocurio el siguiente error: ${error}`);
      return res.status(412).send(util.formatearMensaje("ADVERTENCIA", error));
    }

  });

  app.post('/verificar', (req, res) => {

    const Documento = Modelos.documento;
    const Firma = Modelos.firma;
    const Usuario = Modelos.usuario;
    const datos = {};
    const respuesta = {};
    try {
      if (!req.body.cite) throw Error('No se puede realizar la busqqueda sin el cite.');
      if (!req.body.codigo) throw Error('No se puede realizar la busqueda sin el código.');
      if (!req.body.recaptcha) throw Error('Complete la solución del reCaptcha.');
      recaptcha.validar(req,res)
      .then(resp => {
        if (resp.status !== 200) {
          throw new Error('Error en la validacion del recaptcha');
        }
        if (resp.data.success !== true) {
          throw new Error('Error en la validacion de data recaptcha');
        }

        return Documento.findOne({
          attributes: ['id_documento', 'nombre', 'firmado', 'firmaron', 'de', 'via', 'para'],
          where: {
            nombre: { [Op.iLike]: req.body.cite },
          },
          include: {
            required: false,
            attributes: ['hash', 'codigo', '_usuario_modificacion', '_usuario_creacion'],
            model: Firma,
            as: 'firma',
            where: { codigo: req.body.codigo },
          },
        });
      })
      .then(respDocumento => {

        if (!respDocumento) throw Error('El documento a verificar no es válido, revise los datos introducidos.');
        if (!respDocumento.firma) throw Error('El documento no se puede verificar en este medio, el mismo no posee un codigo válido.');
        if (respDocumento.firmado === false) throw Error('El documento no fue firmado por todos los actores del mismo.');
        respuesta.cite = respDocumento.nombre;
        respuesta.hash = respDocumento.firma.hash;
        respuesta.codigo = respDocumento.firma.codigo;
        datos.nombre = `${util.formatoNombreDoc(respDocumento.nombre)}.pdf`;
        const usuarios = respDocumento.firmaron || [];
        return Usuario.findAll({
          attributes: ['nombres', 'apellidos', 'cargo'],
          where: { id_usuario: { [Op.in]: usuarios }},
        });
      })
      .then(respFirmantes => {
        datos.usuarios = respFirmantes || [];
        return firmaUtil.obtenerFirmas(`${dirDocumento}${datos.nombre}`);
      })
      .then(respFirmas => {
        datos.firmas = respFirmas.data || [];
        return blFirmado.procesarFirmas(datos.usuarios, datos.firmas );
      })
      .then(filtrado => {
        respuesta.firmantes = filtrado;
        return util.generarTokenVerificacion();
      })
      .then(respToken => {
        respuesta.token = respToken;
        return res.send(util.formatearMensaje("EXITO", 'Obtención de datos exitosa', respuesta));
      })
      .catch(errorDocumento => {
        logger.error('Error', errorDocumento);
        return res.status(412).send(util.formatearMensaje("ERROR", errorDocumento));
      });
    } catch (error) {
      logger.error('Revisando el error desde el catch', error);
      return res.status(412).send(util.formatearMensaje("ADVERTENCIA", error));
    }
  });

  app.post('/pdfVerificado', (req, res) =>
    util.obtenerArchivo(req.body.cite)
    .then(data => res.send(data))
    .catch(error => {
      logger.error('Error en la obtencion del pdf verificado', error);
      return res.status(412).send(util.formatearMensaje("ERROR", error));
    })
  );

  app.post('/verificarAnulado', (req, res) => {
    const nombreArchivo = util.formatoNombreDoc(req.body.anular);
    const rutaArchivo = `${dirDocumento}${nombreArchivo}.pdf`;
    return archivos.anular(rutaArchivo, req.body.cite)
    .then(() => res.send(util.formatearMensaje('EXITO', 'Verificacion de documento anulado correctamente')))
    .catch(e => {
      logger.error('No se puede anular', e);
      return res.status(412).send(util.formatearMensaje("ERROR", e));
    });
  });
  app.post('/corregir', (req, res) => {

    const nombreArchivo = util.formatoNombreDoc(req.body.iad);
    const rutaArchivo = `${dirDocumento}${nombreArchivo}.pdf`;
    const datos = {
      ruta: rutaArchivo,
      nombre: req.body.iad,
    };
    return archivos.corregirAnulacion(datos, Modelos, app)
    .then((resp) => res.send(util.formatearMensaje('EXITO', 'Verificación de documento anulado correctamente', resp)))
    .catch(e => {
      logger.error('No se puede anular', e);
      return res.status(412).send(util.formatearMensaje("ERROR", e));
    });
  });

  
};
