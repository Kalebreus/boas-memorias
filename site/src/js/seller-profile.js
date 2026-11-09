(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const apiBase = (() => {
    const value = document.documentElement.dataset.apiBase?.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      return url.protocol === "https:" || local ? url.href.replace(/\/+$/, "") : "";
    } catch { return ""; }
  })();
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const categories = { CARRINHOS: "Carrinhos", BONECAS: "Bonecas", JOGOS: "Jogos e brinquedos", OUTROS: "Outros" };
  const conditions = { EXCELENTE: "Excelente", MUITO_BOA: "Muito boa", BOA: "Boa", COM_MARCAS_DO_TEMPO: "Com marcas do tempo" };
  const profileLoading = $("#profile-loading");
  const profileCard = $("#public-seller-card");
  const listingsSection = $("#public-seller-listings");
  const profileError = $("#profile-error");

  function safeHttps(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname ? url.href : null;
    } catch { return null; }
  }

  function makeText(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function renderSocialLinks(links) {
    const container = $("#public-social-links");
    container.replaceChildren();
    (Array.isArray(links) ? links : []).forEach((link) => {
      const url = safeHttps(link.url);
      if (!url) return;
      const anchor = makeText("a", "public-social-link", link.network || "Rede social");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer nofollow";
      container.append(anchor);
    });
  }

  function renderListings(listings) {
    const grid = $("#profile-listing-grid");
    grid.replaceChildren();
    (Array.isArray(listings) ? listings : []).forEach((listing) => {
      const card = document.createElement("article");
      card.className = "profile-listing-card";
      const media = document.createElement("div");
      media.className = "profile-listing-image";
      const imageUrl = safeHttps(listing.imageUrl);
      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = `Foto de ${listing.title || "brinquedo antigo"}`;
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        media.append(image);
      } else {
        media.append(makeText("span", "", "✳"));
      }
      const copy = document.createElement("div");
      copy.className = "profile-listing-copy";
      copy.append(makeText("h3", "", listing.title || "Brinquedo antigo"));
      const details = [categories[listing.category] || "Brinquedo", conditions[listing.condition] || "Conservação"];
      if (listing.decade) details.push(`Década de ${listing.decade}`);
      copy.append(makeText("p", "", details.join(" · ")));
      const price = Number(listing.price);
      copy.append(makeText("strong", "", Number.isFinite(price) ? money.format(price) : "Consulte o vendedor"));
      card.append(media, copy);
      grid.append(card);
    });
    $("#profile-no-listings").hidden = grid.children.length > 0;
  }

  function renderProfile(profile) {
    const name = String(profile.name || "Vendedor").trim();
    $("#public-seller-name").textContent = name;
    $("#public-seller-avatar").textContent = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR");
    $("#public-seller-location").textContent = [profile.city, profile.state].filter(Boolean).join(" · ");
    $("#public-seller-bio").textContent = profile.bio || "Este vendedor ainda não adicionou um resumo.";

    const ratingCount = Number(profile.ratingCount) || 0;
    const ratingAverage = Number(profile.ratingAverage);
    if (ratingCount > 0 && Number.isFinite(ratingAverage)) {
      const rounded = Math.max(0, Math.min(5, ratingAverage));
      const fullStars = Math.round(rounded);
      $("#seller-rating-stars").textContent = `${"★ ".repeat(fullStars)}${"☆ ".repeat(5 - fullStars)}`.trim();
      $("#seller-rating-value").textContent = `${rounded.toFixed(1)} de 5`;
      $("#seller-rating-count").textContent = `${ratingCount} ${ratingCount === 1 ? "avaliação" : "avaliações"}`;
    } else {
      $("#seller-rating-stars").textContent = "☆ ☆ ☆ ☆ ☆";
      $("#seller-rating-value").textContent = "Sem avaliações";
      $("#seller-rating-count").textContent = "A plataforma ainda não registra compras confirmadas para calcular uma nota.";
    }

    const memberSince = profile.memberSince ? new Date(profile.memberSince) : null;
    $("#public-seller-since").textContent = memberSince && !Number.isNaN(memberSince.valueOf())
      ? `Na comunidade desde ${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(memberSince)}`
      : "Membro da comunidade Boas Memórias";

    const digits = String(profile.whatsapp || "").replace(/\D/g, "");
    if (digits.length < 10) throw new Error("O WhatsApp público deste perfil não está disponível.");
    const whatsappNumber = digits.length <= 11 ? `55${digits}` : digits;
    const whatsapp = $("#public-whatsapp");
    whatsapp.href = `https://wa.me/${whatsappNumber}`;
    whatsapp.setAttribute("aria-label", `Conversar com ${name} pelo WhatsApp; o contato abrirá em outra janela`);
    renderSocialLinks(profile.socialLinks);
    renderListings(profile.listings);
    profileCard.hidden = false;
    listingsSection.hidden = false;
  }

  async function loadProfile() {
    if (!apiBase) throw new Error("Os perfis públicos aparecem quando a API da loja estiver hospedada e conectada à vitrine.");
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("O endereço deste perfil está incompleto ou inválido.");
    const response = await fetch(`${apiBase}/api/sellers/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" }, credentials: "omit", cache: "no-store"
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || body.message || "Este perfil não está disponível no momento.");
    renderProfile(body);
  }

  $("#current-year").textContent = String(new Date().getFullYear());
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

  loadProfile().then(() => {
    profileLoading.hidden = true;
  }).catch((error) => {
    profileLoading.hidden = true;
    $("#profile-error-message").textContent = error.message || "Não foi possível carregar este perfil.";
    profileError.hidden = false;
  });
})();
