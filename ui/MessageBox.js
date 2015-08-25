/**
 * Created by emptysamurai on 25-Aug-15.
 */

define(function() {
    function div() {
        return document.createElement("div");
    }

    function hr() {
        return document.createElement("hr");
    }

    function MessageBox() {
        var messages = $("#messages");
        this.messages = messages;

        $("#show_logs").click(function() {
            var style = $("#logs_style");
            if ($(this).prop("checked")) {
                style.html(".log {display: block; }")
            } else {
                style.html(".log {display: none; }")
            }
        });

        $("#show_errors").click(function() {
            var style = $("#errors_style");
            if ($(this).prop("checked")) {
                style.html(".error {display: block; }")
            } else {
                style.html(".error {display: none; }")
            }
        });

        $("#clear_messages").click(function() {
            messages.empty();
        });


    }

    MessageBox.prototype.scrollToBottom = function () {
        this.messages.scrollTop(this.messages[0].scrollHeight);
    };

    MessageBox.prototype.addMessageWithClass =function(message, c) {
        var messageDiv = div();
        messageDiv.className = "message "+c;
        messageDiv.textContent = message;
        messageDiv.appendChild(hr());
        this.messages.append(messageDiv);
        this.scrollToBottom();
    };

    MessageBox.prototype.log = function (message) {
        this.addMessageWithClass(message, "log");
    };

    MessageBox.prototype.err = function (message) {
        this.addMessageWithClass(message, "error")
    };

    return MessageBox;
});