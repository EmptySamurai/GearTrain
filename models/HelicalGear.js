/**
 * Created by emptysamurai on 27-Aug-15.
 */

define(['models/Gear', 'models/Shaft', 'geometry/Cylinder'], function (Gear, Shaft, Cylinder) {

    function HelicalGear(params, shaft, parentGear) {
        Gear.call(this, params, shaft, parentGear);
        this.type = HelicalGear.type;
        this.normalDiametralPitch = params.normalDiametralPitch;
        this.pressureAngle = params.pressureAngle;
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
            throw new Error("Helical gear is intersecting");
        }
    }

    HelicalGear.prototype = Object.create(Gear.prototype);

    HelicalGear.type = 'HelicalGear';

    HelicalGear.prototype.radialPressureAngle = function() {
        return Math.atan(Math.tan(this.pressureAngle) / Math.cos(this.helixAngle));
    };

    HelicalGear.prototype.pitchCircleDiameter = function () {
        return this.teeth / (this.normalDiametralPitch * Math.cos(this.helixAngle));
    };

    HelicalGear.prototype.baseCircleRadius = function () {
        return this.pitchCircleDiameter() * Math.cos(this.radialPressureAngle()) / 2;
    };

    HelicalGear.prototype.outsideCircleRadius = function () {
        return (this.pitchCircleDiameter() + 2 / this.normalDiametralPitch) / 2;
    };

    HelicalGear.prototype.rootRadius = function () {
        return (this.pitchCircleDiameter() - 2.4 / this.normalDiametralPitch) / 2;
    };

    HelicalGear.prototype.axialPitch = function () {
        return this.normalDiametralPitch / Math.sin(this.helixAngle);
    };


    HelicalGear.prototype.toCylinder = function () {
        return new Cylinder(this.position.toArray(), this.axis.toArray(), this.outsideCircleRadius(), this.width);
    };

    HelicalGear.LEFT_HANDED = 'left';
    HelicalGear.RIGHT_HANDED = 'right';

    /**
     * Connects new gear to shaft
     * @param shaft Shaft to connect
     * @param params Gear parameters: teeth, width, diametral pitch, pressure angle
     * @param position Position of the gear (will be projected to the axis)
     */
    HelicalGear.connectToShaft = function (shaft, params, position) {
        if (shaft.length<params.width) {
            throw new Error('Width of helical gear is larger than shaft length');
        }
        var halfAvailableShaft = shaft.axis.clone().setLength(shaft.length/2-params.width/2);
        var axisLine = new THREE.Line3(shaft.position.clone().add(halfAvailableShaft), shaft.position.clone().sub(halfAvailableShaft));
        position = axisLine.closestPointToPoint(position, true);
        params.position = position;
        params.speed = shaft.speed;
        params.axis = shaft.axis;
        params.clockwise = shaft.clockwise;
        params.angle = 0;
        params.innerRadius = shaft.radius;
        params.handedness = HelicalGear.LEFT_HANDED;
        params.helixAngle = Math.PI / 4;
        var gear = new HelicalGear(params, shaft, null);
        shaft.gears.push(gear);
        return gear;
    };

    /**
     *
     * @param params Object containing teeth, inner radius
     * @param direction The direction of connection *
     * @return {HelicalGear} connected gear
     */
    HelicalGear.prototype.connectGear = function (params, direction) {
        var shaftAngle = Math.PI / 2;
        params.teeth = Math.max(4, params.teeth);
        params.helixAngle = shaftAngle - this.helixAngle;
        var ratio = (this.teeth * Math.cos(params.helixAngle)) / ( params.teeth * Math.cos(params.helixAngle));
        params.speed = this.speed * ratio;
        params.clockwise = !this.clockwise;
        params.handedness = this.handedness;
        var up = this.up;
        direction.normalize();
        up.normalize();
        var jointAngle = Math.acos(direction.dot(up));
        var cross = new THREE.Vector3().crossVectors(direction, up);
        if (this.axis.dot(cross) < 0) {
            jointAngle = -jointAngle;
        }
        jointAngle = this.clockwise ? jointAngle : -jointAngle;

        //Do not subtract jointAngle since up of the connected gear is direction itself
        console.log("asd");
        //params.angle = Math.PI + (this.angle - jointAngle) * ratio;
        params.angle = Math.PI /*+ 2 * Math.PI / params.teeth / 2 */ + (this.angle - jointAngle) * ratio;
        params.normalDiametralPitch = this.normalDiametralPitch;
        params.pressureAngle = this.pressureAngle;
        var distance = ((this.teeth / Math.cos(this.helixAngle) + params.teeth / Math.cos(params.helixAngle)) / this.normalDiametralPitch) / 2;
        params.position = this.position.clone().add(direction.clone().multiplyScalar(distance));
        params.axis = new THREE.Vector3().crossVectors(this.axis, direction).normalize().negate();
        params.width = this.width;
        params.radius = params.innerRadius;
        params.length = this.width * 3;
        params.up = direction.clone().normalize();
        var shaft = new Shaft(params, this);
        var gear = new HelicalGear(params, shaft, this);
        shaft.gears.push(gear);
        this.gears.push(gear);
        return gear;
    };

    return HelicalGear;
});