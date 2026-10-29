(function () {
  "use strict";

  // ---- Configuration (adjust when the Spring Boot gateway is available) ----
  const CONFIG = {
    API_URL: "/api/auth/login",
    // Routes are used only AFTER the backend returns a verified role.
    DASHBOARD_ROUTES: {
      FARMER: "farmer/dashboard.html",
      CUSTOMER: "customer/dashboard.html",
      ADMIN: "admin/dashboard.html"
    },
    REQUEST_TIMEOUT_MS: 15000
  };

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberInput = document.getElementById("remember");
  const toggleBtn = document.getElementById("togglePassword");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");
  const spinner = document.getElementById("submitSpinner");
  const formAlert = document.getElementById("formAlert");
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let isSubmitting = false;

  function setFieldError(input, message) {
    const errorEl = document.getElementById(input.id + "Error");
    const invalid = Boolean(message);
    input.classList.toggle("is-invalid", invalid);
    input.setAttribute("aria-invalid", String(invalid));
    if (errorEl) errorEl.textContent = message || "";
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    let msg = "";
    if (!value) msg = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(value)) msg = "Please enter a valid email address.";
    setFieldError(emailInput, msg);
    return !msg;
  }

  function validatePassword() {
    const msg = passwordInput.value ? "" : "Please enter your password.";
    setFieldError(passwordInput, msg);
    return !msg;
  }

  function showAlert(message) {
    formAlert.textContent = message;
    formAlert.classList.remove("d-none");
    formAlert.focus();
  }

  function clearAlert() {
    formAlert.textContent = "";
    formAlert.classList.add("d-none");
  }

  function setLoading(loading) {
    isSubmitting = loading;
    submitBtn.disabled = loading;
    submitBtn.setAttribute("aria-busy", String(loading));
    spinner.classList.toggle("d-none", !loading);
    submitLabel.textContent = loading ? "Signing in…" : "Sign In";
  }

  // Show / hide password
  toggleBtn.addEventListener("click", function () {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    toggleBtn.setAttribute("aria-pressed", String(show));
    toggleBtn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggleBtn.querySelector("i").className = show ? "bi bi-eye-slash" : "bi bi-eye";
  });

  // Inline validation feedback
  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);
  emailInput.addEventListener("input", function () { if (emailInput.classList.contains("is-invalid")) validateEmail(); });
  passwordInput.addEventListener("input", function () { if (passwordInput.classList.contains("is-invalid")) validatePassword(); });

  async function authenticate(payload) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, CONFIG.REQUEST_TIMEOUT_MS);
    try {
      return await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include", // lets the backend set a Secure, HttpOnly session/JWT cookie
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (isSubmitting) return;
    clearAlert();

    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk) { emailInput.focus(); return; }
    if (!passwordOk) { passwordInput.focus(); return; }

    setLoading(true);
    try {
      const response = await authenticate({
        email: emailInput.value.trim(),
        password: passwordInput.value,
        rememberMe: rememberInput.checked
      });

      if (response.status === 401 || response.status === 403) {
        showAlert("We couldn’t sign you in. Please check your email and password and try again.");
        return;
      }
      if (!response.ok) {
        showAlert("Something went wrong on our side. Please try again in a moment.");
        return;
      }

      // The role must come from the backend's verified response, never from the page.
      const data = await response.json();
      const role = data && typeof data.role === "string" ? data.role.toUpperCase() : "";
      const destination = Object.prototype.hasOwnProperty.call(CONFIG.DASHBOARD_ROUTES, role)
        ? CONFIG.DASHBOARD_ROUTES[role] : null;

      if (!destination) {
        showAlert("Your account could not be verified. Please contact FarmFresh support.");
        return;
      }
      passwordInput.value = "";
      window.location.assign(destination);
    } catch (err) {
      // Network failure, timeout, or no backend connected.
      showAlert("We can’t reach the sign-in service right now. Signing in requires the FarmFresh backend to be running. Please try again later.");
    } finally {
      setLoading(false);
    }
  });
})();
