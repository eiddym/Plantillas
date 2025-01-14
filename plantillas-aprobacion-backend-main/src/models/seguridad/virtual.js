module.exports = (sequelize, DataType) => {
  const virtual = sequelize.define("virtual", {
    id_virtual: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    fid_usuario_titular: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Titular',
    },
    fid_usuario_virtual: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Descripción',
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
  }, {
    createdAt: '_fecha_creacion',
    updatedAt: '_fecha_modificacion',
    freezeTableName: true,
    classMethods: {
      associate: (models) => {
        // rol.hasMany(models.rol_menu, {
        //   as: 'rol_menu',
        //   foreignKey: 'fid_rol'
        // });
        // rol.hasMany(models.usuario_rol, {
        //   as: 'usuario_rol',
        //   foreignKey: 'fid_rol'
        // });
      },
    },
  });
  return virtual;
};
