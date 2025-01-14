/**
 * Módulo que mapea los ROLES_MENUS.
 *
 * @module
 *
 **/

module.exports = (sequelize, DataType) => {
    const rol_menu = sequelize.define("rol_menu", {
        id_rol_menu: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'Id rol menú',
        },
        fid_rol: {
            type: DataType.INTEGER,
            allowNull: false,
            references: {
                model: 'rol',
                key: 'id_rol',
                onDelete: 'cascade',
            },
            xchoice:'rol',
            unique: 'compositeIndex',
        },
        fid_menu: {
            type: DataType.INTEGER,
            allowNull: false,
            references: {
                model: 'menu',
                key: 'id_menu',
                onDelete: 'cascade',
            },
            xchoice:'menu',
            unique: 'compositeIndex',
        },        
        estado: {
            type: DataType.STRING(30),
            allowNull: false,
            defaultValue: 'ACTIVO',
            validate: {
                isIn: {args: [['ACTIVO', 'INACTIVO', 'ELIMINADO']], msg: "El campo estado sólo permite valores: ACTIVO, INACTIVO o ELIMINADO."},
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
      },
    });
    rol_menu.associate = (models) => {
        rol_menu.belongsTo(models.rol, {as: 'rol', foreignKey: 'fid_rol'});
        rol_menu.belongsTo(models.menu, {as: 'menu', foreignKey: 'fid_menu'});
    };
    return rol_menu;
};
