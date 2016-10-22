var Copterface = require('./lib/copterface');
var arDrone = require('ar-drone');
var client = arDrone.createClient({ip: '192.168.1.10'});
client.takeoff();
console.log('Connected to client');
var pngStream = client.getPngStream();
console.log('Getting png stream');

var Controller   = require('node-pid-controller');

var ver_ctrl = new Controller(0.3, 0.01, 0.1)
  , hor_ctrl = new Controller(0.4, 0.01, 0.1)
  ;

var copterface = Copterface(pngStream, function(info){
	console.log(info);
	var face = info.rects;
	var im = info.image;
	face.centerX = face.x + face.width * 0.5;
	face.centerY = face.y + face.height * 0.5;

	var centerX = im.width() * 0.5;
	var centerY = im.height() * 0.5;

	var heightAmount = -( face.centerY - centerY ) / centerY;
	var turnAmount = -( face.centerX - centerX ) / centerX;

	heightAmount = ver_ctrl.update(-heightAmount);
	turnAmount   = hor_ctrl.update(-turnAmount);

	var lim = 0.1;
	if( Math.abs( turnAmount ) > lim || Math.abs( heightAmount ) > lim ){
		console.log( "turning" + turnAmount );
		if( turnAmount < 0 ) 
			client.clockwise(Math.abs(turnAmount));
		else 
			client.counterClockwise(turnAmount);
	
		if(  heightAmount < 0 )
			client.down(Math.abs(heightAmount));
		else 
			client.up(heightAmount);
	} else {
		client.stop();
	}

	// to determine how much time the drone will move, we use the lower of the changes [-1,1], and multiply by a reference time.
	dt = Math.min(Math.abs(turnAmount), Math.abs(heightAmount));
	dt = dt * 2000;
});

setTimeout(function(){
	client.land();
}, 20000);

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

copterface.start();