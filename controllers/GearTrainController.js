/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['models/GearTrain', 'models/Shaft', 'models/SpurGear', 'ui/ModalForm', 'ui/MessageBox', 'views/ShaftMesh', 'views/SpurGearMesh', 'controllers/MouseController'],
    function (GearTrain, Shaft, SpurGear, ModalForm, MessageBox, ShaftMesh, SpurGearMesh, MouseController) {

        function addAxes(scene) {
            var axes = new THREE.AxisHelper(200);
            scene.add(axes);
        }


        THREE.Object3D.prototype.clear = function () {
            var children = this.children;
            for (var i = children.length - 1; i >= 0; i--) {
                var child = children[i];
                child.clear();
                this.remove(child);
            }
        };

        function GearTrainController(gearTrain, scene, camera) {
            this.scene = scene;
            this.mouseController = new MouseController(scene, camera);
            if (!gearTrain) {
                var driverShaft = new Shaft({
                    speed: 1,
                    clockwise: true,
                    angle: 0,
                    position: new THREE.Vector3(0, 0, 0),
                    axis: new THREE.Vector3(0, 0, 1),
                    radius: 5,
                    length: 20
                });
                gearTrain = new GearTrain(driverShaft);
            }
            this.messageBox = new MessageBox();
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

        GearTrainController.prototype.pressureAngle = Math.PI / 9;

        GearTrainController.prototype.shaftDoubleClickHandler = function (shaftMesh, position) {
            var form = new ModalForm({
                teeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    }
                },
                width: {
                    type: Number
                },
                diametralPitch: {
                    type: Number
                }
            });
            var o = this;
            form.show(function (e) {
                if (e.ok) {
                    var shaft = shaftMesh.model;
                    e.values.pressureAngle = o.pressureAngle;
                    try {
                        var gear = SpurGear.connectToShaft(shaft, e.values, position);
                        o.reload();
                    } catch (err) {
                        throw  err;
                        alert(err);
                        o.messageBox.err(err);
                        e.prevent = true;
                    }
                }
            });
        };

        GearTrainController.prototype.spurGearDoubleClickHandler = function (spurMesh, position) {
            var gear = spurMesh.model;
            var direction = position.projectOnPlane(gear.axis).sub(gear.position.clone().projectOnPlane(gear.axis));

            var form = new ModalForm({
                teeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    }
                },
                innerRadius: {
                    type: Number
                }
            });
            var o = this;
            form.show(function (e) {
                if (e.ok) {
                    try {
                        gear.connectGear(e.values, direction);
                        o.reload();
                    } catch (err) {
                        alert(err);
                        o.messageBox.err(err);
                        e.prevent = true;
                    }
                }
            });
        };

        GearTrainController.prototype.shaftRightClickHandler = function (shaftMesh, position) {
            try {
                this.gearTrain.removeShaft(shaftMesh.model);
                this.reload();
            } catch (e) {
                o.messageBox.err(e);
            }
        };

        GearTrainController.prototype.gearRightClickHandler = function (gearMesh, position) {
            this.gearTrain.removeGear(gearMesh.model);
            this.reload();
        };

        GearTrainController.prototype.loadGearTrain = function (gearTrain) {
            this.scene.clear();
            addAxes(this.scene);
            this.gearTrain = gearTrain;
            var o = this;

            gearTrain.iterate(function (e) {
                if (e instanceof Shaft) {
                    var shaftMesh = new ShaftMesh(e);
                    shaftMesh.onDoubleClick(function (mesh, pos) {
                        o.shaftDoubleClickHandler(mesh, pos);
                    });
                    shaftMesh.onRightButtonClick(function (mesh, pos) {
                        o.shaftRightClickHandler(mesh, pos);
                    });
                    o.scene.add(shaftMesh);
                } else if (e instanceof SpurGear) {
                    var gearMesh = new SpurGearMesh(e);
                    gearMesh.onDoubleClick(function (mesh, pos) {
                        o.spurGearDoubleClickHandler(mesh, pos);
                    });
                    gearMesh.onRightButtonClick(function (mesh, pos) {
                        o.gearRightClickHandler(mesh, pos);
                    });
                    o.scene.add(gearMesh);
                }
            });

        };

        GearTrainController.prototype.reload = function () {
            this.loadGearTrain(this.gearTrain);
        };

        return GearTrainController;
    });