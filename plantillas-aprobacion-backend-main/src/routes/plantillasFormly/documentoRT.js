/* eslint-disable arrow-body-style */
const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const _ = require('lodash');
const fs = require("fs");
const moment = require('moment');
const axios = require('axios');
const logger = require('../../lib/logger');
require('colors');

module.exports = app => {
  const modelos = app.src.db.models;
  const documento = app.src.db.models.documento;
  const unidad = app.src.db.models.unidad;
  const usuario = app.src.db.models.usuario;
  const correlativo = app.src.db.models.correlativo;
  const historial_flujo = app.src.db.models.historial_flujo;
  const confNotificacion = app.src.db.models.conf_notificacion;
  const notificacion = app.src.db.models.notificacion;
  const partida = app.src.db.models.partida;
  const Op = app.src.db.Sequelize.Op;
  const util = require('../../lib/util');
  const correo = require('../../lib/correo');
  const notificar = require('../../lib/notificacion');
  const archivo = require('../../lib/archivos');
  const bl = require('../../bl/plantillasFormly/documentoBL');
  const blm = require('../../bl/monitor/monitorBL');
  const sequelize = app.src.db.sequelize;
  const director = app.src.config.config.sistema.director;
  const citeGuia = app.src.config.config.sistema.cite_principal;
  const citeCeros = app.src.config.config.sistema.cite_ceros;
  const prefijo = app.src.config.config.prefijo;
  const dirDocumento = app.src.config.config.ruta_documentos;
  const dirExternos = app.src.config.config.ruta_externos;
  const dirExternosAprobacion = app.src.config.config.aprobacionCD.ruta_externos_aprobacion;
  const sequelizeHandlers = new ModelHandler(documento);
  // const Op = app.src.db.sequelize.Op;

/**
  @apiVersion 2.0.0
  @apiGroup Documento
  @apiName Post documento
  @api {post} /api/v1/plantillasFormly/documento Crear documento

  @apiDescription Post para documento

  @apiParam (Petición) {Texto} nombre Nombre del documento
  @apiParam (Petición) {Texto} nombre_plantilla Nombre de la planilla usada para el documento
  @apiParam (Petición) {Texto} abreviacion Sigla o abreviación del documento
  @apiParam (Petición) {Texto} plantilla Plantilla del documento
  @apiParam (Petición) {Texto} plantilla_valor Valores de la plantilla
  @apiParam (Petición) {Texto} sw Propiedades del documento
  @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario que esta creando

  @apiParamExample {json} Ejemplo para enviar:
  {
    "nombre": "INSTRUCTIVO - Juan Perez",
    "nombre_plantilla": "INSTRUCTIVO",
    "abreviacion": "II",
    "plantilla": "[]",
    "plantilla_valor": "{}",
    "sw": "{"enviado": "false", "enviar": "false", "es_respuesta":"false"}",
    "_usuario_creacion": 1
  }

  @apiSuccess (Respuesta) {Integer} id_documento Identificador de documento
  @apiSuccess (Respuesta) {Texto} nombre Nombre del documento
  @apiSuccess (Respuesta) {Texto} nombre_planilla Nombre de la planilla usada para el documento
  @apiSuccess (Respuesta) {Texto} plantilla Plantilla del documento
  @apiSuccess (Respuesta) {Texto} plantilla_valor Valores de la plantilla
  @apiSuccess (Respuesta) {Texto} abreviacion Sigla o abreviación de la plantilla
  @apiSuccess (Respuesta) {Texto} estado Estado del registro
  @apiSuccess (Respuesta) {Boolean} firmado Si el documento ha sido firmado
  @apiSuccess (Respuesta) {Boolean} anulado Si el documento ha sido anulado
  @apiSuccess (Respuesta) {Texto} impreso Si el documento ha sido impreso
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de documento
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de documento
  @apiSuccess (Respuesta) {Texto} de Remitente del documento
  @apiSuccess (Respuesta) {Texto} para Destino del documento
  @apiSuccess (Respuesta) {Texto} via Usuarios por los que deba pasar del documento antes del desstino
  @apiSuccess (Respuesta) {Texto} via_actual Posición del documento actual
  @apiSuccess (Respuesta) {Texto} referencia Referencias del documento
  @apiSuccess (Respuesta) {Texto} fecha Fecha del documento
  @apiSuccess (Respuesta) {Texto} observaciones Observaciones del documento
  @apiSuccess (Respuesta) {Texto} documento_padre Documento del cual haya derivado el documento actual
  @apiSuccess (Respuesta) {Integer} grupo Grupo al que pertenezca el documeto
  @apiSuccess (Respuesta) {Texto} firmaron Firmantes del documento
  @apiSuccess (Respuesta) {Texto} firmante_actual Usuario que debe firmar para proseguir con el flujo
  @apiSuccess (Respuesta) {Texto} multiple Copias del documento

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente.",
      "datos": {
        "id_documento": 3,
        "nombre": "INSTRUCTIVO",
        "nombre_plantilla": "INSTRUCTIVO",
        "abreviacion": "II",
        "plantilla": "[]",
        "plantilla_valor": "{}",
        "estado": "ACTIVO",
        "firmado":	false,
        "impreso":	"NO",
        "anulado":	false,
        "estado":	"NUEVO",
        "_usuario_creacion": 1,
        "_fecha_modificacion": "2016-12-02T20:16:10.276Z",
        "_fecha_creacion": "2016-12-02T20:16:10.276Z",
        "_usuario_modificacion": null,
        "de":	"null",
        "para":	"null",
        "via":	"null",
        "via_actual":	"null",
        "referencia":	"null",
        "fecha":	"null",
        "observaciones":	"null",
        "documento_padre":	"null",
        "grupo":	6082,
        "firmaron":	"null",
        "firmante_actual":	"null",
        "multiple":	"null"

      }
    }

  @apiSampleRequest off
*/
  app.post('/api/v1/plantillasFormly/documento', (req, res) => {
    let xdoc;
    const msg = "La operación se realizó correctamente.";
    const sw = req.body.sw;
    sw.xenviar = !sw.enviado && sw.enviar;
    const model = JSON.parse(req.body.plantilla_valor);
    let respuestaMultiple;

    sequelize.transaction().then(t => {
        const transaccion = { transaction: t };
        bl.verificarExternos(req.body)
        .then(pValores => {
          if(pValores) req.body.plantilla_valor=pValores;
          return bl.verificarObtenerMultiple(req.body, transaccion);
        })
        .then((multipleResp) => {
          respuestaMultiple = multipleResp;
          return bl.verificarParticipantesDocumento(req.body);
        })
        .then(respValidacionParticipantes => {
          if(respValidacionParticipantes.existeParticipantesRepetidos) {
            throw new Error('Por favor, verifique que no se tenga usuarios repetidos en los destinatarios DE, VÍA o PARA');
          }
          if(respuestaMultiple.esMultiple == true) {
            req.body.multiple = respuestaMultiple.multiple;
          }
          return documento.create(req.body, transaccion)
          .then( resp => {
            xdoc = resp;
            return bl.actualizarGrupo(documento, xdoc, transaccion);
          })
          .then( resp => {
            return bl.registrarDocumentosAprobacionCD(req.body, resp.id_documento, resp._usuario_creacion, modelos, transaccion);
          })
          .then( resp => {
            if (sw.xenviar){
              return bl.verificarPartidas(partida, model);
            }
            return
          })
          .then( resp => {
            if(sw.xenviar && sw.es_respuesta){
              return bl.documento_crear(historial_flujo, xdoc.documento_padre, xdoc._usuario_creacion, transaccion);
            }
            return;
          })
          .then( resp => {
            if(sw.xenviar){
              return bl.documento_enviar(historial_flujo, xdoc, transaccion, director)
              .then(() => t.commit())
              .finally(() =>  notificar.enviar(modelos, xdoc,'enviado',{}));
            }
            return;
          });
        })
        .then( resp => {
          if(!sw.xenviar) return t.commit();
        })
        .then( resp => res.send(util.formatearMensaje("EXITO", msg, xdoc)))
        .catch(e => {
          t.rollback();
          res.status(412).send(util.formatearMensaje("ERROR", e));
        });
    });


  });

/**
  @apiVersion 2.0.0
  @apiGroup Documento
  @apiName Get documento/:id
  @api {get} /api/v1/plantillasFormly/documento/:id Obtiene un/a documento

  @apiDescription Get documento, obtiene un/a documento

  @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere obtener

  @apiSuccess (Respuesta) {Integer} id_documento Identificador de documento
  @apiSuccess (Respuesta) {Texto} nombre Nombre del documento
  @apiSuccess (Respuesta) {Texto} nombre_planilla Nombre de la planilla usada para el documento
  @apiSuccess (Respuesta) {Texto} plantilla Plantilla del documento
  @apiSuccess (Respuesta) {Texto} plantilla_valor Valores de la plantilla
  @apiSuccess (Respuesta) {Texto} abreviacion Sigla o abreviación de la plantilla
  @apiSuccess (Respuesta) {Texto} estado Estado del registro
  @apiSuccess (Respuesta) {Boolean} firmado Si el documento ha sido firmado
  @apiSuccess (Respuesta) {Boolean} anulado Si el documento ha sido anulado
  @apiSuccess (Respuesta) {Texto} impreso Si el documento ha sido impreso
  @apiSuccess (Respuesta) {Texto} de Remitente del documento
  @apiSuccess (Respuesta) {Texto} para Destino del documento
  @apiSuccess (Respuesta) {Texto} via Usuarios por los que deba pasar del documento antes del desstino
  @apiSuccess (Respuesta) {Texto} via_actual Posición del documento actual
  @apiSuccess (Respuesta) {Texto} referencia Referencias del documento
  @apiSuccess (Respuesta) {Texto} fecha Fecha del documento
  @apiSuccess (Respuesta) {Texto} observaciones Observaciones del documento
  @apiSuccess (Respuesta) {Texto} documento_padre Documento del cual haya derivado el documento actual
  @apiSuccess (Respuesta) {Integer} grupo Grupo al que pertenezca el documeto
  @apiSuccess (Respuesta) {Texto} firmaron Firmantes del documento
  @apiSuccess (Respuesta) {Texto} firmante_actual Usuario que debe firmar para proseguir con el flujo
  @apiSuccess (Respuesta) {Texto} multiple Copias del documento
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de documento
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de documento

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente.",
      "datos": {
        "id_documento": 1,
        "nombre": "INSTRUCTIVO",
        "nombre_plantilla": "INSTRUCTIVO",
        "abreviacion": "II",
        "estado": "ACTIVO",
        "plantilla": "[{\"type\":\"textoh2\",\"key\":\"textoh2\",\"className\":\"ap-text-center\",\"templateOptions\":{\"label\":\"INSTRUCTIVO\"}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"CITE:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"A:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"REF:\",\"disabled\":false,\"required\":true}},{\"type\":\"datepicker\",\"key\":\"inputDatePicker\",\"templateOptions\":{\"label\":\"FECHA:\",\"disabled\":false,\"required\":true}},{\"type\":\"textarea\",\"key\":\"inputTextArea\",\"templateOptions\":{\"label\":\"Contenido:\",\"rows\":6,\"grow\":false,\"required\":true}}]",
        "plantilla_valor": "{\"input-0\":\"AGETIC/UAF/002/2016\",\"input-1\":\"Todo el personal de la AGETIC\",\"input-2\":\"SOLICITUD DE VIATICOS\",\"datepicker-0\":\"2016-12-01T04:00:00.000Z\",\"textarea-0\":\"Se comunica al personal de la Agencia de Gobierno Electrónico y Tecnologías de Información y Comunicación que sea declarado en Comisión de Viaje debe realizar los requerimientos de pasajes y viáticos por separado para facilitar el pago:\\n\\nPara pasajes: Señalar los nombres completos de los pasajeros, la cedula de identidad, el lugar, la fecha de ida y de retorno debidamente justificado. Adjuntar la reserva del pasaje con el precio referencial \\n\\nEjemplo: Soila Ana Vaca Rodríguez, C.I. 9999999 L.P. y Juan Carlos Perico Pericon C.I. 8888888 L.P. viajaran a Tarija el 9/02/2015 y regresaran 10/02/2015 para la instalación de la red en el SIN. \\n\\nPara viáticos: Llenar el formulario correspondiente adjuntando el Memorandum y la certificación presupuestaria . Para el calculo de pago de viatico se considera un importe bruto de Bs. 371.- por día  sujetos a retencion del 13% RC IVA (Excepto el Director General Ejecutivo)\\n\\nEs cuanto informo para fines consiguientes\\n\\n\\nLa Paz, 1 de diciembre de 2016\"}",
        "estado": "ACTIVO",
        "firmado":	"false",
        "impreso":	"NO",
        "anulado":	"false",
        "de":	"null",
        "para":	"null",
        "via":	"null",
        "via_actual":	"null",
        "referencia":	"null",
        "fecha":	"null",
        "observaciones":	"null",
        "documento_padre":	"null",
        "grupo":	6082,
        "firmaron":	"null",
        "firmante_actual":	"null",
        "multiple":	"null"
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-01T19:09:18.329Z",
        "_fecha_modificacion": "2016-12-01T19:34:14.745Z"
      }
    }
*/
  app.get('/api/v1/plantillasFormly/documento/:id', Validar, (req,res) => {
    console.log("Iniciando con la obtencion del documento");
    documento.findOne({
      where:{
        id_documento:req.params.id,
        estado:{$ne:'ELIMINADO'},
      },
    })
    .then(pDocumento => {
      if(pDocumento)
        res.status(200).send(util.formatearMensaje("EXITO","La operación se realizó correctamente.", pDocumento));
      else throw new Error("El documento solicitado no esta disponible.");
    })
    .catch(pError => res.status(412).send(util.formatearMensaje("ERROR",pError)));
  });

  /**
   * Función que realiza el registro de la visita, validando si esta relacionado con el usuario.
   * @param {[type]}   req  [description]
   * @param {[type]}   res  [description]
   * @param {Function} next [description]
   */
  function Validar(req,res, next){
    const usuarioPeticion = req.body.audit_usuario;
    let
    cite = false,
    resultado = null;

    documento.findByPk(req.params.id)
    .then(pDocumento => {
      if(pDocumento){
        resultado= pDocumento;

        if(pDocumento.estado != 'NUEVO'){
          cite = (pDocumento.estado == 'ENVIADO')? false : true;
          return bl.validarPeticionGet(documento, historial_flujo, pDocumento, usuarioPeticion)
          .then(pValido => {
            req.body.relacionado = pValido;
          });
        }
        else if (pDocumento.estado == 'NUEVO') {
          if(pDocumento._usuario_creacion == usuarioPeticion.id_usuario) req.body.relacionado=true;
          else req.body.relacionado=false;
        }
        else req.body.relacionado=false;

      }
      else req.body.relacionado=false;
    })
    .then(() => {
      const
        rmip = req.connection.remoteAddress,
        miIp = rmip.substr(rmip.lastIndexOf(':')+1,rmip.length),
        log = {
          fid_usuario:req.body.audit_usuario.id_usuario,
          fid_documento:req.params.id,
          ip:[miIp],
          relacionado:req.body.relacionado,
          cite,
        };
      blm.registrarVisita(app.src.db.models,log)
      .finally(() => {
        next();
      });
    })
    .catch(pError => {
      logger.error("Error al validar");
      res.status(412).send(util.formatearMensaje("ERROR",pError));
    });
  }

/**
  @apiVersion 1.0.0
  @apiGroup Documento
  @apiName Get documento/?order=&limit=&page=&filter=
  @api {get} /api/v1/plantillasFormly/documento/?order=&limit=&page=&filter= Obtiene la lista paginada de documentos

  @apiDescription Get documento

  @apiParam (Query) {Texto} order Campo por el cual se ordenará el resultado
  @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
  @apiParam (Query) {Integer} page Número de página de resultados
  @apiParam (Query) {Texto} filter Texto a buscar en los registros

  @apiSuccess (Respuesta) {Texto} tipoMensaje Tipo del mensaje de respuesta.
  @apiSuccess (Respuesta) {Texto} mensaje Mensaje de respuesta.
  @apiSuccess (Respuesta) {Objeto} datos Objeto de con los datos de respuesta
  @apiSuccess (Respuesta) {Integer} total Numero de objetos categoria
  @apiSuccess (Respuesta) {Array} resultado Array de objetos categoria


  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
 {
  "tipoMensaje": "EXITO",
  "mensaje": "La operación se realizó correctamente.",
  "datos": {
    "total": 2,
    "resultado": [
      {
        "id_documento": 1,
        "nombre": "INSTRUCTIVO",
        "plantilla": "[{\"type\":\"textoh2\",\"key\":\"textoh2\",\"className\":\"ap-text-center\",\"templateOptions\":{\"label\":\"INSTRUCTIVO\"}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"CITE:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"A:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"REF:\",\"disabled\":false,\"required\":true}},{\"type\":\"datepicker\",\"key\":\"inputDatePicker\",\"templateOptions\":{\"label\":\"FECHA:\",\"disabled\":false,\"required\":true}},{\"type\":\"textarea\",\"key\":\"inputTextArea\",\"templateOptions\":{\"label\":\"Contenido:\",\"rows\":6,\"grow\":false,\"required\":true}}]",
        "plantilla_valor": "{\"input-0\":\"AGETIC/UAF/002/2016\",\"input-1\":\"Todo el personal de la AGETIC\",\"input-2\":\"SOLICITUD DE VIATICOS\",\"datepicker-0\":\"2016-12-01T04:00:00.000Z\",\"textarea-0\":\"Se comunica al personal de la Agencia de Gobierno Electrónico y Tecnologías de Información y Comunicación que sea declarado en Comisión de Viaje debe realizar los requerimientos de pasajes y viáticos por separado para facilitar el pago:\\n\\nPara pasajes: Señalar los nombres completos de los pasajeros, la cedula de identidad, el lugar, la fecha de ida y de retorno debidamente justificado. Adjuntar la reserva del pasaje con el precio referencial \\n\\nEjemplo: Soila Ana Vaca Rodríguez, C.I. 9999999 L.P. y Juan Carlos Perico Pericon C.I. 8888888 L.P. viajaran a Tarija el 9/02/2015 y regresaran 10/02/2015 para la instalación de la red en el SIN. \\n\\nPara viáticos: Llenar el formulario correspondiente adjuntando el Memorandum y la certificación presupuestaria . Para el calculo de pago de viatico se considera un importe bruto de Bs. 371.- por día  sujetos a retencion del 13% RC IVA (Excepto el Director General Ejecutivo)\\n\\nEs cuanto informo para fines consiguientes\\n\\n\\nLa Paz, 1 de diciembre de 2016\"}",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": 1,
        "_fecha_creacion": "2016-12-01T19:09:18.329Z",
        "_fecha_modificacion": "2016-12-01T19:34:14.745Z"
      },
      {
        "id_documento": 2,
        "nombre": "CIRCULAR",
        "plantilla": "[{\"type\":\"textoh1\",\"key\":\"textoh1\",\"className\":\"ap-text-center\",\"templateOptions\":{\"label\":\"CIRCULAR\"}},{\"type\":\"textoh3\",\"key\":\"textoh3\",\"className\":\"ap-text-center\",\"templateOptions\":{\"label\":\"AGETIC/UAF N°083/2016\"}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"DE:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"A:\",\"disabled\":false,\"required\":true}},{\"type\":\"input\",\"key\":\"inputText\",\"templateOptions\":{\"type\":\"text\",\"label\":\"REF:\",\"disabled\":false,\"required\":true}},{\"type\":\"datepicker\",\"key\":\"inputDatePicker\",\"templateOptions\":{\"label\":\"FECHA:\",\"disabled\":false,\"required\":true}},{\"type\":\"parrafo\",\"key\":\"textParrafo\",\"className\":\"ap-text-justify\",\"templateOptions\":{\"label\":\"Dando cumplimiento a lo establecido en el Decreto Supremo N° 21531 de fecha 29 de junio de 1995 y la reglamentación relativa al Régimen Complementario al Impuesto al Valor Agregado (RC-IVA), así como la remisión del formulario 110 RC-IVA dependientes, todos los servidores públicos deben tomar en cuenta:\"}},{\"type\":\"parrafo\",\"key\":\"textParrafo\",\"className\":\"ap-text-justify\",\"templateOptions\":{\"label\":\"1. El formulario RC-IVA 110 debidamente llenado tanto para el pago de sueldos como para refrigerios deben ser presentados desde el 01 hasta el día 15 de cada mes o el siguiente día hábil en caso de ser fin de semana o feriado. \\n2. La elaboración de los formularios debe realizarse en el programa Facilito, el cual está instalado en todos los computadores.\"}},{\"type\":\"parrafo\",\"key\":\"textParrafo\",\"className\":\"ap-text-justify\",\"templateOptions\":{\"label\":\"La Unidad Administrativa Financiera mediante Recursos Humanos se pone a disposición de todos los funcionarios que tengan dudad o requieran mayor información a la presente circular.\"}},{\"type\":\"parrafo\",\"key\":\"textParrafo\",\"className\":\"ap-text-left\",\"templateOptions\":{\"label\":\"Atentamente,\"}}]",
        "plantilla_valor": "{\"datepicker-0\":\"2016-12-01T04:00:00.000Z\",\"input-0\":\"Carmen Fedra Valverde\",\"input-1\":\"Todo el personal de planta de la Agencia de Gobierno Electronico y Tecnologías de Información y Comunicación\",\"input-2\":\"FORMULARIOS RC-IVA\"}",
        "estado": "ACTIVO",
        "_usuario_creacion": 1,
        "_usuario_modificacion": null,
        "_fecha_creacion": "2016-12-01T19:36:18.489Z",
        "_fecha_modificacion": "2016-12-01T19:36:18.489Z"
      }
    ]
  }
}

*/
  app.get('/api/v1/plantillasFormly/documento', sequelizeHandlers.query(documento));

  function filtros (req,res,next){
      if(req.query.filter!='')
        util.consulta(req,res,next,documento)
      else next();
  }

  /**
  @apiVersion 2.0.0
  @apiGroup Plantillas_Formly
  @apiName Post plantillasFormly/documentoPDF
  @api {post} /api/v1/plantillasFormly/documentoPDF Generar el documento PDF en base a una plantillas_formly

  @apiDescription Post del plantillasFormly/documentoPDF para generar el documento en formato PDF en base a una plantilla

  @apiParam (Petición) {Texto} cite Nombre del documento PDF

  @apiParamExample {json} Ejemplo para enviar:
  {
  	"cite":"plantilla_test.pdf"
  }

  @apiSuccess (Respuesta) {Base64} Archivo pdf en Base64

  @apiSuccessExample {Base64} Respuesta del Ejemplo:
  HTTP/1.1 200 OK

  JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKP7/....

  @apiSampleRequest off
*/

  app.post('/api/v1/plantillasFormly/documentoPDF', (req, res) => {
    let dirArch = '.';
    if(req.body.cite && req.body.cite.indexOf(dirExternos.replace('./', '/'))==0)
      dirArch += req.body.cite
    else if(req.body.cite && req.body.cite.indexOf(dirExternosAprobacion.replace('./', '/'))==0)
      dirArch += req.body.cite
    else dirArch = `${dirDocumento}${req.body.cite}`;
    const nombre= req.body.cite.substr(0,req.body.cite.indexOf('.pdf'));
    const usuarioPeticion = req.body.audit_usuario;
    const msg = "Usted no esta autorizado para ver este documento.";

    fs.readFile(dirArch, (pError, pData) => {

      if(pError){
        pError=(process.env.NODE_ENV=='production')?"No se pudo obtener el documento":pError;
        res.status(412).send(util.formatearMensaje("ERROR",pError));
      }
      else res.send(pData);
    });
  })

  app.post('/api/v1/plantillasFormly/multiple', (req, res) => {
    console.log('Iniciando la busqueda de documentos multiples', req.body.cite);
    if (!req.body.cite || req.body.cite == "") {
      return res.status(412).send(util.formatearMensaje("ERROR", 'El número de cite no es válido.'));
    }
    modelos.documento.findOne({
      attributes: ['id_documento', 'nombre', 'multiple'],
      where:{
        nombre: req.body.cite,
        estado: {
          $notIn: ['ELIMINADO', 'ENVIADO'],
        },
      },
    })
    .then(respDocumento => {
      if(!respDocumento)  throw Error('No existe el documento solicitado.');
      return modelos.documento.findAll({
        attributes:['nombre'],
        where: {
          multiple: respDocumento.dataValues.multiple,
        },
      });
    })
    .then(respDocumentos => {
      return archivo.obtenerBufferLista(dirDocumento, respDocumentos);
    })
    .then(respBuffer => {
      res.send(respBuffer);
    })
    .catch(error => {
      logger.error('Error en la busqueda del documento', error);
      return res.status(412).send(util.formatearMensaje("ERROR", error));
    });
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Documento
  @apiName Get plantillasFormly/documento/:id/misdocumentos/?order=&limit=&page=&filter=&fields=
  @api {get} /api/v1/plantillasFormly/documento/:id/misdocumentos/?order=&limit=&page=&filter=&fields= Obtiene lista de los documentos del usuario actual

  @apiDescription Get plantillasFormly/documento/:id/misdocumentos/?order=&limit=&page=&filter=&fields=, obtiene lista de los documentos del usuario actual de acuerdo a las especificaciones de orden, límite, paginación, filtros y campos

  @apiParam (Parámetro) {Integer} id Identificador del usuario actual

  @apiParam (Query) {Texto} order Campo por el cual se ordenará el resultado
  @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
  @apiParam (Query) {Integer} page Número de página de resultados
  @apiParam (Query) {Texto} filter Texto a buscar en los registros
  @apiParam (Query) {Texto} fields Campos de la búsqueda a mostrar

  @apiSuccess (Respuesta) {Integer} total Número de documentos encontrados
  @apiSuccess (Respuesta) {Texto} resultado Array de documentos encontrados

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La busqueda fue exitosa",
    "datos": {
      "total": 1,
      "resultado": [
        {
          "id_documento":	62,
          "nombre":	"Instructivo - Juan Perez",
          "nombre_plantilla":	"Instructivo",
          "fecha":	null,
          "estado":	"NUEVO",
          "impreso":	"NO",
          "_fecha_creacion":	"2020-01-08T22:21:14.857Z",
          "_fecha_modificacion":	"2020"-01-08T22:31:14.764Z,
          "_usuario_creacion":	3
        }
      ]
    }
  }
*/

  app.get('/api/v1/plantillasFormly/documento/:id/misdocumentos',  filtros, (req, res) => {
    if (req.params.id != req.body.audit_usuario.id_usuario) {
      return res.status(412).send(util.formatearMensaje("ERROR", 'Usted no tiene la autorización.'));
    }
    const documentos=[];
    const estFlujo = [];
    const estDoc = [];
    const xdocs = {};
    const estVal = {
      'nuevo': 'NUEVO',
      'envia': 'ENVIADO',
      // 'cerra': 'APROBADO',
      'cerra': 'CERRADO',
      'deriv': 'DERIVADO',
      //-------flujo-----
      'aprobe': 'CERRADO',
      'aprobe': 'APROBADO',
      'aprobe': 'APROBADO_CD',
      'rechace': 'RECHAZADO',
      'derive': 'DERIVADO',
      'respondi': 'CREADO',
    };
    
    const estKeyFlujo = {
      //-------flujo-----
      'APROBADO': 'APROBE',
      'APROBADO_CD': 'APROBE',
      'RECHAZADO': 'RECHACE',
      'DERIVADO': 'DERIVE',
      'CREADO': 'RESPONDI',
      'CERRADO': 'APROBE',
      'FIRMO': 'FIRMÉ',
    };

    if(req.query.estado){
      req.query.estado.split(',').forEach(it => {
        if(['nuevo','envia','recha','cerra','deriv'].indexOf(it)!=-1) estDoc.push(estVal[it]);
        else estFlujo.push(estVal[it]);
      });
    }
    const opcionesFlujo = {
      attributes:['id_documento', 'accion'],
      where: { _usuario_creacion: req.body.audit_usuario.id_usuario },
      order: [['_fecha_creacion']],
    };
    if(req.query.estado)
      opcionesFlujo.where.accion = { $in: estFlujo};

    historial_flujo.findAll(opcionesFlujo)
    .then(pRespuesta => {
      if(pRespuesta){
        pRespuesta.forEach((pItem) => {
          documentos.push(pItem.dataValues.id_documento);
          xdocs[pItem.dataValues.id_documento]=pItem;
        });
      }
      const opcionesDocumento={};
      opcionesDocumento.where={
        $or: [
          { _usuario_creacion:req.params.id },
          { id_documento:{ $in:documentos }},
        ],
        estado:{$notIn: ['ELIMINADO','RECHAZADO']},
      };

      if(req.query.filter!=='' && req.xfilter){
        opcionesDocumento.where.$or[0].$or = req.xfilter;
        opcionesDocumento.where.$or[1].$or = req.xfilter;
      }


      if(req.query.fields){
        opcionesDocumento.attributes=req.query.fields.split(',');
        opcionesDocumento.attributes.push('_usuario_creacion');
      }
      if(req.query.estado)
        opcionesDocumento.where.$or[0].estado={$in:estDoc};
      if(req.query.limit)
        opcionesDocumento.limit=req.query.limit;
      if(req.query.page)
        opcionesDocumento.offset=(req.query.limit * ((req.query.page || 1) - 1)) || 0;
      let order;
      if(req.query.order){
        order = (req.query.order.charAt(0)=='-')? 'DESC': 'ASC';
        req.query.order = (req.query.order.charAt(0)=='-')? req.query.order.substring(1,req.query.order.length) : req.query.order;
        opcionesDocumento.order = [[req.query.order, order]];
      }
      return documento.findAndCountAll(opcionesDocumento);

    })
    .then(pRespuesta => {
      if(xdocs){
        pRespuesta.rows.forEach( d => {
          if(d._usuario_creacion != req.params.id){
            d.estado = estKeyFlujo[xdocs[d.id_documento].accion];
          }
          delete d._usuario_creacion;
        });
      }
      res.send(util.formatearMensaje("EXITO", "La busqueda fue exitosa", {total:pRespuesta.count,resultado:pRespuesta.rows}));
    })
    .catch(pError => {
      res.status(412).send(util.formatearMensaje("ERROR", pError));
    });
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get plantillasFormly/documento/:id/todo
    @api {get} /api/v1/plantillasFormly/documento/:id/todo/?order=&limit=&page=&filter=& Obtiene lista de los documentos pendientes del usuario actual

    @apiDescription Get plantillasFormly/documento/:id/todo/?order=&limit=&page=&filter=&, obtiene lista de los documentos pendientes del usuario actual de acuerdo a las especificaciones de orden, límite, paginación, filtros y campos

    @apiParam (Parámetro) {Integer} id Identificador del usuario actual

    @apiParam (Query) {Texto} order Campo por el cual se ordenará el resultado
    @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
    @apiParam (Query) {Integer} page Número de página de resultados
    @apiParam (Query) {Texto} filter Texto a buscar en los registros

    @apiSuccess (Respuesta) {Integer} total Número de documentos encontrados
    @apiSuccess (Respuesta) {Texto} resultado Array de documentos encontrados

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La busqueda fue exitosa",
      "datos": {
        "total": 5,
        "resultado": [
          {
            "id_documento":	62,
            "nombre":	"Instructivo - Juan Perez",
            "nombre_plantilla":	"Instructivo",
            "fecha":	null,
            "estado":	"ENVIADO",
            "_fecha_creacion":	"2020-01-08T22:21:14.857Z",
            "_fecha_modificacion":	"2020"-01-08T22:31:14.764Z
          },
          ...
        ]
      }
    }
  */
  
  app.get('/api/v1/plantillasFormly/documento/:id/todo', filtros,(req, res) => {
    const estDoc = ['envia', 'recha', 'deriv'];
    const idUsuario = req.body.audit_usuario.id_usuario;
    let condiciones = {};
    let opcionesDocumento ={};
    opcionesDocumento.where= {
      via_actual: idUsuario,
      estado:{
        $eq: 'DERIVADO',
        $ne: 'ELIMINADO',
      },
    };
    opcionesDocumento.attributes = ['id_documento'];
    opcionesDocumento.raw=true;
    if(req.query.filter!=='' && req.xfilter) opcionesDocumento.where[Op.and] = { [Op.or]:req.xfilter };
    documento.findAll(opcionesDocumento)
    .then( pRespuesta => {
      const promesas=[];
      pRespuesta.forEach( d => {
        promesas.push(new Promise((resolve, reject) => {
          documento.findOne({ attributes: ['fecha'], where:{ documento_padre: d.id_documento }, raw:true})
          .then( pResp => {
            resolve( pResp==null? d.id_documento : ( (pResp && pResp.fecha===null)? d.id_documento: 0));
          });
        }));
      })
      return Promise.all(promesas)
    })
    .then( pRespuesta => {
      opcionesDocumento={};
      opcionesDocumento.where={
        $or: [],
        estado:{$ne: 'ELIMINADO'},
      };
      
      condiciones = {
        'envia': { via_actual: idUsuario, estado:'ENVIADO' },
        'recha': { _usuario_creacion: idUsuario, estado:'RECHAZADO' },
        'deriv': { id_documento:{$in:pRespuesta || []} },
      };

      if(req.query.filter!=='' && req.xfilter) opcionesDocumento.where.$and = { $or:req.xfilter };
      if(req.query.fields) opcionesDocumento.attributes=req.query.fields.split(',');
      if(req.query.limit) opcionesDocumento.limit=req.query.limit;
      if(req.query.page) opcionesDocumento.offset=(req.query.limit * ((req.query.page || 1) - 1)) || 0;

      if(req.query.estado){
        req.query.estado.split(',').forEach(it => {
          if (condiciones[it]) opcionesDocumento.where.$or.push(condiciones[it]);
        });
      } else {
        estDoc.forEach(it => {
          if (condiciones[it]) opcionesDocumento.where.$or.push(condiciones[it]);
        });
      }
      let order;
      if(req.query.order){
        order = (req.query.order.charAt(0)=='-')? 'DESC': 'ASC';
        req.query.order = (req.query.order.charAt(0)=='-')? req.query.order.substring(1,req.query.order.length) : req.query.order;
        opcionesDocumento.order = [[req.query.order, order]];
      }
      return documento.findAndCountAll(opcionesDocumento)
    })
    .then(pRespuesta => {
      res.send(util.formatearMensaje("EXITO", "La busqueda fue exitosa", {total:pRespuesta.count,resultado:pRespuesta.rows}))
    })
    .catch(pError => {
      logger.error('Error en la búsqueda de documentos'.red);
      res.status(412).send(util.formatearMensaje("ERROR", pError));
    })
  });

  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Get plantillasFormly/documento/:id/encurso
    @api {get} /api/v1/plantillasFormly/documento/:id/encurso?order=&limit=&page=&filter=&fields= Obtiene lista de los documentos en curso del usuario actual
    @apiDescription Get plantillasFormly/documento/:id/encurso?order=&limit=&page=&filter=&fields=, obtiene lista de los documentos en curso del usuario actual de acuerdo a las especificaciones de orden, límite, paginación, filtros y campos

    @apiParam (Parámetro) {Integer} id Identificador del usuario actual

    @apiParam (Query) {Texto} order Campo por el cual se ordenará el resultado
    @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
    @apiParam (Query) {Integer} page Número de página de resultados
    @apiParam (Query) {Texto} filter Parámetros a buscar en los registros
    @apiParam (Query) {Texto} fields Campos que se mostrarán en el resultado

    @apiSuccess (Respuesta) {Integer} total Número de documentos encontrados
    @apiSuccess (Respuesta) {Texto} resultado Array de documentos encontrados

    @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La busqueda fue exitosa",
      "datos": {
        "total": 2,
        "resultado": [
          {
            "id_documento":	62,
            "nombre":	"Instructivo - Juan Perez",
            "nombre_plantilla":	"Instructivo",
            "fecha":	<fecha_y_hora>,
            "estado":	"DERIVADO",
            "_fecha_creacion":	"2020-01-08T22:21:14.857Z",
            "_fecha_modificacion":	"2020"-01-08T22:31:14.764Z
          },
          ...
        ]
      }
    }
  */

  app.get('/api/v1/plantillasFormly/documento/:id/encurso', filtros,(req, res) => {
    const opcionesDocumento = {};
    const idUsuario = req.body.audit_usuario.id_usuario;

    opcionesDocumento.where = { $or: [
        { via:{ $like:{ $any:[`%${idUsuario},%`,`%${idUsuario}]`] }} },
        { para:`[${idUsuario}]` },
    ]};
    opcionesDocumento.where.$or[0].estado = { $notIn:['ELIMINADO', 'CERRADO'] };
    opcionesDocumento.where.$or[1].estado = { $notIn:['ELIMINADO', 'CERRADO'] };
    opcionesDocumento.where.$or[0].grupo = { $not:null };
    opcionesDocumento.where.$or[1].grupo = { $not:null };
    opcionesDocumento.attributes = ['grupo'];

    let xdocs;
    documento.findAll(opcionesDocumento)
    .then(resp => {
      xdocs = [];
      resp.forEach( (it) => { xdocs.push(it.dataValues.grupo); })
      return documento.findAll({
        attributes: ['grupo', [sequelize.fn('COUNT', sequelize.col('grupo')), 'cant']],
        where: {
            grupo: { $in:xdocs },
        },
        group:['grupo'],
      })
    })
    .then( resp => {
      xdocs = [];
      resp.forEach( (it) => { if(it.dataValues.cant!=1){ xdocs.push(it.dataValues.grupo); }})

      if(req.query.filter!=='' && req.xfilter)opcionesDocumento.where.$or = req.xfilter;
      if(req.query.fields) opcionesDocumento.attributes=req.query.fields.split(',');
      if(req.query.limit) opcionesDocumento.limit=req.query.limit;
      if(req.query.page) opcionesDocumento.offset=(req.query.limit * ((req.query.page || 1) - 1)) || 0;
      if(req.query.order){
        const order = (req.query.order.charAt(0)=='-')? 'DESC': 'ASC';
        req.query.order = (req.query.order.charAt(0)=='-')? req.query.order.substring(1,req.query.order.length) : req.query.order;
        opcionesDocumento.order = [[req.query.order, order]];
      }
      opcionesDocumento.where.$or[0].grupo = { $in: xdocs };
      opcionesDocumento.where.$or[1].grupo = { $in: xdocs };
      return documento.findAndCountAll(opcionesDocumento)
    })
    .then( resp => {
        res.send(util.formatearMensaje("EXITO", "La busqueda fue exitosa", {total:resp.count,resultado:resp.rows}))
    })
    .catch(pError => {
      res.status(412).send(util.formatearMensaje("ERROR", pError));
    })
  });

  /**
  @apiVersion 2.0.0
  @apiGroup Documento
  @apiName Get plantillasFormly/documento/:id/info
  @api {get} /api/v1/plantillasFormly/documento/:id/info Obtiene la información rápida del documento

  @apiDescription Get plantillasFormly/documento/:id/info, obtiene la información rápida del documento, tipo resumen

  @apiParam (Parámetro) {Integer} id Identificador del documento

  @apiSuccess (Respuesta) {Texto} datos Texto con la información abreviada del documento

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La busqueda fue exitosa",
    "datos": "Desclasificado<br/>Dirigido a<br/>INSTRUCTIVO DE PRUEBA<br/>Contenido del instructivo"
  }
*/

  app.get('/api/v1/plantillasFormly/documento/:id/info', (req, res) => {
    documento.findOne({
      where:{
        id_documento:req.params.id,
        estado:{$ne:'ELIMINADO'},
      },
    })
    .then(pDoc => {
      // Si existe el documento.
      if(pDoc){
        // Parsea a objeto los valores del documento.
        const v = JSON.parse(pDoc.plantilla_valor);
        // informacion a retornar.
        let inf=null;
        // contador de valores a obtener.
        let c=0;
        // Campos valor a excluir.
        const a= ['ccArchivo-0'];

        // Itera los valores.
        for (const k in v) {

          // Si el contador es menor a 6.
          if(c<6){
            // Si el valor en iteracion no esta en la lista de excluidos.
            if(a.indexOf(k) == -1 ){
              // Si el valor es de tipo datosGenerales.
              if(k.indexOf('datosGenerales')>-1){
                // Busca la referencia o asunto e incrementa el contador.
                if(v[k].ref){
                  inf = `${(inf==null)?'':inf}${(inf==null)?'':'<br/>'}${v[k].ref}`;
                  c++;
                }
              }
              // Si el valor es de tipo editor de texto.
              else if(k.indexOf('editorTexto') > -1){}
              // Si el valor es de tipo checkbox.
              else if(k.indexOf('checkbox') > -1){}
              // Si el valor es de tipo datepicker.
              else if(k.indexOf('datepicker') > -1){
                // Genera la fecha actual.
                const fecha=moment(v[k]).format("DD/MM/YYYY");
                // Agrega la informacion.
                inf = `${(inf==null)?'':inf}${(inf==null)?'':'<br/>'}${fecha}`
              }
              // Si el valor es de otro tipo.
              else{
                if(typeof v[k] == 'string'){
                  /// Agrega la informacion, actualiza el contador.
                  inf = `${(inf==null)?'':inf}${(inf==null)?'':'<br/>'}${v[k]}`
                  c++;
                }
              }
            }
          }
        }
        // Si la variable inf no ha sido modificado.
        if(inf !== null){
          // Si la longitud del valor es mayor a 250 caracteres.
          if(inf.length>250) inf = `${inf.substring(0,250)} .....`;
        } else {
          inf ='Sin información.'
        }
        // Reemplaza todos los saltos de linea.
        inf = inf.replace(/\n/g, "<br/>");
        // Retorna la informacion.
        return inf;
      }
      // Si el documento no existe
      else throw new Error("El documento solicitado, no esta disponible.")
    })
    .then(pDoc =>
      res.send(util.formatearMensaje("EXITO", "La busqueda fue exitosa", pDoc))
    )
    .catch(pError => {
      logger.error("Error al buscar el documento");
      return res.status(412).send(util.formatearMensaje("ERROR", pError));
    })
  })
/**
  @apiVersion 1.0.0
  @apiGroup Documento
  @apiName Delete documento
  @api {delete} /api/v1/plantillasFormly/documento/:id Elimina un/a documento

  @apiDescription Delete documento

  @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere eliminar

  @apiSuccessExample {json} Respuesta:
      HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La eliminación fue exitosa."
    }
*/
  app.delete('/api/v1/plantillasFormly/documento/:idUs/misdocumentos/:id', (req, res) => {

    if( req.params.idUs == req.body.audit_usuario.id_usuario ){

      documento.findOne({
        where:{_usuario_creacion:req.params.id},
      })
      bl.eliminarDocumento(req.params.idUs, req.params.id, documento, historial_flujo)
      .then(() => res.send(util.formatearMensaje("EXITO", "La eliminación fue exitosa.")))
      .catch(pError => res.status(412).send(util.formatearMensaje("ERROR", pError)))
    } else {
      res.status(412).send(util.formatearMensaje("ERROR", "Usted no tiene la autorizacion."))
    }
  });

/**
    @apiVersion 1.0.0
    @apiGroup Documento
    @apiName Delete documento
    @api {delete} /api/v1/plantillasFormly/documento/:idUs/todo/:id Elimina un/a documento

    @apiDescription Delete documento

    @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere eliminar

    @apiSuccessExample {json} Respuesta:
        HTTP/1.1 200 OK
      {

      }
  */
  app.delete('/api/v1/plantillasFormly/documento/:idUs/todo/:id', (req, res) => {

    if( req.params.idUs == req.body.audit_usuario.id_usuario ){

      documento.findOne({
        where:{_usuario_creacion:req.params.id},
      })
      bl.eliminarDocumento(req.params.idUs, req.params.id, documento, historial_flujo)
      .then(() => res.send(util.formatearMensaje("EXITO", "La eliminación fue exitosa.")))
      .catch(pError => res.status(412).send(util.formatearMensaje("ERROR", pError)))
    } else {
      res.status(412).send(util.formatearMensaje("ERROR", "Usted no tiene la autorizacion."))
    }
  });

/**
  @apiVersion 2.0.0
  @apiGroup Documento
  @apiName Put documento
  @api {put} /api/v1/plantillasFormly/documento/:id Actualiza un/a documento

  @apiDescription Put documento

  @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere actualizar

  @apiParam (Petición) {Texto} nombre Nombre del documento
  @apiParam (Petición) {Texto} nombre_plantilla Nombre de la planilla usada para el documento
  @apiParam (Petición) {Texto} abreviacion Sigla o abreviación del documento
  @apiParam (Petición) {Texto} sw Propiedades del documento
  @apiParam (Petición) {Texto} plantilla Plantilla del documento
  @apiParam (Petición) {Texto} plantilla_valor Valores de la plantilla
  @apiParam (Petición) {Integer} _usuario_modificacion Identificador del usuario que esta modificando

  @apiParamExample {json} Ejemplo para enviar:
  {
    "nombre": "INSTRUCTIVO",
    "nombre_plantilla": "INSTRUCTIVO",
    "abreviacion": "II",
    "plantilla": "[]",
    "plantilla_valor": "{}",
    "sw": "{"enviado": false, "enviar": false, "es_respuesta": false}",
    "_usuario_modificacion": 1
  }

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La operación se realizó correctamente.",
    }

  @apiSampleRequest off 
*/
  app.put('/api/v1/plantillasFormly/documento/:id', (req, res) => {
    let xdoc;
    const msg = "La operación se realizó correctamente.";
    const sw = req.body.sw || {};
    sw.xenviar = !sw.enviado && sw.enviar || false;
    let flag= false;

    sequelize.transaction().then(t => {

      const tr = { transaction: t };

      // Verifica la existencia de archivos externos, si existen los crea fisicamente en el servidor.
      bl.verificarExternos(req.body)
      .then(pValores => {

        // Si existe la respuesta actualiza plantilla_valor.
        if(pValores) req.body.plantilla_valor=pValores;
        return documento.findByPk(req.params.id)
        .then( resp => {
          xdoc = resp;

          if(xdoc.estado == 'NUEVO' || xdoc.estado == 'RECHAZADO'){
            if(xdoc._usuario_creacion == req.body.audit_usuario.id_usuario)
              return xdoc.update(req.body, tr);
            else
              throw new Error("Usted no tiene la autorizacion");
          }
          else if(xdoc.estado == 'CERRADO' || xdoc.estado == 'DERIVADO'){

            let flagB=false;
            const roles = req.body.audit_usuario.roles;
            for(let i = 0; i<roles.length; i++){
              const rol = roles[i].rol.nombre
              if(rol=='SECRETARIA'){
                flagB = true;
                break;
              }
            }
            if(flagB) return xdoc.update(req.body, tr);
            else throw new Error("La modificacion no esta disponible en este momento.");
          }
          else throw new Error("La modificacion no esta disponible en este momento.");


        })
        .then((resp) => {
          return bl.verificarParticipantesDocumento(req.body);
        })
        // eslint-disable-next-line arrow-body-style
        .then( resp => {
          console.log('Validacion de participantes del documento', resp)
          if(resp.existeParticipantesRepetidos) {
            throw new Error('Por favor, verifique que no se tenga usuarios repetidos en los destinatarios DE, VÍA o PARA');
          }
          return bl.actualizarDocumentosAprobacionCD(req.body, req.params.id, req.body.audit_usuario.id_usuario, modelos, tr);
        })
        .then( resp => {
          if (sw.xenviar){
            return bl.verificarPartidas(partida, JSON.parse(req.body.plantilla_valor));
          }
          return
        })
        .then( resp => {
          if(sw.xenviar && sw.es_respuesta){
            return bl.documento_crear(historial_flujo, xdoc.documento_padre, xdoc._usuario_modificacion, tr)
          }
          return;
        })
        .then( resp => {
          if(sw.xenviar){
            return bl.documento_enviar(historial_flujo, xdoc, tr, director)
            .then((temp) => {
              flag = true;
              return t.commit();
            })
            .finally(() =>  notificar.enviar(modelos, xdoc,'enviado',{}));
          }
          return resp;
        })
      })
      .then( resp => {
        if(!flag) return t.commit();
      })
      .then( resp => res.send(util.formatearMensaje("EXITO", msg)))
      .catch(e => {
        console.log('Revisando el error en la modificacion del documento', e);
        t.rollback();
        res.status(412).send(util.formatearMensaje("ERROR", e));
      })
    })

  });

  // Servicio rest de envio de documento para su aprobacion
  /**
    @apiVersion 2.0.0
    @apiGroup Documento
    @apiName Put documento para aprobacion
    @api {put} /api/v1/plantillasFormly/documento/:id/aprobar Aprobacion de un documento pendiente

    @apiDescription Put documento

    @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere aprobar

    @apiParam (Petición) {Integer} usuario Identificador del usuario que aprueba.
    @apiParam (Petición) {Boolean} derivar Parámetro que define que no es derivación.
    @apiParam (Petición) {Integer} usuario_derivar Identificador del usuario al que se deriva. Solo si derivar es true.
    @apiParam (Petición) {Texto} observaciones Parámetro que define que no es derivación. Solo si derivar es true.

    @apiParamExample {json} Ejemplo para Aprobar y cerrar:
    {
      "usuario":1,
      "derivar": false
    }

    @apiParamExample {json} Ejemplo para Aprobar y derivar:
    {
      "usuario":1,
      "derivar": true,
      "observaciones":	"Favor elaborar el informe",
      "usuario_derivar":	7
    }

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
    {
      "tipoMensaje" : EXITO,
      "mensaje" : El documento se aprobó correctamente,
      "datos": {}
    }
    @apiSampleRequest off
  */
  app.put('/api/v1/plantillasFormly/documento/:id/aprobar',  (req, res) => {
    let documentoBase = null;
    let esMultiple = false;
    const idDocumento = req.params.id;
    const usuarioModificacion = req.body.audit_usuario.id_usuario;
    console.log(`Iniciando la aprobacionn del documento---- usuarioModificacion`, usuarioModificacion);
    console.log(`Iniciando la aprobacionn del documento---- idDocumento`, idDocumento);

    sequelize.transaction().then(t => {
      const tr = { transaction: t };

      return modelos.documento.findByPk(idDocumento)
        .then(docResp => {
          console.log('Revisando la obtencion del documento base para aprobar', tr);
          console.log('\n***Documento sin procesar :: ', docResp);
          if (docResp.estado !== 'ENVIADO') throw Error("Este documento no puede ser modificado.");
          if (docResp.via_actual !== usuarioModificacion) throw Error('Usted no esta autorizado para la accion solicitada.');
          documentoBase = docResp;
          const para = JSON.parse(documentoBase.para)[0];
          const viaActual = documentoBase.via_actual;
          const aprobarPara = (viaActual == para);
          const datosAprobacion = {
            derivar: req.body.derivar || false,
            observaciones: req.body.observaciones || '',
            director,
            usuarioModificacion,
            idDocumento,
            viaActual,
            auditUsuario: req.body.audit_usuario,
            usuarioDerivar: req.body.usuario_derivar,
          };
          if (docResp.multiple && docResp.multiple !== null) {
            esMultiple = true;
          }

          if (aprobarPara && esMultiple === false) {
            return bl.aprobarPara(modelos, documentoBase, datosAprobacion, req, tr);
          } else if (aprobarPara && esMultiple === true) {
            return bl.aprobarParaMultiple(modelos, documentoBase, datosAprobacion, req, tr);
          } else {
            return bl.aprobarVia(modelos, documentoBase, datosAprobacion, tr);
          }
        })
        .then((respuesta) => {
          return modelos.documento.findByPk(idDocumento, tr)
        })
        .then((respuesta) => {
          if (respuesta.estado === "DERIVADO") {
            return notificar.enviar(modelos, respuesta, "derivado", {});
          } else {
            if (!respuesta.aprobador_cd_actual) {
              return notificar.enviar(modelos, respuesta, "enviado", {});
            }
          }
        })
        .then(() => {
          return t.commit();
        })
      .then(() => res.send(util.formatearMensaje("EXITO", "El documento fue aprobado correctamente", {})))
        .catch(error => {
          logger.error('<<<<++++>>>> Error en la aprobacion del documento', error);
          t.rollback();
          res.status(412).send(util.formatearMensaje("ERROR", error));
        });
      })

  });

  /**
    @apiVersion 1.0.0
    @apiGroup Documento
    @apiName Put documento/:id/derivar
    @api {put} /api/v1/plantillasFormly/documento/:id/derivar Deriva un documento 

    @apiDescription Put para plantillasFormly/documento/:id/derivar Deriva un documento, realizando las actualizaciones necesarias

    @apiParam (Parámetro) {Integer} id Identificador del documento a derivar

    @apiParam (Petición) {Integer} usuario Identificador del usuario actual
    @apiParam (Petición) {Integer} destino Identificador del usuario destino
    @apiParam (Petición) {Texto} obsrvaciones Texto con el que se hace la dervación (Proveído)

    @apiParamExample {json} Ejemplo para enviar:
    {
      "usuario":12,
      "destino":11,
      "observaciones":"derivando a ..."
    }

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
    {
      "tipoMensaje":"EXITO",
      "mensaje":"El documento se derivó"
    }

    @apiSampleRequest off

  */

  app.put('/api/v1/plantillasFormly/documento/:id/derivar',  (req, res) => {
    const idDocumento = req.params.id;
    const usuarioModificacion = req.body.audit_usuario.id_usuario;
    // const usuarioModificacion = req.body.usuario;
    const destino = req.body.destino;

    const datos={
      via_actual: destino,
      observaciones:req.body.observaciones,
      estado : 'DERIVADO',
      _usuario_modificacion: usuarioModificacion,
    }
    let doc = null;
    documento
      .findByPk(idDocumento)
      .then((pDoc) => {
        doc = pDoc;
        if (doc.via_actual !== usuarioModificacion)
          throw new Error(
            "Usted no esta autorizado para la accion solicitada."
          );
        if (doc.estado !== "DERIVADO")
          throw new Error("El documento no puede ser modificado.");
        return documento.findOne({
          where: { documento_padre: doc.id_documento },
        });
      })
      .then((resultado) => {
        if (resultado == null)
          return bl.actualizarDocumento(doc, datos, historial_flujo);
        else
          throw new Error(
            "El documento no se puede derivar, porque ya creó una respuesta."
          );
      })
      .then((resultado) => {
        notificar.enviar(modelos, doc, "derivado", {});
        return true;
      })
      .then((resultado) => {
        res.send(
          util.formatearMensaje("EXITO", "El documento se derivó", resultado)
        );
      })
      .catch((error) => {
        logger.error("Error en la derivacion", error);
        res.status(412).send(util.formatearMensaje("ERROR", error));
      });
  });

  //Servicio rest para rechazar documento
  /**
    @apiVersion 1.0.0
    @apiGroup Documento
    @apiName Put rechazar documento
    @api {put} /api/v1/plantillasFormly/documento/:id/rechazar Observación de un documento pendiente

    @apiDescription Put documento , Rechaza un documento con una observación, para que el emisor lo corrija

    @apiParam (Parámetro) {Integer} id Identificador de documento que se quiere rechazar

    @apiParam (Petición) {Integer} usuario Identificador del usuario que rechaza
    @apiParam (Petición) {Texto} observaciones Observaciones al documento
    @apiParam (Petición) {Texto} observado_por Información de quien rechaza el documento

    @apiParamExample {json} Ejemplo para enviar:
    {
      "usuario" : 1,
      "observaciones" : "Este informe no contiene informacion alguna",
      "observado_por" : "AGETIC AGETIC"
    }

    @apiSuccessExample {json} Respuesta del Ejemplo:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "El documento fue observado correctamente"
    }
    @apiSampleRequest off
  */

  app.put('/api/v1/plantillasFormly/documento/:id/rechazar',  (req, res) => {
    const idDocumento = req.params.id;
    const usuarioModificacion = req.body.audit_usuario.id_usuario;
    // const usuarioModificacion = req.body.usuario;
    const observaciones = req.body.observaciones;
    const observadoPor = req.body.observado_por;
    let usuarioNotificar = null;
    let doc=null;
    sequelize.transaction().then(t => {
      const tr = { transaction: t };
      documento.findByPk(idDocumento).then(doc => {

        if(usuarioModificacion !== doc.via_actual) throw new Error("Usted no cuenta con la autorizacion");
        if(doc.estado!=='ENVIADO') throw new Error("El documento no puede ser modificado");

          return doc.update({
          estado : 'RECHAZADO',
          observaciones : `Observado por: ${observadoPor} - Observaciones: ${observaciones}`,
          aprobaron_de : [],
          _usuario_modificacion: usuarioModificacion,
        },
        {where: {id_documento: idDocumento}, transaction: t})
      })
      .then(docum => {
        doc=docum.dataValues;
        usuarioNotificar=docum.dataValues._usuario_creacion;
        return historial_flujo.create({
            id_documento:docum.id_documento,
            accion: 'RECHAZADO',
            observacion: docum.observaciones,
            estado: 'ACTIVO',
            _usuario_creacion: usuarioModificacion,
        },tr)
      })
      .then(() =>
        notificar.enviar(modelos, doc,'observado',{})
        .then(pRespuesta => {
          console.log("Notificacion enviada");
          return
        })
      )
      .then(() => t.commit())
      .then(() =>
        res.send(util.formatearMensaje("EXITO", "El documento fue observado correctamente"))) 
      .catch(error => {
        t.rollback();
        res.status(412).send(util.formatearMensaje("ERROR", error));
      });
    });
  });

/**
  @apiVersion 1.0.0
  @apiGroup Documento
  @apiName Options documento
  @api {options} /api/v1/plantillasFormly/documento Extrae formly de documento

  @apiDescription Options de documento

  @apiSuccess (Respuesta) {Texto} key Llave para el campo
  @apiSuccess (Respuesta) {Texto} type Tipo de etiqueta este puede ser input, select, datepicker, etc
  @apiSuccess (Respuesta) {Objeto} templateOptions Objeto de opciones para la etiqueta, el cual varia de acuerdo el tipo de etiqueta

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
    [
      {
        "key": "id_documento",
        "type": "input",
        "templateOptions": {
          "type": "number",
          "label": "ID",
          "required": true
        }
      },
      {
        "key": "nombre",
        "type": "input",
        "templateOptions": {
          "type": "text",
          "label": "Nombre",
          "required": true
        }
      },
      {
        "key": "plantilla",
        "type": "textarea",
        "templateOptions": {
          "type": "",
          "label": "Plantilla",
          "required": true
        }
      },
      {
        "key": "plantilla_valor",
        "type": "textarea",
        "templateOptions": {
          "type": "",
          "label": "Valores",
          "required": true
        }
      },
      {
        "key": "estado",
        "type": "select",
        "templateOptions": {
          "type": "",
          "label": "Estado",
          "required": false,
          "options": [
            {
              "name": "ACTIVO",
              "value": "ACTIVO"
            },
            {
              "name": "INACTIVO",
              "value": "INACTIVO"
            }
          ]
        }
      },
      {
        "key": "_usuario_creacion",
        "type": "input",
        "templateOptions": {
          "type": "number",
          "label": "Usuario de creación",
          "required": true
        }
      },
      {
        "key": "_usuario_modificacion",
        "type": "input",
        "templateOptions": {
          "type": "number",
          "label": "Usuario de modificación",
          "required": false
        }
      },
      {
        "key": "_fecha_creacion",
        "type": "datepicker",
        "templateOptions": {
          "type": "datetime-local",
          "label": "_fecha_creacion",
          "required": true
        }
      },
      {
        "key": "_fecha_modificacion",
        "type": "datepicker",
        "templateOptions": {
          "type": "datetime-local",
          "label": "_fecha_modificacion",
          "required": true
        }
      }
    ]

  @apiSampleRequest off
*/
 //creando servicio actualizar control personal
  function enviarControlPersonal(datos, doc) { return  new Promise((resolve, reject) => {
    const control_personal = controlPersonal.control_personal;
    const fecha_creacion_documento = new Date(doc._fecha_creacion)
    const control_personal_ordenado = controlPersonal.control_personal.datos.sort((a, b) => {
      if (a.fecha_creacion > b.fecha_creacion) {
        return 1;
      }
      if (a.fecha_creacion < b.fecha_creacion) {
        return -1;
      }
      return 0;
    });

    let array = '';

    for(let i = 0; i < control_personal_ordenado.length; i++) {
      const fecha = new Date(control_personal_ordenado[i].fecha_creacion);
      if (fecha_creacion_documento > fecha) {
        array = control_personal_ordenado[i];
      }
    }

    if (array !== '') {
      let usuarioDe = '';
      let usuarioPara = '';
      let unidadInicial = '';
      usuario.findOne({
        where: {
          id_usuario: datos[array.datos_generales].de[0].id_usuario,
        },
        attributes: ['email', 'fid_unidad'],
      }).then(usuario1 => {
        usuarioDe = usuario1.email;
        return usuario1;
      })
        .then( usuario => unidad.findById(usuario.fid_unidad))
        .then(unidad => {
          unidadInicial = unidad.nombre;
          usuario.findOne({
            where: {
              id_usuario: datos[array.datos_generales].para.id_usuario,
            },
            attributes: ['email'],
          }).then(usuario2  => {
            usuarioPara = usuario2.email;

            let tipo_permiso = 'licencia';
            if (datos[array.checkbox.licencia]) {
              tipo_permiso = 'licencia';
            }
            if (datos[array.checkbox.comision]) {
              tipo_permiso = 'comision';
            }
            if (datos[array.checkbox.vacaciones]) {
              tipo_permiso = 'particular';
            }
            if (datos[array.justificacion].search('Baja') !== -1) {
              tipo_permiso = 'baja';
            }

            if (datos[array.justificacion].search('dos') !== -1) {
              tipo_permiso = 'particular';
            }

            const fecha_inicio = new Date(datos[array.fecha.fecha_inicio]);
            const fecha_fin = new Date(datos[array.fecha.fecha_fin]);


            const data = {
              tipo_permiso,
              unidad_organizacional: unidadInicial,
              motivo: datos[array.motivo],
              fecha_ini: `${fecha_inicio.getFullYear()}-${fecha_inicio.getMonth()+1}-${fecha_inicio.getDate()}`,
              fecha_fin: `${fecha_fin.getFullYear()}-${fecha_fin.getMonth()+1}-${fecha_fin.getDate()}`,
              hora_ini: datos[array.hora.entrada],
              hora_fin:  datos[array.hora.salida],
              jefe: usuarioPara,
              usuario: usuarioDe,
              cite: datos[array.cite].cite,
            };

            const headers = {
              "Content-Type": "application/json",
              "authorization": controlPersonal.control_personal.token,
            };

            const args = {};
            args.data = data;
            args.headers = headers;
            args.url = controlPersonal.control_personal.url;
            args.method = 'post';

            return axios(args).then((response) => {
              resolve(true)
            })
          })
        }).catch(error => reject(error));
    } else {
      resolve(true);
    }
  });
 };
  

  app.options('/api/v1/plantillasFormly/documento', sequelizeFormly.formly(documento, app.src.db.models));
  app.options('/api/v1/plantillasFormly/documento/:id/todo', sequelizeFormly.formly(documento, app.src.db.models));
  app.options('/api/v1/plantillasFormly/documento/:id/misdocumentos', sequelizeFormly.formly(documento, app.src.db.models));
  app.options('/api/v1/plantillasFormly/documento/:id/encurso', sequelizeFormly.formly(documento, app.src.db.models));

};
