
define(function() {
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

    return MouseController;
});