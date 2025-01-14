/**
 * Modelo para tabla de Plantilla Formly
 * @param {type} sequelize
 * @param {type} DataType
 * @returns plantilla
 */
module.exports = (sequelize, DataType) => {
    const plantillaFormly = sequelize.define("plantilla_formly", {
        id_plantilla_formly: {
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
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Abreviación',
        },
        plantilla: {
            type: DataType.TEXT,
            allowNull: false,
            xlabel: 'Plantilla',
        },
        plantilla_valor: {
            type: DataType.TEXT,
            allowNull: true,
            xlabel: 'Valores',
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
    return plantillaFormly;
};
