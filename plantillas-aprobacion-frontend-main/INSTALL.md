.:: Plantillas Formly Frontend ::.
=================================================

A continuación se detalla la instalación de la aplicación frontend desde cero. El presente manual fue probado en un servidor con Debian 9.

Se debe realizar primeramente la instalación del proyecto del backend. 

## A. INSTALACIÓN DE DEPENDENCIAS

Se requiere tener instaladas las siguientes dependencias: git, nvm, node (ver INSTALL.md del proyecto backend).

### 1. Activar nodejs

    $ nvm use 6.9.x

### 2. Instalar las siguientes dependencias: gulp, bower

    npm install -g gulp bower

### 3. Instalar generator-gulp-angular (para desarrollo)

    npm install -g generator-gulp-angular

## B. CONFIGURACION DE RECAPTCHA

Debe generar os ks necesarios e el siguiente link
[__RECAPTCHA__](https://www.google.com/recaptcha/admin/create)

Una vez generado el token. debe copiar el token del sitio web en el index.constants.js en la cofiguracion del recaptcha

## C. INSTALACIÓN EN DESARROLLO

### 1. Clonar el proyecto

    $ git clone <url-repositorio_proyecto_plantillas_frontend>

### 2. Instalar dependencias bower

Ingresar al directorio plantillas-formly-frontend

    $ bower install

### 3. Instalar dependencias npm

    $ npm install

### 4. Iniciar el proyecto

    $ gulp serve


## D. INSTALACIÓN EN PRODUCCIÓN

### 1. Instalación de apache

    $ sudo apt-get install apache2

### 2. Modificar la configuración de apache

    $ sudo nano /etc/apache2/sites-enabled/000-default.conf

Cambiar la línea

    DocumentRoot /var/www/html

Por

    DocumentRoot /var/www/html/plantillas

Reiniciar apache

    $ sudo /etc/init.d/apache2 restart

### 3. Clonar el proyecto

Moverse a la misma carpeta donde esta plantillas-formly-backend y ejecutar el siguiente comando (Nos pedirá usuario y contraseña de git)

    $ git clone <url-repositorio_proyecto_plantillas_frontend>

### 4. Instalar dependencias npm

Ingresar a la carpeta _<proyecto_plantillas_frontend>_ y ejecutar el siguiente comando

    $ npm install

### 5. Instalar dependencias bower

En este caso nos perdirá confirmaciones con opciones, se debe elegir siempre el número en que este la opción __app__

    $ bower install

### 6. Modificar el archivo _index.constants.js_

    $ nano src/app/index.constants.js

Asegurarse que las constantes authUrl, restUrl y backUrl deben apuntar al backend, por ejemplo:

    .constant('timeAutoSave', 10) // tiempo de autoguardado de documentos en minutos
    .constant('authUrl', 'https://<url_despliegue_proyecto_backend>/autenticar') // Auth
    .constant('restUrl', 'https://<url_despliegue_proyecto_backend>/api/v1/') // Rest Api Backend
    .constant('backUrl', 'https://<url_despliegue_proyecto_backend>/') // Backend

### 6.1. Modificar el archivo _config.js_ para autenticación con Ciudadanía Digital

    $ cp oauth/config.js.sample oauth/config.js
    $ nano oauth/config.js

Asegurarse que las variables backend_api y subdomain deben apuntar al backend, por ejemplo:

    var backend_api = '<url_despliegue_proyecto_backend>';
    var subdomain = '';

### 7. Generar el código minificado del proyecto (se creará la carpeta _dist_) y crear la carpeta _produccion_

    $ gulp build
    $ mkdir produccion

### 8. Renombrar la carpeta _dist_ a _plantillas_ y moverla  dentro de _produccion_

    $ mv dist plantillas
    $ mv plantillas produccion/

### 9. Crear un enlace simbólico al proyecto compilado

    $ sudo ln -s <ruta_real_del_directorio_del_proyecto_frontend>/produccion /var/www/html/plantillas

### 10. Actualizar el archivo index.html

Modificar _index.html_ del proyecto ejecutando los siguientes comandos:

```sh
sed -i -e 's/src=maps\//src=/g' dist/index.html
sed -i -e 's/.js.map/.js/g' dist/index.html
```

## E. Implementar seguridad en apache 2.4.10

Los siguientes cambios afectarán a todos los virtual hosts del servidor apache

### Eliminar información de servidor y modificar headers de respuesta

    $ sudo nano /etc/apache2/apache2.conf

Añadir al final del archivo las líneas

    #Eliminan información del servidor
    #En paginas 404, 500 u otro que genera apache
    ServerSignature Off

    #En Headers de peticiones
    ServerTokens Prod

    #Modifican informacion de headers
    <IfModule mod_headers.c>
            Header set X-XSS-Protection "1; mode=block"
            Header set X-Content-Type-Options "nosniff"
            Header set X-Frame-Options sameorigin
            Header unset "X-Powered-By"
    </IfModule>

Habilitar el módulo headers

    sudo a2enmod headers

Reiniciar el servicio de apache2

    sudo /etc/init.d/apache2 restart


## Modalidad de autenticación.

La autenticación se puede configurar de tres formas diferentes:

    a. Haciendo uso sólamente de la autenticación del sistema.
    b. Haciendo uso del servicio de autenticación LDAP.
    c. Haciendo uso del servicio de autenticación de Ciudadanía Digital.

Las tres opciones son excluyentes.

### a. Haciendo uso sólamente de la autenticación del sistema. 
Para poder usar esta configuración, se recomienda editar en el archivo ***/src/app/modules/admin/login/modules.admin.login.html*** 
la línea 12:
```sh
<img class="icon-circular-imagen ciudadania" src="assets/images/Ciudadania-Digital-Logo-v01-cuadrado.png" ng-click="login.iniciarSesion()">
```

y cambiarla por:
```sh
<img class="icon-circular-imagen ciudadania" src="assets/images/Ciudadania-Digital-Logo-v01-cuadrado.png">
```

### b. Haciendo uso del servicio de autenticación LDAP.
Para poder usar esta configuración, se recomienda editar en el archivo ***/src/app/modules/admin/login/modules.admin.login.html*** 
la línea 12:
```sh
<img class="icon-circular-imagen ciudadania" src="assets/images/Ciudadania-Digital-Logo-v01-cuadrado.png" ng-click="login.iniciarSesion()">
```

y cambiarla por:
```sh
<img class="icon-circular-imagen ciudadania" src="assets/images/Ciudadania-Digital-Logo-v01-cuadrado.png">
```

### c. Haciendo uso del servicio de autenticación de Ciudadanía Digital.

Para este caso, en el archivo ***/src/app/modules/admin/login/modules.admin.login.html*** , se debe eliminar las líneas 19 a la 33:
```sh
20       <form name="form" ng-submit="login.login()">
21         <md-input-container>
22           <label>Nombre de usuario</label>
23            <md-icon>person</md-icon><input ng-model="login.username" required>
24         </md-input-container>
25         <md-input-container>
26           <label>Contraseña</label>
27           <md-icon>lock</md-icon><input ng-model="login.password" type="password" required>
28         </md-input-container>
29         <md-button type="submit" class="md-raised md-primary" ng-disabled="form.$invalid">
30           Iniciar sesión
31         </md-button>
32       </form>
```
