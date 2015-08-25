/**
 * Spur gear creation based on https://www.wpi.edu/Pubs/E-project/Available/E-project-042811-130543/unrestricted/Final_Report-Parametric_Design_of_a_Spiral_Gear_Process.pdf
 */
define(function () {
    var InvoluteToothGeometry = function (width, baseRadius, addendumAngle, rootRadius, pressureAngle, teeth) {
        THREE.Geometry.call(this);
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


        /*
         //Create undercuts

         //Parameters for right undercut

         var filletRadius = 0.35 / gear.diametralPitch;
         var rootRadius = gear.rootRadius;
         var distanceToFilletCenter = rootRadius + filletRadius;
         var lengthBetweenCenterAndFilletEnd = Math.sqrt(distanceToFilletCenter * distanceToFilletCenter - filletRadius * filletRadius);
         var filletStart = vertices[firstInvoluteVertex].clone().setLength(lengthBetweenCenterAndFilletEnd);
         var thetaLength = Math.acos(filletRadius / distanceToFilletCenter);
         var axisZ = new THREE.Vector3(0, 0, 1);
         var rotate = Math.asin(filletRadius / distanceToFilletCenter);
         var filletCenter = filletStart.clone().applyAxisAngle(axisZ, -rotate).setLength(distanceToFilletCenter);
         var radiusToInvolute = filletStart.clone().sub(filletCenter);
         radiusToInvolute.normalize();

         var axisX = new THREE.Vector3(1, 0, 0);

         var thetaStart = Math.acos(radiusToInvolute.dot(axisX));
         var cross = new THREE.Vector3().crossVectors(radiusToInvolute, axisX);
         if (axisZ.dot(cross) < 0) {
         thetaStart = -thetaStart;
         }
         if (thetaStart < 0) {
         thetaStart += 2 * Math.PI;
         }

         step = thetaLength / segments;

         //Create right undercut

         v = filletStart.clone();
         v2 = v.clone();
         v2.z = gear.width;
         vertices.push(v);
         vertices.push(v2);
         l = vertices.length;
         this.faces.push(new THREE.Face3(l - 1, l - 2, firstInvoluteDeepVertex));
         this.faces.push(new THREE.Face3(l - 2, firstInvoluteVertex, firstInvoluteDeepVertex));

         var firstRightFilletVertex = vertices.length-2;

         //Create fillet

         for (i = 0; i < segments; i++) {
         angle = thetaStart + step * i;
         v = new THREE.Vector3(filletCenter.x + filletRadius * Math.cos(angle), filletCenter.y + filletRadius * Math.sin(angle));
         v2 = v.clone();
         v2.z = gear.width;
         vertices.push(v);
         vertices.push(v2);
         l = vertices.length;
         this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
         this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
         }

         var lastRightFilletVertex = vertices.length-2;


         //Create left undercut

         //Because of Y axis symmetry
         filletCenter.x = -filletCenter.x;
         filletStart.x = -filletStart.x;
         thetaStart = Math.PI - thetaStart;

         v = filletStart.clone();
         v2 = v.clone();
         v2.z = gear.width;
         vertices.push(v);
         vertices.push(v2);
         l = vertices.length;
         this.faces.push(new THREE.Face3(l - 1, l - 2, lastInvoluteDeepVertex));
         this.faces.push(new THREE.Face3(l - 2, lastInvoluteVertex, lastInvoluteDeepVertex));

         var firstLeftFilletVertex = vertices.length-2;


         //Create fillet

         for (i = 0; i < segments; i++) {
         angle = thetaStart - step * i;
         v = new THREE.Vector3(filletCenter.x + filletRadius * Math.cos(angle), filletCenter.y + filletRadius * Math.sin(angle));
         v2 = v.clone();
         v2.z = gear.width;
         vertices.push(v);
         vertices.push(v2);
         l = vertices.length;
         this.faces.push(new THREE.Face3(l - 1, l - 2, l - 3));
         this.faces.push(new THREE.Face3(l - 2, l - 4, l - 3));
         }

         var lastLeftFilletVertex = vertices.length-2;

         //Add side undercut faces
         for (i=0; i<lastLeftFilletVertex-firstLeftFilletVertex; i+=2) {
         this.faces.push(new THREE.Face3(lastLeftFilletVertex-i, lastLeftFilletVertex-i-2, lastRightFilletVertex-i));
         this.faces.push(new THREE.Face3(lastLeftFilletVertex-i-2, lastRightFilletVertex-i,lastRightFilletVertex-i-2));
         this.faces.push(new THREE.Face3(lastLeftFilletVertex-i+1, lastLeftFilletVertex-i-2+1, lastRightFilletVertex-i+1));
         this.faces.push(new THREE.Face3(lastLeftFilletVertex-i-2+1, lastRightFilletVertex-i+1,lastRightFilletVertex-i-2+1));
         }
         this.faces.push(new THREE.Face3(firstLeftFilletVertex, lastInvoluteVertex, firstRightFilletVertex));
         this.faces.push(new THREE.Face3(lastInvoluteVertex, firstRightFilletVertex,firstInvoluteVertex));
         this.faces.push(new THREE.Face3(firstLeftFilletVertex+1, lastInvoluteVertex+1, firstRightFilletVertex+1));
         this.faces.push(new THREE.Face3(lastInvoluteVertex+1, firstRightFilletVertex+1,firstInvoluteVertex+1));
         */

        this.mergeVertices();
        this.computeFaceNormals();
        this.computeVertexNormals();


    };

    InvoluteToothGeometry.prototype = new THREE.Geometry();
    InvoluteToothGeometry.prototype.constructor = InvoluteToothGeometry;


    return InvoluteToothGeometry
});