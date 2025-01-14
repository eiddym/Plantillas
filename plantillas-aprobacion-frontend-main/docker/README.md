# Creación de la imagen

[Crear](https://docs.docker.com/engine/reference/commandline/build) la imagen **plantillas-frontend**:

```sh
docker build -t plantillas-frontend:20180709 -f docker/Dockerfile .
```

# Uso de la imagen

## Despliegue basico

Se puede levantar un simple contenedor de prueba mediante el comando:

```sh
docker run --name frontend -d plantillas-frontend:20180709
```

## Exposición de puerto externo

```sh
docker run --name frontend -d -p 8000:8000 plantillas-frontend:20180709
```

En este caso puedes acceder al servicio mediante la direccion [http://127.0.0.1:8000](http://127.0.0.1:8000) de tu navegador.

## Configuración completa

Se puede configurar el servicio mediante la siguiente variable de entorno:

```sh
# URL del servicio de backend de plantillas. (por defecto: http://127.0.0.1:8001)
BACKEND_URL=http://127.0.0.1:8001
```

Para asignar valores de variables de entorno diferentes puedes levantar el contenedor con la opcion **-e** :

```sh
docker run --name frontend -d -p 8000:8000 -e BACKEND_URL=http://1.2.3.4:5678 plantillas-frontend:20180709
```

## Despliegue mediante docker-compose.yml

Puedes levantar el servicio mediante un archivo [docker-compose.yml](https://docs.docker.com/compose/compose-file) incluyendo por ejemplo las siguientes lineas:

```yaml
frontend:
  environment:
    - BACKEND_URL=http://127.0.0.1:8001
  image: plantillas-frontend:20180709
  ports:
    - "8000:8000"
```

