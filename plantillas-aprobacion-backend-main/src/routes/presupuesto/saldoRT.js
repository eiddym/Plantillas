const sequelizeHandlers = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const Sequelize = require("sequelize");
const fs = require("fs");
require('colors')
const logger = require('../../lib/logger');

module.exports = app => {
  const Partida = app.src.db.models.partida;
  const documento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  //const sequelize = require('sequelize');
  const Promise = require('bluebird');
  const rutaExternos = app.src.config.config.host;

  const config = app.src.config.config;
  const sequelize = app.src.db.sequelize;
  const Op = app.src.db.Sequelize.Op;

/**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Get saldos
  @api {get} /api/v1/presupuesto/saldos/?gestion= Obtiene los saldos del presupuesto por gestión

  @apiDescription Get saldos/?gestion= , Obtiene la información de la gestión deseada

  @apiParam (Parámetro) {Texto} gestion Año del cuál se desea obtener la información

  @apiSuccess (Respuesta) {Texto} descripcion Descripción de la partida
  @apiSuccess (Respuesta) {Texto} numero Número de la partida
  @apiSuccess (Respuesta) {Texto} inicial Monto inicial
  @apiSuccess (Respuesta) {Texto} modificado Monto modificado
  @apiSuccess (Respuesta) {Texto} vigente Monto vigente
  @apiSuccess (Respuesta) {Texto} comprometido Monto comprometido
  @apiSuccess (Respuesta) {Texto} pagado Monto pagado
  @apiSuccess (Respuesta) {Texto} saldo Saldo

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Obtención de datos exitosa.",
    "datos": [
      {
        "descripcion": "Bono de Antigüedad",
        "numero": "11220",
        "inicial": "72420.00",
        "modificado": "0",
        "vigente": "72420.00",
        "comprometido": "0",
        "pagado": "0",
        "saldo": "72420.00"
      },
      ...
    ]
  }

*/

  app.get('/api/v1/presupuesto/saldos', (req, res) => {

    const gestion = req.query.gestion;
    const qry = 'select p.numero, p.descripcion, p.monto as inicial, ' +
                'coalesce(mo.sum,0) as modificado, ' +
                'p.monto + coalesce(mo.sum,0) as vigente, ' +
                'coalesce(co.sum,0) - coalesce(re.sum,0) as comprometido, ' +
                'coalesce(pa.sum,0) as pagado, ' +
                '(p.monto - coalesce(co.tot,0)-coalesce(pa.tot,0)+coalesce(mo.sum,0)) as saldo ' +
                'from partida as p ' +
                'left join ( ' +
                    'select p1.numero, sum(coalesce(p1.monto,0)), avg(coalesce(p2.monto,0)) as tot ' +
                    'from partida p1 ' +
                    'left join ( ' +
                        'select numero, sum(coalesce(monto,0)) as monto ' +
                        'from partida ' +
                        'where tipo = :comprometido and gestion = :gestion and fid_partida is null and estado=\'ACTIVO\' ' +
                        'group by numero ' +
                    ') as p2 ' +
                    'on p1.numero = p2.numero ' +
                    'where p1.tipo = :comprometido and p1.gestion = :gestion and p1.estado=\'ACTIVO\'' +
                    'group by p1.numero ' +
                ') as co ' +
                'on p.numero = co.numero ' +
                'left join ( ' +
                    'select numero, sum(coalesce(monto,0)) ' +
                    'from partida ' +
                    'where tipo=:comprometido and gestion=:gestion and estado=\'ACTIVO\'' +
                    'and  id_partida in ( ' +
                        'select fid_partida ' +
                        'from partida ' +
                        'where tipo=:pagado and gestion=:gestion and monto=0 and estado=\'ACTIVO\'' +
                        'and ( multiple not in ( ' +
                            'select mul.multiple ' +
                            'from ( ' +
                                'select multiple, count(*) as cant ' +
                                'from partida ' +
                                'where gestion=:gestion and not multiple is null and estado=\'ACTIVO\'' +
                                'group by multiple ' +
                            ') as mul ' +
                            'where mul.cant>2 ' +
                        ') or multiple is null) ' +
                   ') ' +
                   'group by numero ' +
                ') as re ' +
                'on p.numero = re.numero ' +
                'left join ( ' +
                    'select p1.numero, sum(coalesce(p1.monto,0)), avg(coalesce(p2.monto,0)) as tot ' +
                    'from partida as p1 ' +
                    'left join ( ' +
                        'select numero, sum(coalesce(monto,0)) as monto ' +
                        'from partida ' +
                        'where tipo = :pagado and gestion = :gestion and not fid_partida is null and estado=\'ACTIVO\'' +
                        'group by numero ' +
                    ') as p2 ' +
                    'on p1.numero = p2.numero ' +
                    'where p1.tipo = :pagado and p1.gestion = :gestion and p1.estado=\'ACTIVO\'' +
                    'group by p1.numero ' +
                ') as pa ' +
                'on p.numero = pa.numero ' +
                'left join ( ' +
                    'select numero, sum(coalesce(monto,0)) ' +
                    'from partida ' +
                    'where tipo = :modificado and gestion = :gestion and estado=\'ACTIVO\'' +
                    'group by numero ' +
                ') as mo ' +
                'on p.numero = mo.numero ' +
                'where p.tipo=:inicial and p.gestion = :gestion and p.estado=\'ACTIVO\'' +
                'order by numero';

        sequelize.query(qry, { replacements: { comprometido: 'COMPROMETIDO', gestion, pagado:'PAGADO', modificado:'MODIFICADO', inicial: 'INICIAL' }, type: sequelize.QueryTypes.SELECT })
        .then(saldos => {
          if (saldos){
            res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", saldos));
          }else{
            res.status(200).send(util.formatearMensaje("INFORMACION", "No existen saldos."));
          }
        })
        .catch(pError => {
          res.status(412).send(util.formatearMensaje('ERROR', pError));
        });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Presupuesto
    @apiName Get presupuesto/gestiones
    @api {get} /api/v1/presupuesto/gestiones Obtiene lista de gestiones de las que se tengan datos

    @apiDescription Get presupuesto/gestiones, obtiene lista de gestiones de las que se tengan datos

    @apiSuccess (Respuesta) {Objeto} gestion Año del que se tienen datos en el sistema

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitosa.",
      "datos": [
        {
          "gestion":	"2019"
        },
        {
          "gestion":	"2018"
        },
        {
          "gestion":	"2017"
        }
      ]
    }
  */

  app.get('/api/v1/presupuesto/gestiones', (req, res) => {
    Partida.findAll({
      attributes: ['gestion'],
      group: ['gestion'],
      order: [['gestion','DESC']],
    }).then( respuesta =>  {
      res.status(200).send(util.formatearMensaje("EXITO", "Obtención de datos exitosa.", respuesta));
    })
    .catch( pError => {
      logger.error('Error a obtener gestiones'.bgRed, pError);
      res.status(412).send(util.formatearMensaje("ERROR", 'Ocurrió un error al obtener gestiones de partidas'))
    });
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Presupuesto
  @apiName Post presupuesto/pdf
  @api {post} /api/v1/presupuesto/pdf Generar un documento PDF presupuesto

  @apiDescription Post del presupuesto/pdf para generar un documento PDF con la información de presupuesto

  @apiParam (Petición) {Array} cabecera Array de las cabeceras de la tabla
  @apiParam (Petición) {Array} filas Array de objetos que contiene datos de cada partida del presupuesto
  @apiParam (Petición) {Array} gestion Año del presupuesto.

  @apiParamExample {json} Ejemplo para enviar:
  {
    "cabecera":["Número","Descripción","Inicial","Comprometido","Pagado","Modificado","Vigente","Saldo"],
    "filas":[
      {
        "numero":"115,00",
        "descripcion":"Viáticos",
        "inicial":"2000,00",
        "comprometido":"1500,00",
        "pagado":"1000,00",
        "modificado":"20,00",
        "vigente":"1200,00",
        "saldo":"70,00"
      },
      {...}
    ],
    "gestion":2020
  }

  @apiSuccess (Respuesta) {Base64} Archivo pdf en Base64

  @apiSuccessExample {Base64} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  
  JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKP7/....

  @apiSampleRequest off
*/

  app.post('/api/v1/presupuesto/pdf', (req, res) => {
    const respuesta = {};
    req.body.host=rutaExternos;
    const datos ={};
    datos.presupuesto = req.body;

    util.generarPresupuestoPDF(datos)
    .then(pRespuesta => {
      const dirArch = './public/documentos/Presupuesto.pdf';
      fs.readFile(dirArch, (pError, pData) => {
        if(pError){
          pError=(process.env.NODE_ENV=='production')?"No se pudo obtener el documento":pError;
          res.status(412).send(util.formatearMensaje("ERROR",pError));
        }
        else res.send(pData);
          //res.status(200).send(util.formatearMensaje('EXITO', "Exitosa generación de la vísta previa.", pData));//
      });
    })
    .catch(pError => {
      logger.error("Error desde el catch", pError);
      res.status(412).send(util.formatearMensaje('ERROR', pError))
    })
  });

  function toFloat(string) { return parseFloat(parseFloat(string).toFixed(2)); }
};
