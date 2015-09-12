/**
 * Created by emptysamurai on 04-Sep-15.
 */
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

    InfoBox.prototype.show = function(type, properties) {
        this.elementType.text(type);

    }
})

