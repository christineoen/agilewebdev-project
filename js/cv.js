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

