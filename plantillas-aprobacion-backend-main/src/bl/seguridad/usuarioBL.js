
const hash = require('object-hash');
const Promise = require('bluebird');
const Op = require('sequelize').Op;
const logger = require('../../lib/logger');

module.exports={

  /** Función que procesa los datos ldap del usuario.
    @param {Objeto} pDatos Objeto que contiene los datos del usuario ldap.
    @param {Modelo} pModeloUsuarioRol modelo de datos de la tabla usuario_rol.
    @param {Modelo} pModeloUnidad modelo de datos de la tabla unidad.
    @param {Modelo} pModeloAuth modelo de datos de la tabla auth_user.
    @param {Modelo} pModeloUsuario modelo de datos de la tabla usuario.
   */
  procesaUsuario:(pDatos, pModeloUsuarioRol, pModeloUnidad, pModeloAuth, pModeloUsuario) => {
    let resultado;
    return new Promise((resolve,reject) => {
      const insertar={
        // fid_unidad:pUnidad,
        usuario:pDatos.uid,
        contrasena:'',
        numero_documento: pDatos.numero_documento || '11111111',
        nombres:pDatos.nombre || 'Nombres',
        apellidos:pDatos.apellido,
        cargo:pDatos.cargo,
        email:pDatos.email || 'email@email.gob.bo',
        _usuario_creacion:1,
      }

      // Inserta el usuario ldap en la tabla usuario.
      return pModeloUsuario.create(insertar)
      .then(pRespuesta => {
        resultado=pRespuesta;
        const insertarUsuarioRol={
          fid_rol:module.exports.obtenerRol(pRespuesta.cargo),
          fid_usuario:pRespuesta.id_usuario,
          _usuario_creacion:pRespuesta._usuario_creacion,
        };

        // Crea el rol del usuario.
        return pModeloUsuarioRol.create(insertarUsuarioRol)
        .then(pRol => resolve(resultado))
        .catch(pErrorRol => reject(pErrorRol))
      })
      .catch(pError => reject(pError))

    })
  },

  /** Función que obtiene la unidad.
    @param {Modelo} pModeloUnidad modelo de datos de la tabla unidad.
    @param {Modleo} pModeloAuth modelo de datos de la tabla auth_user.
    @param {Texto} pUsuario  nombre del usuario.
    @return retorna una promesa, con la unidad.
   */
  obtenerUnidad: (pModeloUnidad, pModeloAuth, pUsuario) => {

    let unidad='';
    let unidadAux='';
    return new Promise ((resolve, reject) => {
      pModeloAuth.findOne({
        attributes:['unidad_dependencia'],
        where:{username: pUsuario},
      })
      .then(pRespuestaAuth =>
        unidadAux=module.exports.quitarAcentos(pRespuestaAuth.dataValues.unidad_dependencia)
      )
      .then(() =>
        pModeloUnidad.findAll({attributes:['nombre', 'id_unidad']})
        .then(pRespuestaUnidad => pRespuestaUnidad.forEach((pItem, pIndice) => {
          unidad = module.exports.quitarAcentos(pItem.dataValues.nombre);
          if(unidadAux == unidad) resolve(pItem.id_unidad);
          else resolve(null);
        }))
        .catch(pErrorUnidad => reject(pErrorUnidad))
      )
      .catch(pErrorAuth => reject(pErrorAuth))
    });

  },

  /** Función que obtiene el rol basado en una cadena de texto que es su cargo.
    @param {Texto} pCadena cadena de texto que es el cargo del usuario.
    @return {Número} retorna un numero identificador del rol en base a su cargo.
   */
  obtenerRol:(pCadena) => {
    const texto = pCadena.toLowerCase();
    if(texto.search("responsable") > -1 || texto.search("jefe") > -1 ||  texto.search("director") > -1) return 2
    else if(texto.search("secretaria") > -1) return 4;
    else return 3;
  },

  /** Función que limpia una cadena de texto de acentos
    @param {Texto} pCadena cadena de texto con tildes.
    @return {Texto} retorna la cadena de texto sin tildes.
   */
  quitarAcentos: (pCadena) => {
    let cadena =  pCadena.toLowerCase();

    // Quita los acentos.
    cadena = cadena.replace(/á/gi,"a");
    cadena = cadena.replace(/é/gi,"e");
    cadena = cadena.replace(/í/gi,"i");
    cadena = cadena.replace(/ó/gi,"o");
    cadena = cadena.replace(/ú/gi,"u");

    return cadena;
  },

  /** Función que ordena el menu.
   @param {Vector} pRolesMenu Vector de objetos, con informacion sobre roles y
   menus.
   @return {Objeto} Objeto con informacion de los menus y el menu de ingreso.
   */
  ordenarMenu:(pRolesMenu) => {
    const respuesta={};
    const menusDevolver=[],menusDevolverAux=[];
    let  menuEntrar=null;

    for(const r in pRolesMenu){
      const menu = pRolesMenu[r].menu;
      const padre = pRolesMenu[r].menu.menu_padre;
      const objPadre = JSON.stringify(padre);
      let existe = false;
      for(let g = 0; g < menusDevolverAux.length; g++){
        if(JSON.stringify(menusDevolverAux[g]) == objPadre){
          existe = true;
          break;
        }
      }

      if(!existe){
        delete padre.estado;
        menusDevolverAux.push(padre)
      }
      else if(menu.fid_menu_padre == null ){
        const menuDatos = JSON.parse(JSON.stringify(menu));
        delete menuDatos.menu_padre;
        menusDevolverAux.push(menuDatos);
      }
    }

    for (const i in menusDevolverAux) {

      const padre = JSON.parse(JSON.stringify(menusDevolverAux[i]));
      if(padre != null){
        padre.submenu = [];
        for (const j in pRolesMenu) {

          if(padre.id_menu == pRolesMenu[j].menu.fid_menu_padre &&
            pRolesMenu[j].menu.fid_menu_padre != null){

            const hijo = JSON.parse(JSON.stringify(pRolesMenu[j].menu));
            delete hijo.menu_padre;
            delete hijo.estado;
            padre.submenu.push(hijo);

            if(!menuEntrar){
              menuEntrar=`/${hijo.url}`;
            }

          }
        }

        delete padre.estado;
        menusDevolver.push(padre);
      }
    }
    respuesta.menu=menusDevolver;
    respuesta.menuEntrar=menuEntrar;
    return respuesta;
  },

  /** Función que hace una busqueda en la db para obtener los menus de un rol.
    @param {Modelo} pModeloRolMenu modelo de datos de la tabla rol_menu
    @param {Modelo} pModeloMenu modelo de datos de la tabla menu
    @param {Número} pIdRol identificador del rol, para el cual se obtiene los
    menus.
    @return Retorna una promesa, la cual retorna el menu del rol.
   */
  obtenerMenu:(pModeloRolMenu, pModeloMenu, pIdRol) =>
  new Promise((resolve, reject) => {
    pModeloRolMenu.findAll({
      where:{
        fid_rol:pIdRol,
        estado:'ACTIVO',
      },
      include:[{
        model:pModeloMenu,
        as:'menu',
        attributes:[['nombre','label'],['ruta','url'],
        ['icono','icon'],'fid_menu_padre','estado'],
        where:{estado:'ACTIVO'},
        include:[{
          model:pModeloMenu,
          as:'menu_padre',
          attributes:['id_menu',['nombre','label'],['ruta','url'],
          ['icono','icon'],'estado'],
          where:{estado:'ACTIVO'},
        }],
      }],
    })
    .then(pRolesMenu => resolve(module.exports.ordenarMenu(pRolesMenu)))
    .catch(pError => reject(pError))
  }),

  /** Función que busca el rol de mayor peso.
    @param {Modelo} pModeloUsuarioRol modelo de datos de la tabla usuario_rol.
    @param {Modelo} pModeloRol modelo de datos de la tabla rol.
    @param {Número} pIdUsuario identificador del usuario.
    @return retorna una promesa, con el rol.
   */
  buscarRol: (pModeloUsuarioRol, pModeloRol, pIdUsuario) =>
  new Promise((resolve, reject) => {
    pModeloUsuarioRol.findOne({
      // attributes:['fid_rol'],
      where:{
        fid_usuario: pIdUsuario,
        estado: 'ACTIVO'},
      include:[{
        model: pModeloRol,
        as: 'rol',
        order: [['peso','ASC']]}],
    })
    .then(pRespuesta => {
      if(pRespuesta) resolve(pRespuesta)
      else throw new Error("Este usuario no tiene un rol asignado, contacte con el administrador.")
    })
    .catch(pError => reject(pError))
  }),

  /** Función que obtiene los roles de un usuario.
    @param {Modelo} pModeloUsuarioRol modelo de datos de la tabla usuario_rol.
    @param {Modelo} pModeloRol modelo de datos de la tabla rol.
    @param {Número} pIdUsuario indentificador del usuario.
    @return retorna una promesa, con los roles.
   */
  obtenerRoles:(pModeloUsuarioRol, pModeloRol, pIdUsuario) =>
  new Promise((resolve, reject) => {
    pModeloUsuarioRol.findAll({
      attributes:['fid_rol'],
      where:{fid_usuario:pIdUsuario, estado:'ACTIVO'},
      include:[{
        attributes:['peso', 'nombre'],
        model:pModeloRol,
        as:'rol',
        where:{estado:'ACTIVO'},
      }],
    })
    .then(pRespuesta => resolve(pRespuesta?pRespuesta:[]))
    .catch(pError => reject(pError))
  }),

  /** Función que obtiene los menus basado en los roles.
    @param {Modelo} pModeloRolMenu modelo de datos de la tabla rol_menu.
    @param {Modelo} pModeloMenu modelo de datos de la tabla menu.
    @param {Vector} pVector vector de datos, con informacion sobre menus por rol.
  */
  obtenerMenus: (pModeloRolMenu, pModeloMenu,pVector) => {

    const condicion=[]
    const peso=0;
    let rol;
    for(const i in pVector){
      const obj={ fid_rol: pVector[i].dataValues.fid_rol}
      condicion.push(obj)
      const pesoActual = pVector[i].dataValues.rol.dataValues.peso
      if(peso<=pesoActual){
        rol = pVector[i];
      }

    }
    console.log('Revisando la condicion', condicion);
    // const Op = Sequelize.Op;
    return new Promise((resolve, reject) =>
      pModeloRolMenu.findAll({
        where:{
          [Op.or]:condicion,
          estado:'ACTIVO',
        },
        include:[{
          model:pModeloMenu,
          as:'menu',
          attributes:[['nombre','label'],['ruta','url'],
          ['icono','icon'],'fid_menu_padre','estado'],
          where:{estado:'ACTIVO'},
          include:[{
            model:pModeloMenu,
            as:'menu_padre',
            attributes:['id_menu',['nombre','label'],['ruta','url'],
            ['icono','icon'],'estado'],
            where:{estado:'ACTIVO'},
          }],
        }],
      })
      .then(pRespuesta => {
        console.log('Revisando la respuesta', pRespuesta.length);
        const menuOrdenado = module.exports.ordenarMenu(pRespuesta)

        const menu=menuOrdenado.menu;

        for(const i in menu){
          const submenusIterar=menu[i].submenu;
          const submenuFinal=[];
          for(const j in submenusIterar){
            let contador=0;
            if(submenuFinal.length>0){
              for(const k in submenuFinal){
                if(hash(submenusIterar[j]) == hash(submenuFinal[k])) contador ++;
              }
              if(contador ==0) submenuFinal.push(submenusIterar[j]);
            }
            else submenuFinal.push(submenusIterar[0]);
          }
          menu[i].submenu=submenuFinal;
        }
        menuOrdenado.menu = menu;
        const respuesta={
          menu:menuOrdenado,
          rol:pVector,
        }
        resolve(respuesta)
      })
      .catch(pError => {
        logger.error('Errorzango', pError);
        reject(pError)
      })
    )

  },

  buscarRolUno: (id, UsuarioRol, Rol, Usuario, Oficina) => Usuario.findOne({
    where: {
      id_usuario: id,
    },
    include: [{
      model: UsuarioRol,
      as: 'usuario_rol',
      attributes: ['fid_rol', 'estado'],
      required: false,
      where: {
        estado: 'ACTIVO',
      },
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ['id_rol', 'nombre', 'estado'],
        required: false,
      }],
    }],
  }),
  buscarRolTodos: (UsuarioRol, Rol, Usuario, Oficina, condicion) => Usuario.findAll({
    where: condicion,
    order: 'estado ASC, usuario ASC',
    include: [{
      model: UsuarioRol,
      as: 'usuario_rol',
      attributes: ['fid_rol', 'fid_usuario', 'id_usuario_rol', 'estado'],
      where: {
        estado: 'ACTIVO',
      },
      order: 'nombre',
      include: [{
        model: Rol,
        as: 'rol',
        attributes: ["id_rol", "nombre", 'estado'],
      }],
    }],
  }),

}
