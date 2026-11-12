/* Form behaviour: inline validation, honest status, and a mail-client fallback. */
(function () {
  "use strict";

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function labelFor(field) {
    var label = field.form && field.id ? field.form.querySelector('label[for="' + field.id + '"]') : null;
    var text = label ? label.textContent.replace(/\s+/g, " ").trim() : field.name || "this field";
    return text.replace(/\s*\*$/, "");
  }

  function errorFor(form, field) {
    var id = field.getAttribute("aria-describedby");
    var node = id ? document.getElementById(id.split(" ")[0]) : null;
    if (node) {
      return node;
    }

    node = form.querySelector('[data-fdm-error-for="' + field.id + '"]');
    return node;
  }

  function messageFor(field) {
    if (field.validity.valueMissing || (field.required && !field.value.trim())) {
      return "Please add " + labelFor(field).toLowerCase() + ".";
    }
    if (field.type === "email" && field.value && !EMAIL.test(field.value)) {
      return "Enter a complete email address, such as name@example.com.";
    }
    var min = Number(field.getAttribute("data-minlength") || 0);
    if (min && field.value.trim().length < min) {
      return "Please write at least " + min + " characters.";
    }
    return "";
  }

  function setError(field, message) {
    var wrapper = field.closest(".field");
    var error = errorFor(field.form, field);

    if (wrapper) {
      wrapper.setAttribute("data-invalid", message ? "true" : "false");
    }
    field.setAttribute("aria-invalid", message ? "true" : "false");

    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  }

  function validateField(field) {
    var message = messageFor(field);
    setError(field, message);
    return !message;
  }

  document.querySelectorAll("[data-fdm-form]").forEach(function (form) {
    var status = form.querySelector("[data-fdm-form-status]");
    var fields = Array.prototype.slice.call(
      form.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea")
    );

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.required || field.value) {
          validateField(field);
        }
      });

      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }
      });

      field.addEventListener("change", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        if (status) {
          status.setAttribute("data-state", "error");
          status.textContent = "Please check the highlighted fields and try again.";
        }
        firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var project = String(data.get("project") || data.get("message") || "").trim();
      var fallback = form.getAttribute("data-fdm-email") || "hello@example.com";

      var subject = "Project enquiry from " + (name || "this site");
      var body =
        "Name: " +
        name +
        "\nEmail: " +
        email +
        "\n\nWhat we are making:\n" +
        project +
        "\n\nSent from the demo page.";

      var href =
        "mailto:" +
        fallback +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      if (!status) {
        return;
      }

      status.setAttribute("data-state", "ready");
      status.textContent = "This demo does not send or store anything. ";

      var link = document.createElement("a");
      link.href = href;
      link.textContent = "Open a draft in your email app";
      status.appendChild(link);

      var note = document.createElement("span");
      note.textContent = " — or write to " + fallback + ".";
      status.appendChild(note);
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        fields.forEach(function (field) {
          setError(field, "");
        });
        if (status) {
          status.removeAttribute("data-state");
          status.textContent = "No data leaves your browser in this demo.";
        }
      }, 0);
    });
  });
})();
