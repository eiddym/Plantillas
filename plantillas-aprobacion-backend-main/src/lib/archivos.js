/**
  Archivo con funciones y metodos para el manejo de archivos.
 */

  const fs = require('fs');
  const util = require('./util');
  const Uuid = require('uuid');
  const pdftk = require('node-pdftk');
  const _ = require('lodash');
  const logger = require('./logger');

  module.exports={

    /**
      Función que crea un archivo, valida la ruta, si no existe la ruta la crea.
      @param {pRuta} Texto Cadena de texto que contiene la ruta destino para el archivo.
      @param {pData} Data Información a ser escrita en el archivo.
      @param {pNombrePublico} Texto Cadena de texto que contiene el nombre del archivo mas su extensión.
      @param {pSobreEscribir} Boleano Es usado para sobreescribir un archivo.
      @example Ejemplo de uso.
      var files=require('../../lib/archivos');
      let ruta=RutaAdjuntos+"prueba2/1/2/3/4/5/6/7/8/9/10/11/12";
      let data="Hola mundo desde un txt5!!!"
      let nombre="archivo5.txt";
      let privado="c1afac81-2465-4315-b3d6-d8c14a9316f0.txt"

      files.crearArchivo(ruta,data,nombre,privado,false)
      .then(pRespuesta=>{
        console.log("Archivo creado", pRespuesta);
      })
      .catch(pError=>{
        console.log("Error al crear ", pError);
      });
     */
    crearArchivo:(pRuta, pData, pNombrePublico,pTipo, pNombrePrivado, pSobreEscribir) => {
      // Declara e inicializa variables locales.
      let rutaOrigen = null, indiceBarra = null, dir = null, temp = null;
      const nombreGenerado = pNombrePrivado ? pNombrePrivado:Uuid.v4()+pNombrePublico.substring(pNombrePublico.lastIndexOf("."),pNombrePublico.length);

      // Instancia una nueva promesa, con sus dos metodos.
      return new Promise((resolve,reject) => {
        // Procesa parte inicial de una ruta del tipo ./ruta/...
        indiceBarra=pRuta.indexOf('/');
        temp=pRuta.substring(0,indiceBarra+1);
        pRuta=pRuta.substring(indiceBarra+1,pRuta.length);
        indiceBarra=pRuta.indexOf('/');
        dir=temp+pRuta.substring(0,indiceBarra);

        // Realiza la iteracion mientras la longitud de la ruta sea mayor a 0 y no exista '/'.
        while (pRuta.length>0 && indiceBarra!==-1) {
          // Si no existe la ruta la crea.
          if(!fs.existsSync(dir)) fs.mkdirSync(dir);
          // Actualiza los datos de las variables.
          rutaOrigen = dir;
          pRuta = pRuta.substring(indiceBarra+1,pRuta.length);
          indiceBarra = pRuta.indexOf('/');
          dir = `${rutaOrigen}/${pRuta.substring(0,indiceBarra)}`;
        }

        // Si la longitud de la ruta es mayor a 0.
        if(pRuta.length>0){
          dir+=pRuta;

          // Si no existe la ruta la crea.
          if(!fs.existsSync(dir)) fs.mkdirSync(dir);
        }

        // Almacena la ruta completa del archivo.
        const rutaArchivo = `${dir}/${nombreGenerado}`;

        // Objeto a enviar.
        const respuesta = {nombre_publico:pNombrePublico,nombre_privado:nombreGenerado,data:pData,type:pTipo}

        // Verifica si existe el parametro para sobreescribir el archivo, crea o sobre-escribe el archivo.
        if(pSobreEscribir && pSobreEscribir==true)
          fs.writeFile(rutaArchivo, pData, {flag: 'w+'}, (pErrorEscritura) => (pErrorEscritura? reject(pErrorEscritura) : resolve(respuesta)));
        // Si no existe el parametro para sobreescribir, verifica la existencia.
        else
          !fs.existsSync(rutaArchivo)
            ? fs.writeFile(rutaArchivo,pData,{ flag: 'w+' },pErrorEscritura => (pErrorEscritura ?  reject(pErrorEscritura) :  resolve(respuesta)))
            : reject("El archivo ya existe.");
      });
    },

    guardarFirmado: (ruta, data, nombreDocumento, sobreescribir) => {
      // Declara e inicializa variables locales.
      // let nombreGenerado=pNombrePrivado? pNombrePrivado:Uuid.v4()+pNombrePublico.substring(pNombrePublico.lastIndexOf("."),pNombrePublico.length);
      module.exports.validarCrearRuta(ruta);

      const rutaArchivo = `${ruta}${nombreDocumento}`;
      const respuesta = 'Archivo guardado correctamente';
      return new Promise((resolve, reject) => {
        if(sobreescribir && sobreescribir===true) {
          return fs.writeFile(rutaArchivo, data, {flag:'w+'}, error => (error? reject(error): resolve(respuesta)));
        }

        if(!fs.existsSync(rutaArchivo)) {
          return fs.writeFile(rutaArchivo, data, {flag: 'w+'}, error => (error? reject(error): resolve(respuesta)));
        }
        else {
          return reject('El archivo ya existe.');
        }
      });
    },

    validarCrearRuta: (pRuta) => {
      let rutaOrigen = null,indiceBarra=null,dir=null, temp=null;
      indiceBarra = pRuta.indexOf('/');
      temp = pRuta.substring(0,indiceBarra+1);
      pRuta = pRuta.substring(indiceBarra+1,pRuta.length);
      indiceBarra = pRuta.indexOf('/');
      dir = temp+pRuta.substring(0,indiceBarra);

      // Realiza la iteracion mientras la longitud de la ruta sea mayor a 0 y no exista '/'.
      while (pRuta.length > 0 && indiceBarra !== -1) {
        // Si no existe la ruta la crea.
        if(!fs.existsSync(dir)) fs.mkdirSync(dir);
        // Actualiza los datos de las variables.
        rutaOrigen = dir;
        pRuta = pRuta.substring(indiceBarra+1,pRuta.length);
        indiceBarra = pRuta.indexOf('/');
        dir = `${rutaOrigen}/${pRuta.substring(0,indiceBarra)}`;
      }

      // Si la longitud de la ruta es mayor a 0.
      if(pRuta.length>0){
        dir+=pRuta;

        // Si no existe la ruta la crea.
        if(!fs.existsSync(dir)) fs.mkdirSync(dir);
      }
    },

    anular: (rutaDocumento, buffer) =>
    new Promise((resolve,reject) => {
      if(fs.existsSync(rutaDocumento)===false) return reject('El documento a anular no existe.');
      return pdftk.input(fs.readFileSync(rutaDocumento))
      .stamp(buffer)
      .output()
      .then(buffer =>
        fs.writeFile(rutaDocumento, buffer, {flag:'w+'}, error => { error ? reject(error): resolve('OK') })
      )
    }),

    obtenerBufferLista: (rutaBase, lista) => {
      const documentos = {};
      let generar = true;

      lista.map((item, indice) => {
        const nombreDocumento = util.formatoNombreDoc(item.nombre);
        const rutaDocumento = `${rutaBase}${nombreDocumento}.pdf`;
        let clave = util.generarCodigo(6, 'A');

        while(generar === true) {
          if(!documentos[clave]) generar = false;
          else clave = util.generarCodigo(6, 'A');
        }

        documentos[clave] = fs.readFileSync(rutaDocumento);
      });

      return pdftk.input(documentos)
      .output()
      .then(respBuffer => respBuffer)
      .catch(error => {
        logger.error('Error en la obtencion del buffer de documentos', error);
        return error;
      });
    },

    corregirAnulacion: (datos, models, sequelize) =>
      new Promise((resolve, reject) => {

        const datosAnulador = {};
        let docsCorregir = [];
        return models.documento.findOne({
          where: {
            nombre: {
              $like: datos.nombre,
            },
          },
        })
        .then(docResp => {
          if(!docResp) throw Error('No éxiste el informe de anulación.');
          const plantillaValor = JSON.parse(docResp.plantilla_valor);
          const docsAnular = plantillaValor['documentosAnular-0'];
          const idsAnular = _.map(docsAnular, 'id_documento');
          datosAnulador.para = JSON.parse(docResp.para)[0];
          datosAnulador.de = JSON.parse(docResp.de)[0];
          datosAnulador.cite = docResp.nombre;
          datosAnulador.idDocumento = docResp.id_documento;
          return models.documento.findAll({
            where: {
              id_documento: {
                $in: idsAnular,
              },
            },
          });
        })
        .then(docsResp => {
          if(!docsResp) throw Error('No existen documentos');
          console.log('-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-++-+-+-++-++--+--+-+-+-+-+-+-');
          console.log('Documentos destinados a su anulacion', docsResp.length);
          docsCorregir = _.filter(docsResp, { anulado: false });
          console.log('-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-++-+-+-++-++--+--+-+-+-+-+-+-');
          console.log('Documentos destinados a su CORRECCION', docsCorregir.length);
          // return obtenerFecha(datosAnulador);
          return models.historial_flujo.findOne({
            where: {
              id_documento: datosAnulador.idDocumento,
              accion: 'APROBADO',
            },
          })
        })
        .then(fechaResp => {
          if(!fechaResp) throw Error('No existe la aprobacion del informe de anulación.');
          datosAnulador.fecha = fechaResp._fecha_creacion;
          return module.exports.corregir(docsCorregir, datosAnulador, models, sequelize);
        })
        .then(r => resolve(r))
        .catch(error => {
          logger.error('Error en la correccion de anulaciones', error);
          return reject();
        });
      }),

    corregirSolo:  (docCorregir, anulador, Modelos, sequelize) =>
      new Promise((resolve, reject) => {
        const temp = docCorregir.dataValues;
        let transaccion;
        const tr= {};
        const datosParaAnular = {
          cite: anulador.cite,
          ruta: temp.ruta,
        };

        return Modelos.historial_flujo.findOne({
          where: {
            id_documento: temp.id_documento,
            accion: 'ANULADO',
          },
        })
        .then(respHistorial =>
          sequelize.transaction()
          .then( t => {
            transaccion = t;
            tr.transaction = t;
            if(!respHistorial) {
              return Modelos.historial_flujo.create({
                id_documento: temp.id_documento,
                accion: 'ANULADO',
                observacion: anulador.cite,
                _usuario_creacion: anulador.de,
                _usuario_modificacion: anulador.para,
                _fecha_creacion: new Date(anulador.fecha),
              }, tr);
            }
            return respHistorial;
          })
          .then(historial => sequelize.query(`
          UPDATE historial_flujo set _fecha_modificacion =to_timestamp('${anulador.fecha}', 'Dy Mon DD YYYY HH24:MI:SS') where id_historial_flujo = ${historial.id_historial_flujo};
          UPDATE historial_flujo set _fecha_creacion =to_timestamp('${anulador.fecha}', 'Dy Mon DD YYYY HH24:MI:SS') where id_historial_flujo = ${historial.id_historial_flujo};
          `, tr))
          .then(() => sequelize.query(`UPDATE documento SET anulado = true WHERE id_documento = ${temp.id_documento};`, tr))
          .then(() => module.exports.anularPDF(datosParaAnular))
          .then(() => transaccion.commit())
          .then(() => ({
            id_documento: temp.id_documento,
            nombre: temp.nombre,
            corregido: true,
            })
          )
          .catch(errorTransaction => {
            logger.error('Error en la transacion', errorTransaction);
            transaccion.rollback();
            return ({
              id_documento: temp.id_documento,
              nombre: temp.nombre,
              corregido: false,
              error: errorTransaction,
            });
          })
        )
        .then(resp => resolve(resp))
      }),

    corregir: (docsCorregir, anulador, Modelos, app) => {
      const respuesta = [];
      const dirDocumento = app.src.config.config.ruta_documentos;

      const promesas = docsCorregir.map(item =>
        new Promise((resolve, reject) => {
          const nombreArchivo = util.formatoNombreDoc(item.nombre);

          const objTemp = {
            id_documento: item.id_documento,
            nombre: item.nombre,
            corregido: false,
            ruta: `${dirDocumento}${nombreArchivo}.pdf`,
          };
          item.dataValues.ruta = `${dirDocumento}${nombreArchivo}.pdf`;
          return module.exports.corregirSolo(item, anulador, Modelos, app.src.db.sequelize)
          .then((resp) => {
            objTemp.corregido= true;
            respuesta.push(resp);
            return resolve(objTemp);
            // return;
          })
          .catch(error => {
            logger.error('Error en la correccion SOLO', error);
            objTemp.error = error;
            respuesta.push(resp);
            return resolve(objTemp);
            // return;
          });
        })
      )

      return Promise.all(promesas)
      .then(() => Promise.resolve(respuesta))
      .catch(error => {
        logger.error('Error en las promesas', error);
        return Promise.reject();
      });

    },

    anularPDF: (datos) =>
      new Promise((resolve, reject) =>
        util.generarAnulador(datos)
        .then(bufferResp => {

          if(!bufferResp) throw Error('No existe el buffer para la anulación');

          return module.exports.anular(datos.ruta, bufferResp);
        })
        .then(() => resolve())
        .catch(error => {
          logger.error('Error en la anulacion del pdf', error);
          return reject(error);
        })
      ),
  };
