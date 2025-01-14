'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    const usersRol = [{
      fid_usuario: 1,
      fid_rol: 1,
      _fecha_creacion: new Date(),
      _fecha_modificacion: new Date(),
      _usuario_creacion: 1,
      _usuario_modificacion: 1
    }, {
      fid_usuario: 2,
      fid_rol: 1,
      _fecha_creacion: new Date(),
      _fecha_modificacion: new Date(),
      _usuario_creacion: 1,
      _usuario_modificacion: 1,
    }];

    return queryInterface.bulkInsert('usuario_rol', usersRol, {});
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