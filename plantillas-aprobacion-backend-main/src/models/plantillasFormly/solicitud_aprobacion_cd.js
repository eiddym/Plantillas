/**
 * Modelo para tabla de Documentos
 * @param {type} sequelize
 * @param {type} DataType
 * @returns documento
 */
module.exports = (sequelize, DataType) => {
  const solicitud_aprobacion_cd = sequelize.define("solicitud_aprobacion_cd", {
    uuid_solicitud: {
      type: DataType.STRING,
      allowNull: false,
      xlabel: 'Identificador Aprobación cd',
    },
    respuesta_servicio_aprobacion: {
      type: DataType.TEXT,
      allowNull: true,
      xlabel: 'Respuesta del servicio de aprobación',
    },
    fecha_aprobacion: {
      type: DataType.DATE,
      allowNull: true,
      xlabel: 'fecha',
    },
    tipo: {
      type: DataType.ENUM('DOCUMENTO', 'ADJUNTO'),
      xlabel: 'Tipo de documento',
      allowNull: false,
    },
    estado: {
      type: DataType.ENUM('SOLICITADO', 'APROBADO_CD', 'FALLIDO'),
      xlabel: 'Estado de la solicitud',
      allowNull: false,
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
  solicitud_aprobacion_cd.associate = (models) => {
    solicitud_aprobacion_cd.belongsTo(models.documento, { as: 'solicitud_aprobacion_cd', foreignKey: 'fid_documento' });
    solicitud_aprobacion_cd.belongsTo(models.adjunto_aprobacion_cd, { as: 'adjunto_aprobacion_cd', foreignKey: 'fid_adjunto_aprobacion_cd' });
  };
  return solicitud_aprobacion_cd;
};
