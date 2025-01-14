module.exports = (sequelize, DataType) => {
  const catalogo = sequelize.define('catalogo', {
    id_catalogo: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    nombre: {
      type: DataType.TEXT,
      allowNull: false,
      xlabel: 'Nombre',
    },
    descripcion: {
      type: DataType.TEXT,
      allowNull: false,
      xlabel: 'Descripción',
    },
    comentario: {
      type: DataType.TEXT,
      xlabel: 'Comentario',
    },
    propietario: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'propietario',
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
  catalogo.associate = (models) => {
    catalogo.hasMany(models.catalogo_usuario, {as: 'catalogo_usuario', foreignKey: 'fid_catalogo'});
    catalogo.hasMany(models.catalogo_documento, {as: 'catalogo_documento', foreignKey: 'fid_catalogo'});
  };
  
  return catalogo;
};