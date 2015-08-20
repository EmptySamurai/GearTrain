/**
 * Created by emptysamurai on 03-May-15.
 */

/**********************
 * BASE ROTATING PART *
 **********************/

function BaseRotatingPart(params) {
    this.speed = params.speed; //speed in r.p.m
    this.clockwise = params.clockwise;
    this.angle = params.angle;
    this.position = params.position;
    this.axis = params.axis.normalize();
}
BaseRotatingPart.prototype.__proto__ = EventEmitter.prototype;


BaseRotatingPart.prototype.rotate = function (ms) {
    var radSpeed = (2 * Math.PI) / 60 * this.speed; //speed in radians
    this.angle = this.angle + radSpeed * (ms / 1000);
    this.emitEvent("angle", [this.angle]);
};

BaseRotatingPart.prototype.toCylinder = function () {
    throw Error("Not implemented");
};

BaseRotatingPart.prototype.intersects = function (part) {
    return this.toCylinder().intersects(part.toCylinder());
};


/**************
 * GEAR TRAIN *
 **************/

function GearTrain(driverShaft) {
    this.driverShaft = driverShaft;

    this._started = false;
    var o = this;
    Object.defineProperty(this, "started", {
        get: function () {
            return o._started;
        }
    });

}

GearTrain.prototype.iterate = function (f) {
    if (this.driverShaft)
        this.driverShaft.iterate(f);
};

GearTrain.prototype.removeGear = function (gear) {
    var i;

    if (gear.parent) {
        for (i = 0; i < gear.parent.gears.length; i++) {
            if (gear.parent.gears[i] == gear) {
                gear.parent.gears[i] = null;
            }
        }
    } else {
        for (i = 0; i < gear.gears.length; i++) {
            var g = gear.gears[i];
            if (g)
                this.removeGear(g);
        }
        var gearIndex = gear.shaft.gears.indexOf(gear);
        gear.shaft.gears.splice(gearIndex, 1);
    }
};

GearTrain.prototype.removeShaft = function (shaft) {
    if (shaft == this.driverShaft) {
        throw new Error("Can't remove driver shaft");
    }

    this.removeGear(shaft.getCreatingGear());
};


GearTrain.prototype.start = function (interval) {
    if (this._started) {
        this.stop();
    }
    var o = this;
    this._interval = setInterval(function () {
        o.update(interval);
    }, interval);
    this._started = true;
};

GearTrain.prototype.stop = function () {
    clearInterval(this._interval);
    this._started = false;
};

GearTrain.prototype.update = function (ms) {
    this.iterate(function (e) {
        e.rotate(ms);
    });
};

/*********
 * SHAFT *
 *********/

function Shaft(params, initiator) {
    BaseRotatingPart.call(this, params);
    this.length = params.length;
    this.radius = params.radius;
    this.gears = [];

    if (initiator) {
        var o = this;
        var intersections = [];
        var checkIntersection = function (e) {
            if (o.intersects(e)) {
                intersections.push(e);
            }
        };
        initiator.iterate(checkIntersection, this);

        if (intersections.length > 0) {
            throw new Error("Shaft is intersecting");
        }
    }
}

Shaft.prototype.__proto__ = BaseRotatingPart.prototype;

Shaft.prototype.iterate = function (f, initiator) {
    f(this);
    for (var i = 0; i < this.gears.length; i++) {
        var gear = this.gears[i];
        if (gear != initiator) {
            gear.iterate(f, this);
        }
    }
};

Shaft.prototype.getCreatingGear = function () {
    for (var i = 0; i < this.gears.length; i++) {
        var gear = this.gears[i];
        if (gear.parent) { //gear that created that shaft
            return gear;
        }
    }
    return null;
};

/**
 *
 * @param params Gear parameters: teeth, width, diametral pitch, pressure angle
 * @param position Position of the gear (will be projected to the axis)
 */
Shaft.prototype.connectSpurGear = function (params, position) {
    position.projectOnVector(this.axis);
    params.position = position;
    params.speed = this.speed;
    params.axis = this.axis;
    params.clockwise = this.clockwise;
    params.angle = 0;
    params.innerRadius = this.radius;
    var gear = new SpurGear(params, this, null);
    this.gears.push(gear);
    return gear;
};

Shaft.prototype.toCylinder = function () {
    return new Cylinder(this.position.toArray(), this.axis.toArray(), this.radius, this.length);
};


/********
 * GEAR *
 ********/

function Gear(params, shaft, parent) {
    BaseRotatingPart.call(this, params);
    this.parent = parent; //Only gears that creted shaft has it
    this.teeth = params.teeth;
    this.innerRadius = params.innerRadius;
    this.width = params.width;
    this.gears = [];
    this.shaft = shaft;

    /*var o = this;

     var initializeGearProperty = function (name, index) {
     Object.defineProperty(o, name, {
     get: function () {
     return o.gears[index];
     },
     set: function (gear) {
     o.gears[index] = gear;
     o.emitEvent(name, [gear]);
     }
     })
     };
     initializeGearProperty("leftGear", 0);
     initializeGearProperty("topGear", 1);
     initializeGearProperty("rightGear", 2);
     initializeGearProperty("bottomGear", 3);*/

}

Gear.prototype.__proto__ = BaseRotatingPart.prototype;

Gear.prototype.iterate = function (f, initiator) {
    f(this);
    var i, gear;

    if (initiator instanceof Shaft) {
        for (i = 0; i < this.gears.length; i++) {
            gear = this.gears[i];
            if (gear) {
                gear.iterate(f, this);
            }
        }
    } else {
        for (i = 0; i < this.gears.length; i++) {
            gear = this.gears[i];
            if (gear && gear != initiator) {
                gear.iterate(f, this);
            }
        }
        this.shaft.iterate(f, this);
    }
};


/*************
 * SPUR GEAR *
 *************/

function SpurGear(params, shaft, parent) {
    Gear.call(this, params, shaft, parent);
    this.diametralPitch = params.diametralPitch;
    this.pressureAngle = params.pressureAngle;
    this.pitchCircleDiameter = this.teeth / this.diametralPitch;
    this.baseCircleRadius = this.pitchCircleDiameter * Math.cos(this.pressureAngle) / 2;
    this.addendumCircleRadius = (this.teeth + 2) / this.diametralPitch / 2;
    this.rootRadius = (this.teeth - 2) / this.diametralPitch / 2;
    if (this.rootRadius <= this.innerRadius) {
        throw new Error("Inner radius larger than root diameter");
    }
    var o = this;
    var intersections = [];
    var checkIntersection = function (e) {
        if (e != shaft && e != parent) {
            if (o.intersects(e)) {
                intersections.push(e);
            }
        }
    };
    if (parent) {
        parent.iterate(checkIntersection);
    } else if (shaft) {
        shaft.iterate(checkIntersection);
    }
    if (intersections.length > 0) {
        throw new Error("Spur gear is intersecting");
    }

}

SpurGear.prototype = Gear.prototype;

SpurGear.prototype.toCylinder = function () {
    return new Cylinder(this.position.toArray(), this.axis.toArray(), this.addendumCircleRadius, this.width);
};

/**
 *
 * @param params Object containing teeth, inner radius
 * @param direction The direction of connection *
 * @param up the up of the 3d object
 * @return {SpurGear} connected gear
 */
SpurGear.prototype.connectGear = function (params, direction, up) {
    params.speed = this.speed * this.teeth / params.teeth;
    params.clockwise = !this.clockwise;
    direction.normalize();
    up.normalize();
    var jointAngle = Math.acos(direction.dot(up));
    var cross = new THREE.Vector3().crossVectors(direction, up);
    if (this.axis.dot(cross) < 0) {
        jointAngle = -jointAngle;
    }
    jointAngle = this.clockwise ? jointAngle : -jointAngle;
    var ratio = this.teeth / params.teeth;
    /*
     Suppose that initially upper tooth is centered by Y axis
     1. Firstly let's imagine that gears' centers are on Y axis and driven gear is above driver gear
     Now we rotate driven gear 180deg so upper tooth become down tooth and is centered by Y axis
     Then we rotate driven gear by half of an angle between teeth so the driver's upper tooth will be exactly between two driven's teeth
     If driver was rotated by some angle than driven should be rotated by the same angle multiplied by ratio
     2. Now there is a joint angle - an angle between Y axis and line connecting gears' centers. If driver rotates clockwise it's positive otherwise not.
     We will try to 'imitate' the situation that was in section 1.
     Firstly we 'rotate' driver gear by -joint angle
     Then we 'rotate' the driven gear by -joint angle
     */
    params.angle = Math.PI + 2 * Math.PI / params.teeth / 2 + (this.angle - jointAngle) * ratio - jointAngle;
    params.diametralPitch = this.diametralPitch;
    params.pressureAngle = this.pressureAngle;
    var distance = ((this.teeth + params.teeth) / this.diametralPitch)/2;
    params.position = this.position.clone().add(direction.multiplyScalar(distance));
    params.axis = this.axis.clone();
    params.width = this.width;
    params.radius = params.innerRadius;
    params.length = this.width * 3;
    var shaft = new Shaft(params, this);
    var gear = new SpurGear(params, shaft, this);
    this.gears.push(gear);
    return gear;
};





