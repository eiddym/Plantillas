const _ = require('lodash');
const logger = require('../../lib/logger');

module.exports = {
  procesarFirmas: (usuarios, firmas) => new Promise((resolve, reject) => {
    try {
      const firmaUsada = [];
      const validas = usuarios.map(usuario => {
        const nombreUsuario = `${usuario.nombres} ${usuario.apellidos}`.toUpperCase();
        const buscado = _.findIndex(firmas, item => item.nombreComunSubject.toUpperCase() === nombreUsuario);
        const obj = {
          firmante: nombreUsuario,
          firmo: false,
          registradoSistema: true,
        };
        if (buscado > -1) {
          obj.revocado = !firmas[buscado].no_revocado;
          obj.fechaFirma = firmas[buscado].fechaFirma;
          obj.fechaFinValidez = firmas[buscado].finValidez;
          obj.firmo = true;
          firmaUsada.push(firmas[buscado]);
        } else {
          obj.revocado = null;
          obj.fechaFirma = null;
          obj.fechaFinValidez = null;
        }
        return obj;
      });

      const firmaNoUsada = _.differenceWith(firmas, firmaUsada, _.isEqual);
      const noValidas = firmaNoUsada.map(firma => ({
        firmante: firma.nombreComunSubject.toUpperCase(),
        firmo: true,
        registradoSistema: false,
        revocado: !firma.no_revocado,
        fechaFirma: firma.fechaFirma,
        fechaFinValidez: firma.finValidez,
      }));
      let respuesta = validas.concat(noValidas);
      respuesta = _.orderBy(respuesta, 'fechaFirma', 'desc');
      return resolve(respuesta);
    } catch (error) {
      logger.error('Revisando el error al filtrar las firmas', error);
      return reject(error);
    }
  }),

  procesarAprobacion: (usuarios, aprobados) => new Promise((resolve, reject) => {
    try {
      let respuesta = usuarios.map(usuario => {
        const nombreUsuario = `${usuario.nombres} ${usuario.apellidos}`.toUpperCase();
        const obj = {
          firmante: nombreUsuario,
          firmo: null,
          registradoSistema: true,
          revocado: null,
          fechaFirma: null,
          fechaFinValidez: null,
        };
        const buscado = _.findIndex(aprobados, item => item._usuario_creacion === usuario.id_usuario);
        if (buscado > -1) {
          obj.firmo = true;
          const servicio = aprobados[buscado].respuesta_servicio_aprobacion || {};
          obj.fechaFirma = JSON.parse(servicio).fechaHoraSolicitud;
        }
        return obj;
      });
      respuesta = _.orderBy(respuesta, 'fechaFirma', 'desc');
      return resolve(respuesta);
    } catch (error) {
      logger.error('Revisando el error al filtrar aprobados', error);
      return reject(error);
    }
  }),
};