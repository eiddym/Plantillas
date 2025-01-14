/**
 * Módulo que mapea los ROLES.
 *
 * @module
 *
 **/

module.exports = (sequelize, DataType) => {
    const rol = sequelize.define("rol", {
        id_rol: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        nombre: {
            type: DataType.STRING(100),
            allowNull: false,
            xlabel: 'Nombre',
        },
        descripcion: {
            type: DataType.STRING,
            allowNull: true,
            xlabel: 'Descripción',
        },
        peso: {
            type: DataType.INTEGER,
            allowNull: false,
            xlabel: 'Peso',
        },
        estado: {
            type: DataType.ENUM('ACTIVO', 'INACTIVO'),
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

          buscar: (condicion) => rol.findAll({
              attributes: ["id_rol", "nombre", "descripcion", "peso", "estado"],
              where: condicion,
              order: 'fecha_creacion ASC',
          }),
        },
    });
    rol.associate = (models) => {
        rol.hasMany(models.rol_menu, {as: 'rol_menu', foreignKey: 'fid_rol'});
        rol.hasMany(models.usuario_rol, {as: 'usuario_rol', foreignKey: 'fid_rol'});
    };
    return rol;
};
