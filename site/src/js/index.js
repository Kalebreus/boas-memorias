(() => {
  "use strict";

  const API_BASE_URL = (() => {
    const value = document.documentElement.dataset.apiBase?.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(url.hostname);
      return (url.protocol === "https:" || isLocalDevelopment) ? url.href.replace(/\/+$/, "") : "";
    } catch { return ""; }
  })();
  const stateNames = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const productSeeds = [
    { id: "carro-classico", title: "Carrinho clássico de corrida", subtitle: "Década de 1980 · metal", category: "Carrinhos", price: 89.9, condition: "Muito boa", badge: "Peça única", tone: "#e9d9bf", type: "car" },
    { id: "boneca-jardim", title: "Boneca jardim de infância", subtitle: "Década de 1970 · vinil", category: "Bonecas", price: 148, condition: "Boa", badge: "Achado raro", tone: "#e9d8d3", type: "doll" },
    { id: "robo-lunar", title: "Robô explorador lunar", subtitle: "Década de 1980 · plástico", category: "Jogos", price: 210, condition: "Muito boa", badge: "Em destaque", tone: "#deded2", type: "robot" },
    { id: "ursinho-mel", title: "Ursinho de mel e abraço", subtitle: "Década de 1990 · tecido", category: "Outros", price: 72, condition: "Boa", badge: "Peça única", tone: "#e7ddc7", type: "bear" },
    { id: "trenzinho-estacao", title: "Trenzinho da estação", subtitle: "Década de 1970 · madeira", category: "Jogos", price: 126.5, condition: "Com marcas do tempo", badge: "Clássico", tone: "#dce4da", type: "train" },
    { id: "carro-conversivel", title: "Conversível vermelho", subtitle: "Década de 1990 · coleção", category: "Carrinhos", price: 116, condition: "Excelente", badge: "Bem cuidado", tone: "#f0dfcf", type: "convertible" }
  ];
  let products = productSeeds.map((item) => ({ ...item, isDemo: true }));

  const svgArt = {
    car: `<svg class="product-art" viewBox="0 0 260 190" aria-hidden="true"><ellipse cx="130" cy="157" rx="91" ry="10" fill="#284338" opacity=".12"/><path d="M39 117c5-19 17-28 37-34l22-32c8-12 18-18 35-18h28c15 0 26 6 35 19l21 30c14 4 21 15 22 31v16H40v-12Z" fill="#b84e38"/><path d="m110 56-20 29h48V39h-4c-11 0-18 5-24 17Zm38-17v46h61l-15-25c-6-13-14-21-28-21h-18Z" fill="#efd09a"/><path d="M36 114c6-13 20-19 43-19h13l9 16h81l11-16h26l18 11c7 5 12 14 12 25v10H36v-12c0-6 0-11 0-15Z" fill="#d0664a"/><circle cx="78" cy="146" r="22" fill="#26443a"/><circle cx="78" cy="146" r="11" fill="#e2d2b7"/><circle cx="201" cy="146" r="22" fill="#26443a"/><circle cx="201" cy="146" r="11" fill="#e2d2b7"/><path d="M128 98h33" stroke="#f4dbaa" stroke-width="4" stroke-linecap="round"/></svg>`,
    doll: `<svg class="product-art" viewBox="0 0 220 205" aria-hidden="true"><ellipse cx="110" cy="178" rx="57" ry="9" fill="#49352e" opacity=".1"/><path d="M69 65c0-29 18-48 41-48s41 19 41 48v40H69V65Z" fill="#84583f"/><circle cx="110" cy="73" r="39" fill="#edcba9"/><path d="M70 71c1-29 17-47 40-47 24 0 39 18 40 47-12-11-22-24-27-37-11 16-27 29-53 37Z" fill="#744b37"/><path d="M76 122c0-22 15-36 34-36s34 14 34 36v38H76v-38Z" fill="#a45b54"/><circle cx="96" cy="73" r="3" fill="#45342c"/><circle cx="124" cy="73" r="3" fill="#45342c"/><path d="M102 89q8 7 16 0" fill="none" stroke="#b87567" stroke-width="2.5" stroke-linecap="round"/><path d="M82 144h56l-3 19H85l-3-19Z" fill="#e7c78f"/><path d="M89 121h42M93 131h34" stroke="#e8bca4" stroke-width="3" stroke-linecap="round"/><circle cx="97" cy="164" r="12" fill="#edcba9"/><circle cx="123" cy="164" r="12" fill="#edcba9"/></svg>`,
    robot: `<svg class="product-art" viewBox="0 0 220 205" aria-hidden="true"><ellipse cx="110" cy="176" rx="58" ry="8" fill="#263f37" opacity=".12"/><path d="M110 24v16" stroke="#5d7771" stroke-width="4" stroke-linecap="round"/><circle cx="110" cy="19" r="7" fill="#cd7252"/><rect x="67" y="41" width="86" height="78" rx="14" fill="#749087"/><rect x="78" y="52" width="64" height="37" rx="8" fill="#d4e2d5"/><circle cx="96" cy="70" r="5" fill="#294b43"/><circle cx="124" cy="70" r="5" fill="#294b43"/><path d="M98 81h24" stroke="#719084" stroke-width="3" stroke-linecap="round"/><path d="M58 69H43m134 0h-15" stroke="#697f77" stroke-width="8" stroke-linecap="round"/><rect x="53" y="60" width="18" height="26" rx="7" fill="#b85d45"/><rect x="149" y="60" width="18" height="26" rx="7" fill="#b85d45"/><rect x="80" y="119" width="60" height="39" rx="8" fill="#bd7354"/><path d="M89 130h42m-37 10h32" stroke="#edc693" stroke-width="3" stroke-linecap="round"/><path d="M93 158v12m34-12v12" stroke="#5d7771" stroke-width="9" stroke-linecap="round"/><path d="M80 171h26m8 0h26" stroke="#405b52" stroke-width="9" stroke-linecap="round"/></svg>`,
    bear: `<svg class="product-art" viewBox="0 0 220 205" aria-hidden="true"><ellipse cx="110" cy="179" rx="54" ry="8" fill="#483b2d" opacity=".12"/><circle cx="77" cy="56" r="21" fill="#b87d54"/><circle cx="143" cy="56" r="21" fill="#b87d54"/><circle cx="77" cy="56" r="10" fill="#d8aa7b"/><circle cx="143" cy="56" r="10" fill="#d8aa7b"/><circle cx="110" cy="77" r="43" fill="#c78d5e"/><ellipse cx="110" cy="91" rx="22" ry="17" fill="#ecd2ae"/><circle cx="96" cy="73" r="3.5" fill="#342b27"/><circle cx="124" cy="73" r="3.5" fill="#342b27"/><ellipse cx="110" cy="87" rx="5" ry="4" fill="#75483b"/><path d="M105 94q5 6 10 0" fill="none" stroke="#75483b" stroke-width="2.5" stroke-linecap="round"/><path d="M72 134c0-26 16-41 38-41s38 15 38 41v29H72v-29Z" fill="#c78d5e"/><ellipse cx="110" cy="134" rx="17" ry="22" fill="#ecd2ae"/><path d="M80 120 61 148m79-28 19 28" stroke="#c78d5e" stroke-width="15" stroke-linecap="round"/><path d="M92 114q18 12 36 0" stroke="#638274" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="124" r="4" fill="#eccf94"/><path d="M84 162h19m14 0h19" stroke="#aa704a" stroke-width="13" stroke-linecap="round"/></svg>`,
    train: `<svg class="product-art" viewBox="0 0 250 190" aria-hidden="true"><ellipse cx="130" cy="157" rx="88" ry="9" fill="#304d40" opacity=".13"/><path d="M49 83h117v60H49z" fill="#587f6d"/><path d="M49 72h92l24 20H49V72Z" fill="#d49458"/><path d="M64 92h35v34H64zm49 0h35v34h-35z" fill="#e8d1a8"/><path d="M91 76V46h44v30" fill="#b64f3b"/><path d="M82 44h63l-10-15H93L82 44Z" fill="#d97450"/><rect x="102" y="52" width="23" height="24" fill="#e6c68e"/><circle cx="77" cy="145" r="16" fill="#354a3e"/><circle cx="77" cy="145" r="7" fill="#d9c8a7"/><circle cx="147" cy="145" r="16" fill="#354a3e"/><circle cx="147" cy="145" r="7" fill="#d9c8a7"/><path d="M173 104h29l11 39h-50v-28c0-6 4-11 10-11Z" fill="#d9a05f"/><circle cx="179" cy="145" r="13" fill="#354a3e"/><circle cx="179" cy="145" r="6" fill="#d9c8a7"/><path d="M48 108H29m19 12H25" stroke="#b4553e" stroke-width="5" stroke-linecap="round"/></svg>`,
    convertible: `<svg class="product-art" viewBox="0 0 250 190" aria-hidden="true"><ellipse cx="129" cy="155" rx="90" ry="10" fill="#463a31" opacity=".12"/><path d="m48 120 10-24c5-12 14-18 28-20l26-23h45c17 0 29 8 40 22l20 25c11 3 17 11 18 23l-1 16H47v-12c0-4 0-6 1-7Z" fill="#b74f3a"/><path d="m118 61-22 20h42V54h-14l-6 7Zm27-7v27h50l-14-18c-7-7-15-9-26-9h-10Z" fill="#f1d59d"/><path d="M46 115h39l9 18h86l9-18h31c8 4 12 11 12 19v10H46v-10c0-8 0-14 0-19Z" fill="#cf634a"/><circle cx="83" cy="148" r="21" fill="#274239"/><circle cx="83" cy="148" r="10" fill="#e5d3b5"/><circle cx="194" cy="148" r="21" fill="#274239"/><circle cx="194" cy="148" r="10" fill="#e5d3b5"/><path d="M58 106h26m133-1 18 4" stroke="#ffe8bd" stroke-width="4" stroke-linecap="round"/></svg>`
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const cart = new Set();
  const favorites = new Set();
  let activeCategory = "Todos";
  let activeQuery = "";
  let activeSort = "featured";
  let sessionToken = null;
  let toastTimeout;

  const categoryMap = { Jogos: "Jogos", Outros: "Jogos" };
  const emptyState = $("#empty-state");
  const productGrid = $("#product-grid");

  function productCard(item, index) {
    const safeTitle = escapeHtml(item.title);
    const favorite = favorites.has(item.id);
    const imageUrl = safeImageUrl(item.imageUrl);
    const image = imageUrl ? `<img class="product-photo" src="${escapeHtml(imageUrl)}" alt="Foto de ${safeTitle}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : "";
    const seller = item.seller;
    const sellerProfileUrl = seller?.id ? `./vendedor.html?id=${encodeURIComponent(seller.id)}` : "";
    const ratingCount = Number(seller?.ratingCount) || 0;
    const ratingAverage = Number(seller?.ratingAverage);
    const sellerRating = ratingCount > 0 && Number.isFinite(ratingAverage)
      ? `★ ${ratingAverage.toFixed(1)} · ${ratingCount} ${ratingCount === 1 ? "avaliação" : "avaliações"}`
      : "Sem avaliações";
    const sellerCard = sellerProfileUrl ? `<div class="product-seller">
        <a class="product-seller-name" href="${escapeHtml(sellerProfileUrl)}">Vendido por ${escapeHtml(seller.name)}</a>
        <span class="product-seller-reputation" aria-label="Reputação do vendedor: ${escapeHtml(sellerRating)}">${escapeHtml(sellerRating)}</span>
        <span class="product-seller-location">${escapeHtml(seller.city)}, ${escapeHtml(seller.state)}</span>
      </div>` : "";
    return `<article class="product-card" style="--product-bg:${item.tone}">
      <div class="product-media">
        <span class="product-badge">${item.isDemo ? "Demonstração" : escapeHtml(item.badge)}</span>
        <button class="favorite-button" type="button" data-favorite="${item.id}" aria-label="${favorite ? "Remover" : "Adicionar"} ${safeTitle} ${favorite ? "dos" : "aos"} favoritos" aria-pressed="${favorite}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 4.4-8.8 10.1-8.8 10.1S3.2 13.2 3.2 8.8A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8.8 1.7Z"/></svg></button>
        <div class="product-illustration${image ? " has-photo" : ""}">${image}${svgArt[item.type]}</div>
      </div>
      <div class="product-details">
        <div class="product-meta"><span>${escapeHtml(item.category)}</span><span>${escapeHtml(item.condition)}</span></div>
        <h3 class="product-title">${safeTitle}</h3><p class="product-subtitle">${escapeHtml(item.subtitle)}</p>
        ${sellerCard}
        <div class="product-bottom"><span class="product-price">${money.format(item.price)}</span><button class="add-button" type="button" data-add="${item.id}" aria-label="Adicionar ${safeTitle} à sacola">${cart.has(item.id) ? "Na sacola" : "Adicionar"}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14"/></svg></button></div>
      </div>
    </article>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function safeImageUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch { return null; }
  }

  function visibleProducts() {
    const normalized = activeQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const filtered = products.filter((item) => {
      const category = categoryMap[item.category] || item.category;
      const matchesCategory = activeCategory === "Todos" || category === activeCategory;
      const content = `${item.title} ${item.subtitle} ${item.category} ${item.condition} ${item.seller?.name || ""} ${item.seller?.city || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return matchesCategory && content.includes(normalized);
    });
    if (activeSort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    if (activeSort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }

  function renderProducts() {
    const items = visibleProducts();
    productGrid.setAttribute("aria-busy", "true");
    productGrid.innerHTML = items.map(productCard).join("");
    emptyState.hidden = items.length > 0;
    productGrid.hidden = items.length === 0;
    productGrid.setAttribute("aria-busy", "false");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
  }

  function updateBag() {
    const count = cart.size;
    $("#bag-count").textContent = String(count);
    $(".bag-button").setAttribute("aria-label", `Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`);
    renderProducts();
    renderCart();
  }

  function renderCart() {
    const items = products.filter((item) => cart.has(item.id));
    const cartItems = $("#cart-items");
    const isEmpty = items.length === 0;
    $("#cart-empty").hidden = !isEmpty;
    $("#cart-total").hidden = isEmpty;
    cartItems.innerHTML = items.map((item) => `<div class="cart-item" style="--product-bg:${item.tone}"><div class="cart-thumb">${svgArt[item.type]}</div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.condition)}</p><button class="cart-item-remove" type="button" data-remove="${item.id}">Remover</button></div><strong>${money.format(item.price)}</strong></div>`).join("");
    $("#cart-total-value").textContent = money.format(items.reduce((total, item) => total + item.price, 0));
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.headers || {})
      },
      credentials: "omit",
      cache: "no-store"
    });
    let body = {};
    try { body = await response.json(); } catch { /* resposta vazia */ }
    if (!response.ok) throw new Error(body.detail || body.message || "Não foi possível concluir agora. Tente novamente.");
    return body;
  }

  function setMessage(element, message, kind = "") {
    element.textContent = message;
    element.className = `form-message field-wide${kind ? ` is-${kind}` : ""}`;
  }

  function friendlyError(error, fallback) {
    if (error instanceof TypeError) return "Não foi possível conectar à API. Confira o endereço HTTPS e a configuração de CORS.";
    return error.message || fallback;
  }

  function toLiveListing(item) {
    const categories = { CARRINHOS: "Carrinhos", BONECAS: "Bonecas", JOGOS: "Jogos", OUTROS: "Outros" };
    const conditions = { EXCELENTE: "Excelente", MUITO_BOA: "Muito boa", BOA: "Boa", COM_MARCAS_DO_TEMPO: "Com marcas do tempo" };
    const art = { CARRINHOS: "car", BONECAS: "doll", JOGOS: "train", OUTROS: "bear" };
    const decade = item.decade ? `Década de ${item.decade}` : "Anúncio da comunidade";
    return {
      id: item.id, title: item.title, subtitle: `${decade} · ${categories[item.category] || "Brinquedo"}`,
      category: categories[item.category] || "Outros", price: Number(item.price),
      condition: conditions[item.condition] || "Sem informação", badge: "Comunidade",
      tone: "#e8dfcc", type: art[item.category] || "bear", imageUrl: item.imageUrl,
      seller: item.seller, isDemo: false
    };
  }

  async function loadCommunityListings() {
    if (!API_BASE_URL) return;
    try {
      const result = await request("/api/products");
      products = [...productSeeds.map((item) => ({ ...item, isDemo: true })), ...result.map(toLiveListing)];
      $("#demo-note").textContent = "Os cartões com a etiqueta “Demonstração” são itens ilustrativos. Os anúncios da comunidade são publicados pela API.";
      renderProducts();
    } catch {
      $("#demo-note").textContent = "Não foi possível carregar os anúncios da comunidade. A vitrine ilustrativa continua disponível.";
    }
  }

  function switchAccountTab(tab) {
    const isRegister = tab === "register";
    $("#account-form").hidden = !isRegister;
    $("#login-form").hidden = isRegister;
    $("#register-tab").classList.toggle("is-active", isRegister);
    $("#login-tab").classList.toggle("is-active", !isRegister);
    $("#register-tab").setAttribute("aria-selected", String(isRegister));
    $("#login-tab").setAttribute("aria-selected", String(!isRegister));
    $("#account-title").textContent = isRegister ? "Crie seu cantinho." : "Bom te ver de novo.";
    $(".modal-intro", $("#account-dialog")).textContent = isRegister
      ? "Seu e-mail, telefone e cidade ajudam a conectar você aos seus novos achados."
      : "Entre na sua conta para conversar sobre um anúncio ou publicar o seu brinquedo.";
  }

  const stateSelect = $("#account-form select[name='state']");
  stateNames.forEach((state) => stateSelect.add(new Option(state, state)));

  $("#current-year").textContent = String(new Date().getFullYear());
  $("#search-input").addEventListener("input", (event) => {
    activeQuery = event.currentTarget.value.trim();
    renderProducts();
  });
  $("#sort-select").addEventListener("change", (event) => { activeSort = event.currentTarget.value; renderProducts(); });
  $("#category-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    $$(".filter-chip", $("#category-filters")).forEach((chip) => {
      const isActive = chip === button;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    renderProducts();
  });
  productGrid.addEventListener("click", (event) => {
    const favButton = event.target.closest("[data-favorite]");
    const addButton = event.target.closest("[data-add]");
    if (favButton) {
      const { favorite: id } = favButton.dataset;
      if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
      renderProducts();
      showToast(favorites.has(id) ? "Guardado nos seus favoritos." : "Removido dos favoritos.");
    }
    if (addButton) {
      const { add: id } = addButton.dataset;
      if (cart.has(id)) { openDialog($("#cart-dialog")); return; }
      cart.add(id);
      updateBag();
      showToast("Achado adicionado à sua sacola.");
    }
  });
  productGrid.addEventListener("error", (event) => {
    if (!event.target.matches(".product-photo")) return;
    event.target.closest(".product-illustration")?.classList.remove("has-photo");
    event.target.remove();
  }, true);
  $("#clear-filters").addEventListener("click", () => {
    activeCategory = "Todos"; activeQuery = ""; activeSort = "featured";
    $("#search-input").value = ""; $("#sort-select").value = "featured";
    $$(".filter-chip").forEach((chip, index) => { chip.classList.toggle("is-active", index === 0); chip.setAttribute("aria-pressed", String(index === 0)); });
    renderProducts();
  });

  $("#menu-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    button.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    $("#primary-nav").classList.toggle("is-open", !isOpen);
  });
  $("#primary-nav").addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      $("#primary-nav").classList.remove("is-open");
      $("#menu-toggle").setAttribute("aria-expanded", "false");
      $("#menu-toggle").setAttribute("aria-label", "Abrir menu");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault(); $("#search-input").focus();
    }
  });

  $$('[data-open-account]').forEach((button) => button.addEventListener("click", () => {
    if (sessionToken && button.classList.contains("account-button")) {
      sessionToken = null;
      $$('[data-open-account]').forEach((accountButton) => {
        accountButton.textContent = accountButton.classList.contains("account-button") ? "Entrar" : "Criar uma conta";
      });
      showToast("Você saiu da sua conta.");
      return;
    }
    switchAccountTab(button.dataset.openAccount || "register");
    openDialog($("#account-dialog"));
  }));
  $$("[data-account-tab]").forEach((button) => button.addEventListener("click", () => switchAccountTab(button.dataset.accountTab)));
  $$('[data-open-listing]').forEach((button) => button.addEventListener("click", () => openDialog($("#listing-dialog"))));
  $("[data-open-cart]").addEventListener("click", () => { renderCart(); openDialog($("#cart-dialog")); });
  $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));
  $$('dialog').forEach((dialog) => dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));

  $("#account-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#account-message");
    if (!form.reportValidity()) return;
    if (!API_BASE_URL) {
      setMessage(message, "Cadastro em modo de demonstração: a API ainda não está conectada. Seus dados não foram enviados nem armazenados.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.password !== data.confirmPassword) {
      setMessage(message, "As senhas não conferem.", "error");
      return;
    }
    delete data.confirmPassword;
    delete data.consent;
    const button = form.querySelector("button[type='submit']");
    button.disabled = true; button.textContent = "Criando conta…";
    try {
      const result = await request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
      sessionToken = result.accessToken;
      $$('[data-open-account]').forEach((accountButton) => { accountButton.textContent = "Sair da conta"; });
      setMessage(message, "Conta criada e entrada realizada. Você já pode publicar um anúncio.", "success");
      form.reset();
    } catch (error) { setMessage(message, friendlyError(error, "Não foi possível criar a conta."), "error"); }
    finally { button.disabled = false; button.innerHTML = 'Criar minha conta <span aria-hidden="true">↗</span>'; }
  });

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#login-message");
    if (!form.reportValidity()) return;
    if (!API_BASE_URL) {
      setMessage(message, "A API ainda não está conectada; sua entrada não foi enviada.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector("button[type='submit']");
    button.disabled = true; button.textContent = "Entrando…";
    try {
      const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
      sessionToken = result.accessToken;
      $$('[data-open-account]').forEach((accountButton) => { accountButton.textContent = "Sair da conta"; });
      setMessage(message, "Entrada realizada. Você já pode criar um anúncio.", "success");
      form.reset();
    } catch (error) { setMessage(message, friendlyError(error, "Não foi possível entrar na conta."), "error"); }
    finally { button.disabled = false; button.innerHTML = 'Entrar na minha conta <span aria-hidden="true">↗</span>'; }
  });

  $("#listing-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#listing-message");
    if (!form.reportValidity()) return;
    if (!API_BASE_URL) {
      setMessage(message, "Anúncio em modo de demonstração: conecte a API da loja para publicar esta peça. Seus dados não foram enviados.", "error");
      return;
    }
    if (!sessionToken) {
      setMessage(message, "Entre na sua conta para publicar um anúncio.", "error");
      switchAccountTab("login");
      openDialog($("#account-dialog"));
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const category = { Carrinhos: "CARRINHOS", Bonecas: "BONECAS", Jogos: "JOGOS", Outros: "OUTROS" }[values.category];
    const condition = values.condition.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, "_");
    const payload = {
      title: values.title.trim(), category, decade: values.decade ? Number(values.decade) : null,
      condition, price: Number(values.price), description: values.description.trim(), imageUrl: values.imageUrl || null
    };
    const button = form.querySelector("button[type='submit']");
    button.disabled = true; button.textContent = "Publicando…";
    try {
      const result = await request("/api/products", { method: "POST", body: JSON.stringify(payload) });
      const listing = result.product;
      if (listing) {
        products.unshift(toLiveListing(listing));
        renderProducts();
      }
      setMessage(message, "Anúncio publicado. Obrigado por passar essa memória adiante.", "success");
      form.reset();
    } catch (error) { setMessage(message, friendlyError(error, "Não foi possível publicar o anúncio."), "error"); }
    finally { button.disabled = false; button.innerHTML = 'Enviar anúncio <span aria-hidden="true">↗</span>'; }
  });

  $("#cart-items").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    cart.delete(button.dataset.remove);
    updateBag();
  });
  $("#checkout-button").addEventListener("click", () => {
    $("#cart-message").textContent = "Nenhuma compra foi realizada. Pagamentos e contato com vendedores ainda não estão habilitados nesta demonstração.";
    $("#cart-message").classList.add("is-error");
  });
  $$('[data-newsletter]').forEach((button) => button.addEventListener("click", () => showToast("Em breve: novidades sobre a comunidade Boas Memórias.")));

  renderProducts();
  renderCart();
  loadCommunityListings();
})();
