define(function() {
    /**
     * Basic mesh for all parts of gear train
     * @param geometry three.js Geometry object
     * @param material three.js Material object
     * @param model model of the
     * @constructor
     */
    function BasicRotatingPartMesh(geometry, material, model) {
        THREE.Mesh.call(this, geometry, material);

        this.up.copy(model.up);
        this.lookAt(model.axis);

        var initialRotation = this.rotation.z;

        var o = this;
        var updateAngle = function (angle) {
            if (model.clockwise)
                o.rotation.z = initialRotation-angle;
            else
                o.rotation.z = initialRotation+angle;
        };
        model.addListener("angle", updateAngle);
        updateAngle(model.angle);
        this.position.copy(model.position);

        this.model = model;
        this._ee = new EventEmitter();
    }

    BasicRotatingPartMesh.prototype = new THREE.Mesh();
    BasicRotatingPartMesh.prototype.constructor = BasicRotatingPartMesh;

    BasicRotatingPartMesh.prototype.onDoubleClick = function (f) {
        this._ee.addListener("dblclick", f);
    };

    BasicRotatingPartMesh.prototype.mouseDoubleClick = function (mesh, position) {
        this._ee.emitEvent("dblclick", [mesh, position]);
    };

    BasicRotatingPartMesh.prototype.onRightButtonClick = function (f) {
        this._ee.addListener("rclick", f);
    };

    BasicRotatingPartMesh.prototype.mouseRightButtonClick = function (mesh, position) {
        this._ee.emitEvent("rclick", [mesh, position]);
    };

    return BasicRotatingPartMesh;
});

