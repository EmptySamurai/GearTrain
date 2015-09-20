
define(['views/BasicRotatingPartMesh'], function (BasicRotatingPartMesh) {

    function ShaftGeometry(shaft) {
        THREE.CylinderGeometry.call(this, shaft.radius, shaft.radius, shaft.length, 40);
        this.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    }

    ShaftGeometry.prototype = new THREE.CylinderGeometry();
    ShaftGeometry.prototype.constructor = ShaftGeometry;


    function ShaftMesh(shaft) {
        BasicRotatingPartMesh.call(this, new ShaftGeometry(shaft), new THREE.MeshBasicMaterial({
            color: 0xC3C3C3,
            side: THREE.DoubleSide
        }), shaft);
    }

    ShaftMesh.prototype = BasicRotatingPartMesh.prototype;
    ShaftMesh.prototype.constructor = ShaftMesh;

    return ShaftMesh;
});