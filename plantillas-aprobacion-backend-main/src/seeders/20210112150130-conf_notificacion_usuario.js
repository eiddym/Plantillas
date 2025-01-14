'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    const notificaciones = [{ // fake
        fid_usuario: 2,
        celular: '77777777',
        canal: 'CORREO',
        canal_habilitado: true,
        enviado: true,
        observado: true,
        aprobado: true,
        derivado: true,
        aprobar_ciudadania: true,
        aprobados_ciudadania: true,
        estado: 'ACTIVO',
        _fecha_creacion: new Date(),
        _fecha_modificacion: new Date(),
        _usuario_creacion: 1,
        _usuario_modificacion: 1
      }];

    return queryInterface.bulkInsert('conf_notificacion', notificaciones, {});
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
  }
};
