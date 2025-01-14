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

  // const config = app.src.config.config;
  //   const sequelize = new Sequelize(
  //   config.database,
  //   config.username,
  //   config.password,
  //   config.params
  //   );
  const sequelize = app.src.db.sequelize;
  const Op = app.src.db.Sequelize.Op;

/**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Get comprometido
  @api {get} /api/v1/presupuesto/comprometido?gestion=

  @apiDescription Get comprometido?gestion= , obtiene el presupuesto comprometido de una gestión específica

  @apiParam {Query} gestion Año del que se quiere obtener el presupuesto comprometido

  @apiSuccess (Respuesta) {Texto} numero Número de la partida
  @apiSuccess (Respuesta) {Texto} descripcion Descripción de la partida
  @apiSuccess (Respuesta) {Texto} monto Monto comprometido
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
          "monto": "7000.00",
          "cite": "AGETIC/RP/0006/2017",
          "id_documento": 8110,
          "_fecha_creacion": "2017-05-25T13:01:31.387Z"
        },
        ...
      ]
    }

*/ 

  app.get('/api/v1/presupuesto/comprometido', (req, res) => {

    const gestion = req.query.gestion;
    const qry = 'select p.numero, p.descripcion, p.monto, p.cite, d.id_documento, p._fecha_creacion ' +
                'from partida p, documento d ' +
                "where p.tipo = 'COMPROMETIDO' and p.gestion = :gestion and p.fid_partida is NULL and d.nombre= p.cite and p.estado=\'ACTIVO\'" +
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
