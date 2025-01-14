/*
 Archivo con los recursos necesarios para poder enviar correo.
 */
 const nodemailer = require('nodemailer');
 const logger = require('./logger');
 const config = require('./../config/config');
 const Promise=require('bluebird');
 let configCorreo = config().correo;
 
 
 var jsonConfig = {
     port: configCorreo.port,
     host: configCorreo.host,
     secure: true,
     ignoreTLS:true,
     tls: {
         rejectUnauthorized: true
     },
     auth: {
         user: configCorreo.user,
         pass: configCorreo.pass
     }
 };
 
 var transporte = nodemailer.createTransport(jsonConfig);
 
 var correo = {
     /**
      * Envia el un correo con parametros necesarios
      * @param {type} datosEnvio
      * @returns {unresolved}
      */
     enviar: function(datosEnvio) {
       return new Promise((resolve, reject) => {
         const opciones = {
             from: configCorreo.user,
             to: datosEnvio.para,
             subject: datosEnvio.titulo,
             text: datosEnvio.mensaje,
             html: datosEnvio.html
         };
 
         transporte.sendMail(opciones, function(error, info){
             if(error){
               logger.error(error);
               reject(error);
             }
             logger.info('Mensaje enviado: ' + info.response);
             resolve()
         });
 
       })
     }
 };
 
 module.exports = correo;
 