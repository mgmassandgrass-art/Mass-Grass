import sys;pre,out,title,nav=sys.argv[1:5]
s=open('site/index.html').read()
head=s[:s.index('/* 1 · hero')]
footcss=s[s.index('/* 6 · footer'):s.index('</style>')]
header=s[s.index('<header>'):s.index('</header>')+9]
footer=s[s.index('<footer'):s.index('</footer>')+9]
a=s.index('/* newsletter');nl=s[a:s.index('/* torn edges',a)]
a=s.index('/* torn edges');tail=s[a:s.index('</script>',a)]
old="buildPages();cap();"
assert old in tail;tail=tail.replace(old,"document.querySelectorAll('[data-ph-ar]').forEach(e=>{e.dataset.phEn=e.dataset.phEn||e.placeholder;e.placeholder=a?e.dataset.phAr:e.dataset.phEn});render();if(view.open)open_(vi);")
tail=tail.replace("const torn=[...document.querySelectorAll('[data-tear],[data-tear-top]')];","let torn=[...document.querySelectorAll('[data-tear],[data-tear-top]')];")
head=head.replace('<title>Mass &amp; Grass · Collage</title>','<title>'+title+' · Mass &amp; Grass</title>')
header=header.replace('href="#story"','href="story.html"').replace('<a href="'+nav+'" data-ar','<a href="'+nav+'" aria-current="page" data-ar',1).replace('href="#cal"','href="index.html#cal"').replace('href="#story"','href="index.html#story"').replace('<a class="logo" href="#"','<a class="logo" href="index.html"')
footer=footer.replace('href="#story"','href="story.html"')
import sys;pre,out,title,nav=sys.argv[1:5]
main=open('parts/'+pre+'_main.html').read();js=open('parts/'+pre+'_js.txt').read()
css=open('parts/'+pre+'_css.txt').read()+'''.tbtn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:0;cursor:pointer;--c:var(--cream);color:var(--ink);font:700 var(--fs-sm)/1 var(--f);filter:drop-shadow(0 4px 4px rgba(var(--rgb-20-18-14),.18))}
.ar-on .tbtn{font-family:var(--fa)}
.ar-on .tbtn svg{transform:scaleX(-1)}
header nav a[aria-current=page]{text-decoration:underline;text-underline-offset:6px}
'''
end='''render();{const k=location.hash.slice(1),L=typeof shown!=='undefined'?shown:P,i=L.findIndex(p=>p[0]===k);if(i>=0)open_(i)}
</script>'''
page=head+css+footcss+'</style>\n<script>document.documentElement.classList.add(\'js\')</script>\n</head>\n<body>\n\n'+header+'\n'+main+'\n'+footer+'\n\n<script src="assets/gsap.min.js"></script>\n<script src="assets/shop.js"></script>\n<script>\n'+js+nl+tail+end+'\n</body>\n</html>\n'
open('site/'+out,'w').write(page);print(len(page))
