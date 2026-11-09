/* Runs in <head> before the page paints: marks scripting as on and sets the language, so nothing flashes. */
(function () {
  var d = document.documentElement, ar = false;
  d.classList.add('js');
  try {
    var s = localStorage.mgLang;
    ar = s ? s === 'ar' : /^ar\b/i.test(navigator.language || '');
  } catch (e) {}
  if (ar) { d.lang = 'ar'; d.dir = 'rtl'; d.classList.add('ar-on'); }
})();
