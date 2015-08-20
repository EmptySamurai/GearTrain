THREE.Object3D.prototype.clear = function(){
    var children = this.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        child.clear();
        this.remove(child);
    }
};

var messageBox, controller;

function MouseController(scene, camera) {
    var raycaster = new THREE.Raycaster();
    var mousePosition = new THREE.Vector2();
    $('canvas').on('dblclick', function (e) {
        var canvas = $(this);
        mousePosition.x = ( e.clientX / canvas.innerWidth() ) * 2 - 1;
        mousePosition.y = -( e.clientY / canvas.innerHeight() ) * 2 + 1;
        raycaster.setFromCamera(mousePosition, camera);
        var intersects = raycaster.intersectObjects(scene.children, false);
        if (intersects.length > 0) {
            var o = intersects[0].object;
            if (o.mouseDoubleClick)
                o.mouseDoubleClick(o, intersects[0].point);
        }
    });
    $('canvas').on('mousedown', function (e) {
        if (e.which != 3) {
            return;
        }
        var canvas = $(this);
        mousePosition.x = ( e.clientX / canvas.innerWidth() ) * 2 - 1;
        mousePosition.y = -( e.clientY / canvas.innerHeight() ) * 2 + 1;
        raycaster.setFromCamera(mousePosition, camera);
        var intersects = raycaster.intersectObjects(scene.children, false);
        if (intersects.length > 0) {
            var o = intersects[0].object;
            if (o.mouseRightButtonClick)
                o.mouseRightButtonClick(o, intersects[0].point);
        }
    });
}


function GearTrainController(gearTrain, scene, camera) {
    this.scene = scene;
    this.mouseController = new MouseController(scene, camera);
    if (!gearTrain) {
        var driverShaft = new Shaft({
            speed :1,
            clockwise: true,
            angle : 0,
            position: new THREE.Vector3(0,0,0),
            axis: new THREE.Vector3(0,0,1),
            radius: 5,
            length: 20
        });
        gearTrain = new GearTrain(driverShaft);
    }
    this.loadGearTrain(gearTrain);


    $("#play_pause_btn").on("click", function () {
        if (gearTrain.started) {
            gearTrain.stop();
            $(this).html("Start");
        } else {
            gearTrain.start(50);
            $(this).html("Stop");
        }
    });
}

GearTrainController.prototype.pressureAngle = Math.PI/9;

GearTrainController.prototype.shaftDoubleClickHandler = function(shaftMesh, position) {
    var form  = new ModalForm({
        teeth: {
            type: Number
        },
        width: {
            type: Number
        },
        diametralPitch: {
            type: Number
        }
    });
    var o = this;
    form.show(function(e){
        if (e.ok) {
            var shaft = shaftMesh.model;
            e.values.pressureAngle = o.pressureAngle;
            try {
                var gear = shaft.connectSpurGear(e.values, position);
                o.reload();
            } catch (err) {
                alert(err);
                messageBox.err(err);
                e.prevent = true;
            }
        }
    });
};

GearTrainController.prototype.spurGearDoubleClickHandler = function(spurMesh, position) {
    var gear = spurMesh.model;
    var direction = position.projectOnPlane(gear.axis).sub(gear.position.clone().projectOnPlane(gear.axis));

    var form  = new ModalForm({
        teeth: {
            type: Number
        },
        innerRadius: {
            type: Number
        }
    });
    var o = this;
    form.show(function(e){
        if (e.ok) {
            try {
                gear.connectGear(e.values, direction, spurMesh.up);
                o.reload();
            } catch (err) {
                alert(err);
                messageBox.err(err);
                e.prevent = true;
            }
        }
    });
};

GearTrainController.prototype.shaftRightClickHandler = function(shaftMesh, position) {
    try {
        this.gearTrain.removeShaft(shaftMesh.model);
        this.reload();
    } catch (e) {
        messageBox.err(e);
    }
};

GearTrainController.prototype.gearRightClickHandler = function(gearMesh, position) {
    this.gearTrain.removeGear(gearMesh.model);
    this.reload();
};

GearTrainController.prototype.loadGearTrain = function (gearTrain) {
    this.scene.clear();
    addAxes(this.scene);
    this.gearTrain = gearTrain;
    var o = this;

    gearTrain.iterate(function(e) {
        if (e instanceof Shaft) {
            var shaftMesh = new ShaftMesh(e);
            shaftMesh.onDoubleClick(function(mesh, pos) {
                o.shaftDoubleClickHandler(mesh, pos);
            });
            shaftMesh.onRightButtonClick(function(mesh, pos) {
                o.shaftRightClickHandler(mesh, pos);
            });
            o.scene.add(shaftMesh);
        } else if (e instanceof SpurGear){
            var gearMesh = new SpurGearMesh(e);
            gearMesh.onDoubleClick(function(mesh, pos) {
                o.spurGearDoubleClickHandler(mesh, pos);
            });
            gearMesh.onRightButtonClick(function(mesh, pos) {
                o.gearRightClickHandler(mesh, pos);
            });
            o.scene.add(gearMesh);
        }
    });

};

GearTrainController.prototype.reload = function() {
    this.loadGearTrain(this.gearTrain);
};


function addAxes(scene) {
    var axes = new THREE.AxisHelper(200);
    scene.add(axes);
}

$(document).ready(function () {

    messageBox = new MessageBox();

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var container = $('canvas')[0];
    var controls = new THREE.TrackballControls(camera, container);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [65, 83, 68];


    camera.position.z = 20;
    controller = new GearTrainController(null, scene, camera);



    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    //gearTrain.start(40);
});
