
define(function() {
    /**
     *
     * @param properties Object map where key is property name and value is object containing type, label and validator for property
     * @param params.buttons - Shown buttons. Available values: ModalForm.OK_CANCEL (default), ModalForm.OK
     * @param params.title - Title of the form
     * @param params Configuration parameters
     */
    function ModalForm(properties, params) {
        params = params || {};
        this.propeties = properties;
        this.buttons = params.buttons || ModalForm.OK_CANCEL;
        this.form = $("<div class=\"modal_form\">");
        var insideForm = $("<div class=\"inner_modal_form\">");
        this.form.append(insideForm);
        var title = params.title;
        if (title) {
            insideForm.append($("<h3>" + title + "</h3>"));
        }
        for (var name in properties) {
            var prop = properties[name];

            var label = prop.label ? prop.label : name;
            insideForm.append($("<span>" + label + ": </span>"));

            if (!prop.type || prop.type == String || prop.type == Number) {
                insideForm.append($("<input name=\"" + name + "\">"));
            } else if (prop.type == Boolean) {
                insideForm.append($("<input type='checkbox' name=\"" + name + "\">"));
            }

            insideForm.append($("<br>"));
        }
        this.buttonOk = $("<button>OK</button>");
        insideForm.append(this.buttonOk);

        if (this.hasCancelButton()) {
            this.buttonCancel = $("<button>Cancel</button>");
            insideForm.append(this.buttonCancel);
        }
    }

    ModalForm.OK_CANCEL = 1;
    ModalForm.OK = 2;

    ModalForm.validators = {
        positiveNumber: function(n) {
            return n>0;
        },
        numberGreaterOrEqualTo: function(x) {
            return function(n) {
                return n>=x;
        }
    }
    };

    ModalForm.prototype.hasCancelButton = function() {
        return this.buttons == ModalForm.OK_CANCEL;
    };

    ModalForm.prototype.show = function (f) {
        var o = this;
        var close = function () {
            o.form.remove();
        };

        if (this.hasCancelButton()) {
            this.buttonCancel.on('click', function () {
                var e = {
                    prevent: false,
                    ok: false
                };
                f(e);
                if (!e.prevent)
                    close();
            });
        }
        this.buttonOk.on('click', function () {
            try {
                var values = o.getValues();
            } catch (err) {
                return;
            }
            var e = {
                values: values,
                prevent: false,
                ok: true
            };
            f(e);
            if (!e.prevent)
                close();
        });
        $('body').append(this.form);
    };

    ModalForm.prototype.getValues = function () {
        var result = {};
        var o = this;
        var error = false;
        $('.inner_modal_form').children().map(function (i, elem) {
            var name = elem.getAttribute('name');
            if (elem.tagName.toLowerCase() == "input") {
                var value = elem.value.trim();
                if (o.propeties[name].type == Number) {
                    var validator = o.propeties[name].validator;
                    if (!value || isNaN(value) || !(!validator || validator(value))) {
                        error = true;
                        $(elem).css("background-color", "#FF4B37");
                    } else {
                        $(elem).css("background-color", "#FFFFFF");
                    }
                }
                result[name] = o.propeties[name].type(elem.value);
            }
        });
        if (error) {
            throw "Not all values can be parsed";
        }
        return result;
    };

    return ModalForm;
});