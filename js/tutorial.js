// ── Live CSS demo ──────────────────────────────────────────────
const DEFAULT_CSS = `background-color: white;
color: black;
font-size: 1.1rem;
font-family: sans-serif;
border-radius: 8px;
padding: 1.5rem;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;

function applyCSS() {
  const raw = document.getElementById('live-css').value;
  const preview = document.getElementById('demo-preview');
  // Reset inline styles, then apply each declaration from the textarea
  preview.removeAttribute('style');
  raw.split(';').forEach(decl => {
    const [prop, ...rest] = decl.split(':');
    if (!prop || rest.length === 0) return;
    const propCamel = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    preview.style[propCamel] = rest.join(':').trim();
  });
}

function resetCSS() {
  document.getElementById('live-css').value = DEFAULT_CSS;
  applyCSS();
}

// Apply on load so the preview matches the default textarea content
applyCSS();

// Apply whenever the user stops typing (300ms debounce)
let cssTimer;
document.getElementById('live-css').addEventListener('input', () => {
  clearTimeout(cssTimer);
  cssTimer = setTimeout(applyCSS, 300);
});

// ── DOM sandbox ────────────────────────────────────────────────
function updateCodeDisplay(action, itemText) {
  const display = document.getElementById('dom-code-display');
  const clone = document.getElementById(`code-tpl-${action}`).content.cloneNode(true);
  if (action === 'add') {
    clone.querySelector('[data-item-text]').textContent = `'${itemText}'`;
  }
  display.replaceChildren(clone);
}

function addDomItem() {
  const input = document.getElementById('dom-input');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  // Hide the placeholder message
  const emptyMsg = document.getElementById('dom-empty-msg');
  if (emptyMsg) emptyMsg.style.display = 'none';

  // Clone the item template and fill in the text
  const item = document.getElementById('dom-item-tpl').content.cloneNode(true).firstElementChild;
  item.querySelector('span').textContent = text;
  item.querySelector('button').addEventListener('click', () => {
    item.remove();
    // Show placeholder again if no items remain
    if (document.querySelectorAll('#dom-output .dom-item').length === 0) {
      document.getElementById('dom-empty-msg').style.display = '';
    }
    updateCodeDisplay('remove');
  });

  document.getElementById('dom-output').appendChild(item);
  input.value = '';
  input.focus();
  updateCodeDisplay('add', text);
}

function clearDom() {
  const output = document.getElementById('dom-output');
  output.querySelectorAll('.dom-item').forEach(el => el.remove());
  document.getElementById('dom-empty-msg').style.display = '';
  updateCodeDisplay('clear');
}

// Show addDomItem skeleton on page load
updateCodeDisplay('add', 'your text here');

// Allow Enter key to add an item
document.getElementById('dom-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addDomItem();
});

// ── Active TOC highlight ───────────────────────────────────────
const sections = document.querySelectorAll('section[id], h3[id]');
const tocLinks = document.querySelectorAll('#toc .toc-link');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '0px 0px -60% 0px' });

sections.forEach(s => observer.observe(s));
