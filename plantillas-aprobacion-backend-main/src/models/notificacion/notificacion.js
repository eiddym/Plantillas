/**
 * Modelo para tabla de notificaciones.
 * @param {type} sequelize
 * @param {type} DataType
 * @returns unidad
 */
module.exports = (sequelize, DataType) => {
    const notificacion = sequelize.define("notificacion", {
        id_notificacion: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        destinatario: {
          type: DataType.INTEGER,
          allowNull:false,
          xlabel: 'Usuario',
        },
        canal: {
          type: DataType.ENUM('SMS','CORREO','SMS_CORREO'),
          allowNull: false,
          xlabel: 'Nombre',
        },
        mensaje: {
          type: DataType.TEXT,
          allowNull: false,
          xlabel: 'Mensaje',
        },
        estado: {
          type: DataType.ENUM('ACTIVO', 'INACTIVO'),
          defaultValue: 'ACTIVO',
          xlabel: 'Estado',
        },
        tipo: {
          type: DataType.ENUM('EXITO', 'ERROR'),
          defaultValue: 'EXITO',
          xlabel: 'Tipo',
        },
        detalle: {
          type: DataType.TEXT(),
          xlabel: 'detalle',
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
          associate: (models) => {

          },
        },
    });
  notificacion.associate = (models) => {
    notificacion.belongsTo(models.documento, {
      as: "notificacion",
      foreignKey: "fid_documento",
    });
  }
    return notificacion;
};
