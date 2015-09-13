
define(function() {
    function BaseRotatingPart(params) {
        this.totalRatio = params.totalRatio;
        this.clockwise = params.clockwise;
        this.angle = params.angle || 0;
        this.position = params.position.clone();
        this.axis = params.axis.clone().normalize();
        if (!params.up) {
            var randomVector = this.axis.clone();
            randomVector.x += 10;
            this.up = new THREE.Vector3().crossVectors(this.axis, randomVector).normalize();
        } else {
            this.up = params.up.clone().normalize();
        }
    }

    BaseRotatingPart.prototype.__proto__ = EventEmitter.prototype;

    BaseRotatingPart.prototype.rotate = function (speed, ms) {
        var radSpeed = (2 * Math.PI) / 60 * speed * this.totalRatio; //speed in radians
        this.angle = this.angle + radSpeed * (ms / 1000);
        this.emitEvent("angle", [this.angle]);
    };

    BaseRotatingPart.prototype.toCylinder = function () {
        throw Error("Not implemented");
    };

    BaseRotatingPart.prototype.intersects = function (part) {
        return this.toCylinder().intersects(part.toCylinder());
    };

    return BaseRotatingPart;
});