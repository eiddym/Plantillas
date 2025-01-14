/**
 * Modelo para Usuarios del sistema
 *
 **/

module.exports = (sequelize, DataType) => {
    const usuario = sequelize.define("usuario_his", {
        id_usuario_his: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        fid_usuario: {
            type: DataType.INTEGER,
            allowNull:false,
            references:{
              model:'usuario',
              key:'id_usuario',
            },
            xlabel: 'Usuario',
        },
        usuario: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre de usuario',
        },
        contrasena: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Contraseña',
        },
        numero_documento: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nro documento de identidad',
        },
        nombre: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre(s)',
        },
        apellido: {
            type: DataType.STRING,
            xlabel: 'Apellidos',
            allowNull: false,
        },        
        cargo: {
            type: DataType.STRING,
            xlabel: 'Cargo',
            allowNull: false,
        },
        email: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
            xlabel: 'Correo electrónico',
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

    });
    return usuario;
};
