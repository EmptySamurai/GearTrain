/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['models/Gear', 'geometry/Cylinder'], function (Gear, Cylinder) {
    //http://www.sdp-si.com/D805/D805_PDFS/Technical/8050T060.pdf

    function BevelGear(params, shaft, parent) {
        Gear.call(this, params, shaft, parent);
        this.type = 'BevelGear';
        this.diametralPitch = params.diametralPitch;
        this.pressureAngle = params.pressureAngle;
        this.pitchCircleDiameter = this.teeth / this.diametralPitch;
        this.baseCircleRadius = this.pitchCircleDiameter * Math.cos(this.pressureAngle) / 2;
        this.outsideCircleRadius = (this.teeth + 2) / this.diametralPitch / 2;
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


    /**
     * Connects new bevel gear to shaft
     * @param shaft shaft to connect
     * @param params Parameters for the driver gear: shaft, diametralPitch, pressureAngle, number of teeth, child's number of teeth
     * @param position position of driver center
     */
    BevelGear.connectToShaft = function (shaft, params, position) {
        var firstEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2));
        var secondEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2).negate());
        if (firstEnd.distanceTo(position) < secondEnd.distanceTo(position)) {
            position.position = firstEnd;
        } else {
            position.position = secondEnd;
        }
        params.shaft = shaft;
        params.speed = shaft.speed;
        params.axis = shaft.axis;
        params.clockwise = shaft.clockwise;
        params.angle = 0;
        params.innerRadius = shaft.radius;

        var shaftAngle = Math.PI / 2;
        params.pitchConeAngle = Math.atan(params.teeth / params.childTeeth);
        var childPitchConeAngle = shaftAngle - params.pitchConeAngle;
        var childAddendum = 0.54 / params.diametralPitch + 0.46 / (params.diametralPitch * ((params.childTeeth * Math.cos(params.pitchConeAngle)) / (params.teeth * Math.cos(childPitchConeAngle))));
        params.addendum = 2 / params.diametralPitch - childAddendum;
        params.coneDistance = this.teeth / this.diametralPitch / (2 * Math.sin(childPitchConeAngle));
        var driverGear = new BevelGear(params, shaft, null);

    };


    BevelGear.prototype = Gear.prototype;
});