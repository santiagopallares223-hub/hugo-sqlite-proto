// static/search.js — búsqueda en el navegador. Vainilla ES6+, sin dependencias.
// Estilo funcional: funciones puras arriba; el DOM (efectos) solo al final.
//
// MDN:
//   fetch                 https://developer.mozilla.org/es/docs/Web/API/Fetch_API
//   Array.filter / every  https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
//   String.normalize      https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
//   Element.replaceChildren https://developer.mozilla.org/es/docs/Web/API/Element/replaceChildren
//   Escapes Unicode \p{M} https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape

// --- puras ------------------------------------------------------------------

// "Árbol" → "arbol": minúsculas y sin acentos
const normalize = s => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const terms = query => normalize(query).split(/\s+/).filter(Boolean);

const haystack = post => normalize(`${post.title} ${post.tags.join(" ")} ${post.text}`);

// Cuenta cuántas veces aparecen los términos en el texto normalizado del post
const score = ts => post => {
  const content = haystack(post);
  // Para cada término buscado, contamos cuántas veces divide al contenido
  return ts.reduce((acc, t) => acc + (content.split(t).length - 1), 0);
};

const search = (posts, query) => {
  const ts = terms(query);
  if (!ts.length) return [];
  
  return posts
    .map(post => ({ post, pts: score(ts)(post) })) // 1. Extraemos los puntos
    .filter(item => item.pts > 0)                  // 2. Filtramos los que coinciden
    .sort((a, b) => b.pts - a.pts)                 // 3. Ordenamos de mayor a menor
    .map(item => item.post);                       // 4. Devolvemos los posts limpios
};

// --- efectos (DOM) ----------------------------------------------------------

// textContent, nunca innerHTML: el contenido se trata como texto, no como HTML
const toItem = base => post => {
  const a = document.createElement("a");
  a.href = base.replace(/\/$/, "") + post.url;
  a.textContent = post.title;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = ` ${post.date.slice(0, 10)} — ${post.summary}`;

  const li = document.createElement("li");
  li.append(a, meta);
  return li;
};

const emptyItem = () => {
  const li = document.createElement("li");
  li.className = "meta";
  li.textContent = "Sin resultados.";
  return li;
};

const main = async () => {
  const input = document.querySelector("#q");
  const list = document.querySelector("#results");
  if (!input || !list) return;

  const { index, base } = list.dataset;
  const posts = await fetch(index).then(r => r.json());

  input.addEventListener("input", () => {
    const found = search(posts, input.value);
    const items = found.map(toItem(base));
    list.replaceChildren(...(items.length || !input.value.trim() ? items : [emptyItem()]));
  });
};

main().catch(err => console.error("search.js:", err));
