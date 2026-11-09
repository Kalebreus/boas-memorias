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
  const profileCard = $("#seller-profile-card");
  const profileForm = $("#seller-profile-form");
  const accessMessage = $("#profile-access-message");
  const accessLink = $("#profile-access-link");
  const notice = $("#api-notice");
  const nextStep = $("#seller-next-step");
  let accessToken = sessionStorage.getItem(tokenKey);
  let profileComplete = false;

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

  function setBusy(busy) {
    const button = profileForm.querySelector("button[type='submit']");
    if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent.trim();
    button.disabled = busy;
    button.textContent = busy ? "Salvando perfil…" : button.dataset.idleLabel;
  }

  function clearSession() {
    sessionStorage.removeItem(tokenKey);
    accessToken = null;
    profileComplete = false;
    profileCard.hidden = true;
    nextStep.hidden = true;
    accessMessage.textContent = "Entre na sua conta para carregar ou editar seu perfil.";
    accessLink.hidden = false;
  }

  async function loadProfile() {
    try {
      const profile = await request("/api/sellers/me");
      ["bio", "whatsapp", "instagramUrl", "facebookUrl", "tiktokUrl", "youtubeUrl", "xUrl", "linkedinUrl", "otherSocialUrls", "websiteUrl"]
        .forEach((name) => { profileForm.elements[name].value = profile[name] || ""; });
      $("#seller-profile-consent").checked = Boolean(profile.complete);
      profileComplete = Boolean(profile.complete);
      message($("#seller-profile-message"), profileComplete
        ? "Perfil salvo. Estes são os dados que você autorizou a exibir."
        : "Complete os campos obrigatórios e autorize a exibição para liberar seus anúncios.");
      nextStep.hidden = !profileComplete;
      accessMessage.textContent = "Conta conectada. Esta página gerencia apenas seu perfil público.";
      accessLink.hidden = true;
      profileCard.hidden = false;
    } catch (error) {
      if (error.status === 401) clearSession();
      message($("#seller-profile-message"), error.message || "Não foi possível carregar seu perfil.", "error");
    }
  }

  $("#current-year").textContent = String(new Date().getFullYear());
  profileForm.querySelector("button[type='submit']").dataset.idleLabel = "Salvar perfil público";

  if (!API_BASE_URL) {
    notice.classList.add("is-demo");
    notice.querySelector("strong").textContent = "Perfil em demonstração";
    notice.querySelector("p").textContent = "A API ainda não está conectada. Nenhum dado será salvo; não informe dados reais até o cadastro estar ativado.";
    accessMessage.textContent = "O cadastro está em demonstração. Entre quando a API estiver conectada para carregar e salvar seu perfil.";
  } else if (!accessToken) {
    profileCard.hidden = true;
    accessMessage.textContent = "Entre ou crie uma conta na página separada para editar seu perfil.";
  } else {
    notice.classList.remove("is-demo");
    notice.classList.add("is-live");
    notice.querySelector("strong").textContent = "Perfil do vendedor";
    notice.querySelector("p").textContent = "Esta página contém os dados públicos do vendedor; conta e anúncios ficam em telas próprias.";
    loadProfile();
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;
    if (!["instagramUrl", "facebookUrl", "tiktokUrl", "youtubeUrl", "xUrl", "linkedinUrl", "otherSocialUrls"]
      .some((name) => String(profileForm.elements[name].value || "").trim())) {
      message($("#seller-profile-message"), "Informe ao menos uma rede social pública.", "error");
      return;
    }
    if (!API_BASE_URL || !accessToken) {
      message($("#seller-profile-message"), "Perfil não salvo: conecte a API e entre na sua conta de vendedor.", "error");
      return;
    }
    const values = Object.fromEntries(new FormData(profileForm).entries());
    const payload = {
      bio: values.bio.trim(), whatsapp: values.whatsapp.trim(),
      instagramUrl: values.instagramUrl.trim(), facebookUrl: values.facebookUrl.trim(),
      tiktokUrl: values.tiktokUrl.trim(), youtubeUrl: values.youtubeUrl.trim(),
      xUrl: values.xUrl.trim(), linkedinUrl: values.linkedinUrl.trim(),
      otherSocialUrls: values.otherSocialUrls.trim(), websiteUrl: values.websiteUrl.trim(),
      publicContactConsent: Boolean(values.publicContactConsent)
    };
    setBusy(true);
    try {
      const profile = await request("/api/sellers/me/profile", { method: "PUT", body: JSON.stringify(payload) });
      profileComplete = Boolean(profile.complete);
      message($("#seller-profile-message"), "Perfil público salvo. Agora você pode cadastrar seus produtos.", "success");
      nextStep.hidden = !profileComplete;
    } catch (error) {
      if (error.status === 401) clearSession();
      message($("#seller-profile-message"), error.message || "Não foi possível salvar o perfil.", "error");
    } finally { setBusy(false); }
  });

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
