'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    var roles_menus_array = [];

    //admin permiso a todo
    for (var i = 1; i <= 10; i++) {
      if (i != 1 ) {
        var obj = {
          fid_menu: i,
          fid_rol: 1,
          estado: 'ACTIVO',
          _fecha_creacion: new Date(),
          _fecha_modificacion: new Date(),
          _usuario_creacion: 1,
          _usuario_modificacion:1
        };
        roles_menus_array.push(obj);
      }
    }

    // JEFE
    var obj = [
      // documentos
      { fid_rol: 2, fid_menu: 7, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos
      { fid_rol: 2, fid_menu: 8, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // aprobar documentos
      { fid_rol: 2, fid_menu: 9, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // docuentos en curso
      { fid_rol: 2, fid_menu: 12, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de monitoreo.
      { fid_rol: 2, fid_menu: 13, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de firma
     // { fid_rol: 2, fid_menu: 14, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de mis catalogos
      { fid_rol: 2, fid_menu: 18, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de catalogos compartidos
      { fid_rol: 2, fid_menu: 19, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos para aprobar con ciudadania
      { fid_rol: 2, fid_menu: 15, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
    ];
    roles_menus_array = roles_menus_array.concat(obj);

    // OPERADOR
    var obj = [
      // documentos
      { fid_rol: 3, fid_menu: 7, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos
      { fid_rol: 3, fid_menu: 8, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de derivados
      { fid_rol: 3, fid_menu: 11, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de firma
//      { fid_rol: 3, fid_menu: 14, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de mis catalogos
      { fid_rol: 3, fid_menu: 18, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de catalogos compartidos
      { fid_rol: 3, fid_menu: 19, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos para aprobar
      { fid_rol: 3, fid_menu: 15, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
    ];
    roles_menus_array = roles_menus_array.concat(obj);
    
    // SECRETARIA
    var obj = [
      // documentos
      { fid_rol: 4, fid_menu: 7, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos
      { fid_rol: 4, fid_menu: 8, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // imprimir documentos
      { fid_rol: 4, fid_menu: 10, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja documentos derivados
      { fid_rol: 4, fid_menu: 11, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de firma
////      { fmd_rol: 4, fid_menu: 14, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de mis catalogos
      { fid_rol: 4, fid_menu: 18, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de catalogos compartidos
      { fid_rol: 4, fid_menu: 19, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos para aprobar con ciudadania
      { fid_rol: 4, fid_menu: 15, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
    ];
    roles_menus_array = roles_menus_array.concat(obj);


    // CONFIGURADOR
    var obj = [
      // documentos
      { fid_rol: 5, fid_menu: 7, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos
      { fid_rol: 5, fid_menu: 8, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // configuracion de plantillas
      { fid_rol: 5, fid_menu: 2, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja documentos derivados
      { fid_rol: 5, fid_menu: 11, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
    ];
    roles_menus_array = roles_menus_array.concat(obj);

    // CORRESPONDENCIA
    var obj = [
      // documentos
      { fid_rol: 6, fid_menu: 7, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de documentos
      { fid_rol: 6, fid_menu: 8, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // bandeja de aprobacion
      { fid_rol: 6, fid_menu: 9, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
      // imprimir documentos
      { fid_rol: 6, fid_menu: 10, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },

    ];
    roles_menus_array = roles_menus_array.concat(obj);
    // CONTACTOS
    var obj = [
      // contactos
      { fid_rol: 7, fid_menu: 15, estado: 'ACTIVO', _fecha_creacion: new Date(), _fecha_modificacion: new Date(), _usuario_creacion: 1, _usuario_modificacion:1 },
    ];
    roles_menus_array = roles_menus_array.concat(obj);


    return queryInterface.bulkInsert('rol_menu', roles_menus_array, {});
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
