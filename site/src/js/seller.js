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
  const imagesInput = $("#product-images");
  const videoInput = $("#product-video");
  const mediaFiles = $("#seller-media-files");
  const mediaMessage = $("#seller-media-message");
  const previewThumbnails = $("#preview-thumbnails");
  const previewVideoWrap = $("#preview-video-wrap");
  const previewVideo = $("#preview-video");
  const maxPhotos = 6;
  const maxPhotoBytes = 10 * 1024 * 1024;
  const maxVideoBytes = 50 * 1024 * 1024;
  const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);
  const selectedPhotos = [];
  let selectedVideo = null;
  let activePhotoIndex = 0;
  let accessToken = null;

  function message(target, text, kind = "") {
    target.textContent = text;
    target.classList.toggle("is-error", kind === "error");
    target.classList.toggle("is-success", kind === "success");
  }

  function updateMediaPreview() {
    if (selectedPhotos.length) {
      activePhotoIndex = Math.min(activePhotoIndex, selectedPhotos.length - 1);
      $("#preview-image").src = selectedPhotos[activePhotoIndex].url;
      $("#preview-image").hidden = false;
      $("#preview-placeholder").hidden = true;
      previewThumbnails.replaceChildren(...selectedPhotos.map((photo, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `seller-preview-thumb${index === activePhotoIndex ? " is-active" : ""}`;
        button.dataset.previewPhoto = String(index);
        button.setAttribute("aria-label", `Mostrar foto ${index + 1}: ${photo.file.name}`);
        button.setAttribute("aria-pressed", String(index === activePhotoIndex));
        const image = document.createElement("img");
        image.src = photo.url;
        image.alt = "";
        button.append(image);
        return button;
      }));
      previewThumbnails.hidden = selectedPhotos.length < 2;
    } else {
      $("#preview-image").removeAttribute("src");
      $("#preview-image").hidden = true;
      $("#preview-placeholder").hidden = false;
      previewThumbnails.replaceChildren();
      previewThumbnails.hidden = true;
      activePhotoIndex = 0;
    }

    if (selectedVideo) {
      if (previewVideo.src !== selectedVideo.url) previewVideo.src = selectedVideo.url;
      previewVideoWrap.hidden = false;
    } else {
      previewVideo.pause();
      previewVideo.removeAttribute("src");
      previewVideo.load();
      previewVideoWrap.hidden = true;
    }
  }

  function renderSelectedMedia() {
    const rows = selectedPhotos.map((photo, index) => {
      const row = document.createElement("div");
      row.className = "seller-media-file";
      const thumbnail = document.createElement("img");
      thumbnail.src = photo.url;
      thumbnail.alt = "";
      const name = document.createElement("span");
      name.className = "seller-media-file-name";
      name.textContent = photo.file.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "seller-media-file-remove";
      remove.dataset.removePhoto = String(index);
      remove.setAttribute("aria-label", `Remover foto ${photo.file.name}`);
      remove.textContent = "Remover";
      row.append(thumbnail, name, remove);
      return row;
    });
    if (selectedVideo) {
      const row = document.createElement("div");
      row.className = "seller-media-file";
      const icon = document.createElement("span");
      icon.className = "seller-media-file-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "▶";
      const name = document.createElement("span");
      name.className = "seller-media-file-name";
      name.textContent = selectedVideo.file.name;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "seller-media-file-remove";
      remove.dataset.removeVideo = "true";
      remove.setAttribute("aria-label", `Remover vídeo ${selectedVideo.file.name}`);
      remove.textContent = "Remover";
      row.append(icon, name, remove);
      rows.push(row);
    }
    mediaFiles.replaceChildren(...rows);
    updateMediaPreview();
  }

  function addPhotos(files) {
    if (!files.length) return;
    if (selectedPhotos.length + files.length > maxPhotos) {
      message(mediaMessage, `Você pode selecionar até ${maxPhotos} fotos. Remova uma foto para adicionar outra.`, "error");
      return;
    }
    if (files.some((file) => !allowedPhotoTypes.has(file.type))) {
      message(mediaMessage, "Escolha fotos JPG, PNG ou WebP.", "error");
      return;
    }
    if (files.some((file) => file.size > maxPhotoBytes)) {
      message(mediaMessage, "Cada foto pode ter no máximo 10 MB.", "error");
      return;
    }
    files.forEach((file) => selectedPhotos.push({ file, url: URL.createObjectURL(file) }));
    message(mediaMessage, `${selectedPhotos.length} ${selectedPhotos.length === 1 ? "foto selecionada" : "fotos selecionadas"}.`, "success");
    renderSelectedMedia();
  }

  function setVideo(file) {
    if (!file) return;
    if (!allowedVideoTypes.has(file.type)) {
      message(mediaMessage, "Escolha um vídeo MP4 ou WebM.", "error");
      return;
    }
    if (file.size > maxVideoBytes) {
      message(mediaMessage, "O vídeo pode ter no máximo 50 MB.", "error");
      return;
    }
    if (selectedVideo) URL.revokeObjectURL(selectedVideo.url);
    selectedVideo = { file, url: URL.createObjectURL(file) };
    message(mediaMessage, "Vídeo selecionado. Confira a prévia antes de continuar.", "success");
    renderSelectedMedia();
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
    notice.querySelector("p").textContent = "Revise os detalhes e publique quando estiver satisfeito. O servidor atual ainda não armazena fotos ou vídeos selecionados.";
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
    notice.querySelector("p").textContent = "Sua conta foi desconectada. Entre novamente quando quiser publicar. Mídias selecionadas ainda não são enviadas ao servidor.";
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
  imagesInput.addEventListener("change", () => {
    addPhotos(Array.from(imagesInput.files || []));
    imagesInput.value = "";
  });
  videoInput.addEventListener("change", () => {
    setVideo(videoInput.files?.[0]);
    videoInput.value = "";
  });
  mediaFiles.addEventListener("click", (event) => {
    const removePhoto = event.target.closest("[data-remove-photo]");
    if (removePhoto) {
      const index = Number(removePhoto.dataset.removePhoto);
      URL.revokeObjectURL(selectedPhotos[index].url);
      selectedPhotos.splice(index, 1);
      renderSelectedMedia();
      message(mediaMessage, `${selectedPhotos.length} ${selectedPhotos.length === 1 ? "foto selecionada" : "fotos selecionadas"}.`, "success");
      return;
    }
    if (event.target.closest("[data-remove-video]")) {
      URL.revokeObjectURL(selectedVideo.url);
      selectedVideo = null;
      renderSelectedMedia();
      message(mediaMessage, "Vídeo removido da prévia.", "success");
    }
  });
  previewThumbnails.addEventListener("click", (event) => {
    const thumbnail = event.target.closest("[data-preview-photo]");
    if (!thumbnail) return;
    activePhotoIndex = Number(thumbnail.dataset.previewPhoto);
    updateMediaPreview();
  });
  $("#preview-image").addEventListener("error", () => {
    $("#preview-image").hidden = true;
    $("#preview-image").removeAttribute("src");
    $("#preview-placeholder").hidden = false;
  });
  window.addEventListener("pagehide", () => {
    selectedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    if (selectedVideo) URL.revokeObjectURL(selectedVideo.url);
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
    notice.querySelector("p").textContent = "Entre na sua conta ou crie uma para publicar. A API ainda não recebe fotos ou vídeos; os arquivos selecionados servem apenas para prévia.";
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
    if (!productForm.reportValidity()) return;
    if (!API_BASE_URL) {
      message(productMessage, "Prévia pronta. O anúncio e as mídias não foram enviados nem salvos; os arquivos ficam apenas neste navegador.", "error");
      updatePreview();
      return;
    }
    if (selectedPhotos.length || selectedVideo) {
      message(productMessage, "A API atual não aceita arquivos de foto ou vídeo. Eles aparecem somente na prévia e não serão publicados.", "error");
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
      description: data.description.trim(), imageUrl: null
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
