module.exports = (sequelize, DataType) => {
  const externo = sequelize.define(
    "usuario_externo",
    {
      id_usuario_externo: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        xlabel: "ID",
      },
      entidad: {
        type: DataType.STRING,
        allowNull: false,
        unique: true,
        xlabel: "Entidad",
      },
      contacto: {
        type: DataType.STRING,
        allowNull: false,
        xlabel: "Contacto",
      },
      iat: {
        type: DataType.INTEGER,
        xlabel: "Inicio",
      },
      key: {
        type: DataType.STRING(50),
        xlabel: "Duración",
      },
      estado: {
        type: DataType.ENUM("ACTIVO", "INACTIVO"),
        defaultValue: "ACTIVO",
        xlabel: "Estado",
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

  return externo;
};
