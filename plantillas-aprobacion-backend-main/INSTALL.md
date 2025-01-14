.:: Plantillas Backend ::.
================================================

A continuación se detalla la instalación de la aplicación desde cero.
El presente manual fue probado en un servidor con Debian 9.

# INSTALACIÓN DESDE CERO

## 1. Instalación de paquetes mínimos

```sh 
sudo apt-get update
sudo apt-get install build-essential libssl-dev
sudo apt-get install curl
sudo apt-get install ca-certificates
sudo apt-get install libfontconfig1-dev libfreetype6-dev fontconfig
sudo apt-get install unzip
sudo apt-get install git
sudo apt-get install openjdk-8-jdk-headless
``` 
Si no se cuenta con un servidor LDAP externo, para instalar realizar lo siguiente:
```sh 
sudo apt -y install slapd ldap-utils
``` 

Configurar la estructura del sistema de acuerdo a su Entidad, revisar la documentación [OpenLdap](https://www.openldap.org).

Se puede verificar y validar la instalación con el siguiente comando, que desplega la estructura de la configuración.
```sh 
sudo slapcat

dn: dc=agetic,dc=gob,dc=bo
objectClass: top
objectClass: dcObject
objectClass: organization
o: agetic.gob.bo
dc: agetic
structuralObjectClass: organization
entryUUID: 71da7e0e-d7ac-1039-9bfa-61fe9051f214
creatorsName: cn=admin,dc=agetic,dc=gob,dc=bo
createTimestamp: 20200130130159Z
entryCSN: 20200130130159.199740Z#000000#000#000000
modifiersName: cn=admin,dc=agetic,dc=gob,dc=bo
modifyTimestamp: 20200130130159Z
....
``` 

Se recomienta utilizar un cliente para la administración del ldap
- [Apache Directory](https://directory.apache.org/).
- [phpLdapAdmin](http://phpldapadmin.sourceforge.net/wiki/index.php/Main_Page). 

**Nota Importante: Se recomienda utilizar la versión última del LDAP, que específicamente incorpore el protocolo TLS versión 1.2, debido a que la versión de node 12.x no soporta versiones anteriores.**

## 2. Instalación de PostgreSql
```sh
sudo apt-get install postgresql-9.6
```
Crear la base de datos
```sh
# Cambio al usuario root
sudo su

# Acceso al usuario postgres    
su postgres

# Acceso a línea de comandos de postgres
psql
```
Crear usuario

```sql
CREATE USER miUsuario WITH PASSWORD 'miSuperPassword';
```
Reiniciar el servicio desde el usuario de la máquina virtual ([miUsuarioSistema])
```sh
sudo /etc/init.d/postgresql restart
```

Creando la base de datos
```sh
sudo su
su postgres
su psql
```
```sql
CREATE DATABASE miBaseDeDatos OWNER miUsuario;
```

Creando extensiones necesarias
```sql
\c miBaseDeDatos
CREATE EXTENSION IF NOT EXISTS tablefunc;
```

Lista las bases de datos existentes, verificar si __miBaseDeDatos__ está en la lista.
```sql
\l
\q
```
## 3. Instalación de Node, Node Version Manager NVM

```sh
# Instalar nvm, via curl
curl https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

# Una vez finalizada REINICIAR la terminal para verificar la instalación
nvm --version
```

Instalación de Node v12.22.7 LTS
```sh
nvm install 12.22.7
nvm use 12.22.7

# Verificar la instalación
node --version
```
Instalación de dependencias globales para base de datos vía npm
```sh
npm i -g sequelize sequelize-cli
npm i -g pg pg-hstore
npm i -g apidoc
npm i -g nodemon
```

## 4. Descargar el proyecto
```sh
git clone <url-repositorio_proyecto_plantillas_backend>
cd <directorio_proyecto_plantillas_backend>
```
## 5. Instalación de la Fuente

```sh
# Crear una nueva carpeta
sudo mkdir /usr/share/fonts/truetype/opensans
```

Copiar la fuente desde __recursos/open-sans.zip__ a __/usr/share/fonts/truetype/opensans__

```sh
sudo cp recursos/open-sans.zip /usr/share/fonts/truetype/opensans
cd /usr/share/fonts/truetype/opensans
sudo unzip open-sans.zip
cd -
```
## 6. Archivos de configuración

- Ingresar al directorio src/config dentro el proyecto clonado ```<repositorio_proyecto_plantillas_backend>.```
- Dentro este directorio encontrará dos archivos con los nombres: config.js.sample y config.json.sample posteriormente deberá duplicar ambos archivos y renombrarlos debiendo quedar de la siguiente manera: config.js y config.json

```sh
# Archivo de configuración para la base de datos
cp src/config/config.json.sample src/config/config.json

# Archivo de configuración para el sistema, conexion ldap, variables de sistema
cp src/config/config.js.sample src/config/config.js
``` 
#### Configuración para la conexión de la Base de Datos
Abrir con un editor el archivo config.json, ahí debera configurar los siguientes variables, en los distintos entornos:

- `username`:  Nombre de usuario de la Base de Datos.
- `password`: Contraseña de la Base de Datos.
- `database`: Nombre de la Base de Datos.
- `host`: Host de la Base de Datos.
- `port`: Puerto de despliegue de la Base de Datos.

#### Configuración para las Notificaciones

El sistema admite notificaciones por medio de un Servidor de Correos o el Servicio de Mensajeria (Alertín)

Para definir el medio de notificacion se considera la siguiente variable:

- envio_notificacion: Parametro de configuracion para las notificaciones ('CORREO' o 'ALERTIN')

CONFIGURACION PARA SERVIDOR DE CORREOS

- port: Puerto del servidor para el envió de correos.
- host: Nombre o IP del servidor.
- remitente: Nombre del Sistema.
- origen: Correo origen del cual se enviaran los correos.
- secure: Seguridad TLS cuando se conecta al servidor
- tls: Opciones adicionales de TLS socket.
- ignoreTLS: Variable para el uso de TLS.

CONFIGURACION PARA SERVICIO DE MENSAJERIA ALERTIN

- correo_url: URL de consumo al servicio de Mensajería Electrónico (Alertín).
- correo_token: TOKEN de consumo al servicio de Mensajería Electrónico (Alertín)

#### Configuración para la aprobación de documentos con ciudadanía digital

Abrir el archivo config.js con un editor de su preferencia y deberá configurar los siguientes parámetros en la variable __aprobacionCD__

- `ruta_externos_aprobacion`: Ruta donde se almacenaran los documentos.
- `max_bytes_por_pdf`: Tamaño máximo por archivo pdf.
- `max_sum_bytes_pdfs_por_documento`: Tamaño máxivo de la suma del tamaño de todos los documentos pdf.
- `url`: Ruta del servicio de aprobación de documento con Ciudadanía Digital.
- `url_validar_documento`: Ruta para el servicio de verificación de documento.
- `token`: Token para poder acceder a los servicios de aprobación y verificación de documento.

#### Configuración de recaptcha

  - Debe generar las Claves necesarios en el siguiente link:
  [__RECAPTCHA__](https://www.google.com/recaptcha/admin/create)
  ```https://www.google.com/recaptcha/admin/create```
  
  - Abrir el archivo config.js que se encuentra dentro el directorio src/config/ en el proyecto ```<repositorio_proyecto_plantillas_backend>```  con su editor de texto de preferencia y configurar el siguiente parámetro en la variable __recaptcha__.
  - `secretKey`: Asignar la __CLAVE SECRETA__ obtenida en el link.
## 7. Instalar dependencias e inicializar la db

```sh
# Instalar las dependencias del proyecto
npm i

# Modificar los sequelize handlers del proyecto
npm run parchar

# Inicializar la base de datos y poblar la base de datos
npm run setup
```

## 8. Ejecución de la aplicación

- Modo desarrollo
  
    ```sh
    npm start
    ```
  o si prefiere usar nodemon:

  ***Usando nodemon***
    ```sh
    # Para este caso es necesario tener instalado nodemon de manera global
    # npm i nodemon -g 
    npm run startdev
    ```
    Para más información sobre [__NODEMON__](https://nodemon.io/)
- Modo producción
    
    ** Para este modo revise la configuración en src/config/config.json en la sección __production__
    ```sh
    # Instalar pm2
    npm i -g pm2
    
    # Iniciar el proyecto 
    pm2 start prod.json

    # Listar todas las aplicaciones en ejecución, ahi estará la aplicación  plantillas-backend
    pm2 list
    
    ```
    Configurar el autoinicio, solo la primera vez
    ```sh
    # Configurar el autoinicio
    pm2 startup

    # Generara un comando Similar al siguiente
    # [PM2] To setup the Startup Script, copy/paste the following command:
    # sudo env PATH=$PATH:/home/miUsuario/.nvm/versions/node/v12.14.1/bin /home/miUsuario/.nvm/versions/node/v12.14.1/lib/node_modules/pm2/bin/pm2 startup systemd -u d3x --hp /home/miUsuario

    # Ejecutamos el comando que nos genero  sudo env PATH=$PATH:/ho......
    # Luego ejecutamos, que guarda la lista de procesos
    pm2 save

    ```

    Para más información sobre [__PM2__](https://pm2.keymetrics.io/)

## Modalidad de autenticación.

La autenticación se puede configurar de tres formas diferentes:

    a. Haciendo uso sólamente de la autenticación del sistema.
    b. Haciendo uso del servicio de autenticación LDAP.
    c. Haciendo uso del servicio de autenticación de Ciudadanía Digital.

Las tres opciones son excluyentes.

### a. Haciendo uso sólamente de la autenticación del sistema. 
Para poder usar esta configuración, se debe realizar lo siguiente:

> Editar el archivo ***/src/routes/seguridad/jwtokenRT.js***, en el segmento de cógido (líneas 228-237) que contiene lo siguiente :

```sh
228 // La siguiente línea trabaja con LDAP, realiza una autenticación con el servidor LDAP y si el usuario no existe en el sistema, lo adiciona a partir de la información
229 // del servidor LDAP. Descomentar la línea y comentar app.post("/autenticar", (req,res) => {
230 // app.post("/autenticar", interceptar, (req,res) => {
231
232 // La siguiente línea trabaja directamente con el sistema, es una autenticación directa con la base de datos del sistema. Funcionará si la línea app.post("/autenticar", interceptar, (req,res) => {
233 // está comentada.
234 // app.post("/autenticar", (req,res) => {
235 //   xautenticacion(req, res, 1);
236 // });
237 
```
> Tal como lo explican los comentarios, se debe descomentar las línea 234, 235 y 236. Para la puesta en producción, se deben eliminar las líneas 228, 229, 230, 231, 232 y 233. Quedando así, el siguiente segmento de código:

``` sh
app.post("/autenticar", (req,res) => {
  xautenticacion(req, res, 1);
});
```

### b. Haciendo uso del servicio de autenticación LDAP.
Para poder usar esta configuración, se debe realizar lo siguiente:

> Editar el archivo ***/src/routes/seguridad/jwtokenRT.js***, en el segmento de cógido (líneas 228-237) que contiene lo siguiente :

```sh
228 // La siguiente línea trabaja con LDAP, realiza una autenticación con el servidor LDAP y si el usuario no existe en el sistema, lo adiciona a partir de la información
229 // del servidor LDAP. Descomentar la línea y comentar app.post("/autenticar", (req,res) => {
230 // app.post("/autenticar", interceptar, (req,res) => {
231
232 // La siguiente línea trabaja directamente con el sistema, es una autenticación directa con la base de datos del sistema. Funcionará si la línea app.post("/autenticar", interceptar, (req,res) => {
233 // está comentada.
234 // app.post("/autenticar", (req,res) => {
235 //   xautenticacion(req, res, 1);
236 // });
237 
```
> Tal como lo explican los comentarios, se debe descomentar las líneaas 230, 235 y 236. Para la puesta en producción, se deben eliminar las líneas 228, 229, 231, 232, 233 y 234. Quedando así, el siguiente segmento de código:

``` sh
app.post("/autenticar", interceptar, (req,res) => {
  xautenticacion(req, res, 1);
});
```
Se requiere de la configuración de LDAP, que ya fue explicada en este archivo.
### c. Haciendo uso del servicio de autenticación de Ciudadanía Digital.

Para esta opción, en el archivo ***/src/routes/seguridad/jwtokenRT.js***, eliminar las líneas 40 a la 251. Es decir, todo lo referente a la ruta de "/autenticar". Es importante eliminar estas líneas, para la seguridad y el correcto funcionamiento del sistema.

### Para habilitar la validación de usuarios con LDAP

> **Importante.-** Se recomienda habilitar la validación con LDAP, para ello, en el archivo `autorizacion.controller.js` en las líneas `186` y `187` se debe descomentar la siguiente porción de código, quedando de la siguiente manera:

```js
  const esValidoLdap = await validarConLdap(user);
  if (esValidoLdap.valido == false) throw new Error('Usted no esta autorizado para ingresar al sistema.');
```



## Usuarios de prueba

Con el propósito de realizar pruebas, con la ejecución los seeders, se está habilitando el usuario ***sys_default***, con el rol de ADMIN para que dicho usuario pueda realizar la configuración general del sistema, como por ejemplo el alta a otros usuarios con rol admin y demás.

Para el modo LDAP o Ciudadanía Digital es necesario que se cuente con un usuario LDAP habilitado para el usuario por defecto, donde se pide que el nombre de usuario sea: sys_default y la contraseña por defecto: Developer. 

A continuación el ejemplo de la configuración del usuario sería de la siguiente manera:
```sh
dn: uid=sys_default,ou=usuarios,dc=nodomain
objectClass: top
objectClass: inetOrgPerson
uid: sys_default
structuralObjectClass: inetOrgPerson
entryUUID: 1afa454c-d7e3-1039-9933-b525709c0f84
creatorsName: cn=admin,dc=nodomain
createTimestamp: 20200130193315Z
userPassword:: e01ENX1aeXl2Si9VMlBjZ3p2YVVKbDNYb2tRPT0=
cn: Sys
sn: Default
description: Usuario por defecto del sistema
employeeNumber: 1
employeeType: ninguno
givenName: Sys
mail: sys@local.com
o: ENTIDAD
ou: UNIDAD
registeredAddress: sys@local.com
telephoneNumber: 000000
title: CARGO
entryCSN: 20200130194031.077493Z#000000#000#000000
modifiersName: cn=admin,dc=nodomain
modifyTimestamp: 20200130194031Z
```
**NOTA IMPORTANTE:** Luego de realizar las pruebas necesarias se recomienda dar de baja al usuario respectivo.


#### * Extra

- Si se presenta algun error relacionado con el uso de "libfontconfig0" por parte de phantom.js, instalar el mismo con:
    ```sh
    sudo apt-get install libfontconfig1-dev
    ```

- Si se presenta el error "Can't find Python executable python", instalar python con:
    ```sh
    sudo apt-get install python
    ```

- En la carpeta /public/images reemplazar las imágenes logo.svg, membrete.png a usar de manera predeterminada.

  - membrete.png  ancho: 574 píxeles, alto: 801 píxeles
  - logo.svg      ancho: 200 píxeles, alto: 80 píxeles

# INSTALACIÓN CON DOCKER

## Compilación

Puedes hacer una compilación rápida de la imagen con el comando:

```sh
docker build -t plantillas-backend .
```

## Uso de la imagen

La imagen necesita minimamente las siguientes variables de entorno:

* `DB_HOST` : nombre de host o ip de la base dato postgres
* `DB_NOMBRE` : nombre de la base datos postgres
* `DB_PASSWORD` : password de la base dato postgres
* `DB_PUERTO` : puerto de la base dato postgres
* `DB_USUARIO` : usuario de la base dato postgres

y expone adentro del contenedor el puerto **8000**.

Por ejemplo puedes levantar una instancia del backend con el siguiente comando:

```sh
docker run \
  --name plantillas_backend \
  -e DB_HOST=1.2.3.4 \
  -e DB_NOMBRE=plantillas \
  -e DB_PASSWORD=plantillas \
  -e DB_PUERTO=5432 \
  -e DB_USUARIO=plantillas \
  -p 5001:8000 \
  plantillas-backend
```

en este ejemplo estamos asumiendo que nuestra base dato postgres se encuentra disponible sobre la ip **1.2.3.4** y puerto **5432** y estamos exponiendo el puerto **5001** desde el puerto interno 8000. Una vez ejecutado el comando, podrás consumir el backend de plantillas desde la url http://127.0.0.1:5001 en el caso estes en el mismo host.

despues del primer arranque es necesario inicializar la base de datos con el siguiente comando:

```sh
docker exec plantillas_backend sh seeder.sh
```

## Persistencia de datos

El sistema plantillas-backend dockerizado genera y almacena documentos pdf en su propio filesystem efimero bajo la ruta:

`/home/node/app/public`

Para garantizar la persistencia de los documentos es suficiente crear y montar un volumen docker externo conectado a esta ruta,
por ejemplo con los comandos:

```sh
docker volume create plantillas-documentos

docker run \
  --name plantillas_backend \
  -e DB_HOST=1.2.3.4 \
  -e DB_NOMBRE=plantillas \
  -e DB_PASSWORD=plantillas \
  -e DB_PUERTO=5432 \
  -e DB_USUARIO=plantillas \
  -p 5001:80 \
  -v plantillas-documentos:/home/node/app/public \
  plantillas-backend
```

# Generación de Token para Entidades Externas

Para la generación de token para una entidad externa ejecutar el siguiente comando:

```sh
npm run generar
# En la consola se le guiará con los datos que se necesita para la generación del token.
```

Al final debe obtener una respuesta en consola de la siguiente forma:
```sh
>>>>>>>>>>>>>>>> El token de acceso para [NOMBRE_ENTIDAD] es <<<<<<<<<<<<<<<<<<<<<<
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1Ni...
```


# Configuración de Aprobación de Documentos con Ciudadanía

Para el registro del cliente en el sistema de aprobaciones se requieren los siguientes parametros:

- *client_id*: `[respuesta del registro en ciudadania]`
- *redirect_front*: https://`[URL_FRONTEND]`/oauth/notify.html
- *redirect_back*: https://`[URL_BACKEND]`/aprobacion-callback
- *token*: Token generado para entidad externa ***(Ver Generación de Token para Entidades Externas)***



