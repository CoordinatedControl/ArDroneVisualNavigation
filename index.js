// Imports
var ImageProcessing = require('./lib/ImageProcessing');
var arDrone = require('ar-drone');
var client = arDrone.createClient({ip: '192.168.1.10'});
console.log('Connected to client');
var pngStream = client.getPngStream();
var Controller = require('node-pid-controller');

// Initialize PID Controllers
var verticalPidController = new Controller(0.3, 0.01, 0.1), 
	spinPidController = new Controller(0.4, 0.01, 0.1), 
	horizontalPidController = new Controller(0.1, 0.01, 0.2)
	;

// Initialize Image Processing
var imageProcessing = ImageProcessing(pngStream, function(info){
	console.log(info);
	var target = info.rects;
	var im = info.image;
	var targetWidth = 100;
	target.centerX = target.x + target.width * 0.5;
	target.centerY = target.y + target.height * 0.5;

	var centerX = im.width() * 0.5;
	var centerY = im.height() * 0.5;

	var heightAmount = -( target.centerY - centerY ) / centerY;
	var turnAmount = -( target.centerX - centerX ) / centerX;
	var forwardAmount = ( targetWidth - target.width ) / 500;

	heightAmount = verticalPidController.update(-heightAmount);
	turnAmount   = spinPidController.update(-turnAmount);
	forwardAmount = horizontalPidController.update(-forwardAmount);

	var lim = 0.1;
	if (Math.abs(target.width) > targetWidth){
		client.stop();
	} else if( Math.abs( turnAmount ) > lim || Math.abs( heightAmount ) > lim ){
		console.log( "forward" + forwardAmount );
	
		if(heightAmount < 0) {
			client.down(Math.abs(heightAmount));
		} else {
			client.up(heightAmount);
		}
		if(forwardAmount < 0) {
			client.back(Math.abs(forwardAmount));
		}
		else{
			client.front(Math.abs(forwardAmount));
		}
	} else{
		client.stop();
	}

	dt = Math.min(Math.abs(turnAmount), Math.abs(heightAmount));
	dt = dt * 2000;
});

// FAILSAFES
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

// Takeoff drone
client.takeoff();

//Start Image Processing
imageProcessing.start();