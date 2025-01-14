const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./logger");

const fileupload = require('express-fileupload');
const moment = require('moment');
// Establece la zona horaria, en la libreria moment.
const genFecha = moment().tz('America/La_Paz');


const jwt = require("jwt-simple");
const helmet = require('helmet');
const nocache = require("nocache");



module.exports = app => {
  // Constante que almacena la congfiguracion.
  const configuracion = app.src.config.config;
  const Usuario = app.src.db.models.usuario;
  const UsuarioExterno = app.src.db.models.usuario_externo;
  const Util = app.src.lib.util;

  // Establece el puerto
  app.set("port", configuracion.puerto);

  // Establece la llave secreta
  app.set("secretBJA", configuracion.jwtSecret);
  // Establece la sesion.
  app.set("sesion", {});
  // Establece la sesion de usuarios virtuales.
  app.set("virtual", {});

  // Realiza el uso de morgan para generar logs.
  app.use(morgan("common", {
    stream: {
      write: (message) => {
        logger.info(message);
      },
    },
  }))
  // app.enable('trust proxy');
  // Realiza el uso de la libreria helmet.
  app.use(helmet());
  app.use(helmet({referrerPolicy: { policy: "no-referrer" }}));
  app.use(nocache());

  app.use(bodyParser.json({limit:'100mb'}));

  // Para poder subir archivos.
  app.use(fileupload());


    // Permite la visualizacion de los test, en entornos distintos a produccion.
    app.use((req, res, next) => {
      res.locals.showTests = app.get('env') !== 'production' &&
      req.query.test === '1';
      next();
    });

    // Establece el uso y configuracion de cors.
    app.use(cors({
        // "origin": "*",
        "Access-Control-Allow-Origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        "preflightContinue": true,
        "headers": "Cache-Control, Pragma, if-modified-since,Content-Type, Authorization, Content-Length, X-Requested-With, validacion",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Content-Type-Options",

    }));

    // Deshabilita la informacion.
    app.disable('x-powered-by');

    // Realiza el uso de "bodyParser" para la recepcion de Json como body.
    app.use(bodyParser.json());

      // Realiza el uso de la autenticacion de passport.
      app.use(app.src.auth.initialize());

    // Ruta estatica de acceso a la imagen del membrete.
    app.use('/public/membrete.png', express.static("public/images/membrete.png"));
    app.use('/flibs/pdfjs/pdf.worker.js', express.static("librerias_frontend_extra/pdf.js-viewer/pdf.worker.js"));

    // verifica si hay errores en el formato json
    app.use((err, req, res, next) => {

      if (err instanceof SyntaxError) {
        res.status(400).json({
          mensaje: "Problemas en el formato JSON",
        });
      } else {
        res.status(500).send('Error interno!');
        console.error(err.stack);
      }
    });

  // Validacion de rutas.
  app.use('/', (req,res,next) => {
    if(req.method !== 'OPTIONS'){
      const rutas = app.get("ruta");
      const v=rutas[req.method];
      let c=0;
      const miRuta= (req.url.indexOf('?')>-1)?req.url.substr(0,req.url.indexOf('?')):req.url;
      for (let i = 0; i < v.length; i++) {
        if(v[i].test(miRuta)) c++;
      }

      (c>0)? next(): res.status(404).send({success:false,message:'Recurso no disponible, intentalo mas tarde.'});
    }
    else next()
  })

  app.use('/reporte', (req,res,next) => {
    validar(req, res, next);
  });

  app.use('/aprobacion-callback', (req, res, next) => {
    validar(req, res, next);
  });

  function validar(req, res, next) {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const tokenDecodificado = jwt.decode(token, app.get('secretBJA'));
      return UsuarioExterno.findByPk(tokenDecodificado.iss)
      .then(resp => {
        if (!resp) throw Error('El ISS no es valido');
        if (resp.iat !== tokenDecodificado.iat) throw Error('El iat no es valido');
        if (resp.key !== tokenDecodificado.key) throw Error('El key no es valido');
        if (resp.estado !== 'ACTIVO') throw Error("El usuario externo no esta activo");
        return next();
      })
      .catch(error => {
        logger.error('error en la validacion ', error);
        return res.status(403).send(Util.formatearMensaje('ERROR', error));
      })
    }
    return res.status(403).send(Util.formatearMensaje('ERROR','Error en las credenciales de acceso.'));
  }

  if( process.env.NODE_ENV =='test'){
    app.use('/api', (req,res,next) => {
      req.body.audit_usuario={
        id_usuario:1,
        usuario: 'TEST',
        roles:[
          {
            fid_rol:1,
            rol:{
              peso:0,
              nombre:'ADMIN',
            },
          },
          {
            fid_rol:2,
            rol:{
              peso:0,
              nombre:'JEFE',
            },
          },
          {
            fid_rol:3,
            rol:{
              peso:0,
              nombre:'OPERADOR',
            },
          },
          {
            fid_rol:4,
            rol:{
              peso:0,
              nombre:'SECRETARIA',
            },
          },
          {
            fid_rol:5,
            rol:{
              peso:0,
              nombre:'CONFIGURADOR',
            },
          },
          {
            fid_rol:6,
            rol:{
              peso:0,
              nombre:'CORRESPONDENCIA',
            },
          },
        ],
      };
      next();
    })
  }
  else {
    // Verifica si el usuario se ha autenticado, para lo cual usa el token como llave.
    app.use('/api',(req,res,next) => {
      const flag = false;
      // Si el metodo de peticion es distinto a 'OPTIONS'.
      if(req.method != 'OPTIONS'){
        // Si existe la autorizacion en la cabecera.
        if(req.headers.authorization){
          // Almacena el token limpio.
          const token = req.headers.authorization.split(" ")[1];
          // Si existe el token.
          if(token){
            // Decodifica el token.
            const tokenDecodificado = jwt.decode(token, app.get('secretBJA'));

            // Si existe el token decodificado.
            if(tokenDecodificado){

              const sesion = app.get("sesion");

              if(!sesion[tokenDecodificado.id_usuario])
              return res.status(403).send({success:false,message:'La sesion finalizo.'})

              if(token !== sesion[tokenDecodificado.id_usuario].token){
                if(sesion[tokenDecodificado.id_usuario].backup !== null){
                  if(token == sesion[tokenDecodificado.id_usuario].backup){
                    const fechaActual = moment().tz('America/La_Paz').format();
                    if(sesion[tokenDecodificado.id_usuario].fecha.format() < fechaActual) return res.status(403).send({success:false,message:'Sesión invalida.'})
                  } else return res.status(403).send({success:false,message:'Sesión invalida.'})
                }
              }
              // Busca al usuario con su estado 'ACTIVO'.
              Usuario.findOne({
                where:{
                  id_usuario:tokenDecodificado.id_usuario,
                  estado:'ACTIVO',
                },
              })
              .then(pUsuario => {
                // Verifica si existe el usuario, si es el mismo usuario del token.
                if(pUsuario && pUsuario.usuario == tokenDecodificado.usuario){
                  // Verifica si existe el campo "secret".
                  if(tokenDecodificado.secret){
                    const secreto = jwt.decode(tokenDecodificado.secret, app.get('secretBJA'));

                    // Verifica si los minutos calculados sean menor a los minutos configurados(expiracion del token).
                    if(genFecha.format() <= secreto.fecha) {
                      // otorga el acceso al sistema.
                      req.body.audit_usuario={
                        id_usuario: tokenDecodificado.id_usuario,
                        usuario: tokenDecodificado.usuario,
                        roles:tokenDecodificado.roles,
                      };

                      return next();

                      // Si el token ya expiro.
                    } else throw new Error("Siga participando...! EXPIRE");

                    // Si el token no contiene el campo cifrado.
                  } else throw new Error("Siga participando...!NOT FOUND")

                  // Si usuario no existe o no es el mismo del token.
                } else throw new Error("Usuario invalido.");

              })

              .catch(pError => res.status(403).send({success:false,message: pError || 'Usuario no valido'}))

            }
            // Si no existe el token decodificado.
            else{
              return res.status(403).send({
                success: false,
                message: 'Fallo la auntenticacion del token.',
              });
            }
          }
          // Si no existe el token.
          else{
            return res.status(403).send({
              success:false,
              message:'Fallo la autenticacion.',
            });
          }
        }
        // Si no existe la autorizacion.
        else{
          return next();
          return res.status(403).send({
            success: false,
            message: ' Fallo la autenticación.',
          });
        }
      }
      // Si es igual a 'OPTIONS'.
      else{
        next();
      }
    });


    app.use('/pdfVerificado', (req, res, next) => {
      if (req.method == 'OPTIONS') return next();
      try {
        if(!req.body.token) throw Error('No existe la cabecera necesaria');
        const token = req.body.token;
        jwt.decode(token, app.get('secretBJA'));
      } catch (error) {
        logger.error('Error en el midleware', error);
        return res.status(403).send({
          success: false,
          message: 'El token de acceso no es valido.',
        });
      }
      // authorization
      next();
    });
  }





};
