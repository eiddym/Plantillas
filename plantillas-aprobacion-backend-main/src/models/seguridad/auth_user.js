/**
 * Modelo para datos de usuario (del sistema de control de personal)
 *
 **/
module.exports = (sequelize, DataType) => {
    const auth_user = sequelize.define("auth_user", {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        password: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Contraseña',
        },
        last_login: {
            type: DataType.DATE,
            allowNull: true,
            xlabel: 'Fecha',
        },
        is_superuser: {
            type: DataType.BOOLEAN,
            allowNull: false,
            xlabel: 'Superusuario',
        },
        username: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
            xlabel: 'Nombre de usuario',
        },
        first_name: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre(s)',
        },
        last_name: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Apellidos',
        },
        email: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
            xlabel: 'Correo electrónico',
        },
        is_staff: {
            type: DataType.BOOLEAN,
            allowNull: false,
            xlabel: 'Staff',
        },
        is_active: {
            type: DataType.BOOLEAN,
            allowNull: false,
            xlabel: 'Activo',
        },
        date_joined: {
            type: DataType.DATE,
            allowNull: false,
            xlabel: 'Fecha ingreso',
        },
        cargo: {
            type: DataType.STRING,
            xlabel: 'Cargo',
            allowNull: true,
        },
        ci: {
            type: DataType.STRING,
            xlabel: 'CI',
            allowNull: true,
        },
        habilitado_marcar: {
            type: DataType.BOOLEAN,
            allowNull: false,
            xlabel: 'Habilitado marcar',
        },
        cas: {
            type: DataType.INTEGER,
            allowNull: true,
            xlabel: 'Habilitado',
        },
        fecha_asignacion: {
            type: DataType.DATE,
            allowNull: true,
            xlabel: 'Fecha de asignación',
        },
        nro_item: {
            type: DataType.INTEGER,
            allowNull: true,
            xlabel: 'Nro Item',
        },
        unidad_dependencia: {
            type: DataType.STRING,
            xlabel: 'Unidad',
            allowNull: true,
        },

    },{
        freezeTableName: true,
        timestamps: false,
    });

    return auth_user;
};
