import fetch from "node-fetch";

async function testFetch() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/dashboard/system-info");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

testFetch();
