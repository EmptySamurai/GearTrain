/**
 * Based on http://www.geometrictools.com/Documentation/IntersectionOfCylinders.pdf
 * This script is dependent on sylvester.js
 */

define(function () {

    /**
     *
     * @param center array of center coords
     * @param axis array of axis coords
     * @param radius
     * @param height
     * @constructor
     */
    function Cylinder(center, axis, radius, height) {
        this.center = Vector.create(center);
        this.axis = Vector.create(axis).toUnitVector();
        this.radius = radius;
        this.height = height;
    }

    Cylinder.prototype.boundingSphereRadius = function () {
        return Math.sqrt((this.height / 2) * (this.height / 2) + this.radius * this.radius);
    };

    Cylinder.prototype.intersectsBoundingSphere = function (cyl) {
        return this.center.distanceFrom(cyl.center) < (this.boundingSphereRadius() + cyl.boundingSphereRadius());
    };


    Cylinder.prototype.separatedByAxisPerpendilcular = function (cyl) {
        var delta = cyl.center.subtract(this.center);
        var c1 = this.axis.dot(cyl.axis);
        var b1 = Math.sqrt(1 - c1 * c1);
        var V0 = cyl.axis.subtract(this.axis.multiply(c1)).toUnitVector();
        var U0 = V0.cross(this.axis);
        var a2 = delta.dot(U0);
        var b2 = delta.dot(V0);

        var this_o = this;

        function f(t) {
            var omt = 1 - t;
            var tsqr = t * t;
            var omtsqr = omt * omt;
            var term0 = this_o.radius * Math.sqrt(omtsqr + tsqr);
            var term1 = cyl.radius * Math.sqrt(omtsqr + c1 * c1 * tsqr);
            var term2 = cyl.height * b1 / 2 * t;
            var term3 = Math.abs(omt * a2 + t * b2);
            return term0 + term1 + term2 - term3;
        }

        function fDer(t) {
            var omt = 1 - t;
            var tsqr = t * t;
            var omtsqr = omt * omt;
            var term0 = this_o.radius * (2 * t - 1) / Math.sqrt(omtsqr + tsqr);
            var term1 = cyl.radius * ((1 + c1 * c1) * t - 1) / Math.sqrt(omtsqr + c1 * c1 * tsqr);
            var term2 = cyl.height * b1 / 2;
            var term3 = (b2 - a2) * Math.sign(omt * a2 + t * b2);
            return term0 + term1 + term2 - term3;
        }

        // if directions (1-t)*U0+t*V0 separating
        if (f(0) <= 0) return true;
        if (f(1) <= 0) return true;
        if (fDer(0) >= 0) return false;
        if (fDer(1) <= 0) return false;

        //using bisect for fDer to find minimum of f
        var maxIteration = 50;
        var t0 = 0, t1 = 1, tmid, fdmid, i;
        for (i = 0; i < maxIteration; i++) {
            tmid = 0.5 * (t0 + t1);
            if (f(tmid) <= 0) return true;
            fdmid = fDer(tmid);
            if (fdmid > 0) {
                t1 = tmid;
            }
            else if (fdmid < 0) {
                t0 = tmid;
            } else {
                break;
            }
        }

        // if directions (1-t)*(-U0)+t*V0 separating
        a2 = -a2;
        if (f(0) <= 0) return true;
        if (f(1) <= 0) return true;
        if (fDer(0) >= 0) return false;
        if (fDer(1) <= 0) return false;

        //using bisect for fDer to find minimum of f
        t0 = 0;
        t1 = 1;
        for (i = 0; i < maxIteration; i++) {
            tmid = 0.5 * (t0 + t1);
            if (f(tmid) <= 0) return true;
            fdmid = fDer(tmid);
            if (fdmid > 0) {
                t1 = tmid;
            }
            else if (fdmid < 0) {
                t0 = tmid;
            } else {
                break;
            }
        }
        return false;
    };

    Cylinder.prototype.separatedByOtherDirections = function (cyl) {
        var delta = cyl.center.subtract(this.center);
        var deltaLength = delta.modulus();
        var W = delta.toUnitVector();
        var t = Vector.create([W.e(1), W.e(2), W.e(3) + 10]);
        var U = W.cross(t).toUnitVector();
        var V = W.cross(U);
        var a0 = U.dot(this.axis), b0 = V.dot(this.axis), c0 = W.dot(this.axis);
        var a1 = U.dot(cyl.axis), b1 = V.dot(cyl.axis), c1 = W.dot(cyl.axis);

        var rad0 = this.radius;
        var rad1 = cyl.radius;
        var h0Div2 = this.height / 2;
        var h1Div2 = cyl.height / 2;

        function g(st) {
            var s = st.e(1), t = st.e(2);
            var omsmt = 1 - s - t, omsmtsqr = omsmt * omsmt;
            var ssqr = s * s, tsqr = t * t;
            var temp = ssqr + tsqr + omsmtsqr;
            var L0 = a0 * s + b0 * t + c0 * omsmt, L1 = a1 * s + b1 * t + c1 * omsmt;
            var Q0 = temp - L0 * L0, Q1 = temp - L1 * L1;
            return rad0 * Math.sqrt(Q0) + rad1 * Math.sqrt(Q1) + h0Div2 * Math.abs(L0) + h1Div2 * Math.abs(L1) - omsmt * deltaLength;
        }

        function gDer(st) {
            var s = st.e(1), t = st.e(2);
            var omsmt = 1 - s - t, omsmtsqr = omsmt * omsmt;
            var ssqr = s * s, tsqr = t * t;
            var temp = ssqr + tsqr + omsmtsqr;
            var L0 = a0 * s + b0 * t + c0 * omsmt, L1 = a1 * s + b1 * t + c1 * omsmt;
            var Q0 = temp - L0 * L0, Q1 = temp - L1 * L1;
            var diffS = s - omsmt, diffT = t - omsmt;
            var diffa0c0 = a0 - c0, diffa1c1 = a1 - c1, diffb0c0 = b0 - c0, diffb1c1 = b1 - c1;
            var halfQ0s = diffS - diffa0c0 * L0, halfQ1s = diffS - diffa1c1 * L1;
            var halfQ0t = diffT - diffb0c0 * L0, halfQ1t = diffT - diffb1c1 * L1;
            var factor0 = rad0 / Math.sqrt(Q0), factor1 = rad1 / Math.sqrt(Q1);
            var signL0 = Math.sign(L0), signL1 = Math.sign(L1);

            var i = 0, j = 0;
            i += halfQ0s * factor0;
            i += halfQ1s * factor1;
            i += h0Div2 * diffa0c0 * signL0;
            i += h1Div2 * diffa1c1 * signL1;
            i += deltaLength;
            j += halfQ0t * factor0;
            j += halfQ1t * factor1;
            j += h0Div2 * diffb0c0 * signL0;
            j += h1Div2 * diffb1c1 * signL1;
            j += deltaLength;

            return Vector.create([i, j]);
        }

        function gDer2(st) {
            var s = st.e(1), t = st.e(2);
            var omsmt = 1 - s - t, omsmtsqr = omsmt * omsmt;
            var ssqr = s * s, tsqr = t * t;
            var temp = ssqr + tsqr + omsmtsqr;
            var L0 = a0 * s + b0 * t + c0 * omsmt, L1 = a1 * s + b1 * t + c1 * omsmt;
            var Q0 = temp - L0 * L0, Q1 = temp - L1 * L1;
            var diffS = s - omsmt, diffT = t - omsmt;
            var diffa0c0 = a0 - c0, diffa1c1 = a1 - c1, diffb0c0 = b0 - c0, diffb1c1 = b1 - c1;
            var Q0s = 2 * (diffS - diffa0c0 * L0), Q1s = 2 * (diffS - diffa1c1 * L1);
            var Q0t = 2 * ( diffT - diffb0c0 * L0), Q1t = 2 * (diffT - diffb1c1 * L1);
            var Q0ss = 4 - 2 * diffa0c0 * diffa0c0, Q1ss = 4 - 2 * diffa1c1 * diffa1c1;
            var Q0st = 2 - 2 * diffa0c0 * diffb0c0, Q1st = 2 - 2 * diffa1c1 * diffb1c1;
            var Q0tt = 4 - 2 * diffb0c0 * diffb0c0, Q1tt = 4 - 2 * diffb1c1 * diffb1c1;
            var Q0pow = Math.pow(Q0, 3 / 2), Q1pow = Math.pow(Q1, 3 / 2);

            var Gss = rad0 * (2 * Q0 * Q0ss - Q0s * Q0s) / (4 * Q0pow) + rad1 * (2 * Q1 * Q1ss - Q1s * Q1s) / (4 * Q1pow);
            var Gst = rad0 * (2 * Q0 * Q0st - Q0s * Q0t) / (4 * Q0pow) + rad1 * (2 * Q1 * Q1st - Q1s * Q1t) / (4 * Q1pow);
            var Gtt = rad0 * (2 * Q0 * Q0tt - Q0t * Q0t) / (4 * Q0pow) + rad1 * (2 * Q1 * Q1tt - Q1t * Q1t) / (4 * Q1pow);

            return Matrix.create([
                [Gss, Gst],
                [Gst, Gtt]]);
        }


        function condition(st) {
            var s = st.e(1), t = st.e(2);
            return s >= 0 && t >= 0 && s + t <= 1;
        }

        var con0 = function (st) {
            return st.e(1);
        };
        var con1 = function (st) {
            return st.e(2);
        };
        var con2 = function (st) {
            var s = st.e(1), t = st.e(2);
            return -s - t + 1;
        };
        var cons = [con0, con1, con2];


        var vertex11 = Vector.create([1, 1]);

        var con0Line = Line.create([0, 0], [1, 0]);
        var con1Line = Line.create([0, 0], [0, 1]);
        var con2Line = Line.create([0, 1], [1, -1]);

        var point0 = Vector.create([0, 0]), point1 = Vector.create([1, 0]), point2 = Vector.create([0, 1]);
        var points = [point0, point1, point2];


        /*var delta = 0.0001;
         var st = Vector.create([0.35, 0.35]);*/


        var iterations = 100;
        for (var i = 0; i < points.length; i++) {
            var from = points[i];
            var to = points[(i + 1) % points.length];
            var dir = to.subtract(from);


            var rmid, rdmid;
            for (var j = 0; j < iterations; j++) {
                rmid = from.add(to).multiply(0.5);
                if (g(rmid) <= 0) {
                    return true;
                }
                rdmid = gDer(rmid).dot(dir);
                if (rdmid > 0) {
                    to = rmid;
                }
                else if (rdmid < 0) {
                    from = rmid;
                } else {
                    break;
                }
            }
        }


        /*iterations = 50000;
         for (var i = 0; i < iterations; i++) {
         var direction = gDer(st).multiply(-1);
         var stNew = st.add(direction.multiply(delta));
         if (!condition(stNew)) {
         var line = Line.create(st, direction);
         var intersection, from, to, x,y;
         var minX = Math.min(st.e(1), stNew.e(1)), maxX = Math.max(st.e(1), stNew.e(1));
         var minY = Math.min(st.e(2), stNew.e(2)), maxY = Math.max(st.e(2), stNew.e(2));

         if (line.intersects(con0Line)) {
         intersection = line.intersectionWith(con0Line);
         x = intersection.e(1);
         y = intersection.e(2);
         if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
         from = point0;
         to = point1;
         }
         }

         if (!from && line.intersects(con1Line)) {
         intersection = line.intersectionWith(con1Line);
         x = intersection.e(1);
         y = intersection.e(2);
         if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
         from = point0;
         to = point2;
         }
         }

         if (!from && line.intersects(con2Line)) {
         intersection = line.intersectionWith(con2Line);
         x = intersection.e(1);
         y = intersection.e(2);
         if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
         from = point1;
         to = point2;
         }
         }

         if (!from) {
         console.error("No intersection!");
         }

         var dir = to.subtract(from);
         var maxIteration = 100;
         var rmid, rdmid;
         for (var j = 0; j < maxIteration; j++) {
         rmid = from.add(to).multiply(0.5);
         if (g(rmid) <= 0) {
         console.log("Found on boundary");
         return true;
         }
         rdmid = gDer(rmid).dot(dir);
         if (rdmid > 0) {
         to = rmid;
         }
         else if (rdmid < 0) {
         from = rmid;
         } else {
         break;
         }
         }
         return false;
         }
         if (g(stNew) <= 0) {
         console.log("At iteration: ", i);
         return true;
         }
         st = stNew;
         }
         return false;*/


        //Check interior point method
        var hessian = gDer2; //Hessian. Since hessian for lambda_i*c_i(x) equals zero it is just hessian for g
        var A = Matrix.create([
            [1, 0],
            [0, 1],
            [-1, -1]
        ]);
        var At = A.transpose();

        var alpha;
        var mu = 10;
        for (var m = 0; m < 15; m++) {
            mu = mu * 0.5;
            var st = Vector.create([0.25, 0.25]);

            var lambda = cons.map(function (c) {
                return [mu / c(st)];
            });
            lambda = Matrix.create(lambda);

            var i;
            var mu1 = [];
            for (i = 0; i < cons.length; i++)
                mu1.push([mu]);
            mu1 = Matrix.create(mu1);

            var iterations = 20;

            for (i = 0; i < iterations; i++) {
                var C = Vector.create(cons.map(function (c) {
                    return c(st);
                })).toDiagonalMatrix();
                var L = new Array(cons.length);
                for (var j = 0; j < cons.length; j++) {
                    L[j] = new Array(cons.length);
                    for (var k = 0; k < cons.length; k++) {
                        if (k === j)
                            L[j][k] = lambda.e(j + 1, 1);
                        else
                            L[j][k] = 0;
                    }
                }
                L = Matrix.create(L);
                var Winv = hessian(st).inverse();
                var LAWinv = L.x(A).x(Winv);
                var gr = gDer(st);
                var plCoefInv = LAWinv.x(At).add(C).inverse();
                if (!plCoefInv) {
                    break;
                }
                var AtLamSubGr = At.x(lambda).subtract(gr);
                var rightSide = mu1.subtract(C.x(lambda)).subtract(LAWinv.x(AtLamSubGr));
                var pl = plCoefInv.x(rightSide);
                var px = Winv.x(At.x(pl).add(AtLamSubGr));
                var pxVec = Vector.create([px.e(1, 1), px.e(2, 1)]);
                if (isNaN(pxVec.e(0)) || isNaN(pxVec.e(1)))
                    break;


                var searchLine = Line.create(st.elements, pxVec.elements);

                var r0 = null, r1 = null, intersection;
                var prec = 1e-12;
                if (searchLine.intersects(con0Line)) {
                    intersection = searchLine.intersectionWith(con0Line);
                    if (intersection.e(1) >= -prec && intersection.e(1) <= 1 + prec) {
                        r0 = intersection;
                    }
                }

                if (searchLine.intersects(con2Line)) {
                    intersection = searchLine.intersectionWith(con2Line);
                    if (intersection.e(1) >= -prec && intersection.e(2) >= -prec && intersection.e(1) <= 1 + prec && intersection.e(2) <= 1 + prec) {
                        if (!r0)
                            r0 = intersection;
                        else
                            r1 = intersection;
                    }
                }

                if (!r1 && searchLine.intersects(con1Line)) {
                    intersection = searchLine.intersectionWith(con1Line);
                    if (intersection.e(2) >= -prec && intersection.e(2) <= 1 + prec) {
                        r1 = intersection;
                    }
                }

                if (!r0 || !r1) {
                    break;
                }

                r0 = Vector.create(r0.elements.slice(0, 2));
                r1 = Vector.create(r1.elements.slice(0, 2));

                //check if r0 and r1 are in the direction of conjugate vector
                var r = r1.subtract(r0);
                if (pxVec.dot(r) < 0) {
                    var temp = r0;
                    r0 = r1;
                    r1 = temp;
                }

                if (g(r0) <= 0) {
                    return true;
                }
                if (g(r1) <= 0) {
                    return true;
                }


                //bisect
                var maxIteration = 100;
                var rmid, rdmid;
                for (var j = 0; j < maxIteration; j++) {
                    rmid = r0.add(r1).multiply(0.5);
                    if (g(rmid) <= 0) {
                        return true;
                    }
                    rdmid = gDer(rmid).dot(pxVec);
                    if (rdmid > 0) {
                        r1 = rmid;
                    }
                    else if (rdmid < 0) {
                        r0 = rmid;
                    } else {
                        break;
                    }
                }

                alpha = rmid.e(1) / st.e(1);
                st = rmid;
                lambda = lambda.add(pl.x(alpha));
            }
        }
        return false;

    }
    ;

    Cylinder.prototype.intersectsPrecise = function (cyl) {

        var delta = cyl.center.subtract(this.center);
        var axesCross = this.axis.cross(cyl.axis);
        var axesCrossLen = axesCross.modulus();
        var this_height_div2 = this.height / 2;
        var other_height_div2 = cyl.height / 2;
        var radiusSum = this.radius + cyl.radius;


        //if they are not parallel
        if (axesCrossLen > 1e-16) {
            //if they are separated by this axis
            if (cyl.radius * axesCrossLen + this_height_div2 + other_height_div2 * Math.abs(this.axis.dot(cyl.axis)) - Math.abs(this.axis.dot(delta)) <= 0)
                return false;

            //if they are separated by cyl axis
            if (this.radius * axesCrossLen + this_height_div2 * Math.abs(this.axis.dot(cyl.axis)) + other_height_div2 - Math.abs(cyl.axis.dot(delta)) <= 0)
                return false;

            //if they are separated by their axes cross product
            if (radiusSum * axesCrossLen - Math.abs(axesCross.dot(delta)) <= 0)
                return false;

            //if they are separated by perpendicular to this axis
            if (this.separatedByAxisPerpendilcular(cyl))
                return false;

            //if they are separated by perpendicular to cyl axis
            if (cyl.separatedByAxisPerpendilcular(this))
                return false;

            //if separated by other directions
            if (this.separatedByOtherDirections(cyl))
                return false;


        } else {
            //if separated by height
            if (this_height_div2 + other_height_div2 - Math.abs(this.axis.dot(delta)) <= 0)
                return false;

            //if they are separated radially
            if (radiusSum - (delta.subtract(this.axis.multiply(this.axis.dot(delta)))).modulus() <= 0)
                return false;
        }

        return true;
    };

    Cylinder.prototype.intersects = function (cyl) {
        return this.intersectsBoundingSphere(cyl) && this.intersectsPrecise(cyl);
    };

    return Cylinder;
});