/*
 * Based mostly on "Elements of Metric Gear Technology"
 * http://sdp-si.com/resources/Elements_Gear_Technology.zip
 */

define(['models/Gear', 'models/Shaft', 'math/Cylinder'], function (Gear, Shaft, Cylinder) {

    function BevelGear(params, shaft, parent) {
        Gear.call(this, params, shaft, parent);
        this.type = BevelGear.TYPE;
        this.module = params.module;
        this.pressureAngle = params.pressureAngle;
        this.childTeeth = params.childTeeth;

        if (this.topRadius() <= this.innerRadius) {
            throw new Error("Inner radius larger than top radius");
        }

        var faceWidth = this.faceWidth();
        if (faceWidth > this.coneDistance() / 3 || faceWidth > 10 * this.module) {
            throw new Error("Face width is too large");
        }

        if (this.getIntersections().length > 0) {
            throw new Error("Bevel gear has intersections");
        }
    }

    BevelGear.prototype = Object.create(Gear.prototype);

    BevelGear.TYPE = 'BevelGear';

    BevelGear.shaftAngle = Math.PI / 2;

    //Formulas are mostly written for only miter gears (shaft angle = 90deg)

    BevelGear.prototype.pitchConeAngle = function () {
        return Math.atan(this.teeth / this.childTeeth);
    };


    BevelGear.prototype.pitchCircleDiameter = function () {
        return this.teeth * this.module;
    };

    BevelGear.prototype.addendum = function () {
        return 1 * this.module;
    };

    BevelGear.prototype.dedendum = function () {
        return 1.25 * this.module;
    };


    BevelGear.prototype.coneDistance = function () {
        return this.pitchCircleDiameter() / (2 * Math.sin(this.pitchConeAngle()));
    };

    BevelGear.prototype.backConeDistance = function () {
        return this.coneDistance() * Math.tan(this.pitchConeAngle());
    };

    BevelGear.prototype.dedendumAngle = function () {
        return Math.atan(this.dedendum() / this.coneDistance());
    };

    BevelGear.prototype.addendumAngle = function () {
        return Math.atan(this.addendum() / this.coneDistance());
    };

    BevelGear.prototype.rootConeAngle = function () {
        return this.pitchConeAngle() - this.dedendumAngle();
    };

    BevelGear.prototype.outerConeAngle = function () {
        return this.pitchConeAngle() + this.addendumAngle();
    };

    BevelGear.prototype.faceWidth = function () {
        return this.width / Math.cos(this.rootConeAngle());
    };

    BevelGear.prototype.baseCircleRadius = function () {
        return this.pitchCircleDiameter() * Math.cos(this.pressureAngle) / 2;
    };

    //Not for bevel gear, but for equivalent spur gear
    BevelGear.prototype.outsideCircleRadius = function () {
        return this.pitchCircleDiameter() / 2 + this.addendum();
    };


    BevelGear.prototype.rootRadius = function () {
        return this.pitchCircleDiameter() / 2 - this.dedendum();
    };

    BevelGear.prototype.bottomRadius = function () {
        return (this.backConeDistance() - this.dedendum()) * Math.cos(this.pitchConeAngle());
    };

    BevelGear.prototype.topRadius = function () {
        var topRadiusDif = this.width * Math.tan(this.rootConeAngle());
        return this.bottomRadius() - topRadiusDif;
    };


    BevelGear.prototype.toCylinder = function () {
        var bevelGearOutsideRadius = (this.pitchCircleDiameter() + 2 * this.addendum() * Math.cos(this.pitchConeAngle())) / 2;
        var coneDistance = this.coneDistance();
        var dedendumAngle = this.addendumAngle();
        var addendumAngle = this.dedendumAngle();
        var faceWidth = this.faceWidth();
        var smallDedendum = (coneDistance - faceWidth) * Math.tan(dedendumAngle);
        var smallAddendum = (coneDistance - faceWidth) * Math.tan(addendumAngle);
        var smallSideHeight = smallAddendum + smallDedendum;
        //Calculate addition to gear's width, since smaller end of tooth is over the top plane
        var heightAddition = smallSideHeight * Math.cos((Math.PI - this.outerConeAngle()) - (Math.PI / 2 - addendumAngle));
        var totalHeight = this.width + heightAddition;
        var position = this.position.clone().add(this.axis.clone().setLength(heightAddition / 2));

        return new Cylinder(position.toArray(), this.axis.toArray(), bevelGearOutsideRadius, totalHeight);
    };


    /**
     * Connects new bevel gear to shaft
     * @param shaft shaft to connect
     * @param params Parameters for the gear: module, pressureAngle, number of teeth, child's number of teeth
     * @param position position of gear center
     */
    BevelGear.connectToShaft = function (shaft, params, position) {
        var firstEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2 - params.width / 2));
        var secondEnd = new THREE.Vector3().addVectors(shaft.position, shaft.axis.clone().setLength(shaft.length / 2 - params.width / 2).negate());
        var alongAxis;
        if (firstEnd.distanceTo(position) < secondEnd.distanceTo(position)) {
            params.position = firstEnd;
            params.axis = shaft.axis;
            params.clockwise = shaft.clockwise;
        } else {
            params.position = secondEnd;
            params.axis = shaft.axis.clone().negate();
            params.clockwise = !shaft.clockwise;
        }
        params.shaft = shaft;
        params.totalRatio = shaft.totalRatio;
        params.angle = 0;
        params.innerRadius = shaft.radius;

        var gear = new BevelGear(params, shaft, null);
        shaft.addGear(gear);
        return gear;

    };

    /**
     *
     * @param params Object containing inner radius, shaft length
     * @param direction The direction of connection
     * @return {BevelGear} connected gear
     */
    BevelGear.prototype.connectGear = function (params, direction) {
        params.teeth = this.childTeeth;
        params.childTeeth = this.teeth;
        params.width = this.width;
        params.radius = params.innerRadius;
        params.up = this.axis.clone();
        var ratio = this.teeth / params.teeth;
        params.totalRatio = this.totalRatio * ratio;
        params.clockwise = !this.clockwise;
        var up = this.up;
        direction.normalize();
        up.normalize();
        var jointAngle = Math.acos(direction.dot(up));
        var cross = new THREE.Vector3().crossVectors(direction, up);
        if (this.axis.dot(cross) < 0) {
            jointAngle = -jointAngle;
        }
        jointAngle = this.clockwise ? jointAngle : -jointAngle;
        params.angle = Math.PI + 2 * Math.PI / params.teeth / 2 + (this.angle - jointAngle) * ratio;
        params.module = this.module;
        params.pressureAngle = this.pressureAngle;
        //dirty hack to calculate top radius and root cone angle easily for new gear from params
        params.__proto__ = BevelGear.prototype;
        var yOffset = this.topRadius() / Math.tan(this.rootConeAngle()) + this.width / 2;
        var xOffset = params.topRadius() / Math.tan(params.rootConeAngle()) + params.width / 2;
        params.axis = direction.clone().negate();
        var gearPosition = this.position.clone().add(this.axis.clone().setLength(yOffset)).add(params.axis.clone().negate().setLength(xOffset));
        var shaftPosition = gearPosition.clone().add(params.axis.clone().negate().setLength(params.length / 2 - params.width / 2));
        params.position = shaftPosition;
        var shaft = new Shaft(params, this);
        params.position = gearPosition;
        var gear = new BevelGear(params, shaft, this);
        shaft.addGear(gear);
        this.gears.push(gear);
        return gear;
    };

    BevelGear.prototype.getParamsObject = function () {
        if (this.parentGear) {
            return {
                innerRadius: this.innerRadius,
                length: this.shaft.length,
                direction: this.axis.clone().negate().toArray()
            }
        } else {
            return {
                teeth: this.teeth,
                width: this.width,
                module: this.module,
                pressureAngle: this.pressureAngle,
                childTeeth: this.childTeeth,
                type: this.type,
                position: this.position.toArray()
            }
        }
    };

    return BevelGear;


});