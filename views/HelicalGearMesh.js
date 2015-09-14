define(['views/BasicRotatingPartMesh', 'models/HelicalGear'], function (BasicRotatingPartMesh, HelicalGear) {

    var HelicalInvoluteToothGeometry = function (helicalGear) {
        THREE.Geometry.call(this);

        var width = helicalGear.width;
        var teeth = helicalGear.teeth;
        var pressureAngle = helicalGear.radialPressureAngle();
        var pitchCircleRadius = helicalGear.pitchCircleDiameter() / 2;
        var baseRadius = helicalGear.baseCircleRadius();
        var outsideRadius = helicalGear.outsideCircleRadius();
        var rootRadius = helicalGear.rootRadius();

        var zAxis = new THREE.Vector3(0, 0, 1);
        var vertices = this.vertices;


        var halfToothAngleAtBaseCircle = Math.PI / (2 * teeth) + (Math.tan(pressureAngle) - pressureAngle);

        var segments = 12;

        var maxAngle = Math.sqrt(outsideRadius * outsideRadius - baseRadius * baseRadius) / baseRadius;
        var step = maxAngle / segments;

        //create involute curve
        var involuteVertices = [];
        for (i = 0; i < segments; i++) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle);
            if (i == 0) {
                v = new THREE.Vector3(x, y, 0);
                v.sub(new THREE.Vector3(x, y, 0).setLength(baseRadius - rootRadius));
                v.applyAxisAngle(zAxis, -2 * halfToothAngleAtBaseCircle);
                involuteVertices.push(v);
            }
            v = new THREE.Vector3(x, y, widthShift);
            v.applyAxisAngle(zAxis, -2 * halfToothAngleAtBaseCircle);
            involuteVertices.push(v);
        }

        for (i = segments - 1; i >= 0; i--) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = -(baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle));
            v = new THREE.Vector3(x, y, 0);
            involuteVertices.push(v);
            if (i == 0) {
                v = new THREE.Vector3(x, y, 0);
                v.sub(new THREE.Vector3(x, y, 0).setLength(baseRadius - rootRadius));
                involuteVertices.push(v);
            }
        }


        //In cylindrical coordinates helix curve parametrisation is {r, atan2(cos(t), sin(t)), r*tan(a)*t}
        //where r is pitch circle radius and a is helix angle
        var helixAngleTan = Math.tan(helicalGear.helixAngle);
        var tMax = width / (pitchCircleRadius * helixAngleTan);

        var helixSegments = 20;
        var tStep = tMax / helixSegments;

        var vertexesCount = involuteVertices.length;

        for (var j = 0; j < helixSegments + 1; j += 1) {
            var i, angle, x, y, v, length;

            var t = tStep * j;
            var rotationAngle;
            if (helicalGear.handedness == HelicalGear.LEFT_HANDED)
                rotationAngle = Math.atan2(Math.cos(t), Math.sin(t));
            else
                rotationAngle = Math.atan2(-Math.sin(t), Math.cos(t));

            var widthShift = pitchCircleRadius * helixAngleTan * t;

            //Create first part of tooth profile
            var firstInvoluteVertex = j * vertexesCount;
            var lastInvoluteVertex = (j + 1) * vertexesCount - 1;

            for (i = 0; i < vertexesCount; i++) {
                v = involuteVertices[i].clone();
                v.z = widthShift;
                v.applyAxisAngle(zAxis, rotationAngle);
                vertices.push(v);
            }

            if (j == 0 || j == helixSegments) {
                //Add front faces
                for (i = firstInvoluteVertex; i < lastInvoluteVertex - 1; i += 1) {
                    this.faces.push(new THREE.Face3(i, i + 1, lastInvoluteVertex));
                }
            }


            if (j > 0) {
                //Add side faces
                for (var k = firstInvoluteVertex; k < lastInvoluteVertex; k += 1) {
                    this.faces.push(new THREE.Face3(k, k - vertexesCount, k + 1 - vertexesCount));
                    this.faces.push(new THREE.Face3(k, k + 1 - vertexesCount, k + 1));
                }
            }
        }

        if (helicalGear.handedness == HelicalGear.LEFT_HANDED)
            maxAngle = Math.PI/2-Math.atan2(Math.cos(tMax), Math.sin(tMax));
        else
            maxAngle = -Math.atan2(-Math.sin(tMax), Math.cos(tMax));

        var halfToothAngleAtPitchCircle = Math.PI / (2 * teeth);
        var angleFromBaseToPitchCircle = (halfToothAngleAtBaseCircle-halfToothAngleAtPitchCircle);
        var angleToLastInvoluteVertex = Math.atan2(vertices[vertexesCount-2].x, vertices[vertexesCount-2].y);
        var rotateAngle = angleToLastInvoluteVertex+ angleFromBaseToPitchCircle + maxAngle/2; //TODO: find out why this works
        this.applyMatrix(new THREE.Matrix4().makeRotationZ(rotateAngle));


        this.mergeVertices();
        this.computeFaceNormals();
        this.computeVertexNormals();


    };

    HelicalInvoluteToothGeometry.prototype = new THREE.Geometry();
    HelicalInvoluteToothGeometry.prototype.constructor = HelicalInvoluteToothGeometry;


    var HelicalGearGeometry = function (helicalGear) {

        THREE.Geometry.call(this);
        var mIdentity = new THREE.Matrix4();

        //create wheel
        var innerRadius = helicalGear.innerRadius;
        var rootRadius = helicalGear.rootRadius();
        var width = helicalGear.width;
        var wheelPoints = [
            new THREE.Vector3(innerRadius, 0, 0),
            new THREE.Vector3(rootRadius, 0, 0),
            new THREE.Vector3(rootRadius, 0, width),
            new THREE.Vector3(innerRadius, 0, width),
            new THREE.Vector3(innerRadius, 0, 0)
        ];

        var gear = new THREE.LatheGeometry(wheelPoints, Math.ceil(10 * rootRadius));
        this.merge(gear, mIdentity);


        //create teeth
        var mRotate = new THREE.Matrix4();
        var tooth = new HelicalInvoluteToothGeometry(helicalGear);
        for (var i = 0; i < 2 * Math.PI; i += Math.PI * 2 / helicalGear.teeth) {
            mRotate.makeRotationZ(i);
            this.merge(tooth.clone(), mRotate);
        }

        this.mergeVertices();

        this.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -width / 2));

    };

    HelicalGearGeometry.prototype = new THREE.Geometry();
    HelicalGearGeometry.prototype.constructor = HelicalGearGeometry;

    function HelicalGearMesh(helicalGear) {
        if (!helicalGear.color) {
            helicalGear.color = Math.floor((Math.random() * 0xFFFFFF) + 1);
        }
        BasicRotatingPartMesh.call(this, new HelicalGearGeometry(helicalGear), new THREE.MeshBasicMaterial({
            color: helicalGear.color,
            side: THREE.DoubleSide,
            wireframe: true
        }), helicalGear);

    }

    HelicalGearMesh.prototype = BasicRotatingPartMesh.prototype;
    HelicalGearMesh.prototype.constructor = HelicalGearMesh;

    return HelicalGearMesh;

});