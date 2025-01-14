const PATH_PKCS11_FIRMA = '/FirmaPkcs11PdfLib.jar';
const { exec } = require('child_process');
const comandoBase = 'java -jar :libreriaJar -doc :documentoPdf';

const ejecutarComando = (comando) => new Promise((resolve,reject) => {
  exec(comando, (error, stdout, stderr) => {
    try {
      if(error) throw Error(error);
      const resp = JSON.parse(stdout);      
      return resolve(resp);
    } catch (e) {
      return reject(e);
    }
  });
});


const obtenerFirmas = (pdf) => {

  const libreria = `${__dirname}${PATH_PKCS11_FIRMA}`;
  const comando = comandoBase.replace(':libreriaJar', libreria).replace(':documentoPdf', pdf);

  return ejecutarComando(comando);
};


module.exports = {
  obtenerFirmas,
  ejecutarComando,
};
