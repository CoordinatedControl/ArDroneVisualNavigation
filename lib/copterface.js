var cv = require('opencv');
var window = new cv.NamedWindow('Result', 0);
var fs    = require('fs');
var path = require('path');

//var target_cascade = new cv.CascadeClassifier('../target_cascade.xml');

var copterface = exports = module.exports = function(pngStream, callback){
  
    var lastPng;
    var lastPngTime;
    var pngDeltaTime;
    var targetInterval;
    var processingImage = false;
    if(typeof callback !== 'function') 
        throw new Error('Callback missing');

    pngStream.on('error', console.log);
    pngStream.on('data', function(pngBuffer) {
        var currentTime = Date.now();
        if( lastPngTime ){
            pngDeltaTime = currentTime - lastPngTime;
        }
        lastPngTime = currentTime;
        lastPng = pngBuffer;
        processingImage = true;
    });

    var start = function(interval){
        if(targetInterval) 
            stop();
        interval = interval || 150;
        targetInterval = setInterval(detectTarget, interval);
    }

    var stop = function(){
        if( targetInterval ) 
            clearInterval(targetInterval);
        targetInterval = null;
    }

    var detectTarget = function(){ 
        if (processingImage == true) {
          cv.readImage(lastPng, function(err, image) {
              if (err) 
                  throw err;
              if (image.width() < 1 || image.height() < 1) 
                  throw new Error('Image has no size');
                
              image_gray = image.copy();
              image_gray.convertGrayscale();
              image_gray.detectObject(path.join(__dirname,'../target_cascade.xml'), {}, function(err, faces){
                if(faces.length != 0){
                  for (var i = 0; i < faces.length; i++){
                    var face = faces[i];
                    image.rectangle([face.x, face.y], [face.width, face.height], [0,255,0], 2);
                  }

                  callback({
                    image : image,
                    delatTime : pngDeltaTime,
                    timestamp : lastPngTime,
                    rects : faces[0]
                  });

                  window.show(image);
                  window.blockingWaitKey(0, 1);
                }
              }, 1.1, 3);
              
              console.log('frame displayed');
          });
        }
    };

    return {
        'stop':stop,
        'start':start
    }
};
