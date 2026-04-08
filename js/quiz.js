const PASS_MARK = 70;
const QUIZ_SIZE = 10;
const STORAGE_KEY = 'quizAttempts';

let questionPool = [];
let questions = [];
let quizDirty = false;

// ── Load questions ──────────────────────────────────────────────
fetch('data/questions.json')
  .then(r => r.json())
  .then(data => {
    questionPool = data;
    renderIntroHistory();
  });

// ── Navigation warning ──────────────────────────────────────────
window.addEventListener('beforeunload', e => {
  if (quizDirty) e.preventDefault();
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

  let score = 0;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && parseInt(selected.value) === q.answer) score++;
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= PASS_MARK;

  quizDirty = false;

  saveAttempt({ score, total, percentage, date: new Date().toISOString() });

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
    const card = qTpl.content.cloneNode(true);
    card.querySelector('.question-number').textContent = `Question ${i + 1} of ${qs.length}`;
    card.querySelector('.question-text').textContent = q.question;
    const optList = card.querySelector('.options-list');

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

    container.appendChild(card);
  });
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

  renderResultsHistory();
}

// ── Fetch reward (on pass) ──────────────────────────────────────
function fetchReward() {
  fetch('https://api.quotable.io/random?tags=wisdom')
    .then(r => r.json())
    .then(data => {
      document.getElementById('reward-quote').textContent = `"${data.content}"`;
      document.getElementById('reward-author').textContent = `— ${data.author}`;
      document.getElementById('reward-img').src = `https://picsum.photos/seed/${encodeURIComponent(data.author)}/760/260`;
      document.getElementById('reward-section').hidden = false;
    })
    .catch(() => {
      // API unavailable — show reward without quote
      document.getElementById('reward-quote').textContent = '"The more that you read, the more things you will know."';
      document.getElementById('reward-author').textContent = '— Dr. Seuss';
      document.getElementById('reward-img').src = 'https://picsum.photos/seed/pass/760/260';
      document.getElementById('reward-section').hidden = false;
    });
}

// ── localStorage ────────────────────────────────────────────────
function saveAttempt(attempt) {
  const attempts = loadAttempts();
  attempts.push(attempt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

function loadAttempts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

// ── History rendering ───────────────────────────────────────────
function renderIntroHistory() {
  const attempts = loadAttempts();
  if (attempts.length === 0) return;
  populateHistoryTable('intro-history-body', attempts);
  document.getElementById('intro-history').hidden = false;
}

function renderResultsHistory() {
  populateHistoryTable('results-history-body', loadAttempts());
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
