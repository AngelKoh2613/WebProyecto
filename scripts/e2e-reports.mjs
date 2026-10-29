import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(
  new URL("../apps/api/package.json", import.meta.url),
);
const { Client } = require("pg");
const port = 3012;
const origin = `http://127.0.0.1:${port}`;
const stamp = `e2e-${Date.now()}`;
const accountEmail = `${stamp}@example.test`;
const descriptions = {
  online: `${stamp}-conectado`,
  offline: `${stamp}-sin-red`,
  failed: `${stamp}-fallo-temporal`,
};

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const edge = edgeCandidates.find((candidate) => existsSync(candidate));
if (!edge) {
  console.error(
    "Microsoft Edge no está instalado. La prueba de extremo a extremo no se ejecutó.",
  );
  process.exit(1);
}

const userDataDir = await mkdtemp(path.join(tmpdir(), "field-service-e2e-"));
let server;
let browser;
const clientIds = [];

async function main() {
  try {
    server = startServer();
    await waitForHealth();
    browser = await launchBrowser();
    const page = await browser.newPage();
    await openControlled(page);

    await saveReport(page, descriptions.online);
    await page.waitForFunction(
      (description) => {
        const item = [...document.querySelectorAll("li")].find((node) =>
          node.textContent?.includes(description),
        );
        return item?.textContent?.includes("Sincronizado") ?? false;
      },
      { timeout: 20_000 },
      descriptions.online,
    );
    const afterOnline = await readReports(page);
    const onlineReport = afterOnline.find(
      (report) => report.description === descriptions.online,
    );
    assert(
      onlineReport?.syncStatus === "synced",
      "El reporte con red no quedó sincronizado.",
    );
    clientIds.push(onlineReport.clientId);

    await clickButton(page, "Mapa");
    await page.waitForFunction(
      () => document.body.innerText.includes("19.4326, -99.1332"),
      { timeout: 15_000 },
    );

    await page.setOfflineMode(true);
    await page.waitForFunction(() => !navigator.onLine);
    await saveReport(page, descriptions.offline);
    await page.waitForFunction(
      (description) => {
        const item = [...document.querySelectorAll("li")].find((node) =>
          node.textContent?.includes(description),
        );
        return (
          item?.textContent?.includes("Pendiente de sincronización") ?? false
        );
      },
      { timeout: 10_000 },
      descriptions.offline,
    );
    const whileOffline = await readReports(page);
    const offlineReport = whileOffline.find(
      (report) => report.description === descriptions.offline,
    );
    assert(
      offlineReport?.syncStatus === "pending",
      "El reporte sin red no quedó pendiente.",
    );
    clientIds.push(offlineReport.clientId);

    await browser.close();
    browser = await launchBrowser();
    const reopened = await browser.newPage();
    await reopened.setOfflineMode(true);
    await reopened.goto(origin, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    await reopened.waitForFunction(
      () => document.body.innerText.includes("Bienvenido, Técnico"),
      { timeout: 15_000 },
    );
    await clickButton(reopened, "Mis reportes");
    const restored = await readReports(reopened);
    assert(
      restored.some(
        (report) =>
          report.description === descriptions.offline &&
          report.syncStatus === "pending",
      ),
      "El reporte pendiente no sobrevivió al cierre del navegador.",
    );

    await reopened.setOfflineMode(false);
    await reopened.waitForFunction(() => navigator.onLine);
    await reopened.waitForFunction(
      (description) => {
        const item = [...document.querySelectorAll("li")].find((node) =>
          node.textContent?.includes(description),
        );
        return item?.textContent?.includes("Sincronizado") ?? false;
      },
      { timeout: 20_000 },
      descriptions.offline,
    );

    const synced = await readReports(reopened);
    const repeated = synced.find(
      (report) => report.description === descriptions.online,
    );
    const replay = await reopened.evaluate(async (report) => {
      const response = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId: report.clientId,
          description: report.description,
          technicianLabel: report.technicianLabel,
          latitude: report.latitude,
          longitude: report.longitude,
          createdAt: report.createdAt,
        }),
        credentials: "include",
      });
      return response.status;
    }, repeated);
    assert(
      replay === 200,
      `La repetición respondió ${replay}, se esperaba 200.`,
    );

    await stopServer();
    await saveReport(reopened, descriptions.failed);
    await reopened.waitForFunction(
      (description) => {
        const item = [...document.querySelectorAll("li")].find((node) =>
          node.textContent?.includes(description),
        );
        return (
          item?.textContent?.includes("Error de sincronización") &&
          item.textContent.includes(description)
        );
      },
      { timeout: 15_000 },
      descriptions.failed,
    );
    const failedLocal = await readReports(reopened);
    const failedReport = failedLocal.find(
      (report) => report.description === descriptions.failed,
    );
    assert(failedReport, "El fallo temporal eliminó el reporte local.");
    clientIds.push(failedReport.clientId);

    server = startServer();
    await waitForHealth();
    await clickButton(reopened, "Reintentar sincronización");
    await reopened.waitForFunction(
      (description) => {
        const item = [...document.querySelectorAll("li")].find((node) =>
          node.textContent?.includes(description),
        );
        return item?.textContent?.includes("Sincronizado") ?? false;
      },
      { timeout: 20_000 },
      descriptions.failed,
    );

    const counts = await countRows(clientIds);
    assert(
      counts.every((count) => count === 1),
      `Cada identificador debe tener una fila. Conteos: ${counts.join(", ")}.`,
    );
    console.log(
      `e2e ok: 3 reportes locales, repetición 200, filas ${counts.join(", ")}`,
    );
  } finally {
    await browser?.close().catch(() => undefined);
    await stopServer();
    await rm(userDataDir, { recursive: true, force: true });
    try {
      await deleteCreatedRows(clientIds);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo limpiar la prueba";
      console.error(redact(message));
    }
  }
}

function startServer() {
  return spawn(
    process.execPath,
    ["--env-file=.env", "apps/api/dist/server.js"],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function stopServer() {
  if (!server || server.killed) return;
  server.kill();
  await new Promise((resolve) => {
    server.once("exit", resolve);
    setTimeout(resolve, 3_000);
  });
  server = undefined;
}

async function waitForHealth() {
  const deadline = Date.now() + 20_000;
  let lastError = "sin respuesta";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/health`);
      if (response.ok) return;
      lastError = String(response.status);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "sin respuesta";
    }
    await delay(250);
  }
  throw new Error(`La API no respondió /health: ${redact(lastError)}`);
}

async function launchBrowser() {
  const debuggingPort = 9334;
  const child = spawn(
    edge,
    [
      "--headless=new",
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-sync",
      "--no-first-run",
      "--disable-extensions",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const version = await waitJson(
    `http://127.0.0.1:${debuggingPort}/json/version`,
  );
  const connection = await openSocket(version.webSocketDebuggerUrl);
  return {
    async newPage() {
      const target = await connection.send("Target.createTarget", {
        url: "about:blank",
      });
      const attached = await connection.send("Target.attachToTarget", {
        targetId: target.targetId,
        flatten: true,
      });
      const page = new CdpPage(connection, attached.sessionId);
      await page.send("Page.enable");
      await page.send("Runtime.enable");
      await page.send("Network.enable");
      return page;
    },
    async close() {
      await connection.send("Browser.close").catch(() => undefined);
      const exited = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 8_000);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve(true);
        });
      });
      if (!exited) child.kill();
      connection.close();
    },
  };
}

async function openControlled(page) {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await ensureAccount(page);
  await page.waitForFunction(
    async () => {
      const ready = await navigator.serviceWorker?.ready;
      return Boolean(navigator.serviceWorker?.controller || ready?.active);
    },
    { timeout: 15_000 },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => Boolean(navigator.serviceWorker.controller),
    { timeout: 15_000 },
  );
  await page.waitForFunction(
    () => document.body.innerText.includes("Bienvenido, Técnico"),
    { timeout: 15_000 },
  );
}

async function ensureAccount(page) {
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("Bienvenido, Técnico") ||
      Boolean(document.querySelector("#account-email")),
    { timeout: 15_000 },
  );
  const needsAccount = await page.evaluate(
    () => !document.body.innerText.includes("Bienvenido, Técnico"),
  );
  if (!needsAccount) return;
  await clickButton(page, "Crear una cuenta");
  await page.waitForSelector("#account-name");
  await page.type("#account-name", "Tecnico e2e");
  await page.type("#account-email", accountEmail);
  await page.type("#account-password", "password12");
  await clickButton(page, "Crear cuenta");
  await page.waitForFunction(
    () => document.body.innerText.includes("Bienvenido, Técnico"),
    { timeout: 15_000 },
  );
}

async function saveReport(page, description) {
  const hasForm = await page.$("#report-description");
  if (!hasForm) {
    const hasNew = await page.evaluate(() =>
      [...document.querySelectorAll("button")].some((button) =>
        button.textContent?.includes("Nuevo reporte"),
      ),
    );
    await clickButton(page, hasNew ? "Nuevo reporte" : "Crear reporte");
  }
  await page.waitForSelector("#report-description");
  await fillField(page, "#report-description", description);
  await fillField(page, "#report-latitude", "19.4326");
  await fillField(page, "#report-longitude", "-99.1332");
  await clickButton(page, "Guardar reporte");
  await page.waitForFunction(
    (description) =>
      [...document.querySelectorAll("li")].some((node) =>
        node.textContent?.includes(description),
      ),
    { timeout: 10_000 },
    description,
  );
}

async function fillField(page, selector, value) {
  await page.evaluate(
    ({ selector: fieldSelector, value: fieldValue }) => {
      const field = document.querySelector(fieldSelector);
      const prototype =
        field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      setter?.call(field, fieldValue);
      field?.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { selector, value },
  );
}

async function clickButton(page, label) {
  await page.waitForFunction(
    (text) =>
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.includes(text) && !button.disabled,
      ),
    { timeout: 10_000 },
    label,
  );
  await page.evaluate((text) => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent?.includes(text) && !item.disabled,
    );
    button?.click();
  }, label);
}

function readReports(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("field-service");
        request.onerror = () => reject(new Error("IndexedDB no abrió"));
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("reports", "readonly");
          const rows = transaction.objectStore("reports").getAll();
          rows.onerror = () => reject(new Error("IndexedDB no leyó"));
          rows.onsuccess = () => resolve(rows.result);
        };
      }),
  );
}

async function countRows(ids) {
  return withDatabase(async (database) => {
    const counts = [];
    for (const id of ids) {
      const result = await database.query(
        "select count(*)::int as count from service_reports where client_id = $1",
        [id],
      );
      counts.push(result.rows[0]?.count ?? 0);
    }
    return counts;
  });
}

async function deleteCreatedRows(ids) {
  await withDatabase(async (database) => {
    await database.query(
      "delete from sessions where user_id in (select id from users where email = $1)",
      [accountEmail],
    );
    await database.query(
      "delete from service_reports where client_id = any($1::uuid[]) or description = any($2::text[]) or user_id in (select id from users where email = $3)",
      [ids, Object.values(descriptions), accountEmail],
    );
    await database.query("delete from users where email = $1", [accountEmail]);
  });
}

async function withDatabase(operation) {
  process.loadEnvFile(path.join(root, ".env"));
  const database = new Client({ connectionString: process.env.DATABASE_URL });
  await database.connect();
  try {
    return await operation(database);
  } finally {
    await database.end();
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function redact(value) {
  return value.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]");
}

class CdpPage {
  constructor(connection, sessionId) {
    this.connection = connection;
    this.sessionId = sessionId;
  }

  send(method, params) {
    return this.connection.send(method, params, this.sessionId);
  }

  async goto(url) {
    const loaded = this.waitEvent("Page.loadEventFired", 20_000);
    await this.send("Page.navigate", { url });
    await loaded;
  }

  async reload() {
    const loaded = this.waitEvent("Page.loadEventFired", 20_000);
    await this.send("Page.reload", {});
    await loaded;
  }

  async setOfflineMode(offline) {
    await this.send("Network.emulateNetworkConditions", {
      offline,
      latency: 0,
      downloadThroughput: offline ? 0 : -1,
      uploadThroughput: offline ? 0 : -1,
    });
  }

  async evaluate(fn, arg) {
    const expression =
      typeof fn === "function"
        ? `(${fn})(${arg === undefined ? "" : JSON.stringify(arg)})`
        : fn;
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.text ?? "La página rechazó la expresión",
      );
    }
    return result.result?.value;
  }

  async $(selector) {
    const found = await this.evaluate(
      (value) => Boolean(document.querySelector(value)),
      selector,
    );
    return found ? selector : null;
  }

  async click(selector) {
    await this.evaluate((value) => {
      document.querySelector(value)?.focus();
      document.querySelector(value)?.click();
    }, selector);
  }

  async type(selector, text) {
    await this.click(selector);
    await this.send("Input.insertText", { text });
  }

  async waitForSelector(selector) {
    await this.waitForFunction(
      (value) => Boolean(document.querySelector(value)),
      { timeout: 10_000 },
      selector,
    );
  }

  async waitForFunction(fn, options, arg) {
    const timeout = options?.timeout ?? 15_000;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await this.evaluate(fn, arg)) return;
      await delay(200);
    }
    throw new Error(
      `Se agotó la espera de la página. ${String(
        await this.evaluate(() => document.body.innerText).catch(() => ""),
      ).slice(0, 400)}`,
    );
  }

  waitEvent(method, timeout) {
    return this.connection.waitEvent(method, this.sessionId, timeout);
  }
}

function openSocket(url) {
  const ws = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () =>
      reject(new Error("DevTools no conectó")),
    );
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    if (message.method) {
      for (const listener of listeners.get(message.method) ?? []) {
        listener(message.params, message.sessionId);
      }
    }
  });

  return {
    ready: opened,
    async send(method, params = {}, sessionId) {
      await opened;
      const id = ++nextId;
      ws.send(JSON.stringify({ id, method, params, sessionId }));
      const message = await new Promise((resolve) => {
        pending.set(id, resolve);
      });
      if (message.error) throw new Error(message.error.message);
      return message.result;
    },
    waitEvent(method, sessionId, timeout) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(method));
        }, timeout);
        const listener = (params, eventSession) => {
          if (eventSession !== sessionId) return;
          clearTimeout(timer);
          const group = listeners.get(method) ?? [];
          listeners.set(
            method,
            group.filter((item) => item !== listener),
          );
          resolve(params);
        };
        const group = listeners.get(method) ?? [];
        group.push(listener);
        listeners.set(method, group);
      });
    },
    close() {
      ws.close();
    },
  };
}

async function waitJson(url) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await delay(200);
    }
  }
  throw new Error("Edge no abrió el puerto de depuración");
}

await main();
