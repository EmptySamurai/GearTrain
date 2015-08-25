define(function () {
    require(['controllers/GearTrainController'], function (GearTrainController) {


        $(document).ready(function () {

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
            var controller = new GearTrainController(null, scene, camera);


            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }

            animate();
        });
    });
});