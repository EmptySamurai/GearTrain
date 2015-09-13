
define(['models/BaseRotatingPart', 'models/Shaft'], function (BaseRotatingPart, Shaft) {

    function Gear(params, shaft, parentGear) {
        BaseRotatingPart.call(this, params);
        this.parentGear = parentGear; //Only gears that created shaft has it
        this.teeth = params.teeth;
        this.innerRadius = params.innerRadius;
        this.width = params.width;
        this.gears = [];
        this.shaft = shaft;
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
            if (this.parentGear) {
                this.parentGear.iterate(f, this)
            }
        } else {
            for (i = 0; i < this.gears.length; i++) {
                gear = this.gears[i];
                if (gear && gear != initiator) {
                    gear.iterate(f, this);
                }
            }
            this.shaft.iterate(f, this);
            if (this.parentGear && this.parentGear!=initiator) {
                this.parentGear.iterate(f, this);
            }
        }
    };

    Gear.prototype.getIntersections =function() {
        var intersections = [];
        var o = this;
        var checkIntersection = function (e) {
            if (e != o.shaft && e != o.parentGear) {
                if (o.intersects(e)) {
                    intersections.push(e);
                }
            }
        };
        if (this.parentGear) {
            this.parentGear.iterate(checkIntersection);
        } else if (this.shaft) {
            this.shaft.iterate(checkIntersection);
        }
        return intersections;
    };

    return Gear;
});