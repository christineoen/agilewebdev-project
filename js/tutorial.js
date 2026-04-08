// ── Live CSS demo ──────────────────────────────────────────────
const DEFAULT_CSS = `background-color: #ffffff;
color: #3A3A3A;
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
let selectedColour = '#FBB04C';

document.querySelectorAll('.colour-pick').forEach(btn => {
  btn.addEventListener('click', () => {
    // Deselect all, select clicked
    document.querySelectorAll('.colour-pick').forEach(b => b.style.border = '2px solid transparent');
    btn.style.border = '2px solid #3A3A3A';
    selectedColour = btn.dataset.colour;
  });
});
// Set initial selected state
document.querySelector('.colour-pick').style.border = '2px solid #3A3A3A';

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

  // Create the new item element
  const item = document.createElement('div');
  item.className = 'px-3 py-1 my-1 rounded small d-flex justify-content-between align-items-center';
  item.style.backgroundColor = selectedColour + '33'; // 20% opacity
  item.style.borderLeft = `4px solid ${selectedColour}`;

  const span = document.createElement('span');
  span.textContent = text;
  item.appendChild(span);

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.className = 'btn btn-sm p-0 px-2';
  removeBtn.style.color = selectedColour;
  removeBtn.style.fontWeight = 'bold';
  removeBtn.style.fontSize = '1.1rem';
  removeBtn.setAttribute('aria-label', 'Remove item');
  removeBtn.addEventListener('click', () => {
    item.remove();
    // Show placeholder again if no items remain
    const remaining = document.querySelectorAll('#dom-output .my-1');
    if (remaining.length === 0) {
      document.getElementById('dom-empty-msg').style.display = '';
    }
  });
  item.appendChild(removeBtn);

  document.getElementById('dom-output').appendChild(item);
  input.value = '';
  input.focus();
}

function clearDom() {
  const output = document.getElementById('dom-output');
  output.querySelectorAll('.my-1').forEach(el => el.remove());
  document.getElementById('dom-empty-msg').style.display = '';
}

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
