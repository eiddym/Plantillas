const jwt = require("jwt-simple");
const LdapStrategy = require("passport-ldapauth");
const passport = require("passport");
const crypto = require("crypto");
const util = require('../../lib/util');
const bl = require('../../bl/seguridad/usuarioBL');
const Uuid = require('uuid');
const moment = require('moment');

module.exports = app => {
  // configuracion para authenticacion por base de datos
  const usuarios = app.src.db.models.usuario;
  const UsuariosRoles = app.src.db.models.usuario_rol;
  const Roles = app.src.db.models.rol;
  const RolesMenus = app.src.db.models.rol_menu;
  const Menus = app.src.db.models.menu;
  const cfg = app.src.config.config;
  const Unidad = app.src.db.models.unidad;
  const AuthUser = app.src.db.models.auth_user;
  const ConfNotificacion = app.src.db.models.conf_notificacion;
  const Sequelize = app.src.db.Sequelize;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const OPTS = cfg.ldap;
  passport.use(new LdapStrategy(OPTS, (payload, done) =>
    done(null, {
      nombre: payload.givenName,
      apellido: payload.sn,
      email: payload.mail,
      uid: payload.uid,
      cargo: payload.title ||'Sin cargo',
    })
  ));

  passport.initialize();

/**
 * Funcion que realiza la autenticacion, sea usando ldap ó localmente; si se usa
 * ldap en el primer acceso al sistema, registra al usuario en el mismo, usando
 * los datos obtenidos del ldap.
 * @param  {Objeto} req           Objeto http de peticion.
 * @param  {Objeto} res           Objeto http de respuesta
 * @param  {Numero} [usar_ldap=1] Bandera para usar autenticacion local o ldap.
 * @return {[type]}               [description]
 */
function xautenticacion(req, res, usar_ldap=1){

  let menu, rol, usuario;
  let roles=[];
  usar_ldap=req.user ? 1 : usar_ldap;

  if(req.body.username && req.body.password){

    // Declara constantes.
    const email = req.body.username;
    const contrasena = req.body.password;

    const condicion = {
      usuario:req.body.username,
    };
    if(!req.user) {
      condicion.contrasena=crypto.createHash("SHA256").update(req.body.password).digest("hex");
    }
    // Busca al usuario en base a los parametros de "email" y "contrasena".
    usuarios.findOne({where:condicion})
    .then(pUsuario => {
      if(req.user && !pUsuario){

        return bl.procesaUsuario(req.user, UsuariosRoles, Unidad, AuthUser, usuarios)
        .then(pRespuesta => ConfNotificacion.create({
            fid_usuario:pRespuesta.id_usuario,
            _usuario_creacion:pRespuesta.id_usuario,
          })
          .then(pConf => pRespuesta)
        )
        .catch(pErrorProceso => {throw new Error(pErrorProceso)})
      }
      else return pUsuario;
    })
    // Control que verifica si existe el usuario.
    .then(pUsuario => {
      // Verifica si el usuario existe y esta activo.
      if(pUsuario){
        if(pUsuario.estado=='ACTIVO') return usuario = pUsuario;
        else throw new Error("Este usuario esta inactivo.");
      }
      // Si usuario no existe.
      else {
        throw  new Error("Verifique los datos ingresados");
      }
    })
    // Obtiene los roles, para luego posteriormente obtener los menus.
    .then(() => bl.obtenerRoles(UsuariosRoles, Roles, usuario.id_usuario)
      .then(pRespuesta => bl.obtenerMenus(RolesMenus, Menus, pRespuesta)
        .then(pRespuestaMenu => {
          menu=pRespuestaMenu.menu
          // roles.push(pRespuestaMenu.rol)
          roles=pRespuestaMenu.rol;
        })
      )
    )
    // Realiza el armado del objeto respuesta.
    .then(() => {

      const cifrar = {
        id_usuario: usuario.id_usuario,
        usuario: usuario.usuario,
        secret:jwt.encode({
          fecha:moment().tz('America/La_Paz').add(cfg.tiempo_token,'minutes').format(),
          clave:Uuid.v4(),
        }, cfg.jwtSecret),
        clave:Uuid.v4(),
        tiempo:cfg.tiempo_token,
        virtual: usuario.virtual,
        roles,
      }

      const usuarioEnviar={
        id: usuario.id_usuario,
        username: usuario.usuario,
        first_name: usuario.nombres,
        last_name:usuario.apellidos,
        cargo: usuario.cargo,
        doc: usuario.numero_documento,
        email: usuario.email,
        date_joined: usuario._fecha_creacion,
        ldap:req.ldap,
      }

      const datosTemporal={
        user:usuarioEnviar,
        menu:menu.menu,
        menuEntrar:menu.menuEntrar,
        roles,
      }
      const token=jwt.encode(cifrar, app.src.config.config.jwtSecret);
      const sesion= app.get("sesion");

      // sesion[usuario.id_usuario]=token
      sesion[usuario.id_usuario]={
        fecha:moment(moment().tz('America/La_Paz').format()).add(1,'minutes'),
        backup:null,
        token,
      }

      if(!req.user){
        if(usuario.contrasena=== crypto.createHash("SHA256").update(req.body.password).digest("hex")){
          app.set("sesion", sesion);
          res.status(200).send(util.formatearMensaje("EXITO","Acceso al sistema correcto",datosTemporal,token));
        }
        else res.status(200).send(util.formatearMensaje("INFORMACION","Contraseña incorrecta."));
      }
      else
        res.status(200).send(util.formatearMensaje("EXITO","Acceso al sistema correcto",datosTemporal,token));
    })
    .catch( (error) => {
      res.status(412).send(util.formatearMensaje("ERROR",error));
    });

  }
  // Si no existe datos.
  else{
    res.status(412).send(util.formatearMensaje("INFORMACION","No hay datos para procesar."));
  }
}

/**
  @apiVersion 2.0.0
  @apiGroup Seguridad
  @apiName Post autenticar
  @api {post} /api/v1/autenticar Autentica al usuario

  @apiDescription Post autenticar, login del usuario, se le asigna un token

  @apiParam (Peticion) {Texto} username Nombre de usuario
  @apiParam (Peticion) {Texto} password Contraseña del usuario

  @apiParamExample {json} Ejemplo para enviar:
  {
  	"username":"usuarioTest",
  	"password":"contrasena"
  }

  @apiSuccess (Respuesta) {Texto} user Usuario
  @apiSuccess (Respuesta) {Texto} menu Menú disponible para el usuario
  @apiSuccess (Respuesta) {Texto} menuEntrar Menú especial disponible
  @apiSuccess (Respuesta) {Texto} roles Roles del usuario
  @apiSuccess (Respuesta) {Texto} token Token asignado al usuario para la sesión actual

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Acceso al sistema correcto",
    "datos": {
      "user":	{
        "id":	74,
        "username":	"jperez",
        "first_name":	"Juan",
        "last_name":	"Perez",
        "cargo":	"Asistente Jurídico",
        ...
      },
      "menu":	[
        {
          "id_menu":	7,
          "label":	"DOCUMENTOS",
          "url": "",	
          "icon":	"folder",
          "submenu":	[…]
        }
      ],
      "menuEntrar":	"/monitoreo",
      "roles":	[
        {
          "fid_rol":	3,
          "rol":	"{…}"
        }
      ]
    }
    "token": "TOKEN.........."
  }
*/

// La siguiente línea trabaja con LDAP, realiza una autenticación con el servidor LDAP y si el usuario no existe en el sistema, lo adiciona a partir de la información
// del servidor LDAP. Descomentar la línea y comentar app.post("/autenticar", (req,res) => {
// app.post("/autenticar", interceptar, (req,res) => {

// La siguiente línea trabaja directamente con el sistema, es una autenticación directa con la base de datos del sistema. Funcionará si la línea app.post("/autenticar", interceptar, (req,res) => {
// está comentada.
// app.post("/autenticar", (req,res) => {
//   xautenticacion(req, res, 1);
// });

function interceptar(req, res, next){
  passport.authenticate("ldapauth", cfg.jwtSession, (err, user, info) => {
    if(err) return next(err);
    if(!user){
      req.ldap=false;
      res.status(412).send(util.formatearMensaje("ERROR","Verifique los datos ingresados."));
    }
    else{
      req.ldap=true;
      req.user = user;
      next();
    }
  })(req,res,next);
}

/**
  @apiVersion 2.0.0
  @apiGroup Seguridad
  @apiName Get refrescar
  @api {get} /api/v1/refrescar Mantiene activa la sesión del usuario

  @apiDescription Get refrescar, Mantiene activa la sesión del usuario

  @apiSuccess (Respuesta) {Texto} token Token que le permite seguir activo

  @apiSuccessExample {json} Respuesta:
  HTTP/1.1 200 OK
  {
    "tipoMensaje": "EXITO",
    "mensaje": "Acceso al sistema correcto",
    "datos": {}
    "token": "TOKEN.........."
  }
*/

app.get('/api/v1/refrescar', (req,res) => {

  const tokenBackup = req.headers.authorization.split(" ")[1];
  if(tokenBackup){
    const tokenDecodificado = jwt.decode(tokenBackup, app.get('secretBJA'));
    if(tokenDecodificado){
      // Busca al usuario con su estado 'ACTIVO'.
      usuarios.findOne({
        where:{
          id_usuario:tokenDecodificado.id_usuario,
          estado:'ACTIVO',
        },
      })
      .then(pUsuario => {

        // Verifica si existe el usuario, si es el mismo usuario del token.
        if(pUsuario && pUsuario.usuario == tokenDecodificado.usuario){

          if(tokenDecodificado.secret){
            const secreto = jwt.decode(tokenDecodificado.secret, app.get('secretBJA'));

            // Verifica si la fecha actual es aun valida.
            if(moment().tz('America/La_Paz').format() <= secreto.fecha) {


              const cifrar = {
                id_usuario: tokenDecodificado.id_usuario,
                usuario: tokenDecodificado.usuario,
                secret:jwt.encode({
                  fecha:moment().tz('America/La_Paz').add(cfg.tiempo_token,'minutes').format(),
                  clave:Uuid.v4(),
                }, cfg.jwtSecret),
                clave:Uuid.v4(),
                tiempo:cfg.tiempo_token,
                roles:tokenDecodificado.roles,
                virtual: pUsuario.virtual,
              }

              const token=jwt.encode(cifrar, app.src.config.config.jwtSecret);
              const sesion = app.get("sesion");

              // Actualiza los datos de la sesión.
              sesion[cifrar.id_usuario].token=token;
              sesion[cifrar.id_usuario].backup=tokenBackup;
              sesion[cifrar.id_usuario].fecha=moment(moment().tz('America/La_Paz').format()).add(1,'minutes');

              // Aplica los cambios a la sesión.
              app.set("sesion", sesion);


              res.status(200).send(util.formatearMensaje("EXITO","Acceso al sistema correcto",{},token));

              // Si el token ya expiro.
            } else throw new Error("Siga participando...");
          } else throw new Error("Siga participando...");
          // Si usuario no existe o no es el mismo del token.
        } else throw new Error("Usuario invalido.");

      })
      .catch(pError => res.status(403).send(util.formatearMensaje("ERROR", pError)))
    }
    else res.status(403).send(util.formatearMensaje("ERROR", "Falló la autenticacion"));
  }
  else res.status(403).send(util.formatearMensaje("ERROR", "Falló la autenticacion"));


});


};
