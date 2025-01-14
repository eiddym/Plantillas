const sequelizeHandlers = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const Sequelize = require("sequelize");
const fs = require("fs");
const _ = require('lodash');
const logger = require('../../lib/logger');


module.exports = app => {
  const modelPartida = app.src.db.models.partida;
  const modelDocumento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  const Op = app.src.db.Sequelize.Op;

  /**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Get presupuesto/resumen
  @api {get} /api/v1/presupuesto/resumen?partidas= Obtiene resumen de las partidas

  @apiDescription Get presupuesto/resumen?partidas=, obtiene el resumen de las partidas dadas

  @apiParam (Query) {Array} partidas Array de partidas expresadas como texto

  @apiSuccess (Respuesta) {Texto} partida Identificador de la partida
  @apiSuccess (Respuesta) {Integer} monto Cantidad consignada como monto
  @apiSuccess (Respuesta) {Integer} comprometido Cantidad consignada como comprometido
  @apiSuccess (Respuesta) {Integer} pagado Cantidad consignada como pagado
  @apiSuccess (Respuesta) {Integer} saldo Cantidad consignada como saldo
  @apiSuccess (Respuesta) {Integer} total Cantidad consignada como total

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Obtención de datos exitosa.",
    "datos": [
      {
        "partida": "120",
        "monto": 0,
        "comprometido": 12000,
        "pagado": 12000,
        "saldo": 0,
        "total": 12000
      },
      {
        "partida": "1145",
        "monto": 0,
        "comprometido": 8830,
        "pagado": 1000,
        "saldo": 0,
        "total": 10200
      }
    ]
  }
*/
  // app.get('/resumen', (req,res) => {
  app.get('/api/v1/presupuesto/resumen', (req,res) => {
    const partidas = JSON.parse(req.query.partidas) || [];
    const datos = {};
    modelPartida.findAll({
      attributes:['id_partida','cite','numero','monto','fid_partida','gestion','tipo','estado'],
      where: {
        numero: {
          [Op.like]: { [Op.any]: partidas },
        },
      },
    })
    .then(partidasResp => {
      const procesado = [];
      const partidasClasificadas = _.map(partidasResp, item => {

        const indicePartida = _.findIndex(procesado, itemPartida => (itemPartida.partida == item.numero));
        if( indicePartida == -1) {
          const temp =  {
            partida : item.numero,
            monto : 0,
            comprometido : 0,
            pagado : 0,
            saldo : 0,
            total : 0,
          };
          procesado.push(calcularMontosPorTipo(temp, item));
        }
        else {
          calcularMontosPorTipo(procesado[indicePartida], item);
        }
      });

      logger.error("Revisando lo procesado", procesado);
      res.status(200).send(util.formatearMensaje('EXITO', 'Obtención de datos exitosa.', procesado));
    })
    .catch(error => {
      logger.error("Error en la busqueda de partidas", error);
      res.status(200).send(util.formatearMensaje('INFORMACION', 'No existe resumen.'));
    });
  });
  function calcularMontosPorTipo(respuesta, item) {
    const diccionario = {
      INICIAL: 'total',
      COMPROMETIDO: 'comprometido',
      PAGADO: 'pagado',
      MODIFICADO: 'total',
    };
    respuesta[diccionario[item.tipo]] += parseFloat(item.monto);
    return respuesta;
  }

};
