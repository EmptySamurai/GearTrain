
define(['views/BasicRotatingPartMesh'], function (BasicRotatingPartMesh) {

    var SpurInvoluteToothGeometry = function (spurGear) {
        THREE.Geometry.call(this);

        var width = spurGear.width;
        var baseRadius = spurGear.baseCircleRadius();
        var outsideRadius = spurGear.outsideCircleRadius();
        var rootRadius = spurGear.rootRadius();
        var pressureAngle = spurGear.pressureAngle;
        var teeth = spurGear.teeth;

        var vertices = this.vertices;

        var halfToothAngleAtBaseCircle = Math.PI / (2 * teeth) + Math.tan(pressureAngle) - pressureAngle;

        var segments = 12;

        //according to http://www.arc.id.au/GearDrawing.html
        var maxAngle = Math.sqrt(outsideRadius * outsideRadius - baseRadius * baseRadius) / baseRadius;
        var step = maxAngle / segments;

        var zAxis = new THREE.Vector3(0, 0, 1);

        //Create first part of tooth profile
        var firstInvoluteVertex = 0;
        var firstInvoluteDeepVertex = 1;

        var i, angle, x, y, v, v2, l;


        for (i = 0; i < segments; i++) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle);
            v = new THREE.Vector3(x, y, 0);
            v.applyAxisAngle(zAxis, -halfToothAngleAtBaseCircle);
            v2 = v.clone();
            v2.z = width;
            vertices.push(v);
            vertices.push(v2);
            l = vertices.length;
            if (l >= 4) {
                this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
                this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
            }
        }


        //Create second part of tooth profile
        for (i = segments - 1; i >= 0; i--) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = -(baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle));
            v = new THREE.Vector3(x, y, 0);
            v.applyAxisAngle(zAxis, halfToothAngleAtBaseCircle);
            v2 = v.clone();
            v2.z = width;
            vertices.push(v);
            vertices.push(v2);
            l = vertices.length;
            this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
            this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
        }

        var lastInvoluteVertex = vertices.length - 2;
        var lastInvoluteDeepVertex = vertices.length - 1;

        //Add side faces
        for (i = firstInvoluteVertex + 2; i < lastInvoluteVertex; i += 2) {
            this.faces.push(new THREE.Face3(i - 2, i, lastInvoluteVertex));
            this.faces.push(new THREE.Face3(i - 2 + 1, i + 1, lastInvoluteVertex + 1));
        }

        //Rotate so that tooth will be centered by Y axis
        this.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI/2));

        //Create bottom

        v = vertices[lastInvoluteVertex].clone().setLength(rootRadius);
        v2 = v.clone();
        v2.z = width;
        vertices.push(v);
        vertices.push(v2);
        l = vertices.length;
        this.faces.push(new THREE.Face3(l - 1, l - 2, lastInvoluteDeepVertex));
        this.faces.push(new THREE.Face3(lastInvoluteDeepVertex, l - 2, lastInvoluteVertex));

        v = vertices[firstInvoluteVertex].clone().setLength(rootRadius);
        v2 = v.clone();
        v2.z = width;
        vertices.push(v);
        vertices.push(v2);
        l = vertices.length;
        this.faces.push(new THREE.Face3(l - 1, l - 2, firstInvoluteDeepVertex));
        this.faces.push(new THREE.Face3(firstInvoluteDeepVertex, l - 2, firstInvoluteVertex));

        this.faces.push(new THREE.Face3(l - 4, l - 2, lastInvoluteVertex));
        this.faces.push(new THREE.Face3(l - 2, lastInvoluteVertex, firstInvoluteVertex));
        this.faces.push(new THREE.Face3(l - 3, l - 1, lastInvoluteDeepVertex));
        this.faces.push(new THREE.Face3(l - 1, lastInvoluteDeepVertex, firstInvoluteDeepVertex));


        this.mergeVertices();
        this.computeFaceNormals();
        this.computeVertexNormals();


    };

    SpurInvoluteToothGeometry.prototype = new THREE.Geometry();
    SpurInvoluteToothGeometry.prototype.constructor = SpurInvoluteToothGeometry;


    var SpurGearGeometry = function (spurGear) {

        THREE.Geometry.call(this);
        var mIdentity = new THREE.Matrix4();

        //create wheel
        var innerRadius = spurGear.innerRadius;
        var width = spurGear.width;
        var rootRadius = spurGear.rootRadius();
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
        var tooth = new SpurInvoluteToothGeometry(spurGear);
        for (var i = 0; i < 2 * Math.PI; i += Math.PI * 2 / spurGear.teeth) {
            mRotate.makeRotationZ(i);
            this.merge(tooth.clone(), mRotate);
        }

        this.mergeVertices();

        this.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -width / 2));

    };

    SpurGearGeometry.prototype = new THREE.Geometry();
    SpurGearGeometry.prototype.constructor = SpurGearGeometry;

    function SpurGearMesh(spurGear) {
        if (!spurGear.color) {
            spurGear.color = Math.floor((Math.random() * 0xFFFFFF) + 1);
        }
        BasicRotatingPartMesh.call(this, new SpurGearGeometry(spurGear), new THREE.MeshBasicMaterial({
            color: spurGear.color,
            side: THREE.DoubleSide,
            wireframe: true
        }), spurGear);
    }

    SpurGearMesh.prototype = BasicRotatingPartMesh.prototype;
    SpurGearMesh.prototype.constructor = SpurGearMesh;

    return SpurGearMesh;

});