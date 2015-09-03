/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['views/BasicRotatingPartMesh','views/InvoluteToothGeometry'], function(BasicRotatingPartMesh, InvoluteToothGeometry) {

    var BevelInvoluteToothGeometry = function (bevelGear) {
        THREE.Geometry.call(this);

        var teeth = bevelGear.teeth;
        var pressureAngle = bevelGear.pressureAngle;
        var width = bevelGear.width/Math.cos(Math.PI/2-bevelGear.pitchConeAngle);

        var pitchRadiusBack = bevelGear.coneDistance*Math.tan(bevelGear.pitchConeAngle); //back cone dist
        var baseRadiusBack = pitchRadiusBack * Math.cos(pressureAngle);
        var diametralPitchBack = teeth/(2*pitchRadiusBack);
        var addendumCircleRadiusBack = (teeth + 2) / diametralPitchBack/2;
        var addendumAngleBack = Math.sqrt(addendumCircleRadiusBack * addendumCircleRadiusBack - baseRadiusBack * baseRadiusBack) / baseRadiusBack;
        var rootRadiusBack = (teeth-2)/diametralPitchBack/2;

        var pitchRadiusFront = pitchRadiusBack*(bevelGear.coneDistance-width)/bevelGear.c
        var baseRadiusBack = pitchRadius * Math.cos(pressureAngle);
        var diametralPitchBack = teeth/(2*pitchRadius);
        var addendumCircleRadiusBack = (teeth + 2) / diametralPitch/2;
        var addendumAngleBack = Math.sqrt(addendumCircleRadius * addendumCircleRadius - baseRadius * baseRadius) / baseRadius;
        var rootRadiusBack = (teeth-2)/diametralPitch/2;

        var vertices = this.vertices;

        var halfToothAngle = Math.PI / (2 * teeth) + Math.tan(pressureAngle) - pressureAngle;

        var segments = 12;

        var step = addendumAngle / segments;


        //Create first part of tooth profile
        var firstInvoluteVertex = 0;
        var firstInvoluteDeepVertex = 1;

        var i, angle, x, y, v, v2, l;


        for (i = 0; i < segments; i++) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle);
            v = new THREE.Vector3(x, y, 0);
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
        this.applyMatrix(new THREE.Matrix4().makeRotationZ(-2 * halfToothAngle));
        for (i = segments - 1; i >= 0; i--) {
            angle = step * i;
            x = baseRadius * Math.cos(angle) + baseRadius * angle * Math.sin(angle);
            y = -(baseRadius * Math.sin(angle) - baseRadius * angle * Math.cos(angle));
            v = new THREE.Vector3(x, y, 0);
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
        var rotateAngle = Math.atan2(vertices[0].x, vertices[0].y);
        this.applyMatrix(new THREE.Matrix4().makeRotationZ(rotateAngle - halfToothAngle));

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

    BevelInvoluteToothGeometry.prototype = new THREE.Geometry();
    BevelInvoluteToothGeometry.prototype.constructor = BevelInvoluteToothGeometry;


    return BevelInvoluteToothGeometry


    var BevelGearGeometry = function (bevelGear) {

        THREE.Geometry.call(this);


        var backConeDist = bevelGear.coneDistance*Math.tan(bevelGear.pitchConeAngle);
        var dedendum = 2.188/bevelGear.diametralPitch-bevelGear.addendum;
        var bottomRadius = (backConeDist-dedendum)*Math.cos(bevelGear.pitchConeAngle);
        var topRadius = bottomRadius-2*bevelGear.width/Math.tan(Math.PI/2-bevelGear.pitchConeAngle);

        if (bevelGear.innerRadius>topRadius) {
            alert("Top radius too big");
        }

        var mIdentity = new THREE.Matrix4();
        //create wheel
        var wheelPoints = [
            new THREE.Vector3(bevelGear.innerRadius, 0, 0),
            new THREE.Vector3(bottomRadius, 0, 0),
            new THREE.Vector3(topRadius, 0, bevelGear.width),
            new THREE.Vector3(bevelGear.innerRadius, 0, bevelGear.width),
            new THREE.Vector3(bevelGear.innerRadius, 0, 0)
        ];

        var gear = new THREE.LatheGeometry(wheelPoints, Math.ceil(10 * bevelGear.rootRadius));
        //this.merge(gear, mIdentity);


        //create teeth
        var faceWidth = bevelGear.width/Math.cos(Math.PI/2-bevelGear.pitchConeAngle);
        if (faceWidth>10/bevelGear.diametralPitch || faceWidth>bevelGear.coneDistance/3) {
            alert("HUY");
        }
        var childPitchConeAngle = Math.PI/2 - bevelGear.pitchConeAngle;
        var childAddendum = 0.54 / bevelGear.diametralPitch + 0.46 / (bevelGear.diametralPitch * ((bevelGear.childTeeth * Math.cos(bevelGear.pitchConeAngle)) / (bevelGear.teeth * Math.cos(childPitchConeAngle))));
        var addendumAngle = Math.atan(childAddendum/bevelGear.coneDistance);

        var mRotate = new THREE.Matrix4();
        var tooth = new BevelInvoluteToothGeometry(faceWidth, bevelGear.baseCircleRadius, addendumAngle, bevelGear.rootRadius, bevelGear.pressureAngle, bevelGear.teeth);
        for (var i = 0; i < 2 * Math.PI; i += Math.PI * 2 / bevelGear.teeth) {
            mRotate.makeRotationZ(i);
            this.merge(tooth.clone(), mRotate);
        }

        this.mergeVertices();

        this.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -bevelGear.width / 2));

    };

    BevelGearGeometry.prototype = new THREE.Geometry();
    BevelGearGeometry.prototype.constructor = BevelGearGeometry;

    function BevelMesh(bevelGear) {
        BasicRotatingPartMesh.call(this, new BevelGearGeometry(bevelGear), new THREE.MeshBasicMaterial({
            color: Math.floor((Math.random() * 0xFFFFFF) + 1),
            side: THREE.DoubleSide
        }), bevelGear);
        this.lookAt(bevelGear.axis);
        this.up.copy(bevelGear.up);
        var o = this;
        var updateAngle = function (angle) {
            if (bevelGear.clockwise)
                o.rotation.z = -angle;
            else
                o.rotation.z = angle;
        };
        //bevelGear.addListener("angle", updateAngle);
        updateAngle(bevelGear.angle);
        this.position.copy(bevelGear.position);
    }

    BevelMesh.prototype = BasicRotatingPartMesh.prototype;
    BevelMesh.prototype.constructor = BevelMesh;

    return BevelMesh;
});