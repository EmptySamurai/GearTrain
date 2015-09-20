define(['models/Shaft', 'models/Gear', 'models/SpurGear', 'models/BevelGear', 'models/HelicalGear'], function (Shaft, Gear, SpurGear, BevelGear, HelicalGear) {

    /**
     * Create new gear train
     * @param driverShaftParams.radius radius of the driver shaft
     * @param driverShaftParams.length length of the driver shaft
     * @param driverShaftParams params for driver shaft
     * @param speed speed of the gear train
     * @constructor
     */
    function GearTrain(driverShaftParams, speed) {
        this.driverShaft = new Shaft({
            totalRatio: 1,
            clockwise: true,
            angle: 0,
            position: new THREE.Vector3(0, 0, 0),
            axis: new THREE.Vector3(0, 0, 1),
            radius: driverShaftParams.radius,
            length: driverShaftParams.length
        });
        this.speed = speed;

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
            gear.shaft.removeGear(gear);
        }
    };

    GearTrain.prototype.removeShaft = function (shaft) {
        if (shaft.isDriverShaft()) {
            throw new Error("Can't remove driver shaft");
        }

        this.removeGear(shaft.getParentGear());
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
        var o = this;
        this.iterate(function (e) {
            e.rotate(o.speed, ms);
        });
    };


    GearTrain._DRIVER_SHAFT_ID = -1;
    GearTrain.prototype.save = function () {
        var result = {};
        result.driverShaftParams = {
            length: this.driverShaft.length,
            radius: this.driverShaft.radius
        };
        result.speed = this.speed;

        var idCounter = 1;
        var idMap = new Map();
        idMap.set(this.driverShaft, GearTrain._DRIVER_SHAFT_ID);
        var gearsParams = [];

        this.iterate(function (e) {
            if (e instanceof Gear) {
                var gearId = idCounter;
                idMap.set(e, gearId);
                idCounter++;
                var shaftId;
                if (!idMap.has(e.shaft)) {
                    shaftId = idCounter;
                    idCounter++;
                    idMap.set(e.shaft, shaftId);
                } else {
                    shaftId = idMap.get(e.shaft);
                }

                var params = e.getParamsObject();
                params.gearId = gearId;
                params.shaftId = shaftId;
                if (e.parentGear) {
                    params.parentGearId = idMap.get(e.parentGear);
                }
                gearsParams.push(params);
            }
        });
        result.gearsParams = gearsParams;
        return result;
    };

    GearTrain.load = function (gearTrainParams) {
        var gearTrain = new GearTrain(gearTrainParams.driverShaftParams, gearTrainParams.speed);
        var idMap = new Map();
        idMap.set(GearTrain._DRIVER_SHAFT_ID, gearTrain.driverShaft);
        for (var i = 0; i < gearTrainParams.gearsParams.length; i++) {
            var gearParams = gearTrainParams.gearsParams[i];
            var gear;
            if (gearParams.parentGearId) {
                var parentGear = idMap.get(gearParams.parentGearId);
                var direction = new THREE.Vector3().fromArray(gearParams.direction);
                gear = parentGear.connectGear(gearParams, direction);
                idMap.set(gearParams.gearId, gear);
                idMap.set(gearParams.shaftId, gear.shaft);
            } else {
                var parentShaft = idMap.get(gearParams.shaftId);
                var position = new THREE.Vector3().fromArray(gearParams.position);
                switch (gearParams.type) {
                    case SpurGear.TYPE:
                    {
                        gear = SpurGear.connectToShaft(parentShaft, gearParams, position);
                        break;
                    }
                    case BevelGear.TYPE:
                    {
                        gear = BevelGear.connectToShaft(parentShaft, gearParams, position);
                        break;
                    }
                    case HelicalGear.TYPE:
                    {
                        gear = HelicalGear.connectToShaft(parentShaft, gearParams, position);
                        break;
                    }
                    default :
                    {
                        throw new Error("Unknown gear type: " + gearParams.type);
                    }
                }
                idMap.set(gearParams.gearId, gear);
            }
        }
        return gearTrain;
    };


    return GearTrain;
});