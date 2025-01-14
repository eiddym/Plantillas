/**
 * Modelo para tabla de Documentos
 * @param {type} sequelize
 * @param {type} DataType
 * @returns correlativo
 */
module.exports = (sequelize, DataType) => {
    const correlativo = sequelize.define("correlativo", {
        id_correlativo: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            xlabel: 'ID',
        },
        abreviacion: {
            type: DataType.STRING,
            allowNull: false,
            xlabel: 'Nombre',
        },
        valor: {
            type: DataType.INTEGER,
            allowNull: false,
            xlabel: 'Plantilla',
        },
        anio: {
            type: DataType.STRING(4),
            allowNull: false,
            xlabel: 'Plantilla',
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
    return correlativo;
};
