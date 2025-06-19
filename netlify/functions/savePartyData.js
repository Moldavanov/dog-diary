export default async (req, context) => {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwd9H6HDIiTgsiPuIOWb07tVrBllZB_tzxIV8wH11W0jmuYv64KNRzmT7d-40JHwmFWNA/exec";

  const method = req.method;

  const forwardOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
    }
  };

  if (method === "POST") {
    forwardOptions.body = await req.text();
  }

  try {
    const response = await fetch(scriptUrl, forwardOptions);
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const bodyText = await response.text();

    return new Response(bodyText, {
      status: 200,
      headers: {
        "Content-Type": isJson ? "application/json" : "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
