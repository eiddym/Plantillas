/**
 * Modelo para Usuarios del sistema
 *
 **/
 const crypto = require("crypto");

module.exports = (sequelize, DataType) => {
    const usuario = sequelize.define("usuario", {
        id_usuario: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        fid_unidad: {
            type: DataType.INTEGER,
            allowNull: true,
            references: {
                model: 'unidad',
                key: 'id_unidad',
            },
            xchoice:'abreviacion',
        },
        usuario: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
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
        nombres: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre(s)',
        },
        apellidos: {
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
        virtual: {
            type: DataType.BOOLEAN,
            xlabel: 'virtual',
            defaultValue: false,
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
    usuario.associate = (models) => {
      usuario.hasMany(models.usuario_rol, {as: 'usuario_rol', foreignKey: 'fid_usuario'});
      usuario.belongsTo(models.unidad, {as: 'unidad', foreignKey: 'fid_unidad'});
      usuario.hasOne(models.conf_notificacion, {as: 'configuracion', foreignKey: 'fid_usuario'});
    };

    //Hash password usuario MD5 para eventos de actualizacion y creacion
    const hashPasswordHook = (instance) => {
        if (!instance.changed('contrasena')) return false;
        const contrasena = instance.get('contrasena');
        const password = crypto.createHash("SHA256").update(contrasena).digest("hex");
        instance.set('contrasena', password);
    };
    usuario.beforeCreate((usuario, options) => {
      hashPasswordHook(usuario);
      usuario.usuario = usuario.usuario.toLowerCase();
    });

    // usuario.beforeUpdate(hashPasswordHook);
    return usuario;
};
