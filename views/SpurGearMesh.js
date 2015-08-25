/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['views/InvoluteToothGeometry', 'views/GearTrainMesh'], function (InvoluteToothGeometry, GearTrainMesh) {

    var SpurGearGeometry = function (spurGear) {

        THREE.Geometry.call(this);
        var mIdentity = new THREE.Matrix4();

        //create wheel
        var wheelPoints = [
            new THREE.Vector3(spurGear.innerRadius, 0, 0),
            new THREE.Vector3(spurGear.rootRadius, 0, 0),
            new THREE.Vector3(spurGear.rootRadius, 0, spurGear.width),
            new THREE.Vector3(spurGear.innerRadius, 0, spurGear.width),
            new THREE.Vector3(spurGear.innerRadius, 0, 0)
        ];

        var gear = new THREE.LatheGeometry(wheelPoints, Math.ceil(10 * spurGear.rootRadius));
        this.merge(gear, mIdentity);


        //create cogs
        var mRotate = new THREE.Matrix4();
        var tooth = new InvoluteToothGeometry(spurGear.width, spurGear.baseCircleRadius, spurGear.addendumAngle, spurGear.rootRadius, spurGear.pressureAngle, spurGear.teeth);
        for (var i = 0; i < 2 * Math.PI; i += Math.PI * 2 / spurGear.teeth) {
            mRotate.makeRotationZ(i);
            this.merge(tooth.clone(), mRotate);
        }

        this.mergeVertices();

        this.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -spurGear.width / 2));

    };

    SpurGearGeometry.prototype = new THREE.Geometry();
    SpurGearGeometry.prototype.constructor = SpurGearGeometry;

    function SpurGearMesh(spurGear) {
        GearTrainMesh.call(this, new SpurGearGeometry(spurGear), new THREE.MeshBasicMaterial({
            color: Math.floor((Math.random() * 0xFFFFFF) + 1),
            side: THREE.DoubleSide
        }), spurGear);
        this.lookAt(spurGear.axis);
        this.up.copy(spurGear.up);
        var o = this;
        var updateAngle = function (angle) {
            if (spurGear.clockwise)
                o.rotation.z = -angle;
            else
                o.rotation.z = angle;
        };
        spurGear.addListener("angle", updateAngle);
        updateAngle(spurGear.angle);
        this.position.copy(spurGear.position);
    }

    SpurGearMesh.prototype = GearTrainMesh.prototype;
    SpurGearMesh.prototype.constructor = SpurGearMesh;

    return SpurGearMesh;

});