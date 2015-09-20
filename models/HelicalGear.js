/*
 * Based mostly on "Elements of Metric Gear Technology"
 * http://sdp-si.com/resources/Elements_Gear_Technology.zip
 * Also
 * http://www.thegears.org/spur-and-helical-gears-for-parallel-shafts-design-theory/#spur-and-helical-gears
 */

define(['models/Gear', 'models/Shaft', 'math/Cylinder'], function (Gear, Shaft, Cylinder) {

    function HelicalGear(params, shaft, parentGear) {
        Gear.call(this, params, shaft, parentGear);
        this.type = HelicalGear.TYPE;
        this.normalModule = params.normalModule;
        this.normalPressureAngle = params.normalPressureAngle;
        this.helixAngle = params.helixAngle;
        this.handedness = params.handedness;
        if (this.rootRadius() <= this.innerRadius) {
            throw new Error("Inner radius larger than root radius");
        }

        //according to http://www.rmcet.com/lib/Resources/E-Books/Mech-auto/E-Books%20Machine%20Design-Khurmi%20R.s/CHP-29.pdf
        if (this.width * Math.tan(this.helixAngle) < this.axialPitch()) {
            throw new Error("Overlap should be at least equal to axial pitch");
        }

        if (this.getIntersections().length > 0) {
            throw new Error("Helical gear has intersections");
        }
    }

    HelicalGear.prototype = Object.create(Gear.prototype);

    HelicalGear.TYPE = 'HelicalGear';

    HelicalGear.prototype.radialPressureAngle = function() {
        return Math.atan(Math.tan(this.normalPressureAngle) / Math.cos(this.helixAngle));
    };

    HelicalGear.prototype.pitchCircleDiameter = function () {
        return this.teeth *this.normalModule / Math.cos(this.helixAngle);
    };

    HelicalGear.prototype.baseCircleRadius = function () {
        return this.pitchCircleDiameter() * Math.cos(this.radialPressureAngle()) / 2;
    };

    HelicalGear.prototype.outsideCircleRadius = function () {
        return (this.pitchCircleDiameter() + 2 * this.normalModule) / 2;
    };

    HelicalGear.prototype.rootRadius = function () {
        return (this.pitchCircleDiameter() - 2.4 * this.normalModule) / 2;
    };

    HelicalGear.prototype.axialPitch = function () {
        return this.normalModule / Math.sin(this.helixAngle);
    };


    HelicalGear.prototype.toCylinder = function () {
        return new Cylinder(this.position.toArray(), this.axis.toArray(), this.outsideCircleRadius(), this.width);
    };

    HelicalGear.LEFT_HANDED = 'left';
    HelicalGear.RIGHT_HANDED = 'right';

    /**
     * Connects new gear to shaft
     * @param shaft Shaft to connect
     * @param params Gear parameters: teeth, width, normal module, pressure angle
     * @param position Position of the gear (will be projected to the axis)
     */
    HelicalGear.connectToShaft = function (shaft, params, position) {
        position = shaft.getClosestPositionForGear(position, params.width);
        params.position = position;
        params.totalRatio = shaft.totalRatio;
        params.axis = shaft.axis;
        params.clockwise = shaft.clockwise;
        params.angle = 0;
        params.innerRadius = shaft.radius;
        params.handedness = HelicalGear.LEFT_HANDED;
        params.helixAngle = Math.PI / 4;
        var gear = new HelicalGear(params, shaft, null);
        shaft.addGear(gear);
        return gear;
    };

    /**
     *
     * @param params Object containing teeth, inner radius, shaft length
     * @param direction The direction of connection
     * @return {HelicalGear} connected gear
     */
    HelicalGear.prototype.connectGear = function (params, direction) {
        var shaftAngle = Math.PI / 2;
        params.teeth = Math.max(4, params.teeth);
        params.helixAngle = shaftAngle - this.helixAngle;
        var ratio = (this.teeth * Math.cos(params.helixAngle)) / ( params.teeth * Math.cos(this.helixAngle));
        params.totalRatio = this.totalRatio * ratio;
        params.clockwise = !this.clockwise;
        params.handedness = this.handedness;
        params.up = direction.clone().normalize();
        params.width = this.width;
        params.normalModule = this.normalModule;
        params.normalPressureAngle = this.normalPressureAngle;
        var up = this.up;
        direction.normalize();
        up.normalize();
        var jointAngle = Math.acos(direction.dot(up));
        var cross = new THREE.Vector3().crossVectors(direction, up);
        if (this.axis.dot(cross) < 0) {
            jointAngle = -jointAngle;
        }
        jointAngle = this.clockwise ? jointAngle : -jointAngle;

        params.angle = Math.PI +(this.angle - jointAngle) * ratio;

        var distance = ((this.teeth / Math.cos(this.helixAngle) + params.teeth / Math.cos(params.helixAngle)) * this.normalModule) / 2;
        params.position = this.position.clone().add(direction.clone().multiplyScalar(distance));
        params.axis = new THREE.Vector3().crossVectors(this.axis, direction).normalize().negate();
        params.radius = params.innerRadius;
        var shaft = new Shaft(params, this);
        var gear = new HelicalGear(params, shaft, this);
        shaft.addGear(gear);
        this.gears.push(gear);
        return gear;
    };

    HelicalGear.prototype.getParamsObject = function() {
        if (this.parentGear) {
            return {
                teeth: this.teeth,
                innerRadius: this.innerRadius,
                length: this.shaft.length,
                direction: this.up.clone().toArray()
            }
        } else {
            return {
                teeth: this.teeth,
                width: this.width,
                normalModule: this.normalModule,
                normalPressureAngle : this.normalPressureAngle,
                type: this.type,
                position : this.position.toArray()
            }
        }
    };

    return HelicalGear;
});