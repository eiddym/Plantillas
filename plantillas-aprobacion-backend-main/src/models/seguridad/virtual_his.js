module.exports = (sequelize, DataType) => {
  const virtual_his = sequelize.define("virtual_his", {
    id_virtual_his: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      xlabel: 'ID',
    },
    fid_virtual: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'origen',
    },
    id_virtual: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'titular',
    },
    id_titular: {
      type: DataType.INTEGER,
      allowNull: false,
      xlabel: 'Descripción',
    },
    accion: {
      type: DataType.ENUM('ACTIVO', 'INACTIVO'),
      defaultValue: 'ACTIVO',
      xlabel: 'Accion',
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
  return virtual_his;
};
