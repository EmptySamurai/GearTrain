/*
 * Based mostly on "Elements of Metric Gear Technology"
 * http://sdp-si.com/resources/Elements_Gear_Technology.zip
 */

define(['models/Gear', 'models/Shaft', 'math/Cylinder'], function (Gear, Shaft, Cylinder) {

    function SpurGear(params, shaft, parentGear) {
        Gear.call(this, params, shaft, parentGear);
        this.type = SpurGear.TYPE;
        this.module = params.module;
        this.pressureAngle = params.pressureAngle;
        if (this.rootRadius() <= this.innerRadius) {
            throw new Error("Inner radius larger than root radius");
        }

        if (this.getIntersections().length > 0) {
            throw new Error("Spur gear has intersections");
        }
    }

    SpurGear.prototype = Object.create(Gear.prototype);

    SpurGear.TYPE = 'SpurGear';

    SpurGear.prototype.pitchCircleDiameter = function () {
        return this.teeth * this.module;
    };

    SpurGear.prototype.baseCircleRadius = function () {
        return this.pitchCircleDiameter() * Math.cos(this.pressureAngle) / 2;
    };

    SpurGear.prototype.outsideCircleRadius = function () {
        return (this.teeth + 2) * this.module / 2;
    };

    SpurGear.prototype.rootRadius = function () {
        return (this.teeth - 2) * this.module / 2;
    };

    SpurGear.prototype.toCylinder = function () {
        return new Cylinder(this.position.toArray(), this.axis.toArray(), this.outsideCircleRadius(), this.width);
    };


    /**
     * Connects new gear to shaft
     * @param shaft Shaft to connect
     * @param params Gear parameters: teeth, width, module, pressure angle
     * @param position Position of the gear (will be projected to the axis)
     */
    SpurGear.connectToShaft = function (shaft, params, position) {
        position = shaft.getClosestPositionForGear(position, params.width);
        params.position = position;
        params.totalRatio = shaft.totalRatio;
        params.axis = shaft.axis;
        params.clockwise = shaft.clockwise;
        params.angle = 0;
        params.innerRadius = shaft.radius;
        var gear = new SpurGear(params, shaft, null);
        shaft.addGear(gear);
        return gear;
    };

    /**
     *
     * @param params Object containing teeth, inner radius, shaft length
     * @param direction The direction of connection
     * @return {SpurGear} connected gear
     */
    SpurGear.prototype.connectGear = function (params, direction) {
        params.teeth = Math.max(4, params.teeth);
        var ratio = this.teeth / params.teeth;
        params.totalRatio = this.totalRatio*ratio;
        params.clockwise = !this.clockwise;
        params.up = direction.clone().normalize();
        var up = this.up;
        direction.normalize();
        up.normalize();
        var jointAngle = Math.acos(direction.dot(up));
        var cross = new THREE.Vector3().crossVectors(direction, up);
        if (this.axis.dot(cross) < 0) {
            jointAngle = -jointAngle;
        }
        jointAngle = this.clockwise ? jointAngle : -jointAngle;
        /*
         Suppose that initially upper tooth is centered by Y axis
         1. Firstly let's imagine that gears' centers are on Y axis and driven gear is above driver gear
         Now we rotate driven gear 180deg so upper tooth become down tooth and is centered by Y axis
         Then we rotate driven gear by half of an angle between teeth so the driver's upper tooth will be exactly between two driven's teeth
         If driver was rotated by some angle than driven should be rotated by the same angle multiplied by ratio
         2. Now there is a joint angle - an angle between Y axis and line connecting gears' centers. If driver rotates clockwise it's positive otherwise not.
         We will try to 'imitate' the situation that was in section 1.
         So we have to 'rotate' driver gear by -joint angle
         */
        params.angle = Math.PI + 2 * Math.PI / params.teeth / 2 + (this.angle - jointAngle) * ratio;
        params.module = this.module;
        params.pressureAngle = this.pressureAngle;
        var distance = ((this.teeth + params.teeth) * this.module) / 2;
        params.position = this.position.clone().add(direction.multiplyScalar(distance));
        params.axis = this.axis.clone();
        params.width = this.width;
        params.radius = params.innerRadius;
        var shaft = new Shaft(params, this);
        var gear = new SpurGear(params, shaft, this);
        shaft.addGear(gear);
        this.gears.push(gear);
        return gear;
    };

    SpurGear.prototype.getParamsObject = function() {
        if (this.parentGear) {
            return {
                teeth: this.teeth,
                innerRadius: this.innerRadius,
                length: this.shaft.length,
                direction: this.position.clone().sub(this.parentGear.position).toArray()
            }
        } else {
            return {
                teeth: this.teeth,
                width: this.width,
                module: this.module,
                pressureAngle : this.pressureAngle,
                type: this.type,
                position : this.position.toArray()
            }
        }
    };

    return SpurGear;
});