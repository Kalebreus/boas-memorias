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
  const categories = { CARRINHOS: "Carrinhos", BONECAS: "Bonecas", JOGOS: "Jogos e brinquedos", OUTROS: "Outros" };
  const conditions = { EXCELENTE: "Excelente", MUITO_BOA: "Muito boa", BOA: "Boa", COM_MARCAS_DO_TEMPO: "Com marcas do tempo" };
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const productForm = $("#product-form");
  const notice = $("#api-notice");
  const productMessage = $("#product-message");
  const sellerAccessMessage = $("#seller-access-message");
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
  let accessToken = sessionStorage.getItem("bm_seller_access_token");
  let sellerProfileComplete = false;

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
  function showRegistrationMessage(text) {
    message(productMessage, text, "error");
    const link = document.createElement("a");
    link.href = "./cadastro-vendedor.html?next=anunciar.html";
    link.textContent = " Ir para cadastro do vendedor";
    productMessage.append(link);
  }

  if (!API_BASE_URL) {
    notice.classList.add("is-demo");
    notice.querySelector("strong").textContent = "Prévia de demonstração";
    notice.querySelector("p").textContent = "A API ainda não está conectada. O anúncio e as mídias ficam apenas como prévia neste navegador.";
    productButton.dataset.idleLabel = "Preparar prévia";
    productButton.textContent = productButton.dataset.idleLabel;
    sellerAccessMessage.textContent = "O cadastro do vendedor fica em uma página separada. A demonstração ainda não salva contas ou perfis.";
  } else {
    notice.classList.remove("is-demo");
    notice.classList.add("is-live");
    notice.querySelector("strong").textContent = "Publicação disponível";
    notice.querySelector("p").textContent = "Anúncios publicados aparecem na vitrine. A API atual ainda não armazena fotos ou vídeos.";
    productButton.dataset.idleLabel = "Publicar anúncio";
    productButton.textContent = productButton.dataset.idleLabel;
    if (!accessToken) sellerAccessMessage.textContent = "Entre na sua conta e complete o perfil do vendedor antes de publicar.";
  }

  async function loadSellerStatus() {
    if (!API_BASE_URL || !accessToken) return;
    try {
      const profile = await request("/api/sellers/me");
      sellerProfileComplete = Boolean(profile.complete);
      sellerAccessMessage.textContent = sellerProfileComplete
        ? "Conta conectada e perfil de vendedor completo. Seus dados continuam na página de cadastro."
        : "Complete seus dados de vendedor na página separada antes de publicar.";
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem("bm_seller_access_token");
        accessToken = null;
        sellerAccessMessage.textContent = "Sua sessão terminou. Entre novamente na página de cadastro.";
      } else {
        sellerAccessMessage.textContent = error.message || "Não foi possível conferir seu perfil de vendedor.";
      }
    }
  }
  loadSellerStatus();
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
      showRegistrationMessage("Entre ou cadastre sua conta de vendedor para publicar.");
      return;
    }
    if (!sellerProfileComplete) {
      showRegistrationMessage("Complete seu perfil de vendedor na página separada antes de anunciar.");
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
      const catalogLink = document.createElement("a");
      catalogLink.href = "./index.html#catalogo";
      catalogLink.textContent = " Ver em Explorar brinquedos";
      productMessage.append(catalogLink);
      if (result.product?.title) {
        productForm.reset();
        updatePreview();
      }
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem("bm_seller_access_token");
        accessToken = null;
        sellerAccessMessage.textContent = "Sua sessão terminou. Entre novamente na página de cadastro.";
        showRegistrationMessage("Sua sessão terminou. Entre novamente para concluir a publicação.");
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
