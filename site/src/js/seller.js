(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const API_BASE_URL = (() => {
    const value = document.documentElement.dataset.apiBase?.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(url.hostname);
      return (url.protocol === "https:" || isLocalDevelopment) ? url.href.replace(/\/+$/, "") : "";
    } catch { return ""; }
  })();
  const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const categories = { CARRINHOS: "Carrinhos", BONECAS: "Bonecas", JOGOS: "Jogos e brinquedos", OUTROS: "Outros" };
  const conditions = { EXCELENTE: "Excelente", MUITO_BOA: "Muito boa", BOA: "Boa", COM_MARCAS_DO_TEMPO: "Com marcas do tempo" };
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const authPanel = $("#seller-auth");
  const authTabs = $("#seller-auth-tabs");
  const authSummary = $("#seller-auth-summary");
  const registerForm = $("#seller-register-form");
  const loginForm = $("#seller-login-form");
  const productForm = $("#product-form");
  const notice = $("#api-notice");
  const productMessage = $("#product-message");
  const productButton = $("#product-submit");
  const titleInput = $("#product-title");
  const categoryInput = $("#product-category");
  const decadeInput = $("#product-decade");
  const conditionInput = $("#product-condition");
  const priceInput = $("#product-price");
  const descriptionInput = $("#product-description");
  const imageUrlInput = $("#product-image-url");
  let accessToken = null;

  function message(target, text, kind = "") {
    target.textContent = text;
    target.classList.toggle("is-error", kind === "error");
    target.classList.toggle("is-success", kind === "success");
  }

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Não foi possível concluir esta etapa.");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setBusy(form, busy, label) {
    const button = form.querySelector("button[type='submit']");
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

  function updateAuthState(user) {
    authTabs.hidden = true;
    registerForm.hidden = true;
    loginForm.hidden = true;
    authSummary.hidden = false;
    $("#seller-auth-title").textContent = "Conta conectada";
    $("#seller-auth-name").textContent = user?.name ? `Olá, ${user.name}. Você já pode publicar.` : "Você já pode publicar este anúncio.";
    notice.classList.remove("is-demo");
    notice.classList.add("is-live");
    notice.querySelector("strong").textContent = "Conta pronta para publicar";
    notice.querySelector("p").textContent = "Revise a prévia e publique quando estiver satisfeito. O anúncio será associado à sua conta.";
    productButton.dataset.idleLabel = "Publicar anúncio";
    productButton.textContent = productButton.dataset.idleLabel;
  }

  function resetAuthState() {
    accessToken = null;
    authTabs.hidden = false;
    authSummary.hidden = true;
    $("#seller-auth-title").textContent = "Entre para publicar";
    switchAuthTab("register");
    notice.classList.remove("is-live");
    notice.classList.add("is-demo");
    notice.querySelector("strong").textContent = "Prévia de demonstração";
    notice.querySelector("p").textContent = "Sua conta foi desconectada. Entre novamente quando quiser publicar.";
    productButton.dataset.idleLabel = "Entrar para publicar";
    productButton.textContent = productButton.dataset.idleLabel;
  }

  function updatePreview() {
    const title = titleInput.value.trim();
    $("#preview-title").textContent = title || "O nome do seu brinquedo";
    $("#preview-category").textContent = categories[categoryInput.value] || "Categoria";
    $("#preview-condition").textContent = conditions[conditionInput.value] || "Conservação";
    $("#preview-decade").textContent = decadeInput.value ? `Década de ${decadeInput.value}` : "Década não informada";
    $("#preview-description").textContent = descriptionInput.value.trim() || "A descrição que você escrever aparecerá aqui para ajudar quem está procurando essa peça.";
    const price = Number(priceInput.value);
    $("#preview-price").textContent = Number.isFinite(price) && price > 0 ? money.format(price) : "R$ 0,00";
    $("#description-count").textContent = String(descriptionInput.value.length);
    const image = $("#preview-image");
    const placeholder = $("#preview-placeholder");
    const imageValue = imageUrlInput.value.trim();
    if (imageValue) {
      try {
        const imageUrl = new URL(imageValue);
        if (imageUrl.protocol === "https:") {
          image.src = imageUrl.href;
          image.hidden = false;
          placeholder.hidden = true;
          return;
        }
      } catch { /* A validação do formulário explica URLs inválidas. */ }
    }
    image.removeAttribute("src");
    image.hidden = true;
    placeholder.hidden = false;
  }

  function showAuthPanel() {
    authPanel.hidden = false;
    switchAuthTab("register");
    authPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#seller-name").focus({ preventScroll: true });
  }

  states.forEach((state) => $("#seller-state").add(new Option(state, state)));
  $("#current-year").textContent = String(new Date().getFullYear());
  [titleInput, categoryInput, decadeInput, conditionInput, priceInput, descriptionInput].forEach((input) => {
    input.addEventListener("input", updatePreview);
    input.addEventListener("change", updatePreview);
  });
  imageUrlInput.addEventListener("input", () => {
    imageUrlInput.setCustomValidity("");
    updatePreview();
  });
  imageUrlInput.addEventListener("change", updatePreview);
  $("#preview-image").addEventListener("error", () => {
    $("#preview-image").hidden = true;
    $("#preview-image").removeAttribute("src");
    $("#preview-placeholder").hidden = false;
  });
  $("#seller-auth-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-auth-tab]");
    if (tab) switchAuthTab(tab.dataset.authTab);
  });
  $("#seller-logout").addEventListener("click", resetAuthState);

  if (!API_BASE_URL) {
    authPanel.hidden = true;
    productButton.dataset.idleLabel = "Preparar prévia";
    productButton.textContent = productButton.dataset.idleLabel;
  } else {
    notice.classList.remove("is-demo");
    notice.classList.add("is-live");
    notice.querySelector("strong").textContent = "Publicação disponível";
    notice.querySelector("p").textContent = "Entre na sua conta ou crie uma para publicar o anúncio. A prévia permanece visível enquanto você preenche.";
    authPanel.hidden = false;
    productButton.dataset.idleLabel = "Entrar para publicar";
    productButton.textContent = productButton.dataset.idleLabel;
  }

  registerForm.querySelector("button[type='submit']").dataset.idleLabel = "Criar conta e continuar";
  loginForm.querySelector("button[type='submit']").dataset.idleLabel = "Entrar e continuar";
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
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
      updateAuthState(result.user);
    } catch (error) {
      message($("#seller-register-message"), error.message || "Não foi possível criar a conta.", "error");
    } finally { setBusy(registerForm, false); }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const data = Object.fromEntries(new FormData(loginForm).entries());
    setBusy(loginForm, true, "Entrando…");
    try {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
      accessToken = result.accessToken;
      loginForm.reset();
      updateAuthState(result.user);
    } catch (error) {
      message($("#seller-login-message"), error.message || "Não foi possível entrar na conta.", "error");
    } finally { setBusy(loginForm, false); }
  });

  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const imageValue = imageUrlInput.value.trim();
    let validHttpsImage = true;
    if (imageValue) {
      try { validHttpsImage = new URL(imageValue).protocol === "https:"; }
      catch { validHttpsImage = false; }
    }
    imageUrlInput.setCustomValidity(validHttpsImage ? "" : "Informe um link público que comece com https://.");
    if (!productForm.reportValidity()) return;
    if (!API_BASE_URL) {
      message(productMessage, "Prévia pronta. Este site ainda não está conectado à API: o anúncio não foi enviado nem salvo.", "error");
      updatePreview();
      return;
    }
    if (!accessToken) {
      message(productMessage, "Entre ou crie uma conta para publicar. Seus dados não serão adicionados à descrição do anúncio.", "error");
      showAuthPanel();
      return;
    }

    const data = Object.fromEntries(new FormData(productForm).entries());
    const payload = {
      title: data.title.trim(), category: data.category,
      decade: data.decade ? Number(data.decade) : null,
      condition: data.condition, price: Number(data.price),
      description: data.description.trim(), imageUrl: data.imageUrl.trim() || null
    };
    setBusy(productForm, true, "Publicando…");
    try {
      const result = await request("/api/products", { method: "POST", body: JSON.stringify(payload) });
      message(productMessage, "Anúncio publicado. Obrigado por passar essa memória adiante.", "success");
      if (result.product?.title) {
        productForm.reset();
        updatePreview();
      }
    } catch (error) {
      if (error.status === 401) {
        accessToken = null;
        message(productMessage, "Sua sessão terminou. Entre novamente para concluir a publicação.", "error");
        showAuthPanel();
      } else {
        message(productMessage, error.message || "Não foi possível publicar o anúncio.", "error");
      }
    } finally { setBusy(productForm, false); }
  });

  const menuToggle = $("#menu-toggle");
  const nav = $("#primary-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
    }
  });
  updatePreview();
})();
