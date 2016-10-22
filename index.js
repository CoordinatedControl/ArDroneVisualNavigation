var ImageProcessing = require('./lib/ImageProcessing');
var arDrone = require('ar-drone');
var client = arDrone.createClient({ip: '192.168.1.10'});
console.log('Connected to client');
var pngStream = client.getPngStream();
var Controller   = require('node-pid-controller');

var ver_ctrl = new Controller(0.3, 0.01, 0.1)
  , hor_ctrl = new Controller(0.4, 0.01, 0.1)
  , front_ctrl = new Controller(0.1, 0.01, 0.2)
  ;

client.takeoff();

var imageProcessing = ImageProcessing(pngStream, function(info){
	console.log(info);
	var face = info.rects;
	var im = info.image;
	var targetWidth = 100;
	face.centerX = face.x + face.width * 0.5;
	face.centerY = face.y + face.height * 0.5;

	var centerX = im.width() * 0.5;
	var centerY = im.height() * 0.5;

	var heightAmount = -( face.centerY - centerY ) / centerY;
	var turnAmount = -( face.centerX - centerX ) / centerX;
	var forwardAmount = ( targetWidth - face.width ) / 500;

	heightAmount = ver_ctrl.update(-heightAmount);
	turnAmount   = hor_ctrl.update(-turnAmount);
	forwardAmount = front_ctrl.update(-forwardAmount);

	var lim = 0.1;
	if (Math.abs(face.width) > targetWidth){
		client.stop();
	} else if( Math.abs( turnAmount ) > lim || Math.abs( heightAmount ) > lim ){
		console.log( "forward" + forwardAmount );
		/*if( turnAmount < 0 ) 
			client.clockwise(Math.abs(turnAmount));
		else 
			client.counterClockwise(turnAmount);*/
	
		if(  heightAmount < 0 )
			client.down(Math.abs(heightAmount));
		else 
			client.up(heightAmount);

		if ( forwardAmount < 0 )
			client.back(Math.abs(forwardAmount));
		else
			client.front(Math.abs(forwardAmount));
	} else {
		client.stop();
	}

	dt = Math.min(Math.abs(turnAmount), Math.abs(heightAmount));
	dt = dt * 2000;
});

setTimeout(function(){
	client.land();
}, 40000);

process.on("SIGINT", function(){
	client.land();
	setTimeout(function() {
		process.exit();
	}, 1000);
});

process.on("exit", function(){
	client.land();
	setTimeout(function() {
		process.exit();
	}, 1000);
});

process.on("uncaughtException", function(){
	client.land();
	setTimeout(function() {
		process.exit();
	}, 1000);
});

imageProcessing.start();