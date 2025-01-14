module.exports = (app) => {
  const _app = app;
  _app.dao = {};
  _app.dao.autorizacion = {};

  const AuthModel = app.src.db.models.auth;

  /**
   * Función para guardar los parametros de inicio de flujo para autenticación
   * @param {string} _state
   * @param {string} _parametros
   * @returns {JSON}
   */
  async function guardarState(_state, _parametros) {
    const datos = await AuthModel.create({ state: _state, parametros: _parametros });
    return datos;
  }

  /**
   * Función de actualización en el objeto auth
   * @param {object} auth
   * @returns {JSON}
   */
  async function actualizarTokens(auth) {
    const authActualizar = {
      tokens: auth.tokens,
      id_usuario: auth.id_usuario,
      estado: 'ACTIVO',
    };
    const query = {
      where: {
        state: auth.state,
        estado: 'INICIO',
      },
    };
    const datos = await AuthModel.update(authActualizar, query);
    return datos;
  }

  /**
   * Función de busqueda del objeto oauth a partir del parametro codigo=id_usuario
   * @param {string} _id_usuario
   * @param {string} _state
   * @returns {JSON}
   */
  async function buscaToken(_id_usuario, _state) {
    const datos = await AuthModel.findOne({
      where: {
        id_usuario: _id_usuario,
        state: _state,
        estado: 'ACTIVO',
      },
      // order: [['id', 'DESC']],
    });
    return datos;
  }

  /**
   * Función de busqueda del objeto oauth a partir del parametro state
   * @param {string} estado
   * @returns {JSON}
   */
  async function buscaState(estado) {
    const datos = await AuthModel.findOne({ where: { state: estado, estado: 'INICIO' } });
    return datos;
  }


  _app.dao.autorizacion.guardarState = guardarState;
  _app.dao.autorizacion.buscaState = buscaState;
  _app.dao.autorizacion.buscaToken = buscaToken;
  _app.dao.autorizacion.actualizarTokens = actualizarTokens;
};
