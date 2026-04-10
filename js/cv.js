// ── Skill tags ───────────────────────────────────────────────────
const SKILLS = {
  'skills-languages':  ['Ruby', 'Python', 'JavaScript', 'HTML', 'CSS', 'R', 'C'],
  'skills-frameworks': ['Ruby on Rails', 'React', 'Stimulus'],
  'skills-infra':      ['PostgreSQL', 'Elasticsearch', 'AWS', 'Google Cloud', 'Docker', 'Heroku', 'Git'],
  'skills-other':      ['GitHub Copilot', 'Claude Code', 'Kiro', 'Antigravity', 'REST APIs', 'Excel', 'Technical Documentation'],
};

Object.entries(SKILLS).forEach(([id, tags]) => {
  const container = document.getElementById(id);
  tags.forEach((tag, i) => {
    const badge = document.createElement('span');
    badge.className = 'badge cv-skill-badge';
    badge.textContent = tag;
    badge.style.animationDelay = `${i * 60}ms`;
    container.appendChild(badge);
  });
});

// ── GitHub repos (AJAX) ──────────────────────────────────────────
fetch('https://api.github.com/users/christineoen/repos?sort=updated&per_page=5')
  .then(r => {
    if (!r.ok) throw new Error(`GitHub API error (${r.status})`);
    return r.json();
  })
  .then(repos => {
    if (!Array.isArray(repos) || repos.length === 0) return;
    const list = document.getElementById('github-repo-list');
    repos.forEach(repo => {
      if (!repo.name || repo.fork) return;
      const li = document.createElement('li');
      li.className = 'mb-1';
      li.innerHTML = `<a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>`
        + (repo.description ? ` — <span class="text-secondary">${repo.description}</span>` : '');
      list.appendChild(li);
    });
    if (list.children.length > 0) {
      document.getElementById('github-repos').hidden = false;
    }
  })
  .catch(() => {
    // GitHub API unavailable — section stays hidden
  });
