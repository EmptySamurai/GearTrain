define(['models/BaseRotatingPart', 'math/Cylinder'],
    function (BaseRotatingPart, Cylinder) {

        function Shaft(params, initiator) {
            BaseRotatingPart.call(this, params);
            this.type = Shaft.TYPE;
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
                    throw new Error("Shaft has intersections");
                }
            }
        }

        Shaft.prototype = Object.create(BaseRotatingPart.prototype);

        Shaft.TYPE = 'Shaft';

        Shaft.prototype.iterate = function (f, initiator) {
            f(this);
            for (var i = 0; i < this.gears.length; i++) {
                var gear = this.gears[i];
                if (gear != initiator) {
                    gear.iterate(f, this);
                }
            }
        };

        Shaft.prototype.addGear = function (gear) {
            if (gear.width > this.length) {
                throw new Error("Width of gear is larger than shaft length");
            }
            this.gears.push(gear);
        };

        Shaft.prototype.removeGear = function (gear) {
            var gearIndex = this.gears.indexOf(gear);
            if (gearIndex >= 0) {
                this.gears.splice(gearIndex, 1);
            }
        };

        Shaft.prototype.getParentGear = function () {
            for (var i = 0; i < this.gears.length; i++) {
                var gear = this.gears[i];
                if (gear.parentGear) { //gear that created that shaft
                    return gear;
                }
            }
            return null;
        };

        Shaft.prototype.isDriverShaft = function() {
            return this.getParentGear()==null;
        };


        Shaft.prototype.toCylinder = function () {
            return new Cylinder(this.position.toArray(), this.axis.toArray(), this.radius, this.length);
        };

        /**
         * Finds closest to point available point on axis line for gear position. It is supposed that gear position is located at gear center.
         * @param point point for which we find closest point on axis line
         * @param gearWidth width of gear
         * @returns {THREE.Vector3} closest to point available point on axis line
         */
        Shaft.prototype.getClosestPositionForGear = function (point, gearWidth) {
            if (this.length < gearWidth) {
                throw new Error('Width of gear is larger than shaft length');
            }
            var halfAvailableShaft = this.axis.clone().setLength(this.length / 2 - gearWidth / 2);
            var axisLine = new THREE.Line3(this.position.clone().add(halfAvailableShaft), this.position.clone().sub(halfAvailableShaft));
            return axisLine.closestPointToPoint(point, true);
        };

        return Shaft;
    });
