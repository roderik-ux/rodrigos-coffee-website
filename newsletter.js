(() => {
  async function subscribe(email, source) {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ email, source })
    });

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.error || "";
      } catch (_) {}
      throw new Error(detail || `Signup failed (${response.status})`);
    }
  }

  document.querySelectorAll(".signup-form").forEach((form) => {
    const emailInput = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const botField = form.querySelector('input[name="website"]');
    const status = form.querySelector(".form-status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (botField && botField.value.trim() !== "") return;

      if (!emailInput.checkValidity()) {
        emailInput.reportValidity();
        return;
      }

      status.textContent = "";
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "ONE MOMENT…";

      try {
        await subscribe(emailInput.value.trim(), form.dataset.source || "Website signup");
        window.location.assign("thanks.html");
      } catch (error) {
        console.error("Signup error:", error);
        status.textContent = "Something went wrong. Please try again.";
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });
  });
})();