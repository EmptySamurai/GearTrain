/**
 * Created by emptysamurai on 25-Aug-15.
 */

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

    return Gear;
});