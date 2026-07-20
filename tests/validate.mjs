/* Invariantes de Quant Forensics (estático, sin navegador).
   Core (15 agentes) 9,49€ + selector /elige-tu-pack con Pro (MT5 Bridge) 24,99€ FAIL-CLOSED.
   Sin precio en preview, sin anclas/precios prohibidos, terminología "agentes", Monetag OFF,
   y copy del puente sin claims prohibidos. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

const index = read('index.html');
const selector = read('elige-tu-pack.html');
const script = read('script.js');
const terminos = read('terminos.html');
const CORE_CHECKOUT = 'https://buy.stripe.com/eVq28r9LRfXY7gj58z9fW09';
const PRO_CHECKOUT = 'https://buy.stripe.com/eVq9AT3nt9zAasv0Sj9fW0K'; // LIVE verificado read-only

function group(name, fn) { fn(); console.log(`✓ ${name}`); }

// 1 · El CTA principal de la landing lleva al selector (no directo a Stripe)
group('landing enruta la compra al selector', () => {
  assert(index.includes('/elige-tu-pack'), 'la landing debe enlazar al selector');
  assert(!index.includes('buy.stripe.com'), 'el CTA de la landing NO va directo a Stripe (pasa por el selector)');
});

// 2 · El selector: Core con su Payment Link actual (9,49€), fuente única
group('selector: Core 9,49€ con su Payment Link actual', () => {
  assert(selector.includes(CORE_CHECKOUT), 'el selector debe tener el Payment Link de Core');
  assert(selector.includes('data-qf-checkout'), 'Core por fuente única (data-qf-checkout)');
  assert(selector.includes('9,49€'), 'el selector muestra 9,49€ (Core)');
  // el único link hardcodeado en el HTML del selector es el de Core; el de Pro viene del config (JS)
  const stripeLinks = (selector.match(/buy\.stripe\.com\/[A-Za-z0-9]+/g) || []);
  assert.equal(stripeLinks.length, 1, `solo el link de Core va hardcodeado en el selector: ${stripeLinks.join(', ')}`);
});

// 3 · Pro ACTIVO con el Payment Link LIVE (24,99€, distinto del Core)
group('Pro activo con Payment Link LIVE 24,99€ (!= Core)', () => {
  assert(script.includes(PRO_CHECKOUT), 'PRO_CHECKOUT_URL = Payment Link LIVE');
  assert(PRO_CHECKOUT !== CORE_CHECKOUT && !script.includes('PRO_CHECKOUT_URL: "https://buy.stripe.com/eVq28r'),
    'el Pro NO reutiliza el link del Core');
  assert(/PRO_PRICE_CENTS:\s*2499/.test(script), 'PRO_PRICE_CENTS = 2499');
  assert(/PRO_PRICE_DISPLAY:\s*"24,99€"/.test(script), 'PRO_PRICE_DISPLAY = 24,99€');
  assert(selector.includes('data-pro-checkout') && selector.includes('24,99€'), 'CTA Pro (24,99€) en el selector');
  // fail-safe en el HTML: el CTA nace aria-disabled y sin el link hardcodeado; hydratePro lo activa con la URL del config
  const proCta = selector.match(/<a[^>]*data-pro-checkout[^>]*>/)[0];
  assert(/aria-disabled="true"/.test(proCta), 'CTA Pro con fallback fail-safe en el HTML (se activa por JS)');
  assert(!proCta.includes('buy.stripe.com'), 'el CTA Pro no lleva el link hardcodeado (viene del config)');
});

// 4 · Copy del puente: sin claims prohibidos, con framing correcto
group('copy del puente honesto (sin claims prohibidos)', () => {
  const forbidden = [
    /MCP oficial de MetaTrader/i, /MCP oficial de MetaQuotes/i,
    /funcionan dentro de MetaTrader/i, /la IA opera por ti/i,
    /mejora tu rentabilidad/i, /gana m[aá]s/i, /garantiza(mos)? (beneficios|rentabilidad|ganancias)/i
  ];
  for (const re of forbidden) {
    assert(!re.test(selector), `el selector no debe contener claim prohibido: ${re}`);
  }
  assert(/solo lectura|read-only/i.test(selector), 'debe dejar claro que es de solo lectura');
  assert(/api oficial de python/i.test(selector), 'debe citar la API oficial de Python de MT5');
  assert(/no abre, modifica ni cierra operaciones/i.test(selector), 'bloque de seguridad presente');
});

// 5 · Analítica del selector (eventos sin PII; sin purchase_pro por no haber verificación automática)
group('eventos de analítica del selector', () => {
  assert(selector.includes('data-pack-selector'), 'view_pack_selector via data-pack-selector');
  for (const ev of ['select_core', 'select_pro', 'begin_checkout_core', 'begin_checkout_pro']) {
    assert(selector.includes(ev), `falta el evento ${ev}`);
  }
  assert(!/purchase_pro/.test(selector) && !/purchase_pro/.test(script),
    'NO registrar purchase_pro (no hay verificación automática de pago; entrega manual)');
});

// 6 · Precios/frases prohibidas fuera (landing y selector)
group('sin precios/frases prohibidas (24,90, 715, bundle 99€, fundador, Opus)', () => {
  for (const html of [index, selector]) {
    for (const bad of ['24,90', '2490', '715', 'bundle founder', 'precio fundador', 'Opus 4.8']) {
      assert(!html.includes(bad), `no debe contener "${bad}"`);
    }
    // "99€" suelto (bundle viejo), pero NO dentro de "24,99€"
    assert(!/(?<![\d,])99€/.test(html), 'no debe contener el precio suelto "99€"');
  }
});

// 7 · La preview social NO muestra precio (landing y selector)
group('og/twitter description sin precio', () => {
  for (const [name, html] of [['index', index], ['selector', selector]]) {
    for (const prop of ['og:description', 'twitter:description']) {
      const m = html.match(new RegExp(`(?:property|name)="${prop}"[^>]*content="([^"]*)"`));
      assert(m, `${name}: falta ${prop}`);
      assert(!/\d[.,]\d{2}\s*€|€\s*\d/.test(m[1]), `${name} ${prop} no debe incluir precio: "${m[1]}"`);
    }
  }
});

// 8 · Fuente única de precio Core + 15 agentes + terminología + Monetag OFF + Fable 5
group('Core 949¢ fuente única, 15 agentes, agentes, Monetag OFF, Fable 5', () => {
  assert(/PRICE_CENTS:\s*949/.test(script) && /PRICE_DISPLAY:\s*"9,49€"/.test(script), 'QF_CONFIG Core 9,49€/949');
  assert(script.includes(CORE_CHECKOUT), 'CHECKOUT_URL canónico en config');
  assert.equal((index.match(/class="skill__n"/g) || []).length, 15, 'deben presentarse 15 agentes');
  const title = index.match(/<title>([\s\S]*?)<\/title>/)[1];
  assert(!/skill/i.test(title), '<title> sin "skill"');
  assert(!/«skills»/i.test(terminos), 'legal sin «skills»');
  assert(/MONETAG_ENABLED:\s*false/.test(script), 'Monetag OFF');
  assert(index.includes('Fable 5'), 'menciona Fable 5');
});

console.log('\n✓ Quant Forensics + selector invariants OK');
