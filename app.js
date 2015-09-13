define(function () {
    require(['controllers/GearTrainController', 'ui/MessageBox'], function (GearTrainController, MessageBox) {


        function strToBool(str) {
            return str=='true';
        }

        function isUndefined(v) {
            return typeof v == 'undefined';
        }

        function getBooleanCookieOrDefault(name, def) {
            var value = Cookies.get(name);
            if (isUndefined(value)) {
                return def;
            } else {
                return strToBool(value);
            }
        }

        function getNumberCookieOrDefault(name, def) {
            var value = Cookies.get(name);
            if (isUndefined(value) || !$.isNumeric(value)) {
                return def;
            } else {
                return Number(value);
            }
        }

        function getStringCookieOrDefault(name, def) {
            var value = Cookies.get(name);
            if (isUndefined(value)) {
                return def;
            } else {
                return value;
            }
        }

        function setSettingsFromCookies() {
            var gearType = getStringCookieOrDefault('geartype', 'spur');
            $('input[name="geartype"][value="'+gearType+'"]').prop('checked', true);

            var mouseAction = getStringCookieOrDefault('mouseaction', 'add_remove');
            $('input[name="mouseaction"][value="'+mouseAction+'"]').prop('checked', true);

            var speed = getNumberCookieOrDefault('speed', 1);
            $('#speed_input').val(speed);

            var showLogs = getBooleanCookieOrDefault('showlogs', true);
            $('#show_logs').prop('checked', showLogs);

            var showErrors = getBooleanCookieOrDefault('showerrors', true);
            $('#show_errors').prop('checked', showErrors);

        }

        function updateSettingsOnChange() {
            $('input[name="geartype"]:radio').change(function() {
                Cookies.set('geartype', $(this).val(), {path: ''});
            });
            $('input[name="mouseaction"]:radio').change(function() {
                Cookies.set('mouseaction', $(this).val(), {path: ''});
            });
            $('#speed_input').change(function() {
                var speed = $(this).val();
                if ($.isNumeric(speed)) {
                    Cookies.set('speed', speed, {path: ''});
                }
            });
            $('#show_logs').change(function() {
                Cookies.set('showlogs', this.checked,  {path: ''});
            });
            $('#show_errors').change(function() {
                Cookies.set('showerrors', this.checked,  {path: ''});
            });
        }

        function addShortcut(char, callback) {
            var keyCode = char.toUpperCase().charCodeAt(0);
            $(document).keyup(function(e) {
                if (e.which == keyCode) {
                    callback();
                }
            })
        }

        function addRadioButtonShortcut(char, name, value) {
            addShortcut(char, function() {
                var element = $('input[name="' + name + '"][value="' + value + '"]');
                if (!element.prop('checked')) {
                    element.prop('checked', true);
                    element.trigger('change');
                }
            });
        }

        function addGearTypeShortcut(char, gearType) {
            addRadioButtonShortcut(char, 'geartype', gearType);
        }

        function addMouseActionShortcut(char, action) {
            addRadioButtonShortcut(char, 'mouseaction', action);
        }

        function addShortcuts() {
            addGearTypeShortcut('s', 'spur');
            addGearTypeShortcut('b', 'bevel');
            addGearTypeShortcut('h', 'helical');

            addMouseActionShortcut('a', 'add_remove');
            addMouseActionShortcut('i', 'info');

            addShortcut(' ', function() {
                $('#play_pause_btn').trigger('click');
            });
            $(document).keydown(function(e) { //prevent space bar from scrolling
               if (e.keyCode == 32) {
                   e.preventDefault();
               }
            });

        }

        $(document).ready(function () {

            setSettingsFromCookies();
            updateSettingsOnChange();
            addShortcuts();

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
            camera.position.y = 20;
            var controller = new GearTrainController(null, scene, camera);

            var messageBox = new MessageBox();
            messageBox.log('See documentation and source code at <a href="https://github.com/EmptySamurai/GearTrain">https://github.com/EmptySamurai/GearTrain</a>');


            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }

            animate();
        });
    });
});