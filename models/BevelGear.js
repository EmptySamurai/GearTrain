/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['models/Gear', 'geometry/Cylinder'], function (Gear, Cylinder) {
    //http://www.sdp-si.com/D805/D805_PDFS/Technical/8050T060.pdf

    function BevelGear(params, shaft, parent) {
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

    /**
     * Creates pair of bevel gears with 90deg shaft angle and connects to shaft
     * @param shaft shaft to connect
     * @param driverParams Parameters for the driver gear: shaft, diametralPitch, pressureAngle, number of teeth
     * @param drivenParams Parameters for the driven gear: number of teeth
     * @param driverPosition position of driver gear center
     * @param drivenDirection direction of driven gear connection
     */
    BevelGear.createGearsPair = function (shaft, driverParams, drivenParams, driverPosition, drivenDirection) {
        var firstEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2));
        var secondEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2).negate());
        var position;
        if (firstEnd.distanceTo(driverPosition) < secondEnd.distanceTo(driverPosition)) {
            driverParams.position = firstEnd;
        } else {
            driverParams.position = secondEnd;
        }
        driverParams.shaft = shaft;
        driverParams.speed = shaft.speed;
        driverParams.axis = shaft.axis;
        driverParams.clockwise = shaft.clockwise;
        driverParams.angle = 0;
        driverParams.innerRadius = shaft.radius;

        var shaftAngle = Math.PI / 2;
        driverParams.pitchConeAngle = Math.atan(driverParams.teeth / drivenParams.teeth);
        drivenParams.pitchConeAngle = shaftAngle - driverParams.pitchConeAngle;
        drivenParams.addendum = 0.54 / driverParams.diametralPitch + 0.46 / (drivenParams.diametralPitch * ((drivenParams.teeth * Math.cos(driverParams.pitchConeAngle)) / (driverParams.teeth * Math.cos(drivenParams.pitchConeAngle))));
        driverParams.addendum = 2 / driverParams.diametralPitch - drivenParams.addendum;
        var driverGear = new BevelGear(driverParams, drivenParams.shaft, null);

    };

    BevelGear.prototype = Gear.prototype;
});