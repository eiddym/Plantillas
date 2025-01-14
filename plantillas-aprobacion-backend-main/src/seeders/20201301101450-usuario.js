'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    const users = [{
      fid_unidad: 1,
      usuario: 'sys_default',
      contrasena: '3fb7b39416f1d067268747fc214494d759d2609f863ace1a8a76705618d5c80b',//Developer
      numero_documento: '1111111',
      nombres: 'system',
      apellidos: 'default ',
      cargo: 'Default system user',
      email: 'user@default.net',
      estado: 'ACTIVO',
      _fecha_creacion: new Date(),
      _fecha_modificacion: new Date(),
      _usuario_creacion: 1,
      _usuario_modificacion: 1
    }, { // fake
        fid_unidad: 1,
        usuario: '10794552-1J',
        contrasena: '3fb7b39416f1d067268747fc214494d759d2609f863ace1a8a76705618d5c80b', //Developer
        numero_documento: '10794552-1J',
        nombres: 'FABIOLA',
        apellidos: 'SANCHEZ VACA',
        cargo: 'Default',
        email: '10794552-1J@mailinator.com',
        estado: 'ACTIVO',
        _fecha_creacion: new Date(),
        _fecha_modificacion: new Date(),
        _usuario_creacion: 1,
        _usuario_modificacion: 1
      }];

    return queryInterface.bulkInsert('usuario', users, {});
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