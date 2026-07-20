/* ============================================================
   Quant Forensics — JS de la landing.
   FUENTE ÚNICA DE VERDAD del precio y del checkout: QF_CONFIG.
   No guardar secretos aquí (esto es público). Sin dependencias.
   ============================================================ */
window.QF_CONFIG = Object.freeze({
  /* CORE — los 15 agentes forenses (análisis manual por archivos). */
  CHECKOUT_URL: "https://buy.stripe.com/eVq28r9LRfXY7gj58z9fW09", // Stripe Payment Link (cobra 9,49€, confirmado)
  PRICE_DISPLAY: "9,49€",
  PRICE_CENTS: 949,

  /* PRO — Core + MT5 Bridge Playbook (guía avanzada + kit). LANZAMIENTO con ENTREGA MANUAL.
     Payment Link LIVE verificado (read-only): javiperezbuilds · "Core + MT5 Bridge Playbook"
     · 24,99€ EUR · pago único · email obligatorio · sin suscripción/trial · != link del Core.
     La entrega es MANUAL (no hay webhook ni descarga automática). */
  PRO_CHECKOUT_URL: "https://buy.stripe.com/eVq9AT3nt9zAasv0Sj9fW0K",
  PRO_PRICE_DISPLAY: "24,99€",
  PRO_PRICE_CENTS: 2499,

  /* Monetag: desactivado por defecto. Solo se activa si ENABLED === true Y hay ZONE_ID.
     Reglas: sin popunder/push/interstitial, nunca en checkout, tras el contenido principal,
     con dimensiones reservadas (sin layout shift). No cargar nada mientras esté desactivado. */
  MONETAG_ENABLED: false,
  MONETAG_ZONE_ID: ""
});

(function () {
  "use strict";

  var config = window.QF_CONFIG;

  /* ---- año del footer ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- helpers ---- */
  function validHttpsUrl(value) {
    try { return new URL(value).protocol === "https:"; } catch (e) { return false; }
  }

  /* ---- tracking: stub centralizado sin PII (mismo patrón que javiperezbuilds).
     Empuja a dataLayer si existe y hace console.debug en modo debug. Cuando se conecte
     un analytics real, se sustituye SOLO el cuerpo de esta función. Nunca envía datos
     introducidos por el comprador. ---- */
  window.QF_TRACK = function (eventName, data) {
    try {
      var payload = Object.assign({ event: eventName }, data || {});
      if (window.dataLayer && typeof window.dataLayer.push === "function") {
        window.dataLayer.push(payload);
      }
      var debug = location.hostname === "localhost" || location.hostname === "127.0.0.1" ||
                  location.search.indexOf("debug_track") !== -1;
      if (debug) console.debug("[QF_TRACK]", eventName, payload);
    } catch (e) { /* el tracking nunca debe romper la página */ }
  };

  /* ---- fuente única de verdad: precio ---- */
  function hydratePrice() {
    document.querySelectorAll("[data-qf-price]").forEach(function (el) {
      el.textContent = config.PRICE_DISPLAY;
    });
  }

  /* ---- fuente única de verdad: checkout ---- */
  function hydrateCheckout() {
    var enabled = validHttpsUrl(config.CHECKOUT_URL);
    document.querySelectorAll("[data-qf-checkout]").forEach(function (link) {
      if (enabled) {
        link.href = config.CHECKOUT_URL;
        link.removeAttribute("aria-disabled");
      } else {
        // fail-safe: sin URL válida no se puede comprar; se desactiva en vez de cobrar mal.
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    });
  }

  /* ---- PRO (fail-closed): precio + checkout. Si no hay URL válida, el botón queda
     deshabilitado con "Disponible tras validación" (nunca reutiliza el link de Core). ---- */
  function hydratePro() {
    document.querySelectorAll("[data-pro-price]").forEach(function (el) {
      el.textContent = config.PRO_PRICE_DISPLAY;
    });
    var ok = validHttpsUrl(config.PRO_CHECKOUT_URL);
    document.querySelectorAll("[data-pro-checkout]").forEach(function (link) {
      if (ok) {
        link.href = config.PRO_CHECKOUT_URL;
        link.removeAttribute("aria-disabled");
        link.removeAttribute("data-disabled");
      } else {
        // fail-closed: sin checkout no "empieza checkout"; el clic solo registra interés.
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("data-disabled", "true");
        link.removeAttribute("data-qf-event");
      }
    });
    document.querySelectorAll("[data-pro-state]").forEach(function (el) {
      el.textContent = ok
        ? "Pago único y seguro con Stripe. Entrega manual en un máximo de 12 h al email de la compra."
        : "Disponible en breve.";
    });
  }

  /* ---- eventos de analítica (sin PII) ---- */
  function setupTracking() {
    if (document.body.hasAttribute("data-pack-selector")) {
      window.QF_TRACK("view_pack_selector");
    } else {
      window.QF_TRACK("quant_bundle_view");
    }

    // Llegada cross-site desde javiperezbuilds (?from=jpb) o por referrer.
    try {
      var fromJpb = location.search.indexOf("from=jpb") !== -1 ||
                    (document.referrer && document.referrer.indexOf("javiperezbuilds.com") !== -1);
      if (fromJpb) window.QF_TRACK("quant_cross_site_arrival");
    } catch (e) { /* noop */ }

    document.addEventListener("click", function (ev) {
      var el = ev.target.closest && ev.target.closest("[data-qf-event]");
      if (el) window.QF_TRACK(el.getAttribute("data-qf-event"));
    }, true);
  }

  /* ---- Monetag: aislado y desactivado por defecto. No hace NADA salvo que
     MONETAG_ENABLED sea true y exista MONETAG_ZONE_ID. No popunder/push/interstitial. ---- */
  function setupMonetag() {
    var slot = document.querySelector("[data-qf-ad]");
    if (!slot) return;
    if (config.MONETAG_ENABLED !== true || !config.MONETAG_ZONE_ID) return; // inerte
    // Punto de inserción documentado. Implementación real del formato de banner
    // pendiente del zone ID de Monetag (contenido educativo/gratuito, tras el contenido principal).
    slot.hidden = false;
    slot.setAttribute("aria-hidden", "false");
  }

  hydratePrice();
  hydrateCheckout();
  hydratePro();
  setupTracking();
  setupMonetag();
})();
