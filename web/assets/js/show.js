/* MG.show(section, slides): the carousel of the home and calendar pages.
   slides: [{src, alt:[en,ar], name:[en,ar], place:[en,ar], fx, fy}] · the section holds #slides, #dots, #sprev, #snext, #sname, #splace. */
(function () {
  'use strict';
  MG.show = function (sec, slides, every) {
    const $ = (s) => sec.querySelector(s), holder = $('[data-slides]'), dots = $('[data-dots]');
    let i = 0, timer = null;
    holder.innerHTML = slides.map((s, k) => `<div class="slide${k ? '' : ' on'}" style="${s.fx ? `--fx:${s.fx};` : ''}${s.fy ? `--fy:${s.fy}` : ''}"><img src="${s.src}" alt="" ${k ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></div>`).join('');
    dots.innerHTML = slides.map(() => '<button type="button"></button>').join('');
    function caption() {
      const s = slides[i]; $('[data-name]').textContent = MG.L(s.name); $('[data-place]').textContent = MG.L(s.place);
      [...holder.children].forEach((d, k) => (d.firstChild.alt = k === i ? MG.L(s.alt) : ''));
      [...dots.children].forEach((b, k) => { b.setAttribute('aria-current', k === i); b.setAttribute('aria-label', MG.L(slides[k].name)); });
    }
    function go(n) { holder.children[i].classList.remove('on'); i = (n + slides.length) % slides.length; holder.children[i].classList.add('on'); caption(); }
    function restart() { clearInterval(timer); if (!MG.still) timer = setInterval(() => { if (!document.hidden) go(i + 1); }, every || 6000); }
    dots.addEventListener('click', (e) => { const k = [...dots.children].indexOf(e.target.closest('button')); if (k >= 0) { go(k); restart(); } });
    $('[data-next]').addEventListener('click', () => { go(i + 1); restart(); });
    $('[data-prev]').addEventListener('click', () => { go(i - 1); restart(); });
    sec.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { go(i + ((e.key === 'ArrowRight') !== MG.ar ? 1 : -1)); restart(); } });
    restart(); caption();
    return { caption, go };
  };
})();
