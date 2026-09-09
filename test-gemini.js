const fetch = require('node-fetch');
async function test() {
  const imagePrompt = "Create a blue square image";
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyCY3v3-tQum8P9Y0xscYQJpHrP57gY7VzA';
  try {
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: imagePrompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          responseMimeType: "text/plain",
        },
      }),
    });
    console.log("Status:", geminiResponse.status);
    const data = await geminiResponse.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.log("Error:", e);
  }
}
test();
