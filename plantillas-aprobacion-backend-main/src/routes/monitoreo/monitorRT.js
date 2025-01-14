const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const _ = require("lodash");
const moment = require('moment');
const logger = require('../../lib/logger');

module.exports = app => {
  const monitor = app.src.db.models.monitor;
  const usuario = app.src.db.models.usuario;
  const documento = app.src.db.models.documento;
  const config = app.src.config.config;
  const sequelize = app.src.db.sequelize;
  const Op = app.src.db.Sequelize.Op;
  const util = require('../../lib/util');
  const sequelizeHandlers = new ModelHandler(monitor);

  /**
    @apiVersion 2.0.0
    @apiGroup Monitoreo
    @apiName Get monitoreo/global/
    @api {get} /api/v1/monitoreo/global/ Obtiene lista de gestiones de las que se tengan datos

    @apiDescription Get monitoreo/global/, obtiene lista de gestiones de las que se tengan datos

    @apiParam (Query) {Texto} anio Año del que se desea la información.
    @apiParam (Query) {Texto} mes Mes del que se desea la información, expresado como un entero. Ejemplo: 1 para enero.

    @apiSuccess (Respuesta) {Array} nombres Array de nombres de los puntos a graficarse
    @apiSuccess (Respuesta) {Array} global Array de puntos 
    @apiSuccess (Respuesta) {Array} relacionado Array de puntos relacionados
    @apiSuccess (Respuesta) {Array} no_relacionado Array de puntos no relacionados
    @apiSuccess (Respuesta) {Integer} total Cantidad total de puntos a graficar

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtención de datos exitoso",
      "datos": {
        "nombres":	["1-1-2020",	"2-1-2020", "3-1-2020", ....., "31-1-2020"],
        "global":	[0, 3, 1, 0, .......],
        "relacionado":	[0, 3, 1, 0, .......],
        "no_relacionado":	[0, 0, 0, 0, .......],
        "total":	31
      }
    }
  */

  app.get('/api/v1/monitoreo/global/', (req,res) => {
    const
      dm = moment(`${req.query.anio}-${req.query.mes}`,'YYYY-MM').daysInMonth(),
      inicio = moment(`${req.query.anio}-${req.query.mes}-1`, 'YYYY-MM').tz('America/La_Paz').format('YYYY-MM-DD'),
      final = moment(inicio).tz('America/La_Paz').add(dm-1,'days').format('YYYY-MM-DD'),
      total = new Array(dm),
      relacionado = new Array(dm),
      noRel = new Array(dm),
      nombres = [];
    let
      f,
      v,
      tot;
    total.fill(0,0);
    relacionado.fill(0,0);
    noRel.fill(0,0);
    for (let i = 1; i <= dm; i++) {
      nombres.push(`${i}-${req.query.mes}-${req.query.anio}`);
    }

    const opcionesMonitor = {
      attributes: [ 'fecha_visita','relacionado',  [sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
      where:{
        fecha_visita:{
          [Op.between]:[`${inicio}T04:00:00.000Z`,`${final}T04:00:00.000Z`],
        },
      },
      group: ['fecha_visita', 'relacionado'],
      order:[['fecha_visita']],
    };
    if(req.query.relacion) opcionesMonitor.where.relacionado=req.query.relacion;

    monitor.findAll(opcionesMonitor)
    .then( pLog => {

      pLog.forEach((pItem, pIndice) => {
          const f=moment(pItem.fecha_visita).tz('America/La_Paz').format('DD-MM-YYYY');
          const d = parseInt(moment(f,'DD').tz('America/La_Paz').format('DD')) -1;

          total[d]+=parseInt(pItem.dataValues.suma);
          if(pItem.dataValues.relacionado === true){

            relacionado[d]= parseInt(pItem.dataValues.suma);
          } else {
            noRel[d]= parseInt(pItem.dataValues.suma);
          }
          if( pIndice == pLog.length-1 ) return;
      });

    })
    .then(() => {

      res.status(200).send(util.formatearMensaje('EXITO', 'Obtencion de datos exitoso', { nombres, global:total,relacionado,no_relacionado:noRel, total:dm}));

    })
    .catch(pError => {
        logger.error("Error en la busqueda", pError);
        res.status(412).send(util.formatearMensaje('ERROR', pError));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Monitoreo
    @apiName Get monitoreo/usuario/
    @api {get} /api/v1/monitoreo/usuario/?anio=&mes= Obtiene datos de los usuario por mes y año

    @apiDescription Get monitoreo/usuario/,  obtiene datos de los usuario por mes y año.

    @apiParam (Petición) {Texto} anio Gestión de la que se requiere el gráfico
    @apiParam (Petición) {Texto} mes Mes de la que se requiere el gráfico

    @apiSuccess (Respuesta) {Array} global Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} relacionado Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} no_relacionado Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} nombres Conjunto de nombres a usarse en el gráfico
    @apiSuccess (Respuesta) {Integer} total Cantidad de puntos para la gráfica

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtencion de datos exitoso",
      "datos": {
        "global": ["21", "5", ...],
        "relacionado": ["20", "4", ...],
        "no_relacionado": [1, 1, ...],
        "nombres": ["jperez", "jarco", ...],
        "total": 5
      }
    }
  */

  app.get('/api/v1/monitoreo/usuario/', (req,res) => {
    const dm = moment(`${req.query.anio}-${req.query.mes}`,'YYYY-MM').daysInMonth(),
    inicio = moment(`${req.query.anio}-${req.query.mes}-1`, 'YYYY-MM').tz('America/La_Paz').format('YYYY-MM-DD'),
    final = moment(inicio).tz('America/La_Paz').add(dm-1,'days').format('YYYY-MM-DD'),
    page = (req.query.page-1)*20 || 0;

    const
      res1 = [],
      res2 = [],
      res3 = [],
      arr = [],
      ids_usuarios = [],
      v = {};
    let
      tot,
      opcionesMonitor = {
        attributes: ['fid_usuario',  [sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
        where:{
          fecha_visita:{
            [Op.between]:[`${inicio}T04:00:00.000Z`,`${final}T04:00:00.000Z`],
          },
        },
        group: ['fid_usuario'],
        order:[['suma','DESC']],
        limit: 20,
        offset: page,
      };
    if(req.query.relacion) opcionesMonitor.where.relacionado=req.query.relacion;
    monitor.findAndCountAll(opcionesMonitor)
    .then( pResp => {
        tot = pResp.count.length;
        pResp.rows.forEach( it => {
            res1.push(it.dataValues.suma);
            res2.push(0);res3.push(it.dataValues.suma);
            v[it.fid_usuario] = res1.length-1;
            ids_usuarios.push(it.fid_usuario);
            arr.push(new Promise((resolve, reject) =>
                usuario.findByPk(it.fid_usuario).then( r => resolve(r.usuario))
            ));
        });
        opcionesMonitor = {
          attributes: ['fid_usuario',  [sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
          where:{
            fecha_visita:{
              [Op.between]:[`${inicio}T04:00:00.000Z`,`${final}T04:00:00.000Z`],
            },
            fid_usuario: { [Op.in]: ids_usuarios },
            relacionado: true,
          },
          group: ['fid_usuario'],
        };
        return monitor.findAll(opcionesMonitor);
    })
    .then( pResp => {
        pResp.forEach( it => {
            v.i = v[it.fid_usuario];
            res2[v.i]=it.dataValues.suma;
            res3[v.i]=parseInt(res3[v.i])-parseInt(res2[v.i]);
        });
        return Promise.all(arr);
    })
    .then( pResp => {
        res.status(200).send(util.formatearMensaje('EXITO', 'Obtencion de datos exitoso', { global: res1, relacionado: res2, no_relacionado: res3, nombres: pResp, total: tot}));
    })
    .catch(pError => {
        logger.error("Error en la busqueda", pError);
        res.status(412).send(util.formatearMensaje('ERROR', pError));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Monitoreo
    @apiName Get monitoreo/documento/
    @api {get} /api/v1/monitoreo/documento/?anio=&mes= Obtiene datos de los documentos por mes y año

    @apiDescription Get monitoreo/documento/,  obtiene datos de los documentos por mes y año.

    @apiParam (Petición) {Texto} anio Gestión de la que se requiere el gráfico
    @apiParam (Petición) {Texto} mes Mes de la que se requiere el gráfico

    @apiSuccess (Respuesta) {Array} global Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} relacionado Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} no_relacionado Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} nombres Conjunto de nombres a usarse en el gráfico
    @apiSuccess (Respuesta) {Integer} total Cantidad de puntos para la gráfica

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtencion de datos exitoso",
      "datos": {
        "global": ["21", "5", ...],
        "relacionado": ["20", "4", ...],
        "no_relacionado": [1, 1, ...],
        "nombres": ["jperez", "jarco", ...],
        "total": 5
      }
    }
  */

  app.get('/api/v1/monitoreo/documento/', (req,res) => {
    console.log("Iniciando la nueva busqueda", req.query);
    const dm=moment(`${req.query.anio}-${req.query.mes}`,'YYYY-MM').daysInMonth(),
    inicio = moment(`${req.query.anio}-${req.query.mes}-1`, 'YYYY-MM').tz('America/La_Paz').format('YYYY-MM-DD'),
    final = moment(inicio).tz('America/La_Paz').add(dm-1,'days').format('YYYY-MM-DD'),
    page = (req.query.page-1)*20 || 0;
    console.log("Revisando la fecha inicio",inicio );
    console.log("Revisando la fecha final", final);

    const
      res1 = [],
      res2 = [],
      res3 = [],
      arr = [],
      ids_usuarios = [],
      v = {};
    let
      tot,
      opcionesMonitor = {
        attributes: ['fid_documento',  [sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
        where:{
          fecha_visita:{
            [Op.between]:[`${inicio}T04:00:00.000Z`,`${final}T04:00:00.000Z`],
          },
        },
        group: ['fid_documento'],
        order:[['suma','DESC']],
        limit: 20,
        offset: page,
      };
    monitor.findAndCountAll(opcionesMonitor)
    .then( pResp => {
        tot = pResp.count.length;
        pResp.rows.forEach( it => {
            res1.push(it.dataValues.suma);
            res2.push(0);res3.push(it.dataValues.suma);
            v[it.fid_documento] = res1.length-1;
            ids_usuarios.push(it.fid_documento);
            arr.push(new Promise((resolve, reject) =>
                documento.findByPk(it.fid_documento).then( r => resolve( r === null? 's/n': r.nombre))
            ));
        });
        opcionesMonitor = {
          attributes: ['fid_documento',  [sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
          where:{
            fecha_visita:{
              [Op.between]:[`${inicio}T04:00:00.000Z`,`${final}T04:00:00.000Z`],
            },
            fid_documento: { $in: ids_usuarios },
            relacionado: true,
          },
          group: ['fid_documento'],
        };
        return monitor.findAll(opcionesMonitor);
    })
    .then( pResp => {
        pResp.forEach( it => {
            v.i = v[it.fid_documento];
            res2[v.i]=it.dataValues.suma;
            res3[v.i]=parseInt(res3[v.i])-parseInt(res2[v.i]);
        });
        return Promise.all(arr);
    })
    .then( pResp => {
        res.status(200).send(util.formatearMensaje('EXITO', 'Obtencion de datos exitoso', { global: res1, relacionado: res2, no_relacionado: res3, nombres: pResp, total: tot}));
    })
    .catch(pError => {
        logger.error("Error en la busqueda", pError);
        res.status(412).send(util.formatearMensaje('ERROR', pError));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Monitoreo
    @apiName Get monitoreo/:id/documento
    @api {get} /api/v1/monitoreo/:id/documento?anio=&mes= Obtiene datos de documentos relacionados a un usuario

    @apiDescription Get monitoreo/:id/documento,  obtiene informacion de documentos con CITE relacionados o no a un usuario en especifico.

    @apiParam (Parámetro) {Integer} id Identificador del usuario

    @apiSuccess (Respuesta) {Array} global Conjunto de puntos a graficar
    @apiSuccess (Respuesta) {Array} relacionado Conjunto de puntos relacionados a graficar
    @apiSuccess (Respuesta) {Array} no_relacionado Conjunto de puntos no relacionados a graficar
    @apiSuccess (Respuesta) {Array} nombres Conjunto de nombres a usarse en el gráfico
    @apiSuccess (Respuesta) {Integer} total Cantidad de puntos para la gráfica

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "Obtencion de datos exitoso",
      "datos": {
        "global": ["21", "5", ...],
        "relacionado": ["20", "4", ...],
        "no_relacionado": [1, 1, ...],
        "nombres": ["jperez", "jarco", ...],
        "total": 5
      }
    }
  */

  // app.get('/:id/documento', (req,res) => {
  app.get('/api/v1/monitoreo/:id/documento', (req,res) => {

    const
      resultado = [],
      arr = [],
      nombres = [],
      total = [],
      relacionado = [],
      sinRel = [],
      page  = (req.query.page-1)*20 || 0;
      // page  = (req.query.page-1)*5 || 0;
    let
      tot,
      c = 0;

    const opcionesMonitor = {
      attributes: ['fid_documento', 'relacionado',[sequelize.fn('SUM', sequelize.col('contador')), 'suma'] ],
      where:{
        fid_usuario:req.params.id,
        cite:true,
      },
      group: ['fid_documento', 'relacionado'],
      order : [['suma','DESC']],
      limit : 5,
      offset : page,
    };

    if(req.query.relacion) opcionesMonitor.where.relacionado=req.query.relacion;

    monitor.findAndCountAll(opcionesMonitor)
    .then( pLog => {
        c = pLog.count.length;
        pLog.rows.forEach( (it, i) => {
          console.log("revisando los registros obtenidos", it.dataValues);
            resultado.push(it.dataValues.suma);
            arr.push(new Promise((resolve, reject) => {

                documento.findOne({
                  where:{
                    id_documento:it.fid_documento,
                    nombre:{[Op.like]: `${config.sistema.cite_principal}%/%/%` },
                  },
                })
                .then( r => {

                  if(r){
                    const val = parseInt(it.dataValues.suma);
                    total.push(val)
                    nombres.push(r.nombre || 'sin nombre');
                    if(it.relacionado==true){
                      relacionado.push(val);
                      sinRel.push(0)
                    }
                    else {
                      sinRel.push(val);
                      relacionado.push(0)
                    }
                  }
                  else resultado.splice(i,1);
                  resolve('_');
                }
              )
            }))
        })
        return Promise.all(arr)
    })
    .then( pResp => {

        res.status(200).send(util.formatearMensaje('EXITO', 'Obtencion de datos exitoso', { global:total,relacionado,no_relacionado:sinRel,nombres, total:c }))
    })
    .catch(pError => {
        logger.error("Error en la busqueda", pError);
        res.status(412).send(util.formatearMensaje('ERROR', pError));
    })
  });

/**
  @apiVersion 2.0.0
  @apiGroup Monitoreo
  @apiName Get monitor/:id
  @api {get} /api/v1/monitoreo/monitor/:id Obtiene un/a monitor

  @apiDescription Get monitor, obtiene un/a monitor

  @apiParam (Parámetro) {Integer} id Identificador de monitor que se quiere obtener

  @apiSuccess (Respuesta) {Integer} id_monitor Identificador de monitor
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de monitor
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de monitor
  @apiSuccess (Respuesta) {Integer} fid_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Integer} fid_documento Identificador del documento
  @apiSuccess (Respuesta) {Texto} fecha_visita  Fecha de la acción
  @apiSuccess (Respuesta) {Texto} ip Identificador de la IP desde la cual se realizó la acción
  @apiSuccess (Respuesta) {Texto} mac Identificador de la MAC desde la cual se realizó la acción
  @apiSuccess (Respuesta) {Integer} contador Cantidad de veces que se haya visto
  @apiSuccess (Respuesta) {Boolean} relacionado Si el documento está o no relacionado con el usuario
  @apiSuccess (Respuesta) {Boolean} cite Si el documento ya cuenta o no con cite.

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_monitor": "1",
      "fid_usuario": 10,
      "fid_documento": 78,
      "fecha_visita": "2017-04-26T04:00:00.000Z",
      "ip": "[\"1\"]",
      "mac": null,
      "contador": 3,
      "relacionado": true,
      "cite": true,
      "_usuario_creacion": "1",
      "_usuario_modificacion": "1",
      "_fecha_creacion": " << fecha y hora >> ",
      "_fecha_modificacion": " << fecha y hora >> "
    }

  }
*/
  app.get('/api/v1/monitoreo/monitor/:id', sequelizeHandlers.get(monitor));

/**
  @apiVersion 2.0.0
  @apiGroup Monitoreo
  @apiName Get monitor
  @api {get} /api/v1/monitoreo/monitor/ Obtiene la lista completa de monitor

  @apiDescription Get monitor

  @apiSuccess (Respuesta) {Integer} id_monitor Identificador de monitor
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de monitor
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de monitor
  @apiSuccess (Respuesta) {Integer} fid_usuario Identificador del usuario
  @apiSuccess (Respuesta) {Integer} fid_documento Identificador del documento
  @apiSuccess (Respuesta) {Texto} fecha_visita  Fecha de la acción
  @apiSuccess (Respuesta) {Texto} ip Identificador de la IP desde la cual se realizó la acción
  @apiSuccess (Respuesta) {Texto} mac Identificador de la MAC desde la cual se realizó la acción
  @apiSuccess (Respuesta) {Integer} contador Cantidad de veces que se haya visto
  @apiSuccess (Respuesta) {Boolean} relacionado Si el documento está o no relacionado con el usuario
  @apiSuccess (Respuesta) {Boolean} cite Si el documento ya cuenta o no con cite.

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "total": 21,
      "resultado":[
        {
          "id_monitor": "1",
          "fid_usuario": 10,
          "fid_documento": 78,
          "fecha_visita": "2017-04-26T04:00:00.000Z",
          "ip": "[\"1\"]",
          "mac": null,
          "contador": 3,
          "relacionado": true,
          "cite": true,
          "_usuario_creacion": "1",
          "_usuario_modificacion": "1",
          "_fecha_creacion": " << fecha y hora >> ",
          "_fecha_modificacion": " << fecha y hora >> "
        },
        {
          "id_monitor": "2",
          "fid_usuario": 20,
          "fid_documento": 87,
          "fecha_visita": "2017-04-26T04:00:00.000Z",
          "ip": "[\"1\"]",
          "mac": null,
          "contador": 4,
          "relacionado": true,
          "cite": true,
          "_usuario_creacion": "2",
          "_usuario_modificacion": "2",
          "_fecha_creacion": " << fecha y hora >> ",
          "_fecha_modificacion": " << fecha y hora >> "
        },
        ...
      ]

  }

*/

/**
  @apiVersion 2.0.0
  @apiGroup Monitoreo
  @apiName Get monitor/?order=&limit=&page=&filter=
  @api {get} /api/v1/monitoreo/monitor/?order=&limit=&page=&filter= Obtiene la lista paginada de monitor

  @apiDescription Get monitor

  @apiParam (Query) {Texto} order Campo por el cual se ordenará el parcial
  @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
  @apiParam (Query) {Integer} page Número de página de resultados
  @apiParam (Query) {Texto} filter Texto a buscar en los registros

  @apiSuccess (Respuesta) {Texto} tipoMensaje Tipo del mensaje de respuesta.
  @apiSuccess (Respuesta) {Texto} mensaje Mensaje de respuesta.
  @apiSuccess (Respuesta) {Objeto} datos Objeto de con los datos de respuesta
  @apiSuccess (Respuesta) {Integer} total Numero de objetos monitor
  @apiSuccess (Respuesta) {Array} resultado Array de objetos moonitor

  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente.",
      "datos": {
        "total": 21,
        "resultado":[
          {
            "id_monitor": "1",
            "fid_usuario": 10,
            "fid_documento": 78,
            "fecha_visita": "2017-04-26T04:00:00.000Z",
            "ip": "[\"1\"]",
            "mac": null,
            "contador": 3,
            "relacionado": true,
            "cite": true,
            "_usuario_creacion": "1",
            "_usuario_modificacion": "1",
            "_fecha_creacion": " << fecha y hora >> ",
            "_fecha_modificacion": " << fecha y hora >> "
          },
          {
            "id_monitor": "2",
            "fid_usuario": 20,
            "fid_documento": 87,
            "fecha_visita": "2017-04-26T04:00:00.000Z",
            "ip": "[\"1\"]",
            "mac": null,
            "contador": 4,
            "relacionado": true,
            "cite": true,
            "_usuario_creacion": "2",
            "_usuario_modificacion": "2",
            "_fecha_creacion": " << fecha y hora >> ",
            "_fecha_modificacion": " << fecha y hora >> "
          },
          ...
        ]
    }

*/
  app.get('/api/v1/monitoreo/monitor', sequelizeHandlers.query(monitor));


/**
  @apiVersion 1.0.0
  @apiGroup Monitoreo
  @apiName Options monitor
  @api {options} /api/v1/monitoreo/monitor Extrae formly de monitor

  @apiDescription Options de monitor

  @apiSuccess (Respuesta) {Texto} key Llave para el campo
  @apiSuccess (Respuesta) {Texto} type Tipo de etiqueta este puede ser input, select, datepicker, etc
  @apiSuccess (Respuesta) {Objeto} templateOptions Objeto de opciones para la etiqueta, el cual varia de acuerdo el tipo de etiqueta

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  [
    {
      "key": "id_monitor",
      "type": "input",
      "templateOptions": {
        "type": "number",
        "label": "Id monitor",
        "required": true
      },
    },
    {
      "key": "campo",
      "type": "input",
      "templateOptions": {
        "type": "text",
        "label": "Campo",
        "required": true
      }
    }
  ]

  @apiSampleRequest off
*/
  app.options('/api/v1/monitoreo/monitor', sequelizeFormly.formly(monitor, app.src.db.models));
};
