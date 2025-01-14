const Promise = require('bluebird');
const Uuid = require('uuid');
const moment = require('moment');
const logger = require('../../lib/logger');

module.exports = {
  /**
   * Método que realiza la creación o actualización de los registros monitor,
   * cuando un usuario visita un determinado documento
   * @param  {Modelos} pModelo Modelos de la base de datos.
   * @param  {Objeto} pLog     Objeto con información sobre la visita en curso.
   * @return {Promesa}
   */
  registrarVisita:(pModelo, pLog) => {
    // Agrega a la informacion de visita la fecha actual.
    pLog.fecha_visita = moment().tz("America/La_Paz").format("YYYY-MM-DD");

    // Almacena un clon del vector ip.
    const ip = pLog.ip;

    // Agrega a la informacion de visita el vector de ip's en modo texto.
    pLog.ip = JSON.stringify(pLog.ip);

    // Instancia el modelo monitor, responsable de registrar visitas.
    const Monitor = pModelo.monitor;

    // Instancia un nuevo objeto.
    const datos={};

    // Instancia una nueva promesa.
    return new Promise((resolve, reject) => {

      // Realiza la busqueda, con relacion a la visita actual.
      Monitor.findOne({
        where:{
          fid_usuario:pLog.fid_usuario,
          fid_documento:pLog.fid_documento,
        },
      })
      .then(pMon => {
        // Si se encuentra registrada la visita.
        if(pMon){

          // Transforma las ip regitrada en modo texto a vector.
          const ips= JSON.parse(pMon.ip);

          let c=0;

          // Itera las IP's obtenidas en la visita actual.
          for(let i=0; i<ip.length;i++){
            // Verifica si una de las ip actual ya estaba registrada.
            if(ips.indexOf(pLog[i])){ c++; }
          }

          if(moment(pMon.fecha_visita).format("YYYY-MM-DD")==pLog.fecha_visita && c>0){
            // Actualiza la información de la visita.
            pLog._usuario_modificacion=pLog.fid_usuario;
            pLog.contador=pMon.dataValues.contador+1;

            // Actualiza la información de la visita
            return pMon.update(pLog).then(() => resolve());
          }else {

            // Actualiza la información de la visita a registrar.
            pLog.contador=1;
            pLog._usuario_creacion=pLog.fid_usuario;

            // Registra la visita.
            return Monitor.create(pLog).then(() => resolve());

          }

        }
        // Si no se encuentra registrada la visita.
        else{

          // Actualiza la información de la visita a registrar.
          pLog.contador=1;
          pLog._usuario_creacion=pLog.fid_usuario;
          // pLog['fecha_visita']= moment().tz("America/La_Paz").format("YYYY-MM-DD");

          // Registra la visita.
          return Monitor.create(pLog).then(() => resolve())
        }
      })
      .catch(pError => {
        logger.error("Error al crear el registro del monitor", pError);
        resolve()
      })
    })
  },
};
