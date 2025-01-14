const sequelizeHandlers = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const logger = require('../../lib/logger');

module.exports = app => {
  const partida = app.src.db.models.partida;
  const documento = app.src.db.models.documento;
  const util = require('../../lib/util');
  const moment = require('moment');
  const sequelize = app.src.db.sequelize;
  const Promise = require('bluebird');
  const Op = app.src.db.Sequelize.Op;

/**
  @apiVersion 1.0.0
  @apiGroup Presupuesto
  @apiName Get partida/?cite=&filter=
  @api {get} /api/v1/presupuesto/partidas/? Obtiene las partidas presupuestarias

  @apiDescription Get partida

  @apiParam (Query) {Texto} cite Cite del documento,
  @apiParam (Query) {Texto} filter Texto a buscar en los registros

  @apiSuccess (Respuesta) {Texto} tipoMensaje Tipo del mensaje de respuesta.
  @apiSuccess (Respuesta) {Texto} mensaje Mensaje de respuesta.
  @apiSuccess (Respuesta) {Objeto[]} datos Lista de objetos partida


  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
    	"tipoMensaje": "EXITO",
    	"mensaje": "La operación se realizo exitosamente",
    	"datos": [
    		{
    			"id_partida": 1,
    			"numero": "22110",
    			"num_des": "22110 - Pasajes al interior del Pais"
    		},
    		{
    			"id_partida": 2,
    			"numero": "22120",
    			"num_des": "22120 - Pasajes al exterior del Pais"
    		}
    	]
    }
  @apiSuccessExample {json} Respuesta cuando se envia cite:
    HTTP/1.1 200 OK
    {
    	"tipoMensaje": "EXITO",
    	"mensaje": "La operación se realizo exitosamente",
    	"datos": {
    		"6": {
    			"partida": {
    				"id_partida": 1,
    				"numero": "321",
    				"num_des": "321 - Papel"
    			},
    			"descripcion": "papel 1",
    			"monto": "500.45",
    			"id": 6
    		},
    		"7": {
    			"partida": {
    				"id_partida": 1,
    				"numero": "321",
    				"num_des": "321 - Papel"
    			},
    			"descripcion": "papel 2",
    			"monto": "550.55",
    			"id": 7
    		},
        ...
    	}
    }

*/

  app.get('/api/v1/presupuesto/partidas', (req, res) => {
    const
    filter = req.query.filter,
    multiple = req.query.saldo,
    cite = req.query.cite;
    let valores, partidas;
    if (!cite && !multiple) {
      // se activa al buscar partidas cuando se esta realizando comprometidos, modificados y pagados
      // se buscara a las partidas iniciales de la gestion presente
      const opcionesPartida = {
        attributes: ['id_partida', 'numero', [sequelize.fn('CONCAT', sequelize.col('numero'), ' - ', sequelize.col('descripcion')), 'num_des'] ],
        where: {
          tipo: 'INICIAL',
          gestion: `${moment().tz("America/La_Paz").year()}`,
          estado: 'ACTIVO',
        },
        order: 'numero',
        limit: 3,
      };

      if (filter) {
        opcionesPartida.where[Op.and] = [
          sequelize.where( sequelize.fn('CONCAT', sequelize.col('numero'), ' - ', sequelize.col('descripcion')), { [Op.iLike]: `%${filter}%` } ),
        ];
      }

      partida.findAll(opcionesPartida)
      .then( pResp =>  res.send(util.formatearMensaje("EXITO", 'La operación se realizo exitosamente', pResp)) )
      .catch( pError => {
        logger.error('Ocurrió un error al obtener partidas >> ', pError);
        res.status(412).send(util.formatearMensaje("ERROR", 'Ocurrió un error al obtener partidas'))
      })
    } else if (!multiple) {
      //al seleccionar un cite de referencia al momento de hacer pagados
      //buscamos el documento con el cite enviado
      documento.findOne({where:{ nombre:cite }})
      .then( doc => {
        const pagados = [], partidas_obj={}, multiples=[];
        valores = JSON.parse(doc.plantilla_valor);
        if (valores['cajachica-0']) {
          // guardamos los comprometidos
          valores['cajachica-0'].rows.forEach( it => {
            pagados.push(it.id);
            // transformamos de array a objeto para que sea mas facil eliminar
            partidas_obj[it.id] = it;
          });
          // buscamos los pagos(si es que existen) de los comprometidos
          partida.findAll({ where:{ fid_partida:{[Op.in]:pagados}, tipo:'PAGADO', estado: 'ACTIVO' }, raw:true})
          .then( pResp => {
            // eliminamos de la respuesta a los que fueron pagados
            pResp.forEach( it => { delete partidas_obj[it.fid_partida]; })
            res.send(util.formatearMensaje("EXITO", 'La operación se realizo exitosamente', partidas_obj))
          })
          .catch( pError => res.status(412).send(util.formatearMensaje("ERROR", pError)) )

        } else {
          res.send(util.formatearMensaje('ADVERTENCIA','El documento no tiene partidas.'));
        }
      })
      .catch( pError => {
        logger.error('Ocurrió un error al obtener comprometidos', pError)
        res.status(412).send(util.formatearMensaje("ERROR", 'Ocurrió un error al obtener comprometidos'));
      })
    } else {
      // se busca el ultimo comprometido que no haya sido pagado
      let saldo;

      // buscamos el comprometido y restamos su monto con todos los pagos que tiene
      partida.findOne({ where:{ id_partida:multiple, estado: 'ACTIVO'}})
      .then( comp => { // comprometido
        if (comp) {
          if (comp.fid_partida) {
            return partida.findOne({ where:{ id_partida:comp.fid_partida, estado: 'ACTIVO'}})
          } else {
            saldo = toFloat(comp.monto);
            return partida.findOne({
              attributes: ['multiple', [sequelize.fn('SUM',sequelize.fn('COALESCE', (sequelize.col('monto')), 0)), 'total']],
              where: {
                multiple: comp.id_partida,
                tipo: 'PAGADO',
                estado: 'ACTIVO',
              },
              group: 'multiple',
              raw: true,
            })
          }
        } else throw 'No exite comprometido';
      })
      .then( resp => {
        if (resp){
          if (resp.id_partida)
            res.send(util.formatearMensaje('ADVERTENCIA',`El comprometido ya fue pagado en el documento ${resp.cite}`));
          else
            res.send(util.formatearMensaje('EXITO','La operación se realizo exitosamente', {monto: (saldo-toFloat(resp.total))}));
        } else  res.send(util.formatearMensaje('EXITO','La operación se realizo exitosamente', {monto: saldo}));

      })
      .catch( pError => {
        logger.error('Ocurrió un error al obtener el saldo actual.', pError);
        res.status(412).send(util.formatearMensaje("ERROR", 'Ocurrió un error al obtener el saldo actual.'));
      })
    }
  });

  function toFloat(string) { return parseFloat(parseFloat(string).toFixed(2)); }
};
