'use strict';

angular
.module('app')
.directive('ngMostrarThumb',['$window',function($window){
  var helper={
    support: !!($window.FileReader && $window.CanvasRenderingContext2D),
    extension:function(pUrl){
      return pUrl.slice(pUrl.lastIndexOf(".")+1);
    }
  }

  return{
    restrict:'A',
    template:'<canvas/>',
    link:function(scope,element,attributes){
      var params=scope.$eval(attributes.ngMostrarThumb);
      var canvas = element.find('canvas');
      var imagenes=['jpg','png','jpeg','bmp','gif'];
      var extension=helper.extension(params.ruta);

      if(imagenes.indexOf(extension)> -1){
        var img = new Image();
        img.src=params.ruta;
        helper.extension(params.ruta);
        img.onload=function(){
          var width = params.width || this.width / this.height * params.height;
          var height = params.height || this.height / this.width * params.width;
          canvas.attr({width:width, height:height});
          canvas[0].getContext('2d').drawImage(img,0,0,width,height);
        }
      }
    }
  };
}]);
