/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(function() {
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

        if (gear.parentGear) {
            for (i = 0; i < gear.parentGear.gears.length; i++) {
                if (gear.parentGear.gears[i] == gear) {
                    gear.parentGear.gears[i] = null;
                }
            }
        } else {
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

    return GearTrain;
});