/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(['models/GearTrain', 'models/Shaft', 'models/SpurGear', 'models/BevelGear', 'models/HelicalGear', 'ui/ModalForm', 'ui/MessageBox', 'views/ShaftMesh', 'views/SpurGearMesh', 'views/BevelGearMesh', 'views/HelicalGearMesh',  'controllers/MouseController'],
    function (GearTrain, Shaft, SpurGear, BevelGear, HelicalGear, ModalForm, MessageBox, ShaftMesh, SpurGearMesh, BevelGearMesh, HelicalGearMesh, MouseController) {

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
                    $(this).text("Start");
                } else {
                    gearTrain.start(50);
                    $(this).text("Stop");
                }
            });
        }

        GearTrainController.prototype.pressureAngle = Math.PI / 9;

        GearTrainController.prototype.addGearToShaft = function(shaft, position, form, connectionFunction) {
            var o = this;
            form.show(function (e) {
                if (e.ok) {
                    e.values.pressureAngle = o.pressureAngle;
                    try {
                        var gear = connectionFunction(shaft, e.values, position);
                        o.reload();
                    } catch (err) {
                        alert(err);
                        o.messageBox.err(err);
                        e.prevent = true;
                        throw err;
                    }
                }
            });
        };

        GearTrainController.prototype.addSpurGearToShaft = function (shaft, position) {
            var form = new ModalForm({
                teeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    },
                    label: "Number of teeth"
                },
                width: {
                    type: Number,
                    label: "Width"
                },
                diametralPitch: {
                    type: Number,
                    label: "Diametral pitch"
                }
            });
            this.addGearToShaft(shaft, position, form, SpurGear.connectToShaft);
        };

        GearTrainController.prototype.addBevelGearToShaft = function (shaft, position) {
            var form = new ModalForm({
                teeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    },
                    label: "Number of teeth"
                },
                width: {
                    type: Number,
                    label: "Width"
                },
                diametralPitch: {
                    type: Number,
                    label: "Diametral pitch"
                },
                childTeeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    },
                    label: "Number of child's teeth"
                }
            });
            this.addGearToShaft(shaft, position, form, BevelGear.connectToShaft);
        };

        GearTrainController.prototype.addHelicalGearToShaft = function (shaft, position) {
            var form = new ModalForm({
                teeth: {
                    type: Number,
                    validator: function (t) {
                        return t >= 4;
                    },
                    label: "Number of teeth"
                },
                width: {
                    type: Number,
                    label: "Width"
                },
                normalDiametralPitch: {
                    type: Number,
                    label: "Normal diametral pitch"
                },
                /*helixAngle: {
                 type:Number,
                 label: "Helix angle(deg)"
                 }*/
            });
            this.addGearToShaft(shaft, position, form, HelicalGear.connectToShaft);
        };

        GearTrainController.prototype.shaftDoubleClickHandler = function (shaftMesh, position) {
            var shaft = shaftMesh.model;
            var gearType = $('input:radio[name=geartype]').filter(":checked").val();
            switch (gearType) {
                case 'spur':
                {
                    this.addSpurGearToShaft(shaft, position);
                    break;
                }
                case 'bevel':
                    this.addBevelGearToShaft(shaft, position);
                    break;
                case 'helical':
                {
                    this.addHelicalGearToShaft(shaft, position);
                    break;
                }
            }
        };

        GearTrainController.prototype.spurOrHelicalGearDoubleClickHandler = function (spurMesh, position) {
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

        GearTrainController.prototype.bevelGearDoubleClickHandler = function (bevelMesh, position) {
            var gear = bevelMesh.model;
            var direction = position.projectOnPlane(gear.axis).sub(gear.position.clone().projectOnPlane(gear.axis));

            var form = new ModalForm({
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
                        throw err;
                    }
                }
            });
        };

        GearTrainController.prototype.shaftRightClickHandler = function (shaftMesh, position) {
            try {
                this.gearTrain.removeShaft(shaftMesh.model);
                this.reload();
            } catch (e) {
                this.messageBox.err(e);
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
                    var spurGearMesh = new SpurGearMesh(e);
                    spurGearMesh.onDoubleClick(function (mesh, pos) {
                        o.spurOrHelicalGearDoubleClickHandler(mesh, pos);
                    });
                    spurGearMesh.onRightButtonClick(function (mesh, pos) {
                        o.gearRightClickHandler(mesh, pos);
                    });
                    o.scene.add(spurGearMesh);
                } else if (e instanceof BevelGear) {
                    var bevelGearMesh = new BevelGearMesh(e);
                    bevelGearMesh.onDoubleClick(function (mesh, pos) {
                        o.bevelGearDoubleClickHandler(mesh, pos);
                    });
                    bevelGearMesh.onRightButtonClick(function (mesh, pos) {
                        o.gearRightClickHandler(mesh, pos);
                    });
                    o.scene.add(bevelGearMesh);
                } else if (e instanceof HelicalGear) {
                    var helicalGearMesh = new HelicalGearMesh(e);
                    helicalGearMesh.onDoubleClick(function (mesh, pos) {
                        o.spurOrHelicalGearDoubleClickHandler(mesh, pos); //TODO: make another or rename method
                    });
                    helicalGearMesh.onRightButtonClick(function (mesh, pos) {
                        o.gearRightClickHandler(mesh, pos);
                    });
                    o.scene.add(helicalGearMesh);
                }
            });

        };

        GearTrainController.prototype.reload = function () {
            this.loadGearTrain(this.gearTrain);
        };

        GearTrainController.prototype.parseGearTrainFromJSON = function (gearTrain) {

            gearTrain.prototype = GearTrain.prototype;
            gearTrain.iterate(function (o) {
                switch (o.type) {
                    case Shaft.type:
                        o.prototype = Shaft.prototype;
                        break;
                    case SpurGear.type:
                        o.prototype = SpurGear.prototype;
                        break;
                    case BevelGear.type:
                        o.prototype = BevelGear.prototype;
                        break;
                    case HelicalGear.type:
                        o.prototype = HelicalGear.prototype;
                        break;
                    default:
                        throw new Error("Unknown element type: " + o.type);
                }
            });
            return gearTrain;
        };

        GearTrainController.prototype.saveToFile = function () {
            var json = JSON.stringify(this.gearTrain);
            var blob = new Blob(json);
        }


        return GearTrainController;
    });