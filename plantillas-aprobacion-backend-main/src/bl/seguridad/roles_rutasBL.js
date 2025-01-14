/**
 * Archivo pra la lógica de negocio para roles_rutas
 * - relacionar permisos de roles_ruta con acciones de ver, crear, modificar y
 * eliminar
 */

 const Q = require('q');

module.exports = {

  /**
   * Función que relaciona permisos (ver, crear, modificar y eliminar) a un
   * rol
   * @param  {Array} rutas       Array de objetos de tipo rutas
   * @param  {Array} roles_rutas Array de objetos de tipo roles_rutas
   * @return {Array}             Array de objetos de tipo rutas con permisos
   */
  establecerRutasPermisos: (rutas, roles_rutas) => {
    const deferred = Q.defer();
    let ruta;
    for(let i = 0; i < rutas.length; i++){
      ruta = rutas[i];
      for(let k = 0; k < roles_rutas.length; k++){
        if(ruta.id_ruta == roles_rutas[k].id_ruta){
          if(roles_rutas[k].method_get)
            rutas[i].dataValues.get = true;
          if(roles_rutas[k].method_post)
            rutas[i].dataValues.post = true;
          if(roles_rutas[k].method_put)
            rutas[i].dataValues.put = true;
          if(roles_rutas[k].method_delete)
            rutas[i].dataValues.delete = true;
        }
      }

      if(i+1  == rutas.length){
          deferred.resolve(rutas);
      }
    }

    return deferred.promise
  },
  /**
   * [function description]
   * @param  {Object} rol_ruta Objeto rol_ruta
   * @param  {Object} rutas Objeto ruta
   * @return {Object} rol_ruta Objeto rol_ruta
   */
  crearRutasPermisos: (rol_ruta, rutas) => {
    let ruta = false;
    if(rutas.hasOwnProperty('get') && rutas.get){
      rol_ruta.method_get = true;
      ruta = true;
    }
    if(rutas.hasOwnProperty('post') && rutas.post){
      rol_ruta.method_post = true;
      ruta = true;
    }
    if(rutas.hasOwnProperty('put') && rutas.put){
      rol_ruta.method_put = true;
      ruta = true;
    }
    if(rutas.hasOwnProperty('delete') && rutas.delete){
      rol_ruta.method_delete = true;
      ruta = true;
    }
    if(ruta){
      return rol_ruta;
    }else{
      return null;
    }
  },

};
