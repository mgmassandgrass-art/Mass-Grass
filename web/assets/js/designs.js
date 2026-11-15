/* More designs: the book (book.js reads it), the design files on sale, and the way to ask for one's own. */
(function () {
  'use strict';
  const { $ } = MG;
  MG.page(function () {
    const L = MG.products('design');
    $('#dgrid').innerHTML = L.map(MG.tile).join('');
    $('#dgrid').hidden = !L.length; $('#dgempty').hidden = !!L.length;
  });
})();
