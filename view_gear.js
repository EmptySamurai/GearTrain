/**
 * Created by emptysamurai on 03-May-15.
 */
var ToothGeometry = function (spurGear) {
    THREE.Geometry.call(this);
    var vertices = this.vertices;
    var baseRadius = spurGear.baseCircleRadius;

    var addendumAngle = Math.sqrt(spurGear.addendumCircleRadius * spurGear.addendumCircleRadius - baseRadius * baseRadius) / baseRadius;
    var halfToothAngle = Math.PI / (2 * spurGear.teeth) + Math.tan(spurGear.pressureAngle) - spurGear.pressureAngle;

    var segments = 12;

    var step = addendumAngle / segments;


    //Create first part of tooth profile
    var firstLeftVertice = 0;
    var firstRightVertice = 1;

    var i, angle, x, y, v, v2;

    for (i = 0; i < segments; i++) {
        angle = step * i;
        x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
        y = baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle);
        v = new THREE.Vector3(x, y, 0);
        v2 = v.clone();
        v2.z = spurGear.width;
        vertices.push(v);
        vertices.push(v2);
        if (i !== 0) {
            var l = vertices.length;
            this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
            this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
        }
    }

    //Create second part of tooth profile
    this.applyMatrix(new THREE.Matrix4().makeRotationZ(-2 * halfToothAngle));
    for (i = segments - 1; i >= 0; i--) {
        angle = step * i;
        x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
        y = -(baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle));
        v = new THREE.Vector3(x, y, 0);
        v2 = v.clone();
        v2.z = spurGear.width;
        vertices.push(v);
        vertices.push(v2);
        l = vertices.length;
        this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
        this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
    }

    var lastLeftVertice = vertices.length - 2;
    var lastRightVertice = vertices.length - 1;

    var rotateAngle = Math.atan2(vertices[0].x, vertices[0].y);

    this.applyMatrix(new THREE.Matrix4().makeRotationZ(halfToothAngle));

    //Add side faces
    for (i = firstLeftVertice + 2; i < lastLeftVertice; i += 2) {
        this.faces.push(new THREE.Face3(i-2, i, lastLeftVertice));
        this.faces.push(new THREE.Face3(i-2 + 1, i + 1, lastLeftVertice + 1));
    }


     //Create bottom
     var bottomDepth = spurGear.width;
     var bottomWidth = baseRadius-spurGear.rootRadius/2;
     var  bottomHeight=  vertices[firstLeftVertice].distanceTo(vertices[lastLeftVertice]);
     var bottomGeometry = new THREE.BoxGeometry(bottomWidth, bottomHeight, bottomDepth);
     this.merge(bottomGeometry, new THREE.Matrix4().makeTranslation(spurGear.rootRadius/2+bottomWidth/2, 0, bottomDepth/2));
     this.mergeVertices();

    //Rotate so that tooth will be centered by Y axis
    this.applyMatrix(new THREE.Matrix4().makeRotationZ(rotateAngle-2*halfToothAngle));

    this.computeFaceNormals();
    this.computeVertexNormals();


};

ToothGeometry.prototype = new THREE.Geometry();
ToothGeometry.prototype.constructor = ToothGeometry;


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

    var gear = new THREE.LatheGeometry(wheelPoints, 20);
    this.merge(gear, mIdentity);


    //create cogs
    var mRotate = new THREE.Matrix4();
    var tooth = new ToothGeometry(spurGear);
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