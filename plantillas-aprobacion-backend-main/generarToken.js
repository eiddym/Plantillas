const prompts = require("prompts");
const jwt = require('jwt-simple');
const pg = require("pg");


const config = require(`${__dirname}/src/config/config`)();
const db = config.database;
const configDB = `${db.params.dialect}://${db.username}:${db.password}@${db.params.host}:${db.params.port}/${db.name}`;

console.log(".::: Iniciando la creacion de token para externos :::.");

const preguntas = [
  {
    type: "text",
    name: "entidad",
    message: "Escribe el nombre de la entidad a registrar",
  },
  {
    type: "text",
    name: "contacto",
    message: "Escribe el correo de contacto",
  },
  {
    type: "number",
    name: "duracion",
    message: "Escribe el tiempo de duracion en años.",
    initial: "1",
    validate: (duracion) => (duracion <= 0 ? `la duración minima es de 1 año` : true),
  },
];
const construirPayload = (data) => {
  const fechaLimite = new Date();
  fechaLimite.setFullYear(fechaLimite.getFullYear() + data.duracion);
  const payload = {
    entidad: data.entidad,
    contacto: data.contacto,
    clave: Math.random().toString(36).slice(-8),
    key: Math.random().toString(36).slice(-8),
    iat: Math.trunc(Date.now() / 1000),
    exp: Math.trunc(fechaLimite.getTime() / 1000),
  };
  return payload;
}

const abrirConexion = () => new Promise((resolve) => {
  const pgCliente = new pg.Client(configDB);
  pgCliente.connect();
  return resolve(pgCliente);
})

const ejecutarConsulta = (pConsulta, pgCliente) => new Promise((resolve, reject) => {
  pgCliente.query(pConsulta)
    .then((res) => resolve(res.rows))
    .catch(error => reject(error));
})

const crearExterno = (payload) => {
  let db = null;
  return abrirConexion()
  .then(respConexion => {
    db = respConexion;
    const campos = 'entidad, contacto, iat, key, _fecha_creacion, _fecha_modificacion';
    const valores = `'${payload.entidad}','${payload.contacto}',${payload.iat},'${payload.key}',NOW(),NOW()`;
    return ejecutarConsulta(
      `INSERT INTO usuario_externo(${campos}) 
      VALUES(${valores})
      RETURNING id_usuario_externo;`,
      db
    );
  })
  .then(respConsulta => {
    payload.iss = respConsulta[0].id_usuario_externo;
    db.end();
    return payload;
  })
  .catch(error => {
    console.log('Error en la creacion', error);
    db.end();
  });
}

const iniciar = () => {
  console.log('iniciando');
  prompts(preguntas)
  .then(resp => construirPayload(resp))
  .then(payload => crearExterno(payload))
  .then(respExterno => {
    delete respExterno.contacto;
    const token = jwt.encode(respExterno, config.jwtSecret);
    console.log(`>>>>>>>>>>>>>>>> El token de acceso para ${respExterno.entidad} es <<<<<<<<<<<<<<<<<<<<<<`);
    console.log(token);
    process.exit();

  })
  .catch(error => {
    console.log('Error prompt', error);
    process.exit();

  })
  
};

iniciar();