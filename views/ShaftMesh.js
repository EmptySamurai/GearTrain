/**
 * Created by emptysamurai on 03-May-15.
 */

define(['views/GearTrainMesh'], function (GearTrainMesh) {

    function ShaftGeometry(shaft) {
        THREE.CylinderGeometry.call(this, shaft.radius, shaft.radius, shaft.length, 40);
        this.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    }

    ShaftGeometry.prototype = new THREE.CylinderGeometry();
    ShaftGeometry.prototype.constructor = ShaftGeometry;


    function ShaftMesh(shaft) {
        GearTrainMesh.call(this, new ShaftGeometry(shaft), new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            side: THREE.DoubleSide
        }), shaft);
        this.lookAt(shaft.axis);
        this.up.copy(shaft.up);
        var o = this;
        var updateAngle = function (angle) {
            if (shaft.clockwise)
                o.rotation.z = -angle;
            else
                o.rotation.z = angle;
        };
        shaft.addListener("angle", updateAngle);
        updateAngle(shaft.angle);
        this.position.copy(shaft.position);
        this.model = shaft;
    }

    ShaftMesh.prototype = GearTrainMesh.prototype;
    ShaftMesh.prototype.constructor = ShaftMesh;

    return ShaftMesh;
});