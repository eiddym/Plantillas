const {ModelHandler} = require("sequelize-handlers");
const sequelizeFormly = require("sequelize-formly");
const bl = require('../../bl/plantillasFormly/plantillasBL');
const logger = require('../../lib/logger');

module.exports = app => {
  const plantilla_formly = app.src.db.models.plantilla_formly;
  const documento = app.src.db.models.documento;
  const Modelos = app.src.db.models;
  const util = app.src.lib.util;
  const rutaExternos = app.src.config.config.host;
  const Op = app.src.db.Sequelize.Op;
  const sequelizeHandlers = new ModelHandler(plantilla_formly);

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Post plantillas_formly
  @api {post} /api/v1/plantillasFormly/plantillas_formly Crear plantillas_formly

  @apiDescription Post para plantillas_formly

  @apiParam (Petición) {Texto} nombre Nombre de la plantilla_formly
  @apiParam (Petición) {Texto} abreviacion Abreviacion de la plantilla_formly
  @apiParam (Petición) {Texto} plantilla Plantilla_formly
  @apiParam (Petición) {Integer} _usuario_creacion Identificador del usuario que esta creando

  @apiParamExample {json} Ejemplo para enviar:
  {
  	"nombre":"plantilla_test",
  	"abreviacion":"plant",
  	"plantilla":"[]",
  	"_usuario_creacion":1
  }

  @apiSuccess (Respuesta) {Integer} id_plantillas_formly Identificador de plantillas_formly
  @apiSuccess (Respuesta) {Texto} nombre Nombre de plantilla_formly
  @apiSuccess (Respuesta) {Texto} abreviacion Abreviacion de plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla Plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla_valor Valor de plantillas_formly
  @apiSuccess (Respuesta) {Texto} estado Estado de plantillas_formly
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de plantillas_formly
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de plantillas_formly

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_plantilla_formly": 21,
      "nombre": "plantilla_test",
      "abreviacion": "plant",
      "plantilla": "[]",
      "plantilla_valor": null,
      "estado": "ACTIVO",
      "_usuario_creacion": 1,
      "_usuario_modificacion": null
      "_fecha_modificacion": "2016-12-19T20:55:31.372Z",
      "_fecha_creacion": "2016-12-19T20:55:31.372Z",
    }
  }

  @apiSampleRequest off
*/
app.post('/api/v1/plantillasFormly/plantilla_formly',  sequelizeHandlers.create(plantilla_formly));

/**
  @apiVersion 2.0.0
  @apiGroup Plantillas_Formly
  @apiName Post plantillasFormly/generarDocumento
  @api {post} /api/v1/plantillasFormly/generarDocumento Generar el documento PDF

  @apiDescription Post del plantillas_formly/generarDocumento para generar el documento en formato PDF en base a una plantilla

  @apiParam (Petición) {Texto} nombre Nombre del documento
  @apiParam (Petición) {Texto} plantilla Plantilla_formly
  @apiParam (Petición) {Vector} form_actual Plantilla_formly en array
  @apiParam (Petición) {Objeto} model_actual Datos de la plantilla

  @apiParamExample {json} Ejemplo para enviar:
  {
  	"nombre":"plantilla_test",
    "plantilla":"[]",
    "form_actual": [],
    "model_actual": {}
  }

  @apiSuccess (Respuesta) {Texto} nombre Nombre del documento PDF generado
  @apiSuccess (Respuesta) {Texto} html Documento en formato html

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Exitosa generación de la vísta previa.",
    "datos": {
      "nombre": "plantilla_test.pdf",
      "html": "<style type="text/css"> body{ font-family: 'Open Sans'; }.....",
    }
  }

  @apiSampleRequest off
*/

app.post('/api/v1/plantillasFormly/generarDocumento', (req, res) => {
  const respuesta = {};
  req.body.host=rutaExternos;
  const datos = JSON.parse(JSON.stringify(req.body));
  const estados = ['CERRADO', 'DERIVADO'];
  let enFirma = false;
  let anulado = false;
  let docEncontrado = null;
  let generar = false;
  documento.findOne({
    attributes: ['firmante_actual', 'firmaron','grupo', 'nombre', 'estado', 'anulado', 'aprobador_cd_actual', 'aprobaron_cd'],
    where: { nombre: { [Op.like]: datos.doc.nombre} },
    include:[
      {
        model: Modelos.firma,
        as: 'firma',
        required: false,
      },
    ],
  })
  .then(docResp => {
    if(!docResp)  throw Error('Asegurese de guardar el documento antes de generar la vista.');
    const docOrigen = docResp.dataValues;
    docEncontrado = docResp.dataValues;
    /*
    if(Array.isArray(docOrigen.firmaron) && docOrigen.firmaron.length > 0 ) enFirma = true;
    if(docResp.firmante_actual !== null && docOrigen.firmaron == null) enFirma = false;
    */
    // aprobación con ciudadania
    if(Array.isArray(docOrigen.aprobaron_cd) && docOrigen.aprobaron_cd.length > 0 ) enFirma = true;
    if(docResp.aprobador_cd_actual !== null && docOrigen.aprobaron_cd == null) enFirma = false;
    req.body.grupo = docResp.grupo;
    req.body.codigo = '';
    if(docEncontrado.firma) req.body.codigo = docEncontrado.firma.codigo;
    datos.grupo = docResp.grupo;
    anulado = docEncontrado.anulado;
  })
  .then(() => {
    // Valida la lectura o generación del documento.
    if(anulado === true || enFirma === true) return;
    if(enFirma === false && (estados.indexOf(docEncontrado.estado) == -1)) generar= false;
    if(enFirma === false &&(estados.indexOf(docEncontrado.estado) > -1)) generar = true;
    return util.generarDocumento(req.body, generar);
  })
  .then(() => {
    respuesta.nombre = `${util.formatoNombreDoc(datos.doc.nombre)}.pdf`;
    return util.generarHtml(datos);
  })
  .then(pRespuesta => {
    respuesta.html = pRespuesta.html;
    res.status(200).send(util.formatearMensaje('EXITO', "Exitosa generación de la vísta previa.", respuesta));
  })
  .catch(pError => {
    logger.error("Revisando el error", pError);
    res.status(412).send(util.formatearMensaje('ERROR', pError));
  });

});

/**
  @apiVersion 2.0.0
  @apiGroup Plantillas_Formly
  @apiName Post plantillasFormly/plantilla_formly/verificar
  @api {post} /api/v1/plantillasFormly/plantilla_formly/verificar Verifica la validez de una plantilla

  @apiDescription Post para plantillasFormly/plantilla_formly/verificar , Verifica si una plantilla esta activa y no sufrio algun cambio

  @apiParam (Petición) {Texto} nombre Nombre de la plantilla
  @apiParam (Petición) {Texto} abreviacion Abreviación o sigla de la plantilla
  @apiParam (Petición) {Texto} plantilla la plantilla_formly que se desea validar

  @apiParamExample {json} Ejemplo para enviar:
  {
    "nombre":"Documento Prueba",
    "abreviacion":"DP",
    "plantilla":"[{\"type\":\"cite\",\"templateOptions\":{\"labelCite\":\"CITE\",\"labelFecha\":\"FECHA\",\"tipo\":\"general\",\"tipoHoja\":\"Letter\"}},{\"type\":\"texto\",\"key\":\"texto\",\"templateOptions\":{\"label\":\"Documento Migración\",\"tipo\":\"h2\",\"className\":\"ap-text-center\",\"mTop\":true,\"mBot\":true}},{\"type\":\"select\",\"key\":\"inputSelect\",\"templateOptions\":{\"label\":\"Tipo\",\"multiple\":false,\"labelProp\":\"value\",\"valueProp\":\"id\",\"showItem\":true,\"options\":[{\"value\":\"Reservado\",\"id\":\"Reservado\"},{\"value\":\"Secreto\",\"id\":\"Secreto\"},{\"value\":\"Confidencial\",\"id\":\"Confidencial\"}],\"disabled\":false}},{\"type\":\"datosGenerales\",\"key\":\"datosGenerales\"}}]"
  }

  @apiSuccess (Respuesta) {Boolean} valido Si es o no válido

  @apiSuccessExample Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje":"EXITO",
    "mensaje":"Validación exitosa.",
    "datos":{
      "valido":true,
    }
  }

*/

app.post('/api/v1/plantillasFormly/plantilla_formly/verificar', (req,res) => {
  const datos = req.body;
  const respuesta = { valido: false};
  return plantilla_formly.findAll({
    attributes: ['id_plantilla_formly', 'nombre', 'abreviacion', 'plantilla', 'estado'],
    where: {
      [Op.and]: {
        nombre: datos.nombre,
        abreviacion: datos.abreviacion,
      },
    },
  })
  .then(plantillas => {
    respuesta.valido = bl.validarPlantilla(plantillas, datos.plantilla);
  })
  .then(() => {
    res.status(200).send(util.formatearMensaje('EXITO', "Validación exitosa.", respuesta));
  })
  .catch(error => {
    logger.error("Error al validar plantillasFormly", error);
    res.status(412).send(util.formatearMensaje('ERROR', error));
  });
});

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Get plantillas_formly/:id
  @api {get} /api/v1/plantillasFormly/plantillas_formly/:id Obtiene un/a plantillas_formly

  @apiDescription Get plantillas_formly, obtiene un/a plantillas_formly

  @apiParam (Parámetro) {Integer} id Identificador de plantillas_formly que se quiere obtener

  @apiSuccess (Respuesta) {Integer} id_plantillas_formly Identificador de plantillas_formly
  @apiSuccess (Respuesta) {Texto} nombre Nombre de plantilla_formly
  @apiSuccess (Respuesta) {Texto} abreviacion Abreviacion de plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla Plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla_valor Valor de plantillas_formly
  @apiSuccess (Respuesta) {Texto} estado Estado de plantillas_formly
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de plantillas_formly
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de plantillas_formly

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_plantilla_formly": 21,
      "nombre": "plantilla_test",
      "abreviacion": "plant",
      "plantilla": "[]",
      "plantilla_valor": null,
      "estado": "ACTIVO",
      "_usuario_creacion": 1,
      "_usuario_modificacion": null,
      "_fecha_creacion": "2016-12-19T20:55:31.372Z",
      "_fecha_modificacion": "2016-12-19T20:55:31.372Z"
    }
  }
*/
  app.get('/api/v1/plantillasFormly/plantilla_formly/:id', sequelizeHandlers.get());

/**
  @apiVersion 2.0.0
  @apiGroup Plantillas_Formly
  @apiName Get plantilla_formly/abreviacion/:abr
  @api {get} /api/v1/plantillasFormly/plantilla_formly/abreviacion/:abr Obtiene las plantillas por su abreviacion 

  @apiDescription Get plantillas_formly, obtiene un/a plantillas_formly, Busca y obtiene las plantillas por su abreviación

  @apiParam (Parámetro) {Texto} abr Abreviación de la plantilla

  @apiSuccess (Respuesta) {Integer} id_plantillas_formly Identificador de la plantilla_formly
  @apiSuccess (Respuesta) {Texto} abreviacion Abreviacion de la plantilla_formly

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "El documento se aprobó correctamente",
    "datos": {
      "row": {
        "count": 1,
        "rows": [
          {
            "id_plantilla_formly": 15,
            "abreviacion": "DP"
          }
        ]
      },
      "rows": {
        "count": 0,
        "rows": []
      }
    }
  }
*/

  app.get('/api/v1/plantillasFormly/plantilla_formly/abreviacion/:abr', (req, res) => {
    const respuesta = {};
    plantilla_formly.findAndCountAll({
      attributes: ['id_plantilla_formly','abreviacion'],
      where: {
        abreviacion: `${req.params.abr}`,
      },
    })
    .then( data => {
      respuesta.row = data;
      return plantilla_formly.findAndCountAll({
        attributes: ['id_plantilla_formly','abreviacion'],
        where: {
          abreviacion: { [Op.like]: `${req.params.abr}-%`},
        },
      });
    })
    .then( data => {
      respuesta.rows = data;
      res.send(util.formatearMensaje("EXITO", "El documento se aprobó correctamente", respuesta));
    })
    .catch( e => {
      res.status(412).send(util.formatearMensaje("ERROR", e));
    });
  });

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Get plantillas_formly
  @api {get} /api/v1/plantillasFormly/plantillas_formly/ Obtiene la lista completa de plantillas_formly

  @apiDescription Get plantillas_formly

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "total": 21,
      "resultado":[
        {
         "id_plantilla_formly": 1,
         "nombre": "Contrato Administrativo para la Prestación de Bienes y Servicios",
         "abreviacion": "CAPBS",
         "plantilla": "[]",
         "plantilla_valor": null,
         "estado": "ACTIVO",
         "_usuario_creacion": 1,
         "_usuario_modificacion": 1,
         "_fecha_creacion": "2016-12-15T21:03:42.486Z",
         "_fecha_modificacion": "2016-12-15T21:05:12.504Z"
        }, ...
      ]
    }
  }

*/

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Get plantillas_formly/?order=&limit=&page=&filter=
  @api {get} /api/v1/plantillasFormly/plantillas_formly/?order=&limit=&page=&filter= Obtiene la lista paginada de plantillas_formly

  @apiDescription Get plantillas_formly

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
        "total": 21,
        "resultado":[
          {
          "id_plantilla_formly": 1,
          "nombre": "Contrato Administrativo para la Prestación de Bienes y Servicios",
          "abreviacion": "CAPBS",
          "plantilla": "[]",
          "plantilla_valor": null,
          "estado": "ACTIVO",
          "_usuario_creacion": 1,
          "_usuario_modificacion": 1,
          "_fecha_creacion": "2016-12-15T21:03:42.486Z",
          "_fecha_modificacion": "2016-12-15T21:05:12.504Z"
          },
          ...
        ]
      }
    }
*/

/**
  @apiVersion 2.0.0
  @apiGroup Plantillas_Formly
  @apiName Get plantillas_formly/?fields=&sort=&estado=&limit=
  @api {get} /api/v1/plantillasFormly/plantillas_formly/?fields=&sort=&estado=&limit= Obtiene la lista de plantillas_formly

  @apiDescription Get plantillas_formly

  @apiParam (Query) {Texto} sort Campo por el cual se ordenará el resultado
  @apiParam (Query) {Integer} limit Cantidad de resultados a obtener
  @apiParam (Query) {Texto} page Número de página de resultados
  @apiParam (Query) {Texto} estado Texto a buscar en el estado de los registros

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
        "total": 21,
        "resultado":[
          {
          "id_plantilla_formly": 1,
          "nombre": "Contrato Administrativo para la Prestación de Bienes y Servicios",
          "abreviacion": "CAPBS"
          }, ...
        ]
      }
    }

*/
  app.get('/api/v1/plantillasFormly/plantilla_formly', sequelizeHandlers.query(plantilla_formly));

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Delete plantillas_formly
  @api {delete} /api/v1/plantillasFormly/plantillas_formly/:id Elimina un/a plantillas_formly

  @apiDescription Delete plantillas_formly

  @apiParam (Parámetro) {Integer} id Identificador de plantillas_formly que se quiere eliminar

  @apiSuccessExample {json} Respuesta:
    HTTP/1.1 200 OK
    {
      "tipoMensaje": "EXITO",
      "mensaje": "La eliminación fue exitosa"
    }
*/
  app.delete('/api/v1/plantillasFormly/plantilla_formly/:id', (req, res) => {

    const roles = req.body.audit_usuario.roles;

    plantilla_formly.findOne({
      where:{id_plantilla_formly:req.params.id},
    })
    .then(pPlantilla => {
      let cont=0;
      for(let i = 0; i<roles.length;i++){
        if(roles[i].rol.nombre=="CONFIGURADOR") cont++;
      }
      if(cont == 0) throw  new Error("Usted no tiene la autorizacion.");
      else return pPlantilla;

    })
    .then(pPlantilla => documento.findAll({
        attributes:['abreviacion'],
        where:{
          abreviacion:pPlantilla.abreviacion,
          estado:{[Op.ne]:'ELIMINADO'},
        },
      })
      .then(pDocumentos => {
        if(pDocumentos.length>0) throw new Error("No se puede eliminar la plantilla, porque ya existen documentos con la misma.");
        else return pPlantilla.destroy();
      })
    )
    .then(() => {
      res.send(util.formatearMensaje("EXITO", "La eliminación fue exitosa"));
    })
    .catch(pError => {
      res.status(412).send(util.formatearMensaje("ERROR", pError));
    });
  });

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Put plantillas_formly
  @api {put} /api/v1/plantillasFormly/plantillas_formly/:id Actualiza un/a plantillas_formly

  @apiDescription Put plantillas_formly

  @apiParam (Parámetro) {Integer} id Identificador de plantillas_formly que se quiere actualizar

  @apiParam (Petición) {Texto} abreviacion Abreciación de plantillas_formly

  @apiParamExample {json} Ejemplo para enviar:
  {
	  "abreviacion":"QA"
  }

  @apiSuccess (Respuesta) {Integer} id_plantillas_formly Identificador de plantillas_formly
  @apiSuccess (Respuesta) {Texto} nombre Nombre de plantillas_formly
  @apiSuccess (Respuesta) {Texto} abreviacion Abreviacion de plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla Plantillas_formly
  @apiSuccess (Respuesta) {Texto} plantilla_valor Valor de plantillas_formly
  @apiSuccess (Respuesta) {Texto} estado Estado de plantillas_formly
  @apiSuccess (Respuesta) {Integer} _usuario_creacion Identificador del usuario creador
  @apiSuccess (Respuesta) {Integer} _usuario_modificacion Identificador del usuario modificador
  @apiSuccess (Respuesta) {FechaHora} _fecha_creacion Fecha de creación de plantillas_formly
  @apiSuccess (Respuesta) {FechaHora} _fecha_modificacion Fecha de modificación de plantillas_formly

  @apiSuccessExample {json} Respuesta del Ejemplo:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "La operación se realizó correctamente.",
    "datos": {
      "id_plantilla_formly": 21,
      "nombre": "plantilla_test",
      "abreviacion": "QA",
      "plantilla": "[]",
      "plantilla_valor": null,
      "estado": "ACTIVO",
      "_usuario_creacion": 1,
      "_usuario_modificacion": null,
      "_fecha_creacion": "2016-12-19T20:55:31.372Z",
      "_fecha_modificacion": "2016-12-19T21:02:38.049Z"
    }
  }

  @apiSampleRequest off
*/
  app.put('/api/v1/plantillasFormly/plantilla_formly/:id' , (req,res) => {
    const roles = req.body.audit_usuario.roles;
    let cont = 0;
    for(let i = 0; i< roles.length;i++){
      if(roles[i].rol.nombre=="CONFIGURADOR")cont++;
    }
    plantilla_formly.findOne({
      where:{id_plantilla_formly:req.params.id},
    })
    .then(pPlantilla => {
      if(pPlantilla){
        if(cont == 0) throw  new Error("Usted no tiene la autorizacion.");
        else return pPlantilla.update(req.body);
      }
      else throw new Error("La plantilla no esta disponible.");
    })
    .then(pPlantilla => {
      res.send(util.formatearMensaje("EXITO", "Actualizacion exitosa", pPlantilla));

    })
    .catch(pError => {
      res.status(412).send(util.formatearMensaje("ERROR", pError));
    });
  });

/**
  @apiVersion 1.0.0
  @apiGroup Plantillas_Formly
  @apiName Options plantillas_formly
  @api {options} /api/v1/plantillasFormly/plantillas_formly Extrae formly de plantillas_formly

  @apiDescription Options de plantillas_formly

  @apiSuccess (Respuesta) {Texto} key Llave para el campo
  @apiSuccess (Respuesta) {Texto} type Tipo de etiqueta este puede ser input, select, datepicker, etc
  @apiSuccess (Respuesta) {Objeto} templateOptions Objeto de opciones para la etiqueta, el cual varia de acuerdo el tipo de etiqueta

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  [
    {
      "key": "id_plantillas_formly",
      "type": "input",
      "templateOptions": {
        "type": "number",
        "label": "Id plantillas_formly",
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
app.options('/api/v1/plantillasFormly/plantilla_formly', sequelizeFormly.formly(plantilla_formly, app.src.db.models));

};
