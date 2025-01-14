module.exports = (sequelize, DataType) => {
  const catalogo_usuario = sequelize.define('catalogo_usuario', {
    id_catalogo_usuario: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    fid_catalogo: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Catalogo',
    },
    fid_usuario: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Usuario',
    },
    lectura: {
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      xlabel: 'Lectura',
    },
    escritura: {
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      xlabel: 'Escritura',
    },
    eliminar: {
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      xlabel: 'Eliminar',
    },
    estado: {
      type: DataType.ENUM('ACTIVO', 'INACTIVO', 'ELIMINADO'),
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
  }, {
    createdAt: '_fecha_creacion',
    updatedAt: '_fecha_modificacion',
    freezeTableName: true,
    classMethods: {
    },
  });
  catalogo_usuario.associate = (models) => {
    catalogo_usuario.belongsTo(models.catalogo, { as:'catalogo', foreignKey:'fid_catalogo' });
  };

  return catalogo_usuario;
};