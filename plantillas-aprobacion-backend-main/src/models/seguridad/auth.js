/**
 * auth
 *
 * @module
 *
 **/

module.exports = (sequelize, DataType) => {
  const auth = sequelize.define('auth', {
    state: {
      type: DataType.STRING(100),
      allowNull: false,
      unique: 'uniqueSelectedItem',
    },
    parametros: { // nonce
      type: DataType.JSONB,
      allowNull: true,
    },
    tokens: { // id_token, access_token, refresh_token
      type: DataType.JSONB,
      allowNull: true,
    },
    id_usuario: { // id_usuario
      type: DataType.STRING(20),
      allowNull: true,
    },
    estado: {
      type: DataType.STRING(30),
      allowNull: false,
      defaultValue: 'INICIO',
      validate: {
        isIn: { args: [['INICIO', 'ACTIVO', 'ELIMINADO']], msg: 'Estado no permitido.' },
      },
    },
  }, {
    classMethods: {
      associate: () => {
      },
    },
    tableName: 'auth',
  });
  return auth;
};
