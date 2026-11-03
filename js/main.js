document.documentElement.classList.add("js");

// Preferência "Reduzir movimento" do sistema (vídeo, carrossel e entrada dos cards)
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Barra de navegação: na página inicial fica oculta no topo e aparece
// quando a pessoa rola a página (passando do logo acima do card).
const header = document.querySelector(".site-header");
const heroLogo = document.querySelector(".hero__logo");

if (header && heroLogo) {
  let ticking = false;
  const updateHeader = () => {
    ticking = false;
    const pastLogo = heroLogo.getBoundingClientRect().bottom < 0;
    header.classList.toggle("is-hidden", !pastLogo);
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  updateHeader();
}

// Menu recolhível em telas estreitas
const navToggle = document.querySelector(".site-nav__toggle");
const navList = document.querySelector(".site-nav__list");

if (navToggle && navList) {
  const setNav = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    navList.classList.toggle("is-open", open);
  };

  navToggle.addEventListener("click", () => {
    setNav(!navList.classList.contains("is-open"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navList.classList.contains("is-open")) {
      setNav(false);
      navToggle.focus();
    }
  });
}

// Vídeo em reprodução automática, mudo e sem controles visíveis.
// HIG: toque/clique pausa ou retoma; "Reduzir movimento" mantém o vídeo
// parado no pôster; fora da tela o vídeo pausa (economia de bateria).
document.querySelectorAll(".feature__media").forEach((media) => {
  const video = media.querySelector(".feature__video");
  const toggle = media.querySelector(".feature__toggle");
  if (!video || !toggle) return;

  let pausedByUser = reduceMotion.matches;
  let isVisible = true;

  const sync = () => {
    if (!pausedByUser && isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    toggle.setAttribute("aria-label", pausedByUser ? "Reproduzir vídeo" : "Pausar vídeo");
  };

  if (reduceMotion.matches) video.removeAttribute("autoplay");

  toggle.addEventListener("click", () => {
    pausedByUser = !pausedByUser;
    sync();
  });

  reduceMotion.addEventListener("change", (event) => {
    pausedByUser = event.matches;
    sync();
  });

  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    sync();
  }).observe(media);

  sync();
});

// Carrossel: rolagem nativa + arraste com mouse + indicador de progresso
document.querySelectorAll(".carousel").forEach((carousel) => {
  const viewport = carousel.querySelector(".carousel__viewport");
  const progress = carousel.querySelector(".carousel__progress");
  const thumb = carousel.querySelector(".carousel__progress-thumb");
  if (!viewport) return;

  // Indicador acompanha a rolagem em tempo real (inclusive durante o arraste)
  let frame = 0;
  const updateProgress = () => {
    frame = 0;
    const { scrollLeft, scrollWidth, clientWidth } = viewport;
    const maxScroll = scrollWidth - clientWidth;
    carousel.classList.toggle("is-static", maxScroll <= 1);
    if (!progress || !thumb || maxScroll <= 1) return;

    const trackWidth = progress.clientWidth;
    const thumbWidth = Math.max(trackWidth * (clientWidth / scrollWidth), 32);
    const ratio = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
    thumb.style.setProperty("--thumb-size", `${thumbWidth}px`);
    thumb.style.setProperty("--thumb-offset", `${ratio * (trackWidth - thumbWidth)}px`);
  };
  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateProgress);
  };

  viewport.addEventListener("scroll", requestUpdate, { passive: true });
  new ResizeObserver(requestUpdate).observe(viewport);
  updateProgress();

  // Arraste com mouse (toque e trackpad já rolam nativamente)
  let startX = 0;
  let startScroll = 0;
  let isDown = false;
  let dragged = false;

  const nearestSnap = () => {
    const padding = parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0;
    const viewportLeft = viewport.getBoundingClientRect().left;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const targets = [maxScroll];
    viewport.querySelectorAll(".carousel__track > li:not([hidden])").forEach((card) => {
      targets.push(viewport.scrollLeft + card.getBoundingClientRect().left - viewportLeft - padding);
    });
    let best = viewport.scrollLeft;
    let bestDistance = Infinity;
    targets.forEach((raw) => {
      const target = Math.min(Math.max(raw, 0), maxScroll);
      const distance = Math.abs(target - viewport.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = target;
      }
    });
    return best;
  };

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    const target = nearestSnap();
    const restoreSnap = () => viewport.classList.remove("is-dragging");
    viewport.scrollTo({ left: target, behavior: reduceMotion.matches ? "auto" : "smooth" });
    if ("onscrollend" in window) {
      viewport.addEventListener("scrollend", restoreSnap, { once: true });
    } else {
      setTimeout(restoreSnap, 400);
    }
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    isDown = true;
    dragged = false;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!isDown) return;
    const dx = event.clientX - startX;
    if (!dragged && Math.abs(dx) > 4) {
      dragged = true;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
    }
    if (dragged) viewport.scrollLeft = startScroll - dx;
  });

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  // Evita abrir um link ao soltar o arraste
  viewport.addEventListener("click", (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }
  }, true);
});

// Entrada dos cards: sobem e aparecem quando entram na tela (uma vez).
// Nos carrosséis isso vale também para a rolagem horizontal: cada card
// sobe ao entrar na área visível do carrossel. Cards que aparecem juntos
// entram em cascata curta (80 ms entre vizinhos).
if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const STAGGER = 80;
  const MAX_STAGGER = 320;

  const reveal = (entries, observer) => {
    let index = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      card.style.transitionDelay = `${Math.min(index * STAGGER, MAX_STAGGER)}ms`;
      card.addEventListener("transitionend", () => {
        card.style.transitionDelay = "";
      }, { once: true });
      card.classList.add("is-visible");
      observer.unobserve(card);
      index += 1;
    });
  };

  const observe = (cards, options) => {
    const observer = new IntersectionObserver(reveal, options);
    cards.forEach((card) => {
      card.classList.add("reveal");
      observer.observe(card);
    });
  };

  observe(document.querySelectorAll(".journey__step, .closing__card"), { threshold: 0.15 });

  // Carrosséis: a raiz é o próprio carrossel, então só conta o que está
  // dentro da faixa visível dele. Nada é revelado antes de o carrossel
  // passar de 90% da altura da tela.
  document.querySelectorAll(".carousel__viewport").forEach((viewport) => {
    const cards = viewport.querySelectorAll(".carousel__track > li:not([hidden])");
    const observer = new IntersectionObserver((entries) => {
      if (viewport.getBoundingClientRect().top > window.innerHeight * 0.9) return;
      reveal(entries, observer);
    }, { root: viewport, threshold: 0.15 });

    // A raiz do carrossel não enxerga a rolagem vertical da página: quando
    // a seção entra na tela, reavalia os cards já visíveis no carrossel.
    new IntersectionObserver(([entry], pageObserver) => {
      if (!entry.isIntersecting) return;
      pageObserver.disconnect();
      cards.forEach((card) => {
        if (card.classList.contains("is-visible")) return;
        observer.unobserve(card);
        observer.observe(card);
      });
    }, { rootMargin: "0px 0px -10% 0px" }).observe(viewport);

    cards.forEach((card) => {
      card.classList.add("reveal");
      observer.observe(card);
    });
  });
}
