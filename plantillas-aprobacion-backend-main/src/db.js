
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
let db = null;
module.exports = app => {

  if (!db) {
    const config = app.src.config.config.database;
    const Op = Sequelize.Op;
    const alias = {
      $eq: Op.eq,
      $ne: Op.ne,
      $gte: Op.gte,
      $gt: Op.gt,
      $lte: Op.lte,
      $lt: Op.lt,
      $not: Op.not,
      $in: Op.in,
      $notIn: Op.notIn,
      $is: Op.is,
      $like: Op.like,
      $notLike: Op.notLike,
      $iLike: Op.iLike,
      $notILike: Op.notILike,
      $regexp: Op.regexp,
      $notRegexp: Op.notRegexp,
      $iRegexp: Op.iRegexp,
      $notIRegexp: Op.notIRegexp,
      $between: Op.between,
      $notBetween: Op.notBetween,
      $overlap: Op.overlap,
      $contains: Op.contains,
      $contained: Op.contained,
      $adjacent: Op.adjacent,
      $strictLeft: Op.strictLeft,
      $strictRight: Op.strictRight,
      $noExtendRight: Op.noExtendRight,
      $noExtendLeft: Op.noExtendLeft,
      $and: Op.and,
      $or: Op.or,
      $any: Op.any,
      $all: Op.all,
      $values: Op.values,
      $col: Op.col,
    };
    config.params.operatorsAliases = alias;
    const sequelize = new Sequelize(
    config.name,
    config.username,
    config.password,
    config.params
    );

    db = {
      sequelize,
      Sequelize,
      models: {},
    };

    const dirModels = path.join(__dirname, "models");
    // Obtiene los modelos del directorio "models".
    fs.readdirSync(dirModels).forEach(dir => {
      if(fs.statSync(`${dirModels}/${dir}`).isDirectory()){
        const subDirModels = path.join(dirModels, dir);
        if(dir !== "ejemplos") // commentar si es que se quieren cargar los modelos de ejemplos
          fs.readdirSync(subDirModels).forEach(file => {
            const pathFile = path.join(subDirModels, file);
            // const model = sequelize.import(pathFile);
            const model = require(pathFile)(sequelize, Sequelize.DataTypes)
            // Almacena los objetos modelo en un JSON.
            db.models[model.name] = model;
          });
      }
    });
    console.log("cargando asociaciones....");
    Object.keys(db.models).forEach(key => {
        console.log(`---->${key+db.models[key]}`);
        // Control de relaciones(associate) de los modelos.
        if(db.models[key].associate!=undefined){
          db.models[key].associate(db.models);

        }
    });

  }
 return db;
};
