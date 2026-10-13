(() => {
  const PUBLIC_KEY = "QUdvbH";
  const LIST_ID = "YguFST";
  const ENDPOINT = `https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(PUBLIC_KEY)}`;
  async function subscribe(email, source) {
    const payload = { data: { type: "subscription", attributes: { custom_source: source, profile: { data: { type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } }, properties: { Brand: "Rodrigo's Coffee", "Signup Source": source } } } } }, relationships: { list: { data: { type: "list", id: LIST_ID } } } } };
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "accept": "application/vnd.api+json", "content-type": "application/vnd.api+json", "revision": "2025-07-15" }, body: JSON.stringify(payload) });
    if (!response.ok) { let detail = ""; try { const body = await response.json(); detail = body?.errors?.[0]?.detail || ""; } catch (_) {} throw new Error(detail || `Klaviyo request failed (${response.status})`); }
  }
  document.querySelectorAll(".signup-form").forEach((form) => {
    const emailInput = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const botField = form.querySelector('input[name="website"]');
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (botField && botField.value.trim() !== "") return;
      if (!emailInput.checkValidity()) { emailInput.reportValidity(); return; }
      status.textContent = "";
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "ONE MOMENT…";
      try { await subscribe(emailInput.value.trim(), form.dataset.source); window.location.assign("thanks.html"); }
      catch (error) { console.error(error); status.textContent = "Something went wrong. Please try again."; button.disabled = false; button.textContent = originalLabel; }
    });
  });
})();