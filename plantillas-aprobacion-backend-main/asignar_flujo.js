const Promise = require('bluebird');
const pg = require('pg');
const config = require(`${__dirname}/src/config/config`)();
const configDB = `${config.params.dialect}://${config.username}:${config.password}@${config.params.host}:${config.params.port}/${config.database}`;

console.log(".::: Iniciando con la asignacion de flujos para documentos antiguos a la implementacion del historico :::.");
const pgCliente = new pg.Client(configDB);

pgCliente.connect();
ejecutarConsulta("SELECT * FROM documento WHERE estado='APROBADO'")
.then(pDocumentos => {
  console.log("revisando los registros obtenidos", pDocumentos.length);
  if(pDocumentos.length>0){
    const campos=`id_documento,accion,_usuario_creacion,_fecha_creacion, _fecha_modificacion,observacion`;
    return pDocumentos.forEach((pItem, pIndice) => {
      const fecha = new Date(pItem._usuario_creacion);
      const fechaAux = new Date(pItem.fecha);
      const fechaEnvio=`${fecha.getFullYear()}-${fecha.getMonth()+1}-${fecha.getDate()}:${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}`
      const fechaAprobacion=`${fechaAux.getFullYear()}-${fechaAux.getMonth()+1}-${fechaAux.getDate()}:${fechaAux.getHours()}:${fechaAux.getMinutes()}:${fechaAux.getSeconds()}`
      const fechaCierre=`${fechaAux.getFullYear()}-${fechaAux.getMonth()+1}-${fechaAux.getDate()}:${fechaAux.getHours()}:${fechaAux.getMinutes()}:${fechaAux.getSeconds()+1}`;

      const valores = `(${pItem.id_documento},'ENVIADO',${pItem._usuario_creacion},'${fechaEnvio}','${fechaEnvio}','s/n'),
      (${pItem.id_documento},'APROBADO',${pItem.para.substring(1,pItem.para.length-1)},'${fechaAprobacion}','${fechaAprobacion}','s/n'),
      (${pItem.id_documento},'CERRADO',${pItem.para.substring(1,pItem.para.length-1)},'${fechaCierre}','${fechaCierre}','s/n')`;
      const consulta=`INSERT INTO historial_flujo (${campos}) VALUES ${valores};`;

      return ejecutarConsulta(consulta)
      .then(pRespuestaCrear =>
        ejecutarConsulta(`UPDATE documento set estado='CERRADO',
        grupo=${pItem.id_documento} where id_documento=${pItem.id_documento};`)
        .then(pRespuestaUpdate => {
          if(pIndice == pDocumentos.length-1){
            pgCliente.end();
          }
        }))
    })
  }
  else {
    pgCliente.end();
  }
})
.catch(pError => {
  console.log("Error en la ejecucion ", pError);
  pgCliente.end();
})

/**
 Funcion que ejecuta una promesa.
 @param {pConsulta} Texto Cadena que contiene la consulta a ejecutar.
 @return retorna una promesa.
 */
function  ejecutarConsulta(pConsulta){

  return new Promise((resolve,reject) => {
    // Instancia una consulta del tipo cliente.
    const query=pgCliente.query(pConsulta)

    // Durante la ejecucion de la consulta,
    query.on("row", (pFila,pResultado) => {
        pResultado.addRow(pFila);
    });

    query.on("end", pResultado => {
      if(pResultado.command == 'UPDATE')
        (pResultado.rowCount ==1)?resolve(true):resolve(false);
      else if(pResultado.command == 'INSERT'){
        (pResultado.rowCount ==1)?resolve(true):resolve(false);
      }
      else
        resolve(pResultado.rows);
    })

  });
}
