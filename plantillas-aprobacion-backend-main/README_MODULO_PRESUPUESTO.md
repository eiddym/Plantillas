## DESARROLLO
Para realizar un control integral del presupuesto se desarrollo el "__Módulo de Presupuesto__" en el sistema de Plantillas el cual, esta disponible en los roles de “_Configurador de Plantillas_” y “_Usuario_” a continuación se describe las opciones disponibles:

1. ### ROL DE CONFIGURADOR DE PLANTILLAS

    En el Menú de creación de Plantillas se habilitara un componente web llamado "__Caja chica__", que debe ser insertado en la plantilla el cual contiene las siguientes modalidades de funcionamiento:
    - GESTIÓN DE PARTIDAS: Habilita al componente para registrar el presupuesto  inicial de determinadas partidas presupuestarias y/o las modificaciones presupuestarias a las mismas.
    - COMPROMETIDO: Habilita al componente para registrar presupuesto comprometido.
    - PAGADO: Habilita al componente para pagar partidas comprometidas.

2. ### ROL DE USUARIO
     
    Para los usuarios del sistema de plantillas, una vez ingresando al sistema se le mostraran las 3 nuevas plantillas con una modalidad específica realizada por el configurador de Plantillas, a continuación se describen las modalidades:

    #### GESTIÓN DE PARTIDAS PRESUPUESTARIAS

    Seleccionando las opción de:
    - INICIAR PARTIDAS: Debe llenar los datos de Partida (Número de la Partida Prespuestaria), Descripción (Nombre Referencial de la Partida) y Monto Inicial, en el cual tiene una validación para que no se pueda agregar la misma partida ya iniciada.
    - MODIFICAR PARTIDAS: Debe agregar una Partida mediante el buscador de Partidas Presupuestarias, posteriormente llenar la Descripción y Monto. El Monto introducido es la afectación de adición (Valores Positivos) o resta (Valores Negativos) a la Partida Seleccionada, donde la validación condiciona a que la partida inicial o actual no tenga valor negativo después de una resta.

    #### COMPROMETIENDO PRESUPUESTO

    Con el buscador de partidas el usuario debe seleccionar las partidas a ser comprometidas en el documento, posteriormente puede agregar un _detalle_ y un _monto positivo_. El sistema automáticamente validará que no se pueda comprometer más allá del presupuesto actual de una partida.

    Se puede crear comprometidos de dos tipos:
    - SIMPLE: Opción por defecto, el valor comprometido se cerrará con un solo pago si queda saldo este será transferido al presupuesto de la partida actual.
    - MÚLTIPLE: Con esta opción el valor comprometido se cerrará tras múltiples pagos, para ello seleccionar la opción _Pagado múltiple_,

    #### PAGANDO PRESUPUESTO

    El usuario con el buscador de Documentos por CITE, debe seleccionar un documentos donde comprometió presupuesto y el sistema agregará de manera inmediata las partidas comprometidas que no fueron pagadas o finalizadas de dicho documento, posteriormente en la columna _Pagado_ se introducirá
    los montos a pagar. 
    
    En el caso de Pago Múltiple, un pago múltiple sera finalizado cuando se establezca un pago de valor 0.
    
    #### REVERSIÓN DE PRESUPUESTO

    Para realizar una reversión de un valor comprometido de pago simple o múltiple, se debe realizar un pago del valor comprometido con monto de valor 0.
    