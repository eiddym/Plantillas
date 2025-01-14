

module.exports = (sequelize, DataType) => {
  const contacto = sequelize.define('contacto', {
    id_contacto: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    grado: {
      type: DataType.STRING(150),
      allowNull: true,
      xlabel: 'Grado',
    },
    nombres: {
      type: DataType.STRING(150),
      allowNull: false,
      xlabel: 'Nombres',
    },
    apellidos: {
      type: DataType.STRING(150),
      allowNull: false,
      xlabel: 'Apellidos',
    },
    cargo: {
      type: DataType.STRING(250),
      xlabel: 'Cargo',
    },
    entidad: {
      type: DataType.STRING(250),
      xlabel: 'Entidad',
    },
    tipo_entidad: {
      type: DataType.STRING(250),
      xlabel: 'Tipo entidad',
    },
    sigla: {
      type: DataType.STRING(80),
      xlabel: 'Sigla',
    },
    direccion: {
      type: DataType.TEXT,
      xlabel: 'Dirección',
    },
    telefono: {
      type: DataType.TEXT,
      xlabel: 'Teléfono',
    },
    departamento: {
      type: DataType.STRING(50),
      xlabel: 'departamento',
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
  }, {
    createdAt: '_fecha_creacion',
    updatedAt: '_fecha_modificacion',
    freezeTableName: true,
    classMethods: {
      associate: (models) => {},
    },
  });
  
  return contacto;
};