// 다크모드 토글
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// 카드 스크롤 등장 애니메이션
const cards = document.querySelectorAll('.card-tilt');
if ('IntersectionObserver' in window && cards.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach((card) => observer.observe(card));
} else {
  cards.forEach((card) => card.classList.add('is-visible'));
}

// 카드 마우스 틸트
const MAX_TILT = 8; // deg
document.querySelectorAll('.card-flip').forEach((flip) => {
  flip.setAttribute('tabindex', '0');
  flip.setAttribute('role', 'button');

  flip.addEventListener('mousemove', (e) => {
    const rect = flip.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (px - 0.5) * MAX_TILT * 2;
    const ry = (0.5 - py) * MAX_TILT * 2;
    flip.style.setProperty('--rx', `${rx}deg`);
    flip.style.setProperty('--ry', `${ry}deg`);
  });

  flip.addEventListener('mouseleave', () => {
    flip.style.setProperty('--rx', '0deg');
    flip.style.setProperty('--ry', '0deg');
  });
});

// ── 라이트박스: 카드를 "책장에서 꺼내듯" 확대 ──
const lightbox = document.getElementById('lightbox');
const lbPanel = document.getElementById('lightboxPanel');
const lbBackdrop = document.getElementById('lightboxBackdrop');
const lbImgWrap = document.getElementById('lightboxImgWrap');
const lbImg = document.getElementById('lightboxImg');

let sourceCard = null;
let savedScrollY = 0;

function flipFromRect(fromRect) {
  const panelRect = lbPanel.getBoundingClientRect();
  const scaleX = fromRect.width / panelRect.width;
  const scaleY = fromRect.height / panelRect.height;
  return `translate(${fromRect.left - panelRect.left}px, ${fromRect.top - panelRect.top}px) scale(${scaleX}, ${scaleY})`;
}

function openLightbox(card) {
  sourceCard = card;
  const d = card.dataset;

  lbImg.style.backgroundImage = `url('${d.img}')`;
  document.getElementById('lightboxTag').textContent = d.tag;
  document.getElementById('lightboxTitle').textContent = d.title;
  document.getElementById('lightboxTagline').textContent = d.tagline;
  document.getElementById('lightboxMeta').innerHTML = `<span class="meta-pill">${d.period}</span>`;
  document.getElementById('lightboxDesc').textContent = d.desc || '';
  document.getElementById('lightboxRole').innerHTML = d.role;
  document.getElementById('lightboxStack').innerHTML = d.stack
    .split(',')
    .map((s) => `<span class="chip chip--sm">${s.trim()}</span>`)
    .join('');
  document.getElementById('lightboxCta').href = d.href;

  const proj = getComputedStyle(card).getPropertyValue('--proj').trim();
  lbPanel.style.setProperty('--proj', proj);

  const cardRect = card.getBoundingClientRect();
  card.closest('.card-tilt').classList.add('is-opening');

  savedScrollY = window.scrollY;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = '100%';

  requestAnimationFrame(() => {
    lbPanel.style.transition = 'none';
    lbPanel.style.transform = flipFromRect(cardRect);
    lbPanel.getBoundingClientRect(); // force reflow
    requestAnimationFrame(() => {
      lbPanel.style.transition = '';
      lbPanel.style.transform = 'translate(0,0) scale(1,1)';
    });
  });
}

function closeLightbox() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
  lightbox.setAttribute('aria-hidden', 'true');

  const closingCard = sourceCard ? sourceCard.closest('.card-tilt') : null;

  if (sourceCard) {
    const rect = sourceCard.getBoundingClientRect();
    lbPanel.style.transition = 'transform .45s cubic-bezier(.5,0,.3,1), opacity .4s ease .05s';
    lbPanel.style.transform = flipFromRect(rect);
    lbPanel.style.opacity = '0';
  }

  // 패널이 카드 자리로 완전히 축소·소멸한 "그 순간"에만
  // 라이트박스를 감추고 카드를 다시 보여줘 — 빈 자리가 보이는 틈을 없앤다.
  setTimeout(() => {
    lightbox.classList.remove('is-open');
    if (closingCard) closingCard.classList.remove('is-opening');
    lbPanel.style.transition = '';
    lbPanel.style.transform = '';
    lbPanel.style.opacity = '';
    lbImg.style.transform = '';
    sourceCard = null;
  }, 450);
}

document.querySelectorAll('.card-flip').forEach((card) => {
  card.addEventListener('click', () => openLightbox(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(card);
    }
  });
});

if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
const lbCloseBtn = document.getElementById('lightboxClose');
if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) closeLightbox();
});

// 라이트박스 이미지 마우스 패럴랙스
if (lbImgWrap) {
  lbImgWrap.addEventListener('mousemove', (e) => {
    const rect = lbImgWrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    lbImg.style.transform = `translate(${-px * 26}px, ${-py * 26}px) scale(1.08)`;
  });
  lbImgWrap.addEventListener('mouseleave', () => {
    lbImg.style.transform = '';
  });
}

// 이메일 복사 버튼
const copyBtn = document.getElementById('copyBtn');
const emailLink = document.getElementById('emailLink');
if (copyBtn && emailLink) {
  copyBtn.addEventListener('click', async () => {
    const email = emailLink.textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      const temp = document.createElement('textarea');
      temp.value = email;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = '복사됨 ✓';
    copyBtn.classList.add('is-copied');
    setTimeout(() => {
      copyBtn.textContent = original;
      copyBtn.classList.remove('is-copied');
    }, 1800);
  });
}
