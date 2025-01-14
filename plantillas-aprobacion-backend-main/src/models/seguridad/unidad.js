/**
 * Modelo para tabla de Unidades organizacionales
 * @param {type} sequelize
 * @param {type} DataType
 * @returns unidad
 */
module.exports = (sequelize, DataType) => {
    const unidad = sequelize.define("unidad", {
        id_unidad: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        nombre: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre',
        },
        abreviacion: {
            type: DataType.TEXT,
            allowNull: false,
            xlabel: 'Abreviación',
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
          associate: (models) => {

          },
        },
    });
    return unidad;
};
