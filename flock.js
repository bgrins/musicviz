
var boidMode, boidModes = {
	AUTO		: 0x0001,
	ATTRACT		: 0x0002,
	SCATTER		: 0x0004
};

var boidMode = boidModes.AUTO;

function Boid(x, y, velx, vely) {
	this.position = { x : x, y : y};
	this.lastPosition = { x : x, y : y};
	this.target = {x : x, y : y};

	this.nearestOther = null;
	this.nearestOtherDist = 0;

	this.nearestDraw = null;

	this.cohesionLimit = 400;
	this.separationLimit = 50;
	this.alignmentLimit = 100;

	this.cohesionLimit2 = this.cohesionLimit*this.cohesionLimit;
	this.separationLimit2 = this.separationLimit*this.separationLimit;
	this.alignmentLimit2 = this.alignmentLimit*this.alignmentLimit;

	this.rotation = random() * PI2;

	this.positionHistory = [];

	this.maxRotation = 5 * DEG2RAD;

	this.fov = 270 * DEG2RAD;

	this.maxSpeed = 10;
	this.minSpeed = 5;
	this.speed = this.minSpeed;

	this.velocity = { 
		x : cos(this.rotation) * this.speed, 
		y : sin(this.rotation) * this.speed
	};

	this.react = function(boids) {
		var numCohesion = 0;
		var numSeparation = 0;
		var numAlignment = 0;

		var aveX = 0;
		var aveY = 0;
		var sepX = 0;
		var sepY = 0;
		var aliX = 0;
		var aliY = 0;

		this.nearestOtherDist = Number.MAX_VALUE;

		for (i=0,l=boids.length;i<l;i++) {
			var other = boids[i];

			// don't react to self
			if (this === other) 
				continue;

			var dx = other.position.x - this.position.x;
			var dy = other.position.y - this.position.y;

			var dist2 = dx*dx+dy*dy;

			if (dist2 < this.nearestOtherDist) {
				this.nearestOtherDist = dx*dx+dy*dy;
				this.nearestOther = other;
			}

			this.nearestDraw = null;

			// is within view?
			var angle = atan2(dy, dx) - other.rotation;
			if (angle < -PI*0.75 || angle > PI*0.75)
				continue;

			// cohesion
			if (dist2 < this.cohesionLimit2) {
				aveX += other.position.x;
				aveY += other.position.y;
				numCohesion++;
			}

			// separation
			if (dist2 < this.separationLimit2) {
				sepX -= dx;
				sepY -= dy;
				numSeparation++;
			}

			// alignment
			if (dist2 < this.alignmentLimit2) {
				aliX += other.velocity.x;
				aliY += other.velocity.y;
				numAlignment++;
			}

		}

		var velCoh = {
			x : numCohesion == 0 ? 0 : aveX / numCohesion - this.position.x,
			y : numCohesion == 0 ? 0 : aveY / numCohesion - this.position.y
		};

		var velSep = {
			x : sepX,
			y : sepY
		};

		var velAli = {
			x : numAlignment == 0 ? this.velocity.x : aliX / numAlignment,
			y : numAlignment == 0 ? this.velocity.y : aliY / numAlignment
		};

		var modCoh = 0.5;
		var modSep = 2;
		var modAli = 15;

		if (boidMode == boidModes.ATTRACT) {
			modCoh *= 50;
			modAli *= 0;
		} else if (boidMode == boidModes.SCATTER) {
			modCoh *= -50;
			modAli *= 0;
		}

		// position boid wants to move to
		this.target.x = this.position.x + (velCoh.x * modCoh + velSep.x * modSep + velAli.x * modAli);
		this.target.y = this.position.y + (velCoh.y * modCoh + velSep.y * modSep + velAli.y * modAli);

	}

	this.move = function() {

		this.positionHistory.push(
			{ x : this.position.x, y : this.position.y }
		);

		this.lastPosition.x = this.position.x;
		this.lastPosition.y = this.position.y;

		var dx = this.target.x - this.position.x;
		var dy = this.target.y - this.position.y;

		var dist = sqrt(dx*dx + dy*dy);

		var speed = Math.max(Math.min(dist, this.maxSpeed * ((boidMode == boidModes.SCATTER || boidMode == boidModes.ATTRACT) ? 2 : 1)), this.minSpeed);

		var newRotation = this.rotation;
		if (dx != 0 || dy != 0)
			newRotation = atan2(dy, dx);

		var difRotation = newRotation - this.rotation;
		if (difRotation >= PI) difRotation -= PI2;
		if (difRotation < -PI) difRotation += PI2;

		var maxRotation = (boidMode == boidModes.SCATTER || boidMode == boidModes.ATTRACT) ? this.maxRotation * 1.5 : this.maxRotation;

		var absDifRotation = difRotation;
		if (absDifRotation < 0) absDifRotation = -absDifRotation;
		if (absDifRotation >= maxRotation) {
			difRotation = difRotation < 0 ? -maxRotation : maxRotation;
		}
		this.rotation += difRotation;

		var dx = cos(this.rotation);
		var dy = sin(this.rotation);

		this.velocity.x = speed * dx;
		this.velocity.y = speed * dy;

		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;

		this.speed = speed;

		var collide = false;
		if (this.position.x < 0) {
			this.position.x = 0;
			this.velocity.x = -this.velocity.x;
			collide = true;
		}
		if (this.position.x > WIDTH) {
			this.position.x = WIDTH;
			this.velocity.x = -this.velocity.x;
			collide = true;
		}
		if (this.position.y < 20) {
			this.position.y = 20;
			this.velocity.y = -this.velocity.y;
			collide = true;
		}
		if (this.position.y > HEIGHT) {
			this.position.y = HEIGHT;
			this.velocity.y = -this.velocity.y;
			collide = true;
		}
		if (collide)
			this.rotation = atan2(this.velocity.y, this.velocity.x);
	}
}

function Flock(numBoids) {
	this.boids = [];
	for (var i=0;i<numBoids;i++) {
		this.boids.push(
			new Boid(
				WIDTH * random(),
				HEIGHT * random(),
				random(),
				random()
			)
		);
	}

	this.addBoid = function() {
		this.boids.push(
			new Boid(
				WIDTH * random(),
				HEIGHT * random(),
				random(),
				random()
			)
		);
	}

	this.step = function() {
		for (var i=0,l=this.boids.length;i<l;i++) {
			this.boids[i].react(this.boids);
		}
		for (var i=0,l=this.boids.length;i<l;i++) {
			this.boids[i].move();
		}
	}

}
