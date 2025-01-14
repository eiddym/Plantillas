const sequelizeHandlers = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const Sequelize = require("sequelize");
const fs = require("fs");


module.exports = app => {
  const partida = app.src.db.models.partida;
  const documento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  //const sequelize = require('sequelize');
  const Promise = require('bluebird');
  const rutaExternos = app.src.config.config.host;

  const config = app.src.config.config;
  const sequelize = app.src.db.sequelize;


/**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Get pagado
  @api {get} /api/v1/presupuesto/pagado?gestion= Obtener presupuesto pagado

  @apiDescription Get pagado?gestion=, obtiene el presupuesto pagado de una gestión específica

  @apiParam (Query) {Texto} gestion Año del que se desea obtener la información

  @apiSuccess (Respuesta) {Texto} numero Número de la partida
  @apiSuccess (Respuesta) {Texto} descripcion Descripción de la partida
  @apiSuccess (Respuesta) {Texto} monto Monto del pago
  @apiSuccess (Respuesta) {Texto} cite Documento relacionado
  @apiSuccess (Respuesta) {Texto} id_documento Id el documento relacionado
  @apiSuccess (Respuesta) {Texto} _fecha_creacion Fecha de creacion del pago

  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitosa.",
      "datos": [
        {
          "numero": "25220",
          "descripcion": "Un consultor de linea técnico de programación",
          "monto": "4000.00",
          "cite": "AGETIC/RP/0006/2017",
          "id_documento": 8102,
          "_fecha_creacion": "2017-05-25T13:01:31.387Z"
        },
        ...
      ]
    }

*/

  app.get('/api/v1/presupuesto/pagado', (req, res) => {

    const gestion = req.query.gestion;
    const qry = 'select p.numero, p.descripcion, p.monto, p.cite, d.id_documento, p._fecha_creacion ' +
                'from partida p, documento d ' +
                "where p.tipo = 'PAGADO' and p.gestion = :gestion and not p.monto = 0 and d.nombre= p.cite and p.estado='ACTIVO'" +
                'order by p.multiple asc';

        sequelize.query(qry, { replacements: { gestion }, type: sequelize.QueryTypes.SELECT }).then(respuesta => {
          if (respuesta){
            res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", respuesta));
          }else{
            res.status(200).send(util.formatearMensaje("INFORMACION", "No existen respuesta."));
          }
        });
  });


};
