const Issuer = require('openid-client').Issuer;
let client = null;
let issuer = null;

module.exports = async (app) => {
  if (!client) {
    const config = app.src.config.config;

    async function discovery() {
      if (!issuer) {
        issuer = await Issuer.discover(config.issuer);
      }
      return issuer;
    }

    issuer = await discovery();
    // inicializamos datos de registro del cliente
    client = new issuer.Client(app.src.config.config.client);
    client.CLOCK_TOLERANCE = 5;
  }
  return client;
};
