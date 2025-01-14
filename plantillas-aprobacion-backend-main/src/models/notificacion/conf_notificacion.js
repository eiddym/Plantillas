/**
 * Modelo para tabla de configuracion de notificaciones.
 * @param {type} sequelize
 * @param {type} DataType
 * @returns unidad
 */
 module.exports = (sequelize, DataType) => {
    const conf_notificacion = sequelize.define("conf_notificacion", {
        id_conf_notificacion: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        fid_usuario: {
            type: DataType.INTEGER,
            allowNull:false,
            unique:true,
            references:{
              model:'usuario',
              key:'id_usuario',
            },
            xlabel: 'Usuario',
        },
        celular: {
            type: DataType.STRING(10),
            allowNull:true,
            xlabel: 'Celular',
        },
        canal: {
            type: DataType.ENUM('SMS', 'CORREO','SMS_CORREO'),
            defaultValue: 'CORREO',
            xlabel: 'Canal',
        },
        canal_habilitado: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel:'Canal habilitado',
        },
        enviado: {
          type: DataType.BOOLEAN,
          defaultValue:true,
          xlabel: 'Enviados',
        },
        observado: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel: 'Observaciones',
        },
        aprobado: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel: 'Aprobados',
        },
        derivado: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel: 'Derivados',
        },
        aprobar_ciudadania: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel: 'Deba aprobar con Ciudadania Digital',
        },
        aprobados_ciudadania: {
            type: DataType.BOOLEAN,
            defaultValue:true,
            xlabel: 'Han sido aprobados con Ciudadania Digital',
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
    },{
        createdAt: '_fecha_creacion',
        updatedAt: '_fecha_modificacion',
        freezeTableName: true,
        classMethods: {
        },
    });
    conf_notificacion.associate = (models) => {
        conf_notificacion.belongsTo(models.usuario, {as: 'usuario', foreignKey: 'fid_usuario'});
    };
    return conf_notificacion;
};
