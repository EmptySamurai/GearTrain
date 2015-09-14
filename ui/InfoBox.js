
define(function() {
    function tr() {
        return document.createElement("tr");
    }

    function td() {
        return document.createElement("td");
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
        this.elementType.text(title);
        for (var key in properties) {
            var value = properties[key];
            var row = tr();
            this.elementProperties.append(row);

            var keyColumn = td();
            keyColumn.textContent = key;
            row.appendChild(keyColumn);

            var valueColumn = td();
            valueColumn.textContent = value;
            row.appendChild(valueColumn);
        }
    };

    return InfoBox;
});

