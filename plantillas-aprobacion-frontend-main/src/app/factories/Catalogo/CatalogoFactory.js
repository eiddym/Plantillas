(function () {
  'use strict'

  angular
  .module('app')
  .factory('Catalogo', CatalogoFactory);

  /** @ngInject */
  function CatalogoFactory(DataService, restUrl, Modal, Datetime) {
    var factory = {
      showHistory: showHistory
    };
    
    return factory;

    function showHistory(ev, id) {
      DataService.get(restUrl + 'historialCatalogo/' + id)
      .then(function (resp) {
        if (resp) {
          var datos = procesarData(resp.datos.catalogos, resp.datos.usuarios, resp.datos.documentos);
          var config = {
            event: ev,
            data: {id: id, catalogos: datos },
            templateUrl: 'app/factories/Catalogo/dialog.historial.html',
            controller: ['data', '$scope', '$mdDialog', '$log', DialogHistorial]
          };
          return Modal.show(config);
        }
      });
    }

    function DialogHistorial(data, $scope, $mdDialog) {
      var vmd = $scope;
      vmd.data = data;
      vmd.catalogos = vmd.data.catalogos
      vmd.cerrar = cerrar;
      function cerrar() {
        $mdDialog.cancel();
      }
    }

    function procesarData(catalogos, usuarios, documentos){
      var respuesta = [];
      catalogos.forEach(function (item)  {
        var objTemp = {
          fecha: Datetime.dateLiteral(item._fecha_creacion),
          hora: Datetime.time(item._fecha_creacion),
          autor: usuarios[item._usuario_creacion],
          accion: item.accion
        };
        if (item.datos.fid_usuario) {
          objTemp.tipo = 'USUARIO';
          objTemp.autor = usuarios[item._usuario_creacion]
          objTemp.datos = [
            { 
              campo: "Usuario", 
              valor: usuarios[item.datos.fid_usuario]
            },
            {
              campo: "¿Esta activo?",
              valor: item.datos.estado == "ACTIVO" ? "Sí" : "No"
            },
            {
              campo: "¿Puede ver el catálogo?",
              valor: item.datos.lectura ? "Sí" : "No"
            },
            {
              campo: "¿Puede ver el catálogo?",
              valor: item.datos.escritura ? "Sí" : "No"
            }
          ];

        }
        else if (item.datos.id_catalogo) {
          objTemp.tipo = 'CATALOGO';
          objTemp.nombreCatalogo = item.datos.nombre;
          objTemp.datos = [];
          // objTemp.autor = usuarios[item._usuario_creacion];

          if (item.datos.propietario) {
            objTemp.datos.push({campo:'Propietario', valor: usuarios[item.datos.propietario]})
          }
          if (item.datos.nombre) {
            objTemp.datos.push({campo:'Nombre', valor: item.datos.nombre})
          }
          if (item.datos.comentario) {
            objTemp.datos.push({campo:'Comentario', valor: item.datos.comentario})
          }
          if (item.datos.descripcion) {
            objTemp.datos.push({campo:'Descripción', valor: item.datos.descripcion})
          }
        }
        else if (item.datos.fid_documento) {
          objTemp.tipo = 'DOCUMENTO';
          objTemp.datos = [
            {
              campo: "Documento",
              valor: documentos[item.datos.fid_documento]
            },
            {
              campo: "¿Esta activo?",
              valor: item.datos.estado == "ACTIVO" ? "Sí" : "No"
            },
            {
              campo: "Descripción",
              valor: item.datos.descripcion
            }
          ];
        }
        respuesta.push(objTemp);
      });

      return respuesta;
    }
  }

})();