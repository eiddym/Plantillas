const Promise = require('bluebird');
// const Client = require('node-rest-client').Client;
const axios = require('axios');
const config = require('../../src/config/config')();
const nodemailer = require('nodemailer');
const logger = require('./logger')
const smtpTransport = require('nodemailer-smtp-transport')

const cn=config.notificacion;
const configNotificacion = config.envio_notificacion;
const configCorreoLocal=config.correo;
// const cliente = new Client();

const jsonConfig = {
  //service: 'GMAIL',
  port: configCorreoLocal.port,
  host: configCorreoLocal.host,
  secure: configCorreoLocal.secure,
  ignoreTLS: configCorreoLocal.ignoreTLS,
  tls: {
    rejectUnauthorized: true,
  },
  auth: {
    user: configCorreoLocal.origen,
  },
};

const transporte = nodemailer.createTransport(jsonConfig);
let usuarioOrigen=null;

function enviar(pModelos, pDocumento, pEntorno, pTr) {
  enviarNotificacion(pModelos, pDocumento, pEntorno, pTr);
  return new Promise((resolve) => {
    resolve();
  });
}

function enviarNotificacion(pModelos, pDocumento, pEntorno, pTr){
  let id_1 = pDocumento._usuario_creacion;
  let id_2 = pDocumento.via_actual;
  if(pEntorno=='derivado'){
    id_1=pDocumento.via_actual;
    id_2=pDocumento._usuario_modificacion;
  }
  if(pEntorno == 'aprobado'){
    id_2=pDocumento._usuario_modificacion;
  }
  if(pEntorno == 'aprobar_ciudadania'){
    id_2 = pDocumento.aprobador_cd_actual;
  }
  if(pEntorno == 'aprobados_ciudadania'){
    id_1 = JSON.parse(pDocumento.para);
    id_2 = JSON.parse(pDocumento.de);
  }

  return new Promise((resolve, reject) => {
    if(process.env.NODE_ENV =='test') resolve();
    return pModelos.conf_notificacion.findOne({
    // return pModeloConfiguracion.findOne({
      where:{
        fid_usuario: id_1,
      },
      include:[{
        model:pModelos.usuario,
        as:'usuario',
      }],
    })
    .then(pResultado => {
      if(pResultado!== null){
        usuarioOrigen=pResultado.dataValues;
        return pModelos.conf_notificacion
          .findAll({
            // return pModeloConfiguracion.findOne({
            where: {
              fid_usuario: id_2,
            },
            include: [
              {
                model: pModelos.usuario,
                as: "usuario",
              },
            ],
          })
          .then((pRespuestaUsuario) => pRespuestaUsuario);
      }
      else throw new Error("Este usuario no tiene la configuracion basica de notificacion")
    })
    .then(pDestinos => {
      const telefonos = [];
      const correos = [];

      pDestinos.forEach(pDestino => {
      // Retorna un mensaje, telefono y correo, dependiendo del Entorno.
        const { destino, origen, correo, mensaje, mensajeHtml, telefono, asunto } = armarMensaje(usuarioOrigen, pDestino, pEntorno, pDocumento);
        telefonos.push(telefono);
        correos.push(correo);
        logger.info('Se enviara notificacion al usuario ', destino.usuario.id_usuario)
        if(destino[pEntorno] && destino['canal_habilitado']){
          const datos = {
            destinatario:destino.usuario.id_usuario,
            canal:destino.canal,
            _usuario_creacion:origen.usuario.id_usuario,
            _fecha_creacion:new Date(),
            mensaje,
            fid_documento: pDocumento.id_documento,
          }
          switch (destino.canal) {
            case 'SMS':
              if(destino.usuario.id_usuario !== origen.usuario.id_usuario){
                return enviarSMS(mensaje, telefonos, pModelos.notificacion, datos)
                .then(pEnvio => resolve())
              }
              else resolve();
            break;
            case 'CORREO':
              if(destino.usuario.id_usuario !== origen.usuario.id_usuario){
                if (configNotificacion == "CORREO") { // Medio por el cual se envian correos CORREO o ALERTIN
                  return envioCorreoLocal(
                    asunto,
                    correo,
                    pModelos.notificacion,
                    datos,
                    pTr,
                    mensajeHtml
                  ).then(() => resolve());
                } else {
                  return envioNotificacion(
                    asunto,
                    correo,
                    pModelos.notificacion,
                    datos,
                    pTr,
                    mensajeHtml
                  ).then(() => resolve());
                }
              }else  resolve();
            break;
            case 'SMS_CORREO':
              if(destino.usuario.id_usuario !== origen.usuario.id_usuario){
                resolve();
              }
              else resolve();
            break;
          }
        }
        else {
          logger.info("Notificaciones desactivadas o no requiere notificacion para ", pEntorno);
          resolve();
        }
      });
    })
    .catch(pError => {
      logger.error("Error en el envio de la notificacion", pError.message);
      resolve();
    })
  })

}

/**
* Función que realiza el armado del mensaje que se enviara para la notificacion..
* @param  {Object} usuarioOrigen       Datos del Usuario remitente.
* @param  {Object} pDestino            Datos del Usuario destino.
* @param  {Text} pEntorno              Entorno de la notificacion.
* @param  {Objeto} pDocumento          Datos del documento a notificar.
* @return {Object} destino             Datos del Usuario destino.
* @return {Object} origen              Datos del Usuario origen.
* @return {Text} correo                Correo del Usuario destino.
* @return {Text} mensaje               Mensaje final de la notificacion.
* @return {Text} mensajeHTML           Mensaje de la notificacion en formato HTML.
* @return {Text} asunto                Asunto de la notificacion.
 */


function armarMensaje(usuarioOrigen, pDestino, pEntorno, pDocumento) {
  let destino = usuarioOrigen;
  let origen = pDestino;
  let correo = usuarioOrigen.usuario.email;
  let asunto = 'Aviso Sistema de Plantillas - Nuevo documento en la bandeja de documentos pendientes';
  let mensaje = null;
  let mensajeHtml = null;
  let telefono = null;
  switch (pEntorno) {
    case 'observado':
      asunto = 'Aviso Sistema de Plantillas - Documento observado';
      mensaje = `Hola ${usuarioOrigen.usuario.nombres},  ${pDestino.usuario.nombres} ${pDestino.usuario.apellidos} observó el documento que enviaste.\n Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para subsanar las observaciones.`;
      mensajeHtml = `<div><p>Hola ${usuarioOrigen.usuario.nombres}, <strong>${pDestino.usuario.nombres} ${pDestino.usuario.apellidos}</strong> observó el documento que enviaste.</p> <p>Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para <strong>SUBSANAR</strong> las observaciones.</p></div>`;
      break;
    case 'enviado':
      mensaje = `Hola ${pDestino.usuario.nombres}, ${usuarioOrigen.usuario.nombres} ${usuarioOrigen.usuario.apellidos} te envió un documento para su revisión.\n Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para revisarlo.`;
      mensajeHtml = `<div><p>Hola ${pDestino.usuario.nombres}, <strong>${usuarioOrigen.usuario.nombres} ${usuarioOrigen.usuario.apellidos}</strong> te envió un documento para su revisión.</p> <p>Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para revisarlo.</p></div>`;
      telefono = pDestino.celular;
      correo = pDestino.usuario.email;
      destino = pDestino;
      origen = usuarioOrigen;
      break;
    case 'derivado':
      mensaje = `Hola ${usuarioOrigen.usuario.nombres}, ${pDestino.usuario.nombres} ${pDestino.usuario.apellidos} te envío un documento para su atención.\n Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para atender la solicitud.`;
      mensajeHtml = `<div><p>Hola ${usuarioOrigen.usuario.nombres}, <strong>${pDestino.usuario.nombres} ${pDestino.usuario.apellidos}</strong> te envió un documento para su revisión.</p> <p>Por favor, ingresa a tu bandeja de Documentos Pendientes del Sistema de Plantillas para atender la solicitud.</p></div>`;
      break;
    case 'aprobado':
      asunto = 'Aviso Sistema de Plantillas - Nuevo documento en la bandeja Aprobar Documento con Ciudadanía Digital';
      mensaje = `Hola ${usuarioOrigen.usuario.nombres}, tu documento ha sido aprobado satisfactoriamente y el CITE del documento que se generó es ${pDocumento.nombre}. \n Por favor, ingresa a tu bandeja APROBAR CON CIUDADANIA DIGITAL del Sistema de Plantillas para aprobarlo.`;
      mensajeHtml = `<div><p>Hola ${usuarioOrigen.usuario.nombres}, tu documento ha sido aprobado satisfactoriamente y el CITE del documento que se generó es <strong>${pDocumento.nombre}.</strong> </p><p>Por favor, ingresa a tu bandeja <strong>APROBAR CON CIUDADANÍA DIGITAL</strong> del Sistema de Plantillas para aprobarlo.</p></div>`;
      break;
    case 'aprobar_ciudadania':
      asunto = 'Aviso Sistema de Plantillas - Nuevo documento en la bandeja Aprobar Documento con Ciudadanía Digital';
      mensaje = `Hola ${pDestino.usuario.nombres}, tienes un nuevo documento pendiente de aprobación con Ciudadanía Digital con CITE ${pDocumento.nombre}. \n Por favor, ingresa a tu bandeja APROBAR CON CIUDADANIA DIGITAL del Sistema de Plantillas para aprobarlo.`;
      mensajeHtml = `<div><p>Hola ${pDestino.usuario.nombres}, tienes un nuevo documento pendiente de aprobación con Ciudadanía Digital con CITE <strong>${pDocumento.nombre}.</strong> </p><p>Por favor, ingresa a tu bandeja <strong>APROBAR CON CIUDADANÍA DIGITAL</strong> del Sistema de Plantillas para aprobarlo.</p></div>`;
      destino = pDestino;
      origen = usuarioOrigen;
      correo = pDestino.usuario.email;
      break;
    case 'aprobados_ciudadania':
      asunto = 'Aviso Sistema de Plantillas - Documento aprobado con Ciudadanía Digital';
      mensaje = `Hola ${pDestino.usuario.nombres}, el documento con CITE ${pDocumento.nombre} ha sido aprobado con Ciudadanía Digital por todos los usuarios intervinientes. \n Ingresa a tu bandeja MIS DOCUMENTOS del Sistema de Plantillas para revisarlo.`;
      mensajeHtml = `<div><p>Hola ${pDestino.usuario.nombres}, el documento con CITE <strong>${pDocumento.nombre}.</strong> ha sido aprobado con Ciudadanía Digital por todos los usuarios intervinientes. </p><p>Ingresa a tu bandeja <strong>MIS DOCUMENTOS</strong> del Sistema de Plantillas para revisarlo.</p></div>`;
      destino = pDestino;
      origen = usuarioOrigen;
      correo = pDestino.usuario.email;
      break;

  }
  return { destino, origen, correo, mensaje, mensajeHtml, telefono, asunto};
}
/**
 * Función que realiza el envio de SMS, haciendo uso de una API.
 * @param  {Texto} pMensaje             Contiene el mensaje a ser enviado via sms.
 * @param  {Vector} pTelefono           Lista de telefonos destinatarios.
 * @param  {Objeto} pModeloNotificacion Modelo de base de datos.
 * @param  {Objeto} pDatos              Datos a ser insertados en el modelo de datos.
 * @param  {Objeto} pTr                 Transaccion propia de sequelize.
 * @return {Promesa}
 */
function enviarSMS(pMensaje,pTelefono,pModeloNotificacion,pDatos,pTr){

  const args = {
    data:{
      mensaje:pMensaje,
      telefonos:[pTelefono],
    },
    headers:{
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cn.sms_token}`,
    },
    url: cn.sms_url,
    method: 'post',
  }
  return new Promise((resolve, reject) => axios(args)
    .then((response) => pModeloNotificacion.create(pDatos, pTr)
      .then(() => resolve())
    )
    .catch(pError => reject(pError)))

}

/**
 * Función que realiza el envio de correos de manera local.
 * @param  {Texto} pMensaje             Contiene el mensaje a ser enviado via correo.
 * @param  {Vector]} pCorreos           Lista de destinatarios.
 * @param  {Texto} pEntorno             Entorno de la notificacion.
 * @param  {Objeto} pModeloNotificacion Modelo de base de datos.
 * @param  {Objeto} pDatos              Datos a ser insertados en el modelo de datos.
 * @param  {Objeto} pTr                 Transaccion propia de sequelize.
 * @return {Promesa}
 */
function enviarCorreoLocal(pAsunto, pMensaje, pCorreos, pEntorno, pModeloNotificacion, pDatos, pId,pTr){
  let html=`Estimado, el siguiente documento fue <strong>${pEntorno}</strong> <br>
  <p>${pMensaje}</p>`;
  if(pEntorno=='observado')html+=`Para mas informacion ingresa a <a href="${config.front}documento/${pId}" >aquí!</a>
  <br> Si el enlace no funciona, prueba a copiar y pegar lo siguiente en tu navegador ${config.front}documento/${pId}`
  else html += `Para mas informacion ingresa al sistema <a href="${config.front}login" >aquí!</a>
  <br> Si el enlace no funciona, prueba a copiar y pegar lo siguiente en tu navegador ${config.front}`
  const contenido={
    from:configCorreoLocal.origen,
    to:pCorreos,
    subject:pAsunto,
    html,
  }
  return new Promise((resolve, reject) => {
    transporte.sendMail(contenido,(pError, pInfo) => {
      if(pError){
        logger.error("Error en el envio de correo",pError);
        resolve();
      } else {
        return pModeloNotificacion.create(pDatos,pTr)
        .then(() => resolve())
      }

    })
  })


}

/**
* Función que realiza el envio de correos consumiendo la API..
* @param  {Texto} pMensaje             Contiene el mensaje a ser enviado via correo.
* @param  {Vector]} pCorreos           Lista de destinatarios.
* @param  {Texto} pEntorno             Entorno de la notificacion.
* @param  {Objeto} pModeloNotificacion Modelo de base de datos.
* @param  {Objeto} pDatos              Datos a ser insertados en el modelo de datos.
* @param  {Objeto} pTr                 Transaccion propia de sequelize.
* @return {Promesa}
 */
function enviarCorreo(pAsunto, pMensaje, pCorreos, pEntorno, pModeloNotificacion, pDatos, pId, pTr){
  let html=`Estimado, el siguiente documento fue <strong>${pEntorno}</strong> <br><p>${pMensaje}</p>`;
  if(pEntorno=='observado')html+=`Para mas informacion ingresa a <a href="${config.front}documento/${pId}" >aquí!</a><br> Si el enlace no funciona, prueba a copiar y pegar lo siguiente en tu navegador ${config.front}documento/${pId}`
  else html += `Para mas informacion ingresa al sistema <a href="${config.front}login" >aquí!</a><br> Si el enlace no funciona, prueba a copiar y pegar lo siguiente en tu navegador ${config.front}`;

  const args = {
    data: {
      remitente: configCorreoLocal.remitente,
      origen: configCorreoLocal.origen,
      asunto: pAsunto,
      mensaje: html,
      modo: "html",
      correos: pCorreos,
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cn.correo_token}`,
    },
    url: cn.correo_url,
    method: "post",
  };

  return new Promise((resolve, reject) =>
    // return cliente.post(`${cn.correo_url}`, args, (data,response) => {
    (
      axios(args)
        .then((response) =>
          pModeloNotificacion.create(pDatos, pTr).then(() => resolve())
        )
        // .on('error', pError => reject(pError))
        .catch((pError) => reject(pError))
    )
  );
}


function envioCorreoLocal(
  pAsunto,
  pCorreos,
  pModeloNotificacion,
  pDatos,
  pTr,
  phtml
) {
  const contenido = {
    from: configCorreoLocal.origen,
    to: pCorreos,
    subject: pAsunto,
    html: phtml,
  };
  logger.info("Se enviara correo a: ", pCorreos);
  return new Promise((resolve, reject) => {
    transporte.sendMail(contenido, (pError, pInfo) => {
      if (pError) {
        logger.error("Error en el envio de correo", pError);
        pDatos.tipo = 'ERROR';
        pDatos.detalle = pError.toString();
        return pModeloNotificacion.create(pDatos, pTr).then(() => resolve());
      } else {
        logger.info("Correo enviado satisfactoriamente");
        return pModeloNotificacion.create(pDatos, pTr).then(() => resolve());
      }
    });
  });
}

function envioNotificacion(pAsunto, pCorreos, pModeloNotificacion, pDatos,pTr,phtml){
  const args = {
    data: {
      para: [pCorreos],
      asunto: pAsunto,
      contenido: phtml,
      tipo: 1,
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cn.correo_token}`,
    },
    url: cn.correo_url,
    method: "post",
  };
  logger.info(configNotificacion," Se enviara correo a: ", pCorreos);
  return new Promise((resolve, reject) =>
    axios(args)
      .then((response) =>
        pModeloNotificacion.create(pDatos, pTr).then(() => {
          logger.info(configNotificacion, " Correo enviado satisfactoriamente");
          resolve();
        })
      )
      .catch((pError) => {
        logger.error(pError);
        reject(pError);
      })
  );
}

module.exports = {
  enviar,
  enviarSMS,
  enviarCorreo,
  enviarCorreoLocal,
};
