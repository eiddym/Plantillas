/**
 * Modelo para tabla de Menus
 * @param {type} DataType
 * @returns menu
 */
module.exports = (sequelize, DataType) => {
    const menu = sequelize.define("menu", {
        id_menu: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        fid_menu_padre: {
            type: DataType.INTEGER,
            allowNull: true,
            references: {
                model: 'menu',
                key: 'id_menu',
                onDelete: 'cascade',
                xchoice:'nombre',
            },
            xlabel:'Menú padre',
        },
        nombre: {
            type: DataType.STRING(100),
            allowNull: false,
            unique: true,
            xlabel: 'Nombre',
        },
        descripcion: {
            type: DataType.STRING(150),
            allowNull: true,
            xlabel: 'Descripción',
        },
        orden: {
          type: DataType.INTEGER,
          xlabel: 'Orden',
        },
        ruta: {
            type: DataType.STRING(100),
            allowNull: true,
            xlabel: 'Ruta',
        },
        icono: {
            type: DataType.STRING(100),
            allowNull: true,
            xlabel: 'Ícono',
        },
        estado: {
            type: DataType.ENUM('ACTIVO', 'INACTIVO'),
            allowNull: false,
            defaultValue: 'ACTIVO',
            validate: {
              isIn:{args:[['ACTIVO', 'INACTIVO']], msg:"Debe seleccionar una opcion de estado."},
            },
            xlabel: 'Estado',
        },
        _usuario_creacion: {
            type: DataType.INTEGER,
            allowNull: false,
            xlabel: 'Usuario de creación',
        },
        _usuario_modificacion: {
            type: DataType.INTEGER,
            xlabel: 'Usuario de modificación',
        },
    },{
        createdAt: '_fecha_creacion',
        updatedAt: '_fecha_modificacion',
        freezeTableName: true,
        classMethods: {          
          buscarMenusSubmenus: () => menu.findAll({
              attributes: ["id_menu", "nombre", "descripcion", "orden", "ruta", "icono", "estado", "fid_menu_padre"],
              where: {estado: 'ACTIVO', fid_menu_padre: null},
              include: [
                {
                  model: sequelize.models.menu,
                  join: 'left',
                  attributes: ["id_menu", "nombre", "descripcion", "orden", "ruta", "icono", "estado", "fid_menu_padre"],
                  as: 'submenu',
                  where: {estado: 'ACTIVO'},
                  paranoid: false,
                  required: false,
                  order: 'orden ASC',
                },
              ],
              order: 'orden ASC',
          }),
          buscarPorId: (id_menu) => menu.findById(id_menu, {
            attributes: ["id_menu", "nombre", "descripcion", "orden", "ruta", "icono", "estado", "fid_menu_padre"],
          }),
        },
    });
    menu.associate = (models) => {
      menu.belongsTo(models.menu, {as: 'menu_padre', foreignKey: 'fid_menu_padre'});
      menu.hasMany(models.menu, {as: 'submenu', foreignKey: 'fid_menu_padre'});
      menu.hasMany(models.rol_menu, {as: 'rol_menu', foreignKey: 'fid_menu'});
    };

    menu.beforeCreate((menu, options) => {
      if (menu.nombre == undefined) {
        throw new Error("El campo nombre menú es obligatorio.");
      }
      if(menu.nombre != null)
        menu.nombre = menu.nombre.toUpperCase();
    });

    menu.beforeUpdate((menu, options) => {
      if (menu.nombre == undefined) {
        throw new Error("El campo nombre menú es obligatorio.");
      }
      if(menu.nombre != null)
        menu.nombre = menu.nombre.toUpperCase();
    });

    return menu;
};
