const PASS_MARK = 70;
const QUIZ_SIZE = 10;
const STORAGE_KEY = 'quizAttempts';

let questionPool = [];
let questions = [];
let quizDirty = false;

// ── Load questions ──────────────────────────────────────────────
fetch('data/questions.json')
  .then(r => {
    if (!r.ok) throw new Error(`Failed to load questions (${r.status})`);
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) throw new Error('Question data is empty or invalid');
    questionPool = data;
    renderHistory();
  })
  .catch(err => {
    document.getElementById('start-btn').disabled = true;
    document.getElementById('start-btn').textContent = 'Questions unavailable';
    console.error('Could not load questions:', err);
  });

// ── Navigation warning ──────────────────────────────────────────
window.addEventListener('beforeunload', e => {
  if (quizDirty) e.preventDefault();
});

// ── Wire up clear-history buttons ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clear-history-quiz-btn').addEventListener('click', () => {
    clearHistory();
    document.getElementById('quiz-history').hidden = true;
  });
});

// ── Start quiz ──────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  renderQuestions(shuffle(questionPool).slice(0, QUIZ_SIZE));
  document.getElementById('quiz-intro').hidden = true;
  document.getElementById('quiz-section').hidden = false;
});

// Set dirty flag when any answer is selected
document.getElementById('questions-container').addEventListener('change', () => {
  quizDirty = true;
});

// ── Submit ──────────────────────────────────────────────────────
document.getElementById('quiz-form').addEventListener('submit', e => {
  e.preventDefault();

  // Block submission if any questions are unanswered
  const unanswered = getUnansweredIndices();
  if (unanswered.length > 0) {
    const list = document.getElementById('unanswered-list');
    const tpl = document.getElementById('unanswered-btn-tpl');
    list.replaceChildren();
    const modal = new bootstrap.Modal(document.getElementById('unanswered-modal'));
    unanswered.forEach(i => {
      const btn = tpl.content.cloneNode(true).querySelector('button');
      btn.textContent = i + 1;
      btn.addEventListener('click', () => {
        modal.hide();
        document.getElementById('question-' + i).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      list.appendChild(btn);
    });
    modal.show();
    return;
  }

  let score = 0;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && parseInt(selected.value) === q.answer) score++;
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= PASS_MARK;

  quizDirty = false;

  saveAttempt({ score, total, percentage, passed, date: new Date().toISOString() });

  showResults(score, total, percentage, passed);
  document.getElementById('quiz-section').hidden = true;
  document.getElementById('quiz-results').hidden = false;

  if (passed) fetchReward();
});

// ── Retake ──────────────────────────────────────────────────────
document.getElementById('retake-btn').addEventListener('click', () => {
  document.getElementById('quiz-results').hidden = true;
  document.getElementById('reward-section').hidden = true;
  renderQuestions(shuffle(questionPool).slice(0, QUIZ_SIZE));
  document.getElementById('quiz-section').hidden = false;
  quizDirty = false;
});

// ── Render questions ────────────────────────────────────────────
function renderQuestions(qs) {
  // Store shuffled order so answer checking matches
  questions = qs;

  const container = document.getElementById('questions-container');
  const qTpl = document.getElementById('question-tpl');
  const optTpl = document.getElementById('option-tpl');
  container.replaceChildren();

  qs.forEach((q, i) => {
    const frag = qTpl.content.cloneNode(true);
    frag.querySelector('.question-number').textContent = `Question ${i + 1} of ${qs.length}`;
    frag.querySelector('.question-text').textContent = q.question;
    const optList = frag.querySelector('.options-list');

    q.options.forEach((opt, j) => {
      const optEl = optTpl.content.cloneNode(true);
      const input = optEl.querySelector('input');
      const label = optEl.querySelector('label');
      const id = `q${i}-opt${j}`;
      input.name = `q${i}`;
      input.value = j;
      input.id = id;
      label.htmlFor = id;
      label.textContent = opt;
      optList.appendChild(optEl);
    });

    // Append frag to get a real element, then set id
    container.appendChild(frag);
    container.lastElementChild.id = 'question-' + i;
  });
}

// ── Get unanswered question indices ─────────────────────────────
function getUnansweredIndices() {
  return questions.map((_, i) => i).filter(i => !document.querySelector(`input[name="q${i}"]:checked`));
}

// ── Show results ────────────────────────────────────────────────
function showResults(score, total, percentage, passed) {
  document.getElementById('score-fraction').textContent = `${score} / ${total}`;
  document.getElementById('score-percentage').textContent = `${percentage}%`;

  const badge = document.getElementById('score-badge');
  if (passed) {
    badge.textContent = 'Passed';
    badge.className = 'badge fs-6 px-4 py-2 bg-success';
  } else {
    badge.textContent = 'Not passed';
    badge.className = 'badge fs-6 px-4 py-2 bg-danger';
  }
}

// ── Fetch reward (on pass) ──────────────────────────────────────
function fetchReward() {
  fetch('https://dog.ceo/api/breeds/image/random')
    .then(r => {
      if (!r.ok) throw new Error(`Dog API error (${r.status})`);
      return r.json();
    })
    .then(data => {
      if (!data || typeof data.message !== 'string' || data.status !== 'success') {
        throw new Error('Unexpected Dog API response shape');
      }
      document.getElementById('reward-img').src = data.message;
      document.getElementById('reward-section').hidden = false;
    })
    .catch(() => {
      document.getElementById('reward-section').hidden = true;
    });
}

// ── localStorage ────────────────────────────────────────────────
function saveAttempt(attempt) {
  try {
    const attempts = loadAttempts();
    attempts.push(attempt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    console.warn('Could not save attempt — storage may be unavailable (private browsing?)');
  }
}

function loadAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('Could not clear history');
  }
}

// ── History rendering ───────────────────────────────────────────
function renderHistory() {
  const attempts = loadAttempts();
  if (attempts.length === 0) return;
  populateHistoryTable('quiz-history-body', attempts);
  document.getElementById('quiz-history').hidden = false;
}

function populateHistoryTable(tbodyId, attempts) {
  const tbody = document.getElementById(tbodyId);
  const tpl = document.getElementById('attempt-row-tpl');
  tbody.replaceChildren();

  // Most recent first
  [...attempts].reverse().forEach(a => {
    const row = tpl.content.cloneNode(true);
    row.querySelector('.attempt-date').textContent = new Date(a.date).toLocaleString();
    row.querySelector('.attempt-score').textContent = `${a.score} / ${a.total}`;
    row.querySelector('.attempt-pct').textContent = `${a.percentage}%`;
    const resultCell = row.querySelector('.attempt-result');
    const passed = a.percentage >= PASS_MARK;
    resultCell.innerHTML = passed
      ? '<span class="badge bg-success">Passed</span>'
      : '<span class="badge bg-danger">Not passed</span>';
    tbody.appendChild(row);
  });
}

// ── Utilities ───────────────────────────────────────────────────
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
