
define(['views/BasicRotatingPartMesh'], function (BasicRotatingPartMesh) {

    var BevelInvoluteToothGeometry = function (bevelGear) {
        THREE.Geometry.call(this);

        var baseRadius = bevelGear.baseCircleRadius();
        var rootRadius = bevelGear.rootRadius();
        var outsideRadius = bevelGear.outsideCircleRadius();
        var pressureAngle = bevelGear.pressureAngle;
        var teeth = bevelGear.teeth;
        var faceWidth = bevelGear.faceWidth();
        var pitchConeAngle = bevelGear.pitchConeAngle();

        var coneDistance = bevelGear.coneDistance();
        var backConeDistance = bevelGear.backConeDistance();

        var vertices = this.vertices;

        var halfToothAngleAtBaseCircle = Math.PI / (2 * teeth) + Math.tan(pressureAngle) - pressureAngle;

        var segments = 12;

        var maxAngle = Math.sqrt(outsideRadius * outsideRadius - baseRadius * baseRadius) / baseRadius;
        var step = maxAngle / segments;


        //Create first part of tooth profile
        var firstInvoluteVertex = 0;
        var firstInvoluteDeepVertex = 1;

        var i, angle, x, y, v, v2, l;

        var xDif = backConeDistance - bevelGear.pitchCircleDiameter() / 2;
        var zAxis = new THREE.Vector3(0, 0, 1);
        var yAxis = new THREE.Vector3(0, 1, 0);
        var pitchApex = new THREE.Vector3(0, 0, Math.sqrt(backConeDistance * backConeDistance + coneDistance * coneDistance));

        var bottomCreated=false;
        for (i = 0; i < segments; i++) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle);
            if (i==0 && !bottomCreated) {
                v = new THREE.Vector3(x, y, 0);
                v.sub(new THREE.Vector3(x, y, 0).setLength(baseRadius - rootRadius));
                bottomCreated = true;
                i--;
            } else {
                v = new THREE.Vector3(x, y, 0);
            }
            v.applyAxisAngle(zAxis, -halfToothAngleAtBaseCircle);
            v.x+=xDif;
            v.applyAxisAngle(yAxis, - pitchConeAngle);
            v2 = v.clone().add(new THREE.Vector3().subVectors(pitchApex, v).setLength(faceWidth));
            vertices.push(v);
            vertices.push(v2);
            l = vertices.length;
            if (l >= 4) {
                this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
                this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
            }
        }


        //Create second part of tooth profile
        var lastVertexCreated = false;
        for (i = segments - 1; i >= 0; i--) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = -(baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle));
            if (i==0 && lastVertexCreated) {
                v = new THREE.Vector3(x, y, 0);
                v.sub(new THREE.Vector3(x, y, 0).setLength(baseRadius - rootRadius));
            } else {
                v = new THREE.Vector3(x, y, 0);
                if (i==0) {
                    lastVertexCreated=true;
                    i++;
                }
            }
            v.applyAxisAngle(zAxis, halfToothAngleAtBaseCircle);
            v.x+=xDif;
            v.applyAxisAngle(yAxis, - pitchConeAngle);
            v2 = v.clone().add(new THREE.Vector3().subVectors(pitchApex, v).setLength(faceWidth));
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


        //Move so that beginning of the tooth will be at z=0
        this.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-(backConeDistance - bevelGear.dedendum()) * Math.sin(pitchConeAngle)));

        //Rotate so that tooth will be centered by Y axis
        this.applyMatrix(new THREE.Matrix4().makeRotationZ( Math.PI/2));

        this.mergeVertices();
        this.computeFaceNormals();
        this.computeVertexNormals();


    };

    BevelInvoluteToothGeometry.prototype = new THREE.Geometry();
    BevelInvoluteToothGeometry.prototype.constructor = BevelInvoluteToothGeometry;


    var BevelGearGeometry = function (bevelGear) {

        THREE.Geometry.call(this);
        var bottomRadius = bevelGear.bottomRadius();
        var topRadius = bevelGear.topRadius();


        var mIdentity = new THREE.Matrix4();
        //create wheel
        var wheelPoints = [
            new THREE.Vector3(bevelGear.innerRadius, 0, 0),
            new THREE.Vector3(bottomRadius, 0, 0),
            new THREE.Vector3(topRadius, 0, bevelGear.width),
            new THREE.Vector3(bevelGear.innerRadius, 0, bevelGear.width),
            new THREE.Vector3(bevelGear.innerRadius, 0, 0)
        ];

        var gear = new THREE.LatheGeometry(wheelPoints, Math.ceil(10 * bottomRadius));
        this.merge(gear, mIdentity);


        //create teeth
        var mRotate = new THREE.Matrix4();
        var tooth = new BevelInvoluteToothGeometry(bevelGear);
        for (var i = 0; i < 2 * Math.PI; i += Math.PI * 2 / bevelGear.teeth) {
         mRotate.makeRotationZ(i);
         this.merge(tooth.clone(), mRotate);
         }

        this.mergeVertices();

        this.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -bevelGear.width/2));

    };

    BevelGearGeometry.prototype = new THREE.Geometry();
    BevelGearGeometry.prototype.constructor = BevelGearGeometry;

    function BevelGearMesh(bevelGear) {
        if (!bevelGear.color) {
            bevelGear.color = Math.floor((Math.random() * 0xFFFFFF) + 1);
        }
        BasicRotatingPartMesh.call(this, new BevelGearGeometry(bevelGear), new THREE.MeshBasicMaterial({
            color: bevelGear.color,
            side: THREE.DoubleSide,
            wireframe: true
        }), bevelGear);
    }

    BevelGearMesh.prototype = BasicRotatingPartMesh.prototype;
    BevelGearMesh.prototype.constructor = BevelGearMesh;

    return BevelGearMesh;
});