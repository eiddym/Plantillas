
module.exports = app => {
  const partida = app.src.db.models.partida;
  const documento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  //const sequelize = require('sequelize');
  const Promise = require('bluebird');

  const config = app.src.config.config;
  const sequelize = app.src.db.sequelize;
        // final = moment(`${req.query.final}`, 'YYYY-MM-DD').tz('America/La_Paz').format(),

/**
  @apiVersion 2.0.0
  @apiGroup Monitoreo
  @apiName Get estados
  @api {get} /api/v1/monitoreo/estados?fechaInicial=&fechaFinal= Obtiene lista de estados de documento por usuario

  @apiDescription Get estados, Obtiene la lista de documentos por estado y usuario desde una fecha inicial a otra final

  @apiParam (Query) {Texto} fechaInicial Fecha y hora desde la que se desea el reporte
  @apiParam (Query) {Texto} fechaFinal Fecha y hora hasta la que se desea el reporte
  
  @apiSuccess (Respuesta) {Texto} _usuario_creacion Usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellios del usuario
  @apiSuccess (Respuesta) {Texto} CREADO Total creados
  @apiSuccess (Respuesta) {Texto} ENVIADO Total enviados
  @apiSuccess (Respuesta) {Texto} DERIVADO Total derivados
  @apiSuccess (Respuesta) {Texto} APROBADO Total aprobados
  @apiSuccess (Respuesta) {Texto} RECHAZADO Total rechazados
  @apiSuccess (Respuesta) {Texto} CERRADO Total cerrados
  @apiSuccess (Respuesta) {Texto} ELIMINADO Total eliminados

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitosa.",
      "datos": [
        {
          "_usuario_creacion": 4,
          "nombres": "Juana",
          "apellidos": "Arco",
          "CREADO": null,
          "ENVIADO": 2,
          "DERIVADO": null,
          "APROBADO": null,
          "RECHAZADO": null,
          "CERRADO": null,
          "ELIMINADO": null
        },
        {
          "_usuario_creacion": 3,
          "nombres": "Juan",
          "apellidos": "Perez",
          "CREADO": null,
          "ENVIADO": 1,
          "DERIVADO": null,
          "APROBADO": null,
          "RECHAZADO": null,
          "CERRADO": null,
          "ELIMINADO": null
        }
        ...
      ]
  }
  @apiSampleRequest off
*/

  app.get('/api/v1/monitoreo/estados', (req, res) => {
    if (isNaN(new Date(req.query.fechaInicial))) {
      res.status(412).send(util.formatearMensaje('ERROR', 'La fecha de inicio no tiene un formato correcto!'));
    }
    if (isNaN(new Date(req.query.fechaFinal))) {
      res.status(412).send(util.formatearMensaje('ERROR', 'La fecha final no tiene un formato correcto!'));
    }
    const _fechaInicial = moment(req.query.fechaInicial).format('YYYY-MM-DD');
    const _fechaFinal = moment(req.query.fechaFinal).format('YYYY-MM-DD');

    const qry = "select * from crosstab($$ " +
        "select h._usuario_creacion, u.nombres , u.apellidos, h.accion, count(h.accion) " +
        "from historial_flujo h, usuario u " +
        `where u.id_usuario = h._usuario_creacion and u.estado = 'ACTIVO' and h._fecha_creacion between '${_fechaInicial}'::date and '${_fechaFinal}'::date ` +
        "GROUP BY h._usuario_creacion, u.nombres , u.apellidos, h.accion " +
        "order by u.nombres , u.apellidos " +
        "$$ , $$VALUES ('CREADO'::text), ('ENVIADO'::text), ('DERIVADO'::text), ('APROBADO'::text), ('RECHAZADO'::text), ('CERRADO'::text), ('ELIMINADO'::text) $$) " +
        'as historial("_usuario_creacion" int, "nombres" text, "apellidos" text, "CREADO" int, "ENVIADO" int, "DERIVADO" int, "APROBADO" int, "RECHAZADO" int, "CERRADO" int, "ELIMINADO" int)';

        sequelize.query(qry, { type: sequelize.QueryTypes.SELECT })
        .then(resultado => {
            if (resultado){
                res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", resultado));
            }else{
                res.status(200).send(util.formatearMensaje("INFORMACION", "No existen resultados."));
            }
        }).catch(pError => {
            res.status(412).send(util.formatearMensaje('ERROR', pError));
        });
  });

  function toFloat(string) { return parseFloat(parseFloat(string).toFixed(2)); }
};
