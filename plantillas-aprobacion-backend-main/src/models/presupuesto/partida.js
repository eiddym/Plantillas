/**
 * Modelo para tabla de Menus
 * @param {type} DataType
 * @returns partida
 */
module.exports = (sequelize, DataType) => {
    const partida = sequelize.define("partida", {
        id_partida: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        cite_ref: {
            type: DataType.STRING(100),
            allowNull: true,
            xlabel: 'Cite',
        },
        cite: {
            type: DataType.STRING(100),
            allowNull: true,
            xlabel: 'Cite',
        },
        numero: {
            type: DataType.STRING(50),
            allowNull: false,
            xlabel: 'Código',
        },
        descripcion: {
            type: DataType.TEXT,
            allowNull: true,
            xlabel: 'Descripción',
        },
        monto: {
          type: DataType.DECIMAL(15,2),
          xlabel: 'Valor inicial',
        },
        fid_partida: {
            type: DataType.INTEGER,
            xlabel: 'Id de la partida ligada',
        },
        multiple: {
            type: DataType.INTEGER,
            xlabel: 'Id de la partida a quien pertenece el pago multiple',
        },
        gestion: {
          type: DataType.STRING(5),
          allowNull: false,
          xlabel: 'Gestión',
        },
        estado: {
            type: DataType.ENUM('ACTIVO', 'INACTIVO'),
            allowNull: false,
            defaultValue: 'ACTIVO',
            validate: {
              isIn:{args:[['ACTIVO', 'INACTIVO']], msg:"Debe seleccionar una opcion de estado."},
            },
            xlabel: 'Estado',
        },
        tipo: {
            type: DataType.ENUM('INICIAL', 'MODIFICADO', 'COMPROMETIDO', 'PAGADO', 'REVERTIDO'),
            allowNull: false,
            validate: {
              isIn:{args:[['INICIAL', 'MODIFICADO', 'COMPROMETIDO', 'PAGADO', 'REVERTIDO']], msg:"Debe seleccionar una opción de tipo."},
            },
            xlabel: 'Tipo',
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
            // partida.belongsTo(models.partida, {as: 'menu_padre', foreignKey: 'fid_menu_padre'});
            // partida.hasMany(models.partida, {as: 'submenu', foreignKey: 'fid_menu_padre'});
            // partida.hasMany(models.rol_menu, {as: 'rol_menu', foreignKey: 'fid_menu'});
          },
        },
    });

    return partida;
};
