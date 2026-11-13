/* Runs in <head> before the page paints: marks scripting as on and sets the language, so nothing flashes. */
(function () {
  var d = document.documentElement, ar = false;
  d.classList.add('js');
  /* the home page's opening (home.css): set before paint so nothing shows and then hides */
  try { if (d.dataset.page === 'home' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { var seen = false; try { seen = sessionStorage.mgIntro === '1'; sessionStorage.mgIntro = '1'; } catch (e) {} if (!seen) d.classList.add('home-intro'); } setTimeout(function () { d.classList.add('flying', 'landed'); var x = document.getElementById('splash'); if (x) x.remove(); }, 4500); } catch (e) {}
  try {
    var s = localStorage.mgLang;
    ar = s ? s === 'ar' : /^ar\b/i.test(navigator.language || '');
  } catch (e) {}
  if (ar) { d.lang = 'ar'; d.dir = 'rtl'; d.classList.add('ar-on'); }
})();
