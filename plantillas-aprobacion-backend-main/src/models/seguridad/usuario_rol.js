/**
 * Módulo que mapea los USUARIOS_ROLES.
 *
 * @module
 *
 **/

module.exports = (sequelize, DataType) => {
    const usuario_rol = sequelize.define("usuario_rol", {
        id_usuario_rol: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'Id usuario rol',
        },
        fid_usuario: {
            type: DataType.INTEGER,
            allowNull: false,
            references: {
                model: 'usuario',
                key: 'id_usuario',
                onDelete: 'cascade',
            },
            xchoice:'usuario',
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
        },
        estado: {
            type: DataType.ENUM('ACTIVO', 'INACTIVO'),
            allowNull: false,
            defaultValue: 'ACTIVO',
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
    usuario_rol.associate = (models) => {
        usuario_rol.belongsTo(models.usuario, {as: 'usuario_rol',foreignKey: 'fid_usuario'});
        usuario_rol.belongsTo(models.rol, {as: 'rol',foreignKey: 'fid_rol'});
    };
    return usuario_rol;
};
