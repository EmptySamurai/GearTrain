/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['models/BaseRotatingPart', 'geometry/Cylinder'],
    function (BaseRotatingPart, Cylinder) {

    function Shaft(params, initiator) {
        BaseRotatingPart.call(this, params);
        this.type='Shaft';
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
            if (gear.parentGear) { //gear that created that shaft
                return gear;
            }
        }
        return null;
    };



    Shaft.prototype.toCylinder = function () {
        return new Cylinder(this.position.toArray(), this.axis.toArray(), this.radius, this.length);
    };

    return Shaft;
});
