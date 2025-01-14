## Sistema de documentos administrativos (Plantillas)

1. Objetivos del sistema

    a. Objetivo Principal 
    El objetivo del sistema de documentos administrativos es tener una mejor administración de los documentos generados en la entidad, mediante el uso de tecnologías “open source” para la generación dinámica de documentos en base a plantillas configurables.

    b. Objetivos Secundarios

        - Desarrollo de un motor de plantillas que permita la configuración de documentos.
        - Desarrollo de un módulo de asignación y control de CITE’s, basados por unidad y tipo de documento
        - Desarrollo del módulo de historicos que permite obtener informacion sobre el flujo de un documento
        - Desarrollo de los medios que permitan a un documento seguir los flujos establecidos.
        - Desarrollo del módulo de presupuesto, para el control de las partidas presupuestarias

2. Tecnologías Utilizadas

    Las Tecnologías utilizadas en el desarrollo de sistema son :
    - NodeJS como entorno base de desarrollo para ambos casos.

    BACKEND:
    - ExpressJS como servidor de aplicaciones web.
    - PostgreSQL como gestor de bases de datos.
    - Sequelize como ORM(Object-Relational mapping).
    - Passport JWT como mecanismos de autenticación.
    - Babel compilador de ECMA6 a ECMA5
    - MomentJS manejador de la generacion de datos tipo fecha,hora,segundos,etc.
    - Uuid(v4) generador aleatorio de caracteres.
    - helmet como herramienta de configuración de seguridad.

    FRONTEND:
    - Gulp como medio de automatización de tareas.
    - Angular(v1.5) como entorno base
    - Angular-Material como medio de desarrollo de la interfaz de usuario(maquetación)
    - Angular-Formly como generador de componentes(Plantilla)
    - html como herramienta de maquetación web
    - css como herramienta de estilos

3. Autenticación

    La autenticación se puede configurar:
    - Haciendo uso del servicio de autenticación de Ciudadanía Digital.
    - Haciendo uso del servicio de autenticación LDAP.
    - Haciendo uso de la autenticación del sistema.

    Las tres opciones son excluyentes entre ellas.

4. Aprobación de documentos con ciudadanía digital

    Para darle validez a toda la documentación generada en el sistema, la misma deberá ser aprobada por los actores de cada documento.

5. Backend

    Este proyecto depende directamente de un backend cuyo código se halla en este mismo repositorio (revise el proyecto_plantillas_backend)

6. Instalación del frontend

    Para la instalación del proyecto frontend revise el archivo [INSTALL.md](INSTALL.md).
    Es importante mencionar que para poder instalar el frontend, se debe tener instalado el proyecto backend primero.
