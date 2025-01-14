const _ = require('lodash');
const Uuid = require('uuid');
const { Issuer, TokenSet } = require('openid-client');
Issuer.defaultHttpOptions = { timeout: 15000 };
const config = require('./../../config/config')();
const requestPromise = require('util').promisify(require('request'));
const logger = require('../../lib/logger');

const crypto = require("crypto");

const lastAccessToken = async (modelos, usuario, clienteCD) => {
  try {
    const authLast = await modelos.auth.findOne({
      where: { id_usuario: usuario },
      order: [['id', 'DESC']],
      raw: true,
    });
    if (!authLast) {
      throw new Error('No se pudo verificar la sesión')
    }
    // return authLast;
    if (authLast && authLast.tokens && authLast.tokens.expires_at) {
      const tokenSet = new TokenSet(authLast.tokens);
      if (tokenSet.expired()) {
        const refreshTokenResp = await clienteCD.refresh(authLast.tokens.refresh_token);
        authLast.tokens.expires_at = refreshTokenResp.expires_at;
        authLast.tokens.refresh_token = refreshTokenResp.refresh_token;
        authLast.tokens.id_token = refreshTokenResp.id_token;
        authLast.tokens.access_token = refreshTokenResp.access_token;
        await modelos.auth.update({tokens: authLast.tokens}, { where: { id: authLast.id } });
      }
    }
    return authLast;
  } catch (error) {
    logger.error(error)
    return error;
  }
}

module.exports = {
  aprobarPdfConCiudadaniaDigital: async (modelos, cite, pdfBase64, userId, clienteOIDC, tipo, fid_adjunto_aprobacion_cd, fid_documento) => {
    const lastAccToken = await lastAccessToken(modelos, userId.toString(), clienteOIDC);
    if (!lastAccToken || !lastAccToken.tokens || !lastAccToken.tokens.access_token) {
      throw new Error('No se pudo recuperar la session, ingrese nuevamente');
    }
    const aprobacionCDConfig = config.aprobacionCD;
    const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex');
    const hashDocumento = sha256(pdfBase64);
    const data = {
      tipoDocumento: 'PDF',
      documento: pdfBase64,
      hashDocumento,
      idTramite: Uuid.v4(),
      descripcion: cite,
      token: lastAccToken.tokens.access_token,
    };
    await modelos.solicitud_aprobacion_cd.create({
      uuid_solicitud: data.idTramite,
      tipo,
      estado: 'SOLICITADO',
      _usuario_creacion: userId,
      fid_adjunto_aprobacion_cd,
      fid_documento,
    })
    try {
      const configRequest = {
        url: aprobacionCDConfig.url,
        method: 'POST',
        headers: {
          Authorization: `${aprobacionCDConfig.token}`,
          'content-type': 'application/json',
        },
        body: data,
        json: true,
      };
      const resAprobacion = await requestPromise(configRequest);
      return resAprobacion;
    } catch (error) {
      logger.error('error :>> ', error);
      return error;
    }
  },
};
