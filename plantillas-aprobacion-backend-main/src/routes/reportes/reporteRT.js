const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = app => {
  const Modelos = app.src.db.models;
  const Util = app.src.lib.util;
  const Op = app.src.db.Sequelize.Op;

  /**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Post reportes/contables
  @api {post} /api/v1/reportes/contables Generar el reporte contable

  @apiDescription Post del reportes/contables , genera el reporte contable de acuerdo al tipo de documento que se requiera y la gestión

  @apiParam (Petición) {Texto} gestion Año del que se quiere generar el reporte
  @apiParam (Petición) {Texto} tipoInforme Tipo de informe que se quiere realizar; IPV(Informe de pago de viáticos), IPBS (Informe de pago de bienes y servicios) o IPSPCL-A (Informe de pago de servicios personales y consultorias de línea)

  @apiParamExample {json} Ejemplo para enviar:
  {
    "gestion":"2018",
    "tipoInforme": "IPV"
  }

  @apiSuccess (Respuesta) {Texto} cite Cite del documento en cuestión
  @apiSuccess (Respuesta) {Texto} detalle Detalle para el informe
  @apiSuccess (Respuesta) {Texto} c31 Comprobante de ejecución de gasto
  @apiSuccess (Respuesta) {Texto} importe Monto

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Obtención de datos exitosa.",
    "datos": {
      "total": 1,
      "documentos": [
        {
          "cite": "AGETIC/PV/002/2017",
          "detalle": "Detalle de prueba",
          "c31": "...",
          "importe": "10000.00"
        }
      ]

    }
  }

  @apiSampleRequest off
*/

  app.post('/api/v1/reportes/contables', (req, res) => {
    console.log('Revisando el objeto app', req.body);
    const gestion = req.body.gestion;
    const tipoInforme = req.body.tipoInforme;
    const respuesta = {
      total: 0,
      documentos: [],
    };
    const condBusqueda = {
      attributes: ['id_documento', 'nombre', 'plantilla_valor', 'fecha'],
      where: {
        nombre: {
          [Op.iLike]: `%/${gestion}`,
        },
        abreviacion: tipoInforme,
      },
    };
    Modelos.documento.findAndCountAll(condBusqueda)
    .then(respDoc => {
      respuesta.total = respDoc.count;
      const documentos = respDoc.rows
      documentos.map((item, index) => {
        const data = JSON.parse(item.plantilla_valor);
        const temp= {
          cite: item.nombre,
          detalle: data['inputt-0'],
          c31: data['inputt-1'],
          importe: data['inputt-2'],
        };
        respuesta.documentos.push(temp);
        if(index == 0) {
          console.log('index', index);
          console.log('Item', item.dataValues);
        }
      })
      res.status(200).send(Util.formatearMensaje("EXITO", 'Obtención de datos exitosa', respuesta));
    })
    .catch(error => {
      logger.error('Error en la busqueda del reporte contable', error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Post firmasPendientes
    @api {post} /api/v1/firmasPendientes Obtiene pendientes de firma por usuario

    @apiDescription Post para firmasPendientes,  obtiene pendientes de firma por usuario de la unidad a la que pertenece el usuario que ejecuta la petición.

    @apiSuccess (Respuesta) {Texto} usuario Nombre completo del usuario
    @apiSuccess (Respuesta) {Integer} pendientes Cantidad de documentos pendientes de firma

    @apiSuccessExample Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje":"EXITO",
      "mensaje":"Obtención de datos exitosa",
      "datos":[
        {
          "usuario": "Juan Perez",
          "pendientes": 3
        },
        {
          "usuario": "León Africano",
          "pendientes": 0
        },
        {
          "usuario": "Oso Pardo",
          "pendientes": 1
        }
      ]
    }

  */

  app.post('/api/v1/firmasPendientes', (req, res) => {
    console.log('Iniciando la obtencion de usuarios pendientes de firma', req.body.audit_usuario);
    const respuesta = [];
    const sequelize = app.src.db.sequelize;
    return Modelos.usuario.findOne({
      attributes: ['fid_unidad'],
      where: {
        id_usuario: req.body.audit_usuario.id_usuario,
      },
    })
    .then(usuarioResp => {
      if(!usuarioResp) throw Error('Los datos del usuario son incorrectos.');
      return Modelos.usuario.findAll({
        attributes: ['id_usuario', 'nombres', 'apellidos'],
        where: {
          fid_unidad: usuarioResp.dataValues.fid_unidad,
          estado: 'ACTIVO',
        },
      });
    })
    .then(usuariosResp => {
      if(!usuariosResp) throw Error('No existen usuarios para la unidad.');
      if(usuariosResp.length === 0) throw Error('No existen usuarios para la unidad.');
      // const idUsuarios = _.usuariosResp.map();
      console.log('Revisando los datos obtenidos', usuariosResp);
      const promesas = usuariosResp.map(item =>
        new Promise((resolve, reject) =>
          sequelize.query(`
          SELECT id_documento, nombre, de, via, para, via_actual, estado, firmado, firmante_actual, firmaron
          FROM documento
          WHERE estado IN('CERRADO', 'DERIVADO')
          AND firmado = FALSE
          AND(de LIKE '[${item.dataValues.id_usuario}]'
            OR de LIKE '[${item.dataValues.id_usuario},%'
            OR de LIKE '%,${item.dataValues.id_usuario},%'
            OR de LIKE '%,${item.dataValues.id_usuario}]'
            OR(
              via LIKE '[${item.dataValues.id_usuario}]'
              OR via LIKE '[${item.dataValues.id_usuario},%'
              OR via LIKE '%,${item.dataValues.id_usuario},%'
              OR via LIKE '%,${item.dataValues.id_usuario}]'
            )
            OR(
              para LIKE '[${item.dataValues.id_usuario}]'
              OR para LIKE '[${item.dataValues.id_usuario},%'
              OR para LIKE '%,${item.dataValues.id_usuario},%'
              OR para LIKE '%,${item.dataValues.id_usuario}]'
            )
          )
          AND(NOT(${item.dataValues.id_usuario} = ANY(firmaron)) OR firmaron IS NULL);
          `)
          .then(resp =>
            resolve({
              usuario: `${item.dataValues.nombres} ${item.dataValues.apellidos}`,
              pendientes: resp[0].length || 0,
            })
          )
        )
      );

      return Promise.all(promesas)
      .then(datos => {
        console.log('revisando los datos', datos);
        return datos;
      });
    })
    .then(datos => {
      res.status(200).send(Util.formatearMensaje("EXITO", 'Obtención de datos exitosa', datos));

    })
    .catch(error => {
      logger.error('Error en la obtención de pendientes de firma', error);
      res.status(412).send(Util.formatearMensaje('ERROR', error));
    })
  });
}