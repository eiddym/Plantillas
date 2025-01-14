/**
 * Modelo para tabla de Documentos
 * @param {type} sequelize
 * @param {type} DataType
 * @returns documento
 */
module.exports = (sequelize, DataType) => {
  const adjunto_aprobacion_cd = sequelize.define("adjunto_aprobacion_cd", {
    nombre_publico: {
      type: DataType.STRING,
      allowNull: false,
      xlabel: 'Nombre público',
    },
    nombre_privado: {
      type: DataType.STRING,
      allowNull: false,
      xlabel: 'Nombre privado',
    },
    url: {
      type: DataType.TEXT,
      allowNull: false,
      xlabel: 'url',
    },
    estado: {
      type: DataType.ENUM('NUEVO', 'APROBADO', 'ELIMINADO'),
      defaultValue: 'NUEVO',
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
  adjunto_aprobacion_cd.associate = (models) => {
    adjunto_aprobacion_cd.belongsTo(models.documento, { as: 'adjunto_aprobacion_cd', foreignKey: 'fid_documento' });
    adjunto_aprobacion_cd.hasMany(models.solicitud_aprobacion_cd, {as: 'solicitud_aprobacion_cd', foreignKey: 'fid_adjunto_aprobacion_cd'});
  };
  return adjunto_aprobacion_cd;
};
