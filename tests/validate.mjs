/* Invariantes de Quant Forensics (estático, sin navegador).
   Un producto (15 agentes) a 9,49€ desde fuente única, sin precio en la preview social,
   sin anclas ni precios prohibidos, terminología "agentes" (no "skills"), Monetag apagado. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

const index = read('index.html');
const script = read('script.js');
const terminos = read('terminos.html');
const CHECKOUT = 'https://buy.stripe.com/eVq28r9LRfXY7gj58z9fW09';

function group(name, fn) { fn(); console.log(`✓ ${name}`); }

// 1 · Un solo checkout, el Payment Link canónico de los 15 agentes
group('checkout único = 15 agentes 9,49€', () => {
  assert(index.includes(CHECKOUT), 'debe existir el Payment Link canónico');
  assert(index.includes('data-qf-checkout'), 'checkout por fuente única');
  const others = (index.match(/buy\.stripe\.com\/(?!eVq28r9LRfXY7gj58z9fW09)[A-Za-z0-9]+/g) || []);
  assert.equal(others.length, 0, `no debe haber otros Payment Links: ${others.join(', ')}`);
});

// 2 · Precios/frases prohibidas fuera
group('sin precios/frases prohibidas (99€, 24,90, 715, precio fundador, Opus)', () => {
  for (const bad of ['24,90', '2490', '715', '99€', 'bundle founder', 'precio fundador', 'Opus 4.8', 'Opus 4,8']) {
    assert(!index.includes(bad), `index.html no debe contener "${bad}"`);
  }
});

// 3 · La preview social NO muestra precio
group('og/twitter description sin precio', () => {
  for (const prop of ['og:description', 'twitter:description']) {
    const m = index.match(new RegExp(`(?:property|name)="${prop}"[^>]*content="([^"]*)"`));
    assert(m, `falta ${prop}`);
    assert(!/\d[.,]\d{2}\s*€|€\s*\d/.test(m[1]), `${prop} no debe incluir precio: "${m[1]}"`);
    assert(!/9,49/.test(m[1]), `${prop} no debe incluir 9,49`);
  }
});

// 4 · El precio 9,49€ SÍ es visible en la página + fuente única en script.js
group('9,49€ visible + fuente única (QF_CONFIG 949)', () => {
  assert(index.includes('9,49€'), 'la página de venta debe mostrar 9,49€');
  assert(index.includes('data-qf-price'), 'precio por fuente única (data-qf-price)');
  assert(/PRICE_CENTS:\s*949/.test(script), 'QF_CONFIG.PRICE_CENTS = 949');
  assert(/PRICE_DISPLAY:\s*"9,49€"/.test(script), 'QF_CONFIG.PRICE_DISPLAY = 9,49€');
  assert(script.includes(CHECKOUT), 'QF_CONFIG.CHECKOUT_URL canónico');
});

// 5 · Terminología: "agentes", no "skills" visible
group('terminología agentes (sin "skills" visible)', () => {
  const title = index.match(/<title>([\s\S]*?)<\/title>/)[1];
  assert(!/skill/i.test(title), `<title> no debe decir skill: "${title}"`);
  assert(!/\d+\s+skills/i.test(index), 'sin "N skills"');
  assert(!/skills de claude/i.test(index), 'sin "skills de Claude"');
  assert(!/«skills»/i.test(terminos), 'legal sin «skills»');
  assert(index.includes('15 agentes'), 'debe hablar de "15 agentes"');
});

// 6 · 15 agentes presentados
group('15 agentes en el value stack', () => {
  const n = (index.match(/class="skill__n"/g) || []).length;
  assert.equal(n, 15, `deben presentarse 15 agentes (encontrados ${n})`);
});

// 7 · Monetag apagado por defecto
group('Monetag desactivado por defecto', () => {
  assert(/MONETAG_ENABLED:\s*false/.test(script), 'MONETAG_ENABLED debe ser false');
  assert(/MONETAG_ZONE_ID:\s*""/.test(script), 'MONETAG_ZONE_ID vacío');
});

// 8 · Fable 5 mencionado (exacto)
group('mención "Fable 5"', () => {
  assert(index.includes('Fable 5'), 'debe mencionar Fable 5');
});

console.log('\n✓ Quant Forensics invariants OK');
