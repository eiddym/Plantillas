const passport2 = require("passport");
const Strategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

module.exports = app => {

  const Funcionarios = app.src.db.models.Funcionarios;

  const cfg = app.src.config.config;
  const params = {
    secretOrKey: cfg.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  };


  const strategy = new Strategy(params, (payload, done) => {
    Funcionarios.findByUid(payload.id)
      .then(funcionario => {
        if (funcionario) {
          return done(null, {
            id: funcionario.uid,
          });
        }
        return done(null, false);
      })
      .catch(error => {
        console.log("Error stategy ldap", error);
        done(error, null);
      });
  });


  passport2.use(strategy);

  return {
    initialize: () => passport2.initialize(),
    authenticate: () => passport2.authenticate("jwt", cfg.jwtSession),
  };
};
