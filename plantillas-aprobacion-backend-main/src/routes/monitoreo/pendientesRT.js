

module.exports = app => {
  const partida = app.src.db.models.partida;
  const documento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  //const sequelize = require('sequelize');
  const Promise = require('bluebird');

  const config = app.src.config.config;
  const sequelize = app.src.db.sequelize;

/**
  @apiVersion 1.0.0
  @apiGroup Monitoreo
  @apiName Get pendientes
  @api {get} /api/v1/monitoreo/pendientes Obtiene los documentos pendientes por usuario

  @apiDescription Get pendientes

  @apiSuccess (Respuesta) {Texto} via_actual Usuario
  @apiSuccess (Respuesta) {Texto} nombres Nombres del usuario
  @apiSuccess (Respuesta) {Texto} apellidos Apellios del usuario
  @apiSuccess (Respuesta) {Texto} ENVIADO Total enviados
  @apiSuccess (Respuesta) {Texto} RECHAZADO Total rechazados
  @apiSuccess (Respuesta) {Texto} DERIVADO Total derivados

  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
        "tipoMensaje": "EXITO",
        "mensaje": "Obtención de datos exitosa.",
        "datos": [
          {
            "_usuario_creacion": 3,
            "nombres": "Oso",
            "apellidos": "Pardo",
            "ENVIADO": null,
            "RECHAZADO": null,
            "DERIVADO": null
          },
          {
            "_usuario_creacion": 9,
            "nombres": "León",
            "apellidos": "Africano",
            "ENVIADO": null,
            "RECHAZADO": null,
            "DERIVADO": null
          }
          ...
        ]
    }
*/

  app.get('/api/v1/monitoreo/pendientes', (req, res) => {

    const qry = "select * from crosstab($$ " +
                "select d.via_actual, u.nombres , u.apellidos, d.estado, count(d.estado) from documento d, usuario u " +
                "where d.estado in ('ENVIADO','RECHAZADO','DERIVADO') and u.id_usuario = d.via_actual and u.estado= 'ACTIVO' " +
                "group by d.via_actual, d.estado, u.nombres , u.apellidos " +
                "order by u.nombres , u.apellidos $$ " +
                ", $$VALUES ('ENVIADO'::text), ('RECHAZADO'::text), ('DERIVADO'::text) $$) " +
                'as pendientes("via_actual" int, "nombres" text, "apellidos" text, "ENVIADO" int, "RECHAZADO" int, "DERIVADO" int) ';

        sequelize.query(qry)
        .then(resultado => {
            if (resultado) {
                res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", resultado));
            } else{
                res.status(200).send(util.formatearMensaje("INFORMACION", "No existen resultados."));
            }
        })
        .catch(pError => {
            res.status(412).send(util.formatearMensaje('ERROR', pError));
        });
  });

  function toFloat(string) { return parseFloat(parseFloat(string).toFixed(2)); }
};
