
function $(id) { return document.getElementById(id); }

log.count = 0;
log.threshold = 100;
function log() { 
	if (window.console && log.count++ < log.threshold) { console.log(Array.prototype.slice.call(arguments)); } 
}

function playPause(e) {
	if (music.playState) {
	    var y = e.layerY;
	    var x = e.layerX;
	    
	    if (y < 30) {
	    	if (music.bytesLoaded == music.bytesTotal) {
	    		music.setPosition(Math.floor((x / WIDTH) * music.duration));
	    	}
	    } else {
	    		music.togglePause();
	    }
	}
}

soundManager.flashVersion = 9;
soundManager.flash9Options.useEQData = true;
soundManager.flash9Options.useWaveformData = true;
soundManager.useHighPerformance = true;
soundManager.flashLoadTimeout = 3000;
soundManager.debugMode = false;
soundManager.url = 'swf/';
soundManager.onready(playsong);

function initDOM() {
	$("container").onclick = playPause;
}


var WIDTH = 400;
var HEIGHT = 400;
var canvas = $("flocks");
var ctx = canvas.getContext("2d");
var permCanvas = $("permscreen");
var	permCtx = permCanvas.getContext("2d");
var imgCanvas = $("img");
var imgCtx = imgCanvas.getContext("2d");
var music = { };
var settings = {
	drawBinaryValues : true,
	drawWaveform : true,
	drawWaveformEcho : true,
	drawFreqBars : true,
	drawFreqBarsEcho : true,
	drawFreqBarsLetters : true,
	drawBoids : true,
	drawBoidHeads : true,
	drawBoidTails : true,
	drawBoidConnections : true,
	drawFaceImage : true
};

var atan2 = Math.atan2;
var sqrt = Math.sqrt;
var cos = Math.cos;
var sin = Math.sin;
var PI = Math.PI;
var PI2 = Math.PI * 2;
var DEG2RAD = Math.PI / 180;
var random = Math.random;

var paused = false;
var scatter = false;
var scatterTime = 0;
var attract = false;
var attractTime = 0;
var lastActionWasScatter = false;

var numBoids = 0;
var maxBoids = 24;
var lastBoidAddTime = 0;
var minBoidAddTime = 300;
var flock = new Flock(0);

canvas.width = permCanvas.width = imgCanvas.width = WIDTH;
canvas.height = permCanvas.height =  imgCanvas.height = HEIGHT;


var thomData = [];

function loadImage(canvas, src) {
	var img = new Image();
	var ctx = canvas.getContext("2d");
	
	img.onload = function() {
		ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.fillRect(0,0,canvas.width,canvas.height);
		
		var thumb = getThumbnail(img, canvas.width * .8, canvas.height * .8);
		var imgX = (canvas.width - thumb.width) / 2;
		var imgY = (canvas.height - thumb.height) / 2;
		
		ctx.drawImage(thumb, imgX, imgY, thumb.width, thumb.height);
		thomData = getGrayscaleData(canvas);
	};
	
	//img.src = 'dog.jpg';
	//img.src = 'drink_empty.png';
	img.src = src;
}


loadImage(imgCanvas, 'dog.jpg');
imgCanvas.style.opacity = '.1';


(function interval() {
	if (music.paused === false) {
		flock.step();
		render(flock.boids);
	}
	setTimeout(interval, 1000 / 20);
})();

function whilePlaying() {
	boidMode = boidModes.AUTO;
	
	//this.waveformData = [];

	var b1 = 0, b2 = 0, b3 = 0, b4 = 0;
	for (var i=0;i<256;i++){
		if (i < 64)
			b1 += parseFloat(this.eqData.left[i]);
		else if (i < 128)
			b2 += parseFloat(this.eqData.left[i]);
		else if (i < 192)
			b3 += parseFloat(this.eqData.left[i]);
		else
			b4 += parseFloat(this.eqData.left[i]);
	}
	
	
	var now = new Date().getTime();
	
	log(this, b1, b2, b3, b4);
	var isBeat = b4 > 1.5 || b3 > 3;
	
	if (isBeat) {
		if (numBoids < maxBoids) {
			if (now - lastBoidAddTime > minBoidAddTime) {
				flock.addBoid();
				flock.addBoid();
				flock.addBoid();
				numBoids += 3;
				lastBoidAddTime = now;
			}
		} else {
			if (!attractTime && !scatterTime) {
				if (lastActionWasScatter) {
					attract = true;

					ctx.fillStyle = "rgba(255,200,200,0.4)";
					ctx.fillRect(0 , 0, WIDTH, HEIGHT);

					attractTime = setTimeout(function() {
						attract = false;
						attractTime = 0;
					},300);
					
					lastActionWasScatter = false;

				} else {
					scatter = true;

					ctx.fillStyle = "rgba(200,200,255,0.4)";
					ctx.fillRect(0,0,WIDTH,HEIGHT);

					scatterTime = setTimeout(function() {
						scatter = false;
						scatterTime = 0;
					},300);
					
					lastActionWasScatter = true;
				}
			} else {
					ctx.fillStyle = "rgba(200,255,200,0.2)";
			}
		}
	}

	if (scatter) 
		boidMode = boidModes.SCATTER;
	else if (attract) 
		boidMode = boidModes.ATTRACT;

}


function render(boids) {
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	ctx.lineWidth = 0.7;
    
	if (settings.drawBoids) {
		if (settings.drawBoidTails) {
			if (boids.length > 0) {
				var numTrail = 4;
				var alpha = 1;
				for (var p=0;p<numTrail;p++) {
					ctx.strokeStyle = "rgba(0,0,0," + alpha + ")";
					ctx.lineWidth = 0.5;
					ctx.beginPath();
		
					for (var i=0,l=boids.length;i<l;i++) {
						var boid = boids[i];
						var numPos = boid.positionHistory.length;
		
						var pos = boid.positionHistory[numPos - p - 1];
						var pos2 = boid.positionHistory[numPos - p - 2]
						if (pos && pos2) {
							ctx.moveTo(pos.x, pos.y);
							ctx.lineTo(pos2.x, pos2.y);
						}
					}
					ctx.stroke();
					alpha *= 0.6;
				}
			}
		}

			
		ctx.strokeStyle = "rgba(0,0,0,0.6)";
		ctx.lineWidth = 0.5;
	
		ctx.beginPath();
	
		for (var i=0,l=boids.length;i<l;i++) {
			var boid = boids[i];
	
			var x = boid.position.x;
			var y = boid.position.y;
			var lastX = boid.lastPosition.x;
			var lastY = boid.lastPosition.y;
	
			ctx.moveTo(x,y);

			if (settings.drawBoidHeads) {
				ctx.arc(x, y, 3, 0, PI2, false)
			}
	
			var dataX = Math.floor(x);
			var dataY = Math.floor(y);
			if (dataX < 0) dataX = 0; if (dataX > WIDTH-1) dataX = WIDTH - 1;
			if (dataY < 0) dataY = 0; if (dataY > HEIGHT-1) dataY = HEIGHT - 1;
			 
			var color = thomData[(dataY * HEIGHT) + dataX];
			permCtx.lineWidth = 0.7 + 0.5 * (1 - color/255);
			permCtx.strokeStyle = "rgba(" + color + "," + color + "," + color + ",0.15)";

			permCtx.beginPath();
			permCtx.moveTo(lastX, lastY);
			permCtx.lineTo(x, y);
			permCtx.stroke();
	
			if (settings.drawBoidConnections && (attract || scatter)) {
				var nearOther = boid.nearestOther;
	
				if (nearOther != boid.nearestDraw) {
					var nearX = nearOther.position.x>>0;
					var nearY = nearOther.position.y>>0;
					var nearLastX = nearOther.lastPosition.x;
					var nearLastY = nearOther.lastPosition.y;
		
					ctx.lineTo(nearX, nearY);
					ctx.lineTo(nearLastX, nearLastY);
					ctx.lineTo(lastX, lastY);
					ctx.lineTo(x, y);
		
					if (attract) {
						permCtx.fillStyle = "rgba(" + color + "," + color + "," + color + ",0.05)";

						permCtx.lineTo(lastX, lastY);
						permCtx.lineTo(nearLastX, nearLastY);
						permCtx.lineTo(nearX, nearY);
						permCtx.lineTo(x, y);
						permCtx.fill();
					}
				} else {
					nearOther.nearestDraw = boid;
					boid.nearestDraw = nearOther;
				}
			}
	
		}
		ctx.stroke();
	}
}



function getGrayscaleData(canvas) {
	var ctx = canvas.getContext("2d");
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var d = imageData.data;
	var results = [];
	
	for (var p = 0; p < d.length; p+=4) {
		var grey = Math.floor((d[p] + d[p+1] + d[p+2]) / 3);
		results.push(grey);
	}
	
	return results;
}

function getThumbnail(img, MAX_WIDTH, MAX_HEIGHT) {
	
	var ratio = 1;
	var imgWidth = img.width, imgHeight = img.height;
	
	if (imgWidth > MAX_WIDTH) {
	    ratio = MAX_WIDTH / imgWidth;
	    imgWidth = MAX_WIDTH;
	    imgHeight = imgHeight * ratio;
	}
	
	if (imgHeight > MAX_HEIGHT) {
	    ratio = MAX_HEIGHT / imgHeight;
	    imgHeight = MAX_HEIGHT;
	    imgWidth = imgWidth * ratio;
	}
	
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	
	canvas.width = imgWidth;
	canvas.height = imgHeight;
	
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	
	return canvas;
}


function playsong() {
	music = soundManager.createSound({
			id:'music',
			url:'song.mp3',
			volume : 100,
			autoLoad : true,
			stream : false,
			autoPlay : true,
			whileloading : function() {
				//var prog = this.bytesLoaded / this.bytesTotal;
				//$("loaderfill").style.width = (prog * 100) + "%";
			},
			onload : function() {
				log("loaded", this);
				$("loader").style.display = "none";
			},
			onerror: function() {
				log("error", this)
			},
			whileplaying : whilePlaying
		}
	);
}

window.onload = function() {
	initDOM();
}
