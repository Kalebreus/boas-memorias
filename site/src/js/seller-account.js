(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const API_BASE_URL = (() => {
    const value = document.documentElement.dataset.apiBase?.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      return url.protocol === "https:" || local ? url.href.replace(/\/+$/, "") : "";
    } catch { return ""; }
  })();
  const tokenKey = "bm_seller_access_token";
  const authPanel = $("#seller-auth");
  const authTabs = $("#seller-auth-tabs");
  const registerForm = $("#seller-register-form");
  const loginForm = $("#seller-login-form");
  const notice = $("#api-notice");
  const nextStep = $("#seller-next-step");
  let accessToken = sessionStorage.getItem(tokenKey);

  function message(target, text, kind = "") {
    target.textContent = text;
    target.classList.toggle("is-error", kind === "error");
    target.classList.toggle("is-success", kind === "success");
  }

  async function request(path, options = {}) {
    const headers = { Accept: "application/json", "Content-Type": "application/json", ...options.headers };
    if (accessToken) headers.Authorization = "Bearer " + accessToken;
    const response = await fetch(API_BASE_URL + path, { ...options, headers, credentials: "omit", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.detail || "Não foi possível concluir esta etapa.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setBusy(form, busy, label) {
    const button = form.querySelector("button[type='submit']");
    if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent.trim();
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.idleLabel;
  }

  function switchAuthTab(mode) {
    const register = mode === "register";
    registerForm.hidden = !register;
    loginForm.hidden = register;
    $("#seller-register-tab").classList.toggle("is-active", register);
    $("#seller-login-tab").classList.toggle("is-active", !register);
    $("#seller-register-tab").setAttribute("aria-selected", String(register));
    $("#seller-login-tab").setAttribute("aria-selected", String(!register));
  }

  if (new URLSearchParams(window.location.search).get("modo") === "login") switchAuthTab("login");

  function setAuthenticated(user) {
    sessionStorage.setItem(tokenKey, accessToken);
    authTabs.hidden = true;
    registerForm.hidden = true;
    loginForm.hidden = true;
    $("#seller-auth-summary").hidden = false;
    $("#seller-auth-title").textContent = "Conta conectada";
    $("#seller-auth-name").textContent = user && user.name
      ? "Olá, " + user.name + ". Sua conta foi conectada."
      : "Sua conta foi conectada.";
    nextStep.hidden = false;
  }

  function clearAuthenticated() {
    sessionStorage.removeItem(tokenKey);
    accessToken = null;
    authTabs.hidden = false;
    $("#seller-auth-summary").hidden = true;
    $("#seller-auth-title").textContent = "Crie sua conta de vendedor";
    switchAuthTab("register");
    nextStep.hidden = true;
  }

  const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SE", "SP", "TO"];
  states.forEach((state) => $("#seller-state").add(new Option(state, state)));
  $("#current-year").textContent = String(new Date().getFullYear());
  $("#seller-auth-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-auth-tab]");
    if (tab) switchAuthTab(tab.dataset.authTab);
  });
  $("#seller-logout").addEventListener("click", clearAuthenticated);

  if (!API_BASE_URL) {
    notice.classList.add("is-demo");
    notice.querySelector("strong").textContent = "Cadastro em demonstração";
    notice.querySelector("p").textContent = "A API ainda não está conectada. Nenhum dado será enviado ou salvo; não informe dados reais até o cadastro estar ativado.";
  } else {
    notice.classList.remove("is-demo");
    notice.classList.add("is-live");
    notice.querySelector("strong").textContent = "Cadastro de vendedor";
    notice.querySelector("p").textContent = "Crie sua conta ou entre nesta página. Seus dados de perfil e anúncios ficam em páginas separadas.";
  }

  registerForm.querySelector("button[type='submit']").dataset.idleLabel = "Criar conta";
  loginForm.querySelector("button[type='submit']").dataset.idleLabel = "Entrar";

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    if (!API_BASE_URL) {
      message($("#seller-register-message"), "Cadastro não enviado: a API da loja ainda não está conectada.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(registerForm).entries());
    if (data.password !== data.confirmPassword) {
      message($("#seller-register-message"), "As senhas não conferem.", "error");
      return;
    }
    delete data.confirmPassword;
    delete data.consent;
    setBusy(registerForm, true, "Criando conta…");
    try {
      const result = await request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
      accessToken = result.accessToken;
      registerForm.reset();
      message($("#seller-register-message"), "", "success");
      setAuthenticated(result.user);
    } catch (error) {
      message($("#seller-register-message"), error.message || "Não foi possível criar a conta.", "error");
    } finally { setBusy(registerForm, false); }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    if (!API_BASE_URL) {
      message($("#seller-login-message"), "Entrada não enviada: a API da loja ainda não está conectada.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(loginForm).entries());
    setBusy(loginForm, true, "Entrando…");
    try {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
      accessToken = result.accessToken;
      loginForm.reset();
      setAuthenticated(result.user);
    } catch (error) {
      message($("#seller-login-message"), error.message || "Não foi possível entrar.", "error");
    } finally { setBusy(loginForm, false); }
  });

  if (API_BASE_URL && accessToken) {
    setAuthenticated({});
  }

  $("#menu-toggle").addEventListener("click", () => {
    const nav = $("#primary-nav");
    const open = nav.classList.toggle("is-open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
    $("#menu-toggle").setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  $("#primary-nav").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    $("#primary-nav").classList.remove("is-open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    $("#menu-toggle").setAttribute("aria-label", "Abrir menu");
  });
})();
