module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { email, source } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    const payload = {
      data: {
        type: "subscription",
        attributes: {
          custom_source: source || "Website signup",
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: email.trim(),
                subscriptions: {
                  email: {
                    marketing: {
                      consent: "SUBSCRIBED"
                    }
                  }
                },
                properties: {
                  Brand: "Rodrigo's Coffee",
                  "Signup Source": source || "Website signup"
                }
              }
            }
          }
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: "YguFST"
            }
          }
        }
      }
    };

    const response = await fetch(
      "https://a.klaviyo.com/client/subscriptions/?company_id=QUdvbH",
      {
        method: "POST",
        headers: {
          "accept": "application/vnd.api+json",
          "content-type": "application/vnd.api+json",
          "revision": "2025-01-15"
        },
        body: JSON.stringify(payload)
      }
    );

    if (response.status !== 202) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.errors?.[0]?.detail || JSON.stringify(body);
      } catch (_) {}
      console.error("Klaviyo error", response.status, detail);
      return res.status(502).json({
        ok: false,
        error: detail || `Klaviyo request failed (${response.status})`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Subscribe endpoint error", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};