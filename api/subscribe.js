const KLAVIYO_REVISION = "2026-07-15";
const LIST_NAME = "Share the cup";

async function klaviyo(path, options = {}) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!apiKey) throw new Error("KLAVIYO_PRIVATE_API_KEY is not configured");

  const response = await fetch(`https://a.klaviyo.com${path}`, {
    ...options,
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
      revision: KLAVIYO_REVISION,
      ...(options.headers || {})
    }
  });

  return response;
}

async function getOrCreateList() {
  const filter = encodeURIComponent(`equals(name,"${LIST_NAME}")`);
  let response = await klaviyo(`/api/lists?filter=${filter}`, { method: "GET" });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Klaviyo list lookup failed (${response.status}): ${body}`);
  }

  const result = await response.json();
  const existing = result?.data?.[0];
  if (existing?.id) return existing.id;

  response = await klaviyo("/api/lists", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "list",
        attributes: {
          name: LIST_NAME
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Klaviyo list creation failed (${response.status}): ${body}`);
  }

  const created = await response.json();
  if (!created?.data?.id) throw new Error("Klaviyo list creation returned no list ID");
  return created.data.id;
}

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

    const cleanEmail = email.trim().toLowerCase();
    const listId = await getOrCreateList();

    const payload = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          custom_source: source || "Website signup",
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: cleanEmail,
                  properties: {
                    Brand: "Rodrigo's Coffee",
                    "Signup Source": source || "Website signup"
                  },
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED"
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId
            }
          }
        }
      }
    };

    const response = await klaviyo("/api/profile-subscription-bulk-create-jobs", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.status !== 202) {
      const body = await response.text();
      console.error("Klaviyo subscribe error", response.status, body);
      return res.status(502).json({
        ok: false,
        error: `Klaviyo subscription failed (${response.status})`
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Subscribe endpoint error", error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Internal server error"
    });
  }
};