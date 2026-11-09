/**
 * Browser checks against the local pages. Intake.post is stubbed in the page.
 * No request is allowed to leave this machine. Google Apps Script is not called.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 8877;
const debugPort = 9444;
const shots = "/opt/cursor/artifacts";
const failures = [];

function check(name, cond) {
  if (!cond) {
    failures.push(name);
    console.error("FAIL " + name);
  } else {
    console.log("ok " + name);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  try {
    const buf = await readFile(path.join(root, pathname));
    res.writeHead(200, { "content-type": contentType(pathname) });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--remote-debugging-port=" + debugPort,
  "--user-data-dir=/tmp/chrome-ddh-intake-" + Date.now(),
  "about:blank"
], { stdio: "ignore" });

let version;
for (let i = 0; i < 50; i++) {
  try {
    version = await (await fetch("http://127.0.0.1:" + debugPort + "/json/version")).json();
    break;
  } catch {
    await sleep(100);
  }
}
if (!version) throw new Error("Chrome debugging port did not open");

const browser = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  browser.addEventListener("open", resolve);
  browser.addEventListener("error", reject);
});

let browserSeq = 1;
const browserWait = new Map();
browser.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && browserWait.has(msg.id)) {
    const pending = browserWait.get(msg.id);
    browserWait.delete(msg.id);
    if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
    else pending.resolve(msg.result);
  }
});
function browserSend(method, params) {
  const id = browserSeq++;
  return new Promise((resolve, reject) => {
    browserWait.set(id, { resolve, reject });
    browser.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

const created = await browserSend("Target.createTarget", { url: "about:blank" });
const pages = await (await fetch("http://127.0.0.1:" + debugPort + "/json/list")).json();
const page = pages.find((item) => item.id === created.targetId);
const pageWs = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  pageWs.addEventListener("open", resolve);
  pageWs.addEventListener("error", reject);
});

let seq = 1;
const waiting = new Map();
const events = [];
pageWs.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && waiting.has(msg.id)) {
    const pending = waiting.get(msg.id);
    waiting.delete(msg.id);
    if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
    else pending.resolve(msg.result);
  } else if (msg.method) {
    events.push(msg);
  }
});
function send(method, params) {
  const id = seq++;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    pageWs.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

const requests = [];
await send("Page.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
pageWs.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method !== "Fetch.requestPaused") return;
  const url = msg.params.request.url;
  const method = msg.params.request.method;
  requests.push(method + " " + url);
  const local = url.startsWith("http://127.0.0.1:" + port) || url.startsWith("data:");
  if (local && method !== "POST") send("Fetch.continueRequest", { requestId: msg.params.requestId }).catch(() => {});
  else send("Fetch.failRequest", { requestId: msg.params.requestId, errorReason: "BlockedByClient" }).catch(() => {});
});

async function openPage(pathname) {
  const loaded = new Promise((resolve) => {
    const on = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === "Page.loadEventFired") {
        pageWs.removeEventListener("message", on);
        resolve();
      }
    };
    pageWs.addEventListener("message", on);
  });
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + pathname });
  await Promise.race([loaded, sleep(4000)]);
  await sleep(50);
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

async function shot(name) {
  const image = await send("Page.captureScreenshot", { format: "png" });
  await mkdir(shots, { recursive: true });
  await writeFile(path.join(shots, name), Buffer.from(image.data, "base64"));
}

function visible(id) {
  return evaluate(`(() => {
    var el = document.getElementById(${JSON.stringify(id)});
    if (!el) return false;
    var style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  })()`);
}

async function fillApply(orgType, billing) {
  await evaluate(`(() => {
    document.getElementById("name").value = "Example Person";
    document.getElementById("email").value = "person@example.invalid";
    document.getElementById("role").value = "COO";
    document.getElementById("orgType").value = ${JSON.stringify(orgType)};
    document.getElementById("scale").value = "1 site";
    document.getElementById("pain").value = "Close takes too long.";
    document.querySelector('input[name="biTeam"][value="Yes"]').checked = true;
    document.querySelector('input[name="billingPack"][value=${JSON.stringify(billing)}]').checked = true;
    document.getElementById("applyForm").requestSubmit();
  })()`);
  await sleep(100);
}

await openPage("/apply.html");
check("empty url constant", await evaluate("SHEET_WEB_APP_URL") === "");
await fillApply("Medical group", "No");
check("empty url shows the error", await visible("applyError"));
check("empty url hides booking", await visible("applyFit") === false);
check("empty url does not navigate away", (await evaluate("location.href")).indexOf("mailto:") === -1);
await shot("intake-not-saved.png");

await evaluate("Intake.post = function (payload) { window.__last = payload; return Promise.resolve({ persisted: true, notified: true }); };");
await evaluate("document.getElementById('applyError').style.display='none'; document.getElementById('applyForm').style.display='block';");
await fillApply("Medical group", "No");
check("saved fit shows booking", await visible("applyFit"));
check("saved fit hides the mail note", await visible("applyMailNote") === false);
check("payload keeps an empty honeypot", (await evaluate("window.__last.companyWebsite")) === "");
await shot("intake-saved-booking.png");

await evaluate("Intake.post = function () { return Promise.resolve({ persisted: true, notified: false }); };");
await evaluate("document.getElementById('applyFit').style.display='none'; document.getElementById('applyForm').style.display='block';");
await fillApply("Medical group", "No");
check("failed mail stays honest", (await evaluate("document.getElementById('applyMailNote').textContent")).indexOf("did not send") !== -1);
check("failed mail still shows booking", await visible("applyFit"));
await shot("intake-mail-not-sent.png");

await evaluate("Intake.post = function () { return Promise.resolve({ persisted: true, notified: null, duplicate: true }); };");
await evaluate("document.getElementById('applyFit').style.display='none'; document.getElementById('applyMailNote').style.display='none'; document.getElementById('applyForm').style.display='block';");
await fillApply("Medical group", "No");
const unknown = await evaluate("document.getElementById('applyMailNote').textContent");
check("unknown notification is not claimed", unknown.indexOf("could not confirm") !== -1 && unknown.indexOf("did not send") === -1);

await evaluate("Intake.post = function () { return Promise.resolve({ persisted: true, notified: true }); };");
await evaluate("document.getElementById('applyFit').style.display='none'; document.getElementById('applyMailNote').style.display='none'; document.getElementById('applyForm').style.display='block';");
await fillApply("Medical group", "Yes");
check("poor fit hides booking", await visible("applyMiss") && await visible("applyFit") === false);

await openPage("/checkup.html");
await evaluate(`(() => {
  for (var i = 0; i < 10; i++) choose("yes");
})()`);
await sleep(500);
check("checkup reaches results without a network post", await evaluate("document.getElementById('results').classList.contains('show')"));
await evaluate(`(() => {
  document.getElementById("capName").value = "Example Person";
  document.getElementById("capOrg").value = "Example Group";
  document.getElementById("capEmail").value = "person@example.invalid";
  document.getElementById("capSend").click();
})()`);
await sleep(100);
check("checkup empty url shows the error", await visible("capError"));
check("checkup empty url hides saved", await visible("capDone") === false);

await evaluate("Intake.post = function () { return Promise.resolve({ persisted: true, notified: true }); };");
await evaluate("document.getElementById('capError').style.display='none'; document.getElementById('capForm').style.display='block';");
await evaluate("document.getElementById('capSend').click()");
await sleep(50);
const saved = await evaluate("document.getElementById('capDoneCopy').textContent");
check("checkup does not claim a visitor copy", await visible("capDone") && saved.indexOf("inbox") === -1 && saved.indexOf("on its way") === -1);
await shot("checkup-saved.png");

await evaluate("Intake.post = function () { return Promise.resolve({ persisted: true, notified: false }); };");
await evaluate("document.getElementById('capDone').style.display='none'; document.getElementById('capForm').style.display='block';");
await evaluate("document.getElementById('capSend').click()");
await sleep(50);
const missed = await evaluate("document.getElementById('capDoneCopy').textContent");
check("checkup mail failure names DDH", missed.indexOf("did not send") !== -1 && missed.indexOf("inbox") === -1);

await openPage("/index.html");
const footer = await evaluate("document.querySelector('.footer-base').textContent");
check("homepage keeps the offer line", footer.indexOf("Retainer") !== -1 && footer.indexOf("Forecasts") !== -1);
check("homepage names analytics", footer.indexOf("Google Analytics") !== -1);

const leaked = requests.filter((line) => /formsubmit|script\.google|mailto:/i.test(line));
check("no form or script request left the browser", leaked.length === 0);

pageWs.close();
browser.close();
chrome.kill("SIGKILL");
server.close();

console.log(JSON.stringify({ pass: failures.length === 0, failures, requests: requests.length }, null, 2));
if (failures.length) process.exit(1);
