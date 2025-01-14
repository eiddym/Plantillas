.:: Plantillas Frontend ::.
=================================================

A continuación se detalla la actualización de la aplicación.

## ACTUALIZACIÓN DE LA APLICACIÓN

### Actualizar el proyecto

Ingresar al directorio '<nombre_proyecto_frontend>'

Ejecutar el siguiente comando:

    $ git pull origin master


##### Nota. Revisar la configuraciones antes de compilar.
Después ejecutar:

    $ gulp build


Verificar la creación de la carpeta dist

    ls


### Actualizar el archivo index.html

Ejecutar los siguientes comandos:

```sh
sed -i -e 's/src=maps\//src=/g' dist/index.html
sed -i -e 's/.js.map/.js/g' dist/index.html
```
Renombrar la carpeta dist a plantillas:

    $ mv dist plantillas

Eliminar la carpeta actual del proyecto y mover la carpeta plantillas a producción

    rm -rf produccion/plantillas
    mv plantillas produccion/

Verificar el contenido del archivo de configuracion para la interaccion oauth

    cat produccion/plantillas/oauth/config.js

El mismo debe contener la url del backend y el subdominio.

