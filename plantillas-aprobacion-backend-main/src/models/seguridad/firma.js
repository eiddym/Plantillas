module.exports = (sequelize, DataType) => {
  const firma = sequelize.define('firma', {
    id_firma: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    fid_documento: {
      type: DataType.INTEGER,
      allowNull: false,
      references: {
        model: 'documento',
        key: 'id_documento',
      },
    },
    hash: {
      type: DataType.TEXT,
      xlabel: 'hash',
    },
    codigo: {
      type: DataType.STRING(10),
      allowNull: false,
      xlabel: 'Código',
    },
    _usuario_creacion: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Usuario de creación',
    },
     _usuario_modificacion: {
      type: DataType.INTEGER,
    },
  }, {
    createdAt: '_fecha_creacion',
    updatedAt: '_fecha_modificacion',
    freezeTableName: true,
    classMethods: {},
  });
  firma.associate= (models) => {
    firma.belongsTo(models.documento, {as: 'documento', foreignKey:'fid_documento'});
  };
  return firma;
};
