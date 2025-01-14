const _ = require('lodash');
const hash = require('object-hash');

module.exports = {


  validarPlantilla: (plantillas, plantillaValidar) => {
    const hashAValidar = hash(JSON.parse(plantillaValidar));
    const estadosValidos= ['ACTIVO'];
    let respuesta = false;
    let cont = 0;

    _.map(plantillas, item => {
      const objTemp = item.dataValues;
      if(estadosValidos.indexOf(objTemp.estado) > -1) {
        const hashTemp = hash(JSON.parse(objTemp.plantilla));
        if(hashAValidar === hashTemp) cont++;
      }
    });

    if(cont > 0) respuesta = true;
    return respuesta;
  },

  /**
   * Función que actualiza el identificador del grupo de  un documento.
   * @param  {Modelo} modeloDocumento Modelo de datos del documento
   * @param  {Objeto} doc             Instancia del documento
   * @param  {Objeto} tr              Instancia de la transaccion en curso
   * @return {Promesa}                Retorna una promesa.
   */
  actualizarGrupo: (modeloDocumento, doc, tr) =>
  new Promise( (resolve, reject) => {
    if(doc.documento_padre){
      modeloDocumento.findById(doc.documento_padre)
      .then( doc_padre => doc.update({grupo: doc_padre.grupo}, tr))
      .then( resu =>  resolve(resu))
      .catch( e => reject(e));
    }else {
      doc.update({grupo: doc.id_documento}, tr)
      .then( resu =>  resolve(resu))
      .catch( e => reject(e));
    }
  }),

};
