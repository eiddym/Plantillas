module.exports = (sequelize, DataType) => {
  const historial_catalogo = sequelize.define(
    "historial_catalogo",
    {
      id_historial_catalogo: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        xlabel: "ID",
      },
      fid_catalogo: {
        type: DataType.INTEGER,
        xlabel: "catalogo",
      },      
      accion: {
        type: DataType.ENUM("CREAR", "MODIFICAR", "ELIMINAR"),
        allowNull: false,
        xlabel: "Acción",
      },
      datos: {
        type: DataType.JSON,
        allowNull: false,
        xlabel: "Datos",
      },
      _usuario_creacion: {
        type: DataType.INTEGER,
        allowNull: false,
        xlabel: "Usuario de creación",
      },
      _usuario_modificacion: {
        type: DataType.INTEGER,
        xlabel: "Usuario de modificación",
      },
    },
    {
      createdAt: "_fecha_creacion",
      updatedAt: "_fecha_modificacion",
      freezeTableName: true,
      classMethods: {
        associate: (models) => {},
      },
    }
  );

  return historial_catalogo;
};
