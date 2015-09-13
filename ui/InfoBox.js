
define(function() {
    function tr() {
        return $(document.createElement("tr"));
    }

    function td() {
        return $(document.createElement("td"));
    }

    function InfoBox() {
        this.elementType = $("#element_type");
        this.elementProperties = $("#element_properties");
    }

    InfoBox.prototype.clear = function() {
        this.elementType.text('');
        this.elementProperties.empty();
    };

    InfoBox.prototype.show = function(title, properties) {
        this.clear();
        this.elementType.text(type);
        for (var key in properties) {

        }
    };

    return InfoBox;
});

