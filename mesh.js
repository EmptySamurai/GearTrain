/**
 * Basic mesh for all parts of gear train
 * @param geometry three.js Geometry object
 * @param material three.js Material object
 * @param model model of the
 * @constructor
 */
function GearTrainMesh(geometry, material, model) {
    THREE.Mesh.call(this, geometry, material);
    this.model = model;
    this._ee = new EventEmitter();
}

GearTrainMesh.prototype = new THREE.Mesh();
GearTrainMesh.prototype.constructor = GearTrainMesh;

GearTrainMesh.prototype.onDoubleClick = function(f) {
    this._ee.addListener("dblclick", f);
};

GearTrainMesh.prototype.mouseDoubleClick = function (mesh, position) {
    this._ee.emitEvent("dblclick", [mesh, position]);
};

GearTrainMesh.prototype.onRightButtonClick = function(f) {
    this._ee.addListener("rclick", f);
};

GearTrainMesh.prototype.mouseRightButtonClick = function (mesh, position) {
    this._ee.emitEvent("rclick", [mesh, position]);
};