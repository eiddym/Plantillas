(function() {
  'use strict';

  angular
  .module('app')
  .service('DataService', ['$http', 'Message', 'Util', '$sce', '$log', DataService]);



  /** @ngInject */
  function DataService($http, Message, Util, $sce, $log) {

    var formly = null;
    var errorConnection = 'No se pudo establecer conexión con el servidor.';
    var error500 = 'Se produjo un error en el servidor, inténtelo más tarde.';
    var error404 = 'No existe el recurso solicitado.';
    var error403 = 'No tiene los permisos necesarios.';
    var error401 = 'No se pudo realizar la operación.';

    var service = {
      list: list,
      all: list,
      delete: remove,
      save: save,
      get: get,
      put: put,
      patch: patch,
      post: post,
      postWithFiles: postWithFiles,
      putWithFiles: putWithFiles,
      fields: fields,
      option: fields,
      pdf: pdf,
      file: file,
      setFormly: setFormly
    };

    return service;

    function list(url, query) {
      return $http.get(url + (query ? '?' + Util.serialize(query) : ''))
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("list->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function save(url, data) {
      return $http[data.id ? 'put' : 'post'](url + (data.id ? data.id + '/': ''), data)
      .then(function (response) {
        if(response.data){
          return response.data;
        } else {
          $log.warn("save->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function put(url, data) {
      return $http.put(url + (data.id ? data.id + '/': ''), data)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("put->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function putWithFiles(url, data) {
      var config = {
        headers: {
          'Content-Type': undefined
        }
      };
      return $http.put(url, data, config)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("putWithFiles->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function patch(url, data) {
      return $http.patch(url + (data.id ? data.id + '/': ''), data)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("patch->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function post(url, data) {
      return $http.post(url, data)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("post->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function postWithFiles(url, data) {
      var config = {
        headers: {
          'Content-Type': undefined
        }
      };
      return $http.post(url, data, config)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("postWithFiles->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function remove(url, id, noID) {
      var urlRemove = noID == true ? url: url + id + '/';
      return $http.delete(urlRemove)
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("remove->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function get(url, id) {
      return $http.get(url + (id ? id + '/' : ''))
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("get->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function fields(url) {
      return $http({method: 'OPTIONS', url: url})
      .then(function (response) {
        if(response.data){
          return response.data;
        }else{
          $log.warn("fields->respuesta sin datos");
        }
      }).catch(function (error) {
        msgError(error);
      });
    }

    function pdf(url, data) {
      return $http.post(url, data || {}, {responseType:'arraybuffer'})
      .then(function (response) {
        if (response.data) {
          var file = new Blob([response.data], {type: 'application/pdf'});
          var fileURL = URL.createObjectURL(file);
          return { data: response.data, url: $sce.trustAsResourceUrl(fileURL) };
        }
        return null;
      }).catch(function (error) {
        if(url.indexOf('/documento/firmar')==-1){
          msgError(error);
        }
      });
    }

    function file(url, data, type) {
      return $http.get(url, data || {})
      .then(function (response) {
        if (response.data) {
          var blob = new Blob([response.data], { type: (type || 'text/plain') }, false);
          blob = blob;
        }
        return true;
      }).catch(function (error) {
        msgError(error);
      });
    }

    function setFormly(data) {
      formly = data;
    }

    function parseError(error) {
      var message = [];
      if (error) {
        if (error.detail || error.error || error.non_field_errors) {
          return error.detail || error.error || error.non_field_errors;
        }
        for (var i in error) {
          var label = i;
          if (formly) {
            formly.filter(function (el) {
              if (el.key == i) {
                label = el.templateOptions.label;
              }
            });
          }
          message.push('<strong>' + label + ':</strong> ' + (Util.toType(error[i]) == 'array' ? error[i].join(', ') : error[i]));
        }
        return message.join('<br>');
      }
      return null;
    }

    function msgError(error) {
      if (error.status === 500) {
        if(error.data.indexOf("SequelizeUniqueConstraintError:") !== -1){
          var xcad = error.data.substring(error.data.indexOf("«"), error.data.indexOf("»"));
          var campo = xcad.substring(1,xcad.lastIndexOf("_"));
          Message.error("El campo "+campo+" ya existe, y no debe duplicarse.");
        }
        else if(error.data.indexOf("SequelizeValidationError:") !== -1){
          var mensajeError=((error.data.split(" ")).splice(3)).join(' ');
          var indice=mensajeError.indexOf("<br>");
          mensajeError=mensajeError.substring(0,indice);
          Message.error(mensajeError);
        }
        else
        Message.error(error500);
      } else if (error.status === 404) {
        Message.error(error404);
      } else if (error.status === 403) {
        Message.error(error403);
      } else if (error.status === 401) {
        Message.error(error401);
      } else if (error.status === 412) {
        Message.show((error.data.tipoMensaje || 'ERROR'), (error.data.mensaje || 'No se pudo obtener una respuesta'));
      } else {
        Message.error(parseError(error.data) || errorConnection);
      }
    }

  }

})();
