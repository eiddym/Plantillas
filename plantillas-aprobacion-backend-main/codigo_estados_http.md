# Estados HTTP
## 1xx Respuestas Informativas:

| Código        | Estado           | Descripción |
| :-------------: |:-------------:| :-----|
|100| Continuar | El navegador puede continuar realizando su petición (se utiliza para indicar que la primera parte de la petición del navegador se ha recibido correctamente). |
|101|Conmutación de protocolos |   El servidor acepta el cambio de protocolo propuesto por el navegador (puede ser por ejemplo un cambio de HTTP 1.0 a HTTP 1.1). |
|102| Procesando (WebDav) | EL servidor está procesando la petición del navegador pero todavía no ha terminado (esto evita que el navegador piense que la petición se ha perdido cuando no recibe ninguna respuesta).|
|103| Punto de control|  Se va a reanudar una petición POST o PUT que fue abortada previamente.|

## 2xx Peticiones Correctas:
| Código        | Estado           | Descripción |
| :-------------: |:-------------:| :-----|
|200 | OK | Respuesta estándar para peticiones correctas.|
|201|Creado|La petición ha sido completada y ha resultado en la creación de un nuevo recurso.|
|202|Aceptado| La petición ha sido aceptada para procesamiento, pero este no ha sido completado. La petición eventualmente pudiere o ser satisfecha, ya que podría ser no permitida o prohibida cuando el procesamiento tenga lugar.|
|203|Información no autorizada|La petición se ha completado con éxito, pero su contenido no se ha obtenido de la fuente originalmente solicitada sino de otro servidor.|
|204|Sin contenido|La petición se ha completado con éxito pero su respuesta no tiene ningún contenido( la respuesta sí que puede incluir información en sus cabeceras HTTP).|
|205|Reiniciar contenido|La petición se ha completado con éxito, pero su respuesta no tiene contenidos y además , el navegador tiene que inicializar la pagina desde la que se realizó la petición(uso en paginas con formularios cuyo contenido debe borrarse después de que el usuario lo envié).|
|206|Contenido parcial|La petición servirá parcialmente el contenido solicitado. Esta característica es utilizada por herramientas de descarga como wget para continuar la transferencia de descargas anteriormente interrumpidas o para dividir una descarga y procesar las partes simultáneamente.|
|207|Multi-estado WebDav|El cuerpo del mensaje que sigue es un mensaje xml y puede contener algún número e códigos de respuesta separados, dependiendo de cuántas sub-peticiones sean hechas.|
|208|Ya registrado WebDav|El listado de elementos dav ya se notifico previamente, por lo que no se van a volver a listar.|

## 3xx Redirecciones:
| Código          | Estado        | Descripción |
| :-------------: |:-------------:| :-----------|
|300|Múltiples opciones|Indica opciones múltiples para el URI que el cliente podría seguir. Ejemplo, representar distintas opciones de formato para vídeo, listar archivos con distintas extensiones o word sense disambiguation.|
|301|Movido permanentemente|Esta y todas las peticiones futuras deberían ser dirigidas a la URI dada.|
|302|Encontrado|Indica el estado sobre el re-direcionamiento de una pagina o documento web.|
|303|Ver otros|La respuesta a la petición puede ser encontrada bajo otra URI utilizando el método GET.(desde HTTP 1.1).|
|304|Sin modificación|Indica que la petición a la URL no ha sido modificada desde que fue requerida por última vez. Típicamente el cliente HTTP provee un encabezado como if-Modified-Since para indicar una fecha y hora actual contra el cual el servidor pueda comparar.|
|305|Use proxy|El documento solicitado debería recuperarse mediante el proxy listado en la cabecera “Location”. Muchos clientes HTTP no se apegan a este estándar por motivos de seguridad; Estas respuestas solo deben generarse por servidores de origen.|
|307|Redirección temporal|Se trata de una redirección que debería haber sido hecha con otra URI, sin embargo aún puede ser procesada con la URI proporcionada. En contraste con la 303 el método no debería ser cambiado cuando el cliente repita la solicitud.|
|308|Redirección permanente|El recurso solicitado por el navegador se encuentra en otro lugar y este cambio es permanente. A diferencia del 301, no se permite cambiar  el método HTTP para la nueva petición.|


## 4xxx Errores del Cliente:
| Código          | Estado        | Descripción |
| :-------------: |:-------------:| :-----------|
|400|Mala solicitud|La solicitud contiene sintaxis errónea y no debería repetirse.|
|401|No autorizado|Similar al 403, pero específicamente para su uso cuando la autentificación es posible pero ha fallado o aun no ha sido provista.|
|402|Pago obligatorio|La intención original era que este código pudiese ser usado como parte de alguna forma o esquema de dinero electrónico  - - nunca se lo uso.|
|403|Prohibido|La solicitud fue legal, pero el servidor rehúsa responderla dado que el cliente no tiene los privilegios para hacerla.|
|404|No se encontró|Recurso no encontrado. Se utiliza cuando el servidor web no encuentra la pagina.|
|405|Método no permitido|Una petición fue hecha a una URI utilizando un método de solicitud no soportado por dicha URI.|
|406|No aceptable|El servidor no es capaz de devolver los datos en ninguno de los formatos aceptados por el cliente, indicados por éste en la cabecera “Accept” de la petición.|
|407|Requiere autenticación de proxy|Parecido al 401, pero el cliente deberá primero autenticarse con el proxy.|
|408|Tiempo de solicitud agotado|El cliente falló al continuar la petición. Excepto durante la ejecución de vídeos adobe flash cuando solo significa que el usuario cerro la ventana de vídeo o se movió a otro.|
|409|Conflicto|Indica que la solicitud no pudo ser procesada debido a un conflicto con el estado actual del recurso que esta identifica.|
|410|Sin disponibilidad|Indica que el recurso solicitado ya no esta disponible y no lo estará de nuevo. Deberia ser utilizado cuando un recurso ha sido quitado de forma permanente.|
|411|Requiere longitud de contenido|El servidor rechaza la petición del navegador porque no incluye la cabecera “Content-Length” adecuada.|
|412|Error de Pre-condicion|El servidor no es capaz de cumplir con algunas de las condiciones impuestas por el navegador.|
|413|Entidad de solicitud demasiado grande|La petición es demasiado grande y por ese motivo el servidor no la procesa.|
|414|URI de solicitud demasiado larga|La URI de la petición del navegador es demasiado grande y por ese motivo el servidor no la procesa.|
|415|Tipo de medio no soportado|La petición del navegador tiene un formato que no entiende el servidor.|
|416|Pedido fuera de rango|El cliente a preguntado por una parte de un archivo, pero el servidor no puede proporcionar esa parte.|
|417|Sin expectativa|La petición del navegador no se procesa porque el servidor no es capaz de cumplir con los requerimientos de la cabecera “Expect”.|
|418|Soy una Tetera|Soy una tetera, sirve para que no se prepare café en un a tetera.|
|422|Entidad WebDav No Procesable|La solicitud está bien formada pero fue  imposible seguirla debido a errores semánticos.|
|423|WebDav bloqueado|El recurso al que se está teniendo acceso está bloqueado.|
|424|Fallo en la dependencia WebDav|La solicitud falló debido a una falla en la solicitud previa.|
|426|Requiere actualización|El cliente debería cambiarse a TLS/1.0|
|428| Condición previa Necesaria|El Servidor requiere que la petición del navegador sea condicional( Evita problemas producidos al modificar con PUT un recurso que ha sido modificado por otra parte).|
|429|Muchas solicitudes|Hay muchas conexiones desde esta dirección de internet.|
|431|Campos de encabezado de solicitud demasiado grande|El servidor no puede procesar la petición porque una de las cabeceras de la petición es demasiado grande. Este error también se produce cuando la suma del tamaño de todas las peticiones es demasiado grande.|
|451|No disponible por razones legales|El contenido ha sido eliminado como consecuencia de una orden judicial o sentencia emitida por un tribunal.|

## 5xxx Errores de Servidor:
| Código          | Estado        | Descripción |
| :-------------: |:-------------:| :-----------|
|500|Error interno del servidor|Mensaje genérico "server is confused". Normalmente es el resultado de programas CGI o servlets que se quedan colgados o retornan cabeceras mal formateadas.|
|501|No implementado|El servidor no soporta alguna funcionalidad necesaria para responder a la solicitud del navegador.|
|502|Error en la puerta de enlace|El servidor está actuando de proxy o gateway y ha recibido una respuesta inválida del otro servidor, por lo que no puede responder adecuadamente a la petición del navegador.|
|503|Servicio no disponible|El Servidor no puede responder a la petición del navegador porque esta congestionado o esta realizando tareas de mantenimiento.|
|504|Tiempo de espera de Gateway|El servidor está actuando de proxy o gateway y no ha recibido a tiempo una respuesta del otro servidor.|
|505|Versión HTTP no soportada|El servidor no soporta o no quiere soportar la versión del protocolo HTTP utilizada en la petición del navegador.|
|506|Variante de negocio|El servidor a detectado una referencia circular al procesar la parte de la negociación del contenido de la petición.|
|507|Insuficiente espacio de almacenamiento WebDav|El servidor no puede crear o modificar el recurso solicitado porque no hay suficiente espacio de almacenamiento libre.|
|508|Bucle WebDav detectado|La petición no se puede procesar porque el servidor ha encontrado un bucle infinito al intentar procesarla.|
|509|Limite de ancho de banda|Limite de ancho de banda excedido – CÓDIGO NO OFICIAL.|
|510|No extendido|La petición del navegador debe añadir mas extensiones para que el servidor pueda procesarla.|
|511|Requiere autentificación en la red|El navegador debe autenticarse para poder realizar peticiones, se los usa con los portales cautivos que obligan a autenticarse antes de navegar.|
