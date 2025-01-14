module.exports = (sequelize, DataType) => {
  const catalogo_documento = sequelize.define('catalogo_documento', {
    id_catalogo_documento: {
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
    fid_documento: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Documento',
    },
    descripcion: {
      type: DataType.TEXT,
      allowNull: false,
      xlabel: 'Lectura',
    },
    estado: {
      type: DataType.ENUM('ACTIVO', 'INACTIVO', 'ELIMINADO'),
      allowNull: false,
      defaultValue: 'ACTIVO',
      xlabel: 'Estado',
    },
    orden: {
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 0,
      xlabel: 'Orden',
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

  return catalogo_documento;
};