/* Mass & Grass · shared pieces for every page:
   1. the Shop menu in the header   2. one bag shared by all pages
   3. the product window (painting, mockups, zoom, details, buy, send as a gift)
   4. "send a postcard to someone you love" */
(function(){
'use strict';
const AR=()=>document.documentElement.lang==='ar'||document.body.classList.contains('ar-on');
const t=(en,ar)=>AR()?ar:en;
const ard=n=>AR()?String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]):String(n);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img=k=>k==='coast'?'assets/coast.webp':`assets/${k}.webp`;

/* ---------- styles ---------- */
const css=`
.mgdd{position:relative;display:inline-flex}
.mgdd>a::after{content:"";display:inline-block;width:6px;height:6px;margin-inline-start:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;rotate:45deg;translate:0 -3px;opacity:.7}
.mgmenu{position:absolute;left:50%;top:calc(100% + 10px);translate:-50% 6px;min-width:250px;background:#FAF5E9;border:1.5px solid #2E241B;box-shadow:3px 3px 0 rgba(46,36,27,.25);padding:6px;display:grid;gap:2px;opacity:0;visibility:hidden;transition:opacity .18s,translate .18s,visibility 0s .18s;z-index:80;direction:ltr}
.mgmenu::before{content:"";position:absolute;left:0;right:0;top:-14px;height:14px}
.mgdd:hover .mgmenu,.mgdd:focus-within .mgmenu,.mgdd.open .mgmenu{opacity:1;visibility:visible;translate:-50% 0;transition:opacity .18s,translate .18s}
.mgmenu a{display:flex!important;align-items:center;gap:10px;padding:7px 9px!important;text-decoration:none;color:#2E241B!important;background:none!important;font:15px/1 'Anton',Impact,sans-serif!important;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.mgmenu a::after{display:none!important}
.mgmenu a i{width:34px;height:26px;flex:none;background:center/cover no-repeat;border:2px solid #fff;box-shadow:0 0 0 1px rgba(46,36,27,.2);rotate:-3deg}
.mgmenu a small{margin-inline-start:auto;font:11px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;color:#C4593F;text-transform:none}
.mgmenu a:hover{background:#2E241B!important;color:#FAF5E9!important}
.mgmenu a.all{border-bottom:1.5px dashed rgba(46,36,27,.25);margin-bottom:3px;padding-bottom:10px!important}
.mgmenu a.soon{opacity:.55}
.ar-on .mgmenu{direction:rtl}.ar-on .mgmenu a{font-family:'Lalezar',sans-serif!important;font-size:16px!important}

@media (max-width:640px){body .btn,body .mgbtn{font-size:14.5px;padding:11px 14px 9px;gap:8px;letter-spacing:.03em}body .btn small{font-size:10px}}
@media (max-width:380px){body .btn,body .mgbtn{font-size:13.5px;padding:10px 12px 8px}}
.mgdlg{outline:none;margin:auto;border:0;padding:0;background:transparent;max-width:none;width:min(1120px,94vw);max-height:92svh;color:#2E241B;overflow:visible}
.mgdlg::backdrop{background:rgba(30,24,17,.8);backdrop-filter:blur(3px)}
.mgdlg[open]{animation:mgIn .35s cubic-bezier(.2,1.1,.3,1)}
@keyframes mgIn{from{opacity:0;transform:translateY(18px) scale(.98)}}
.mgw{position:relative;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);max-height:92svh;background:#FAF5E9 url(assets/paper.jpg);background-blend-mode:multiply;border:2px solid #2E241B;box-shadow:5px 5px 0 rgba(196,89,63,.45)}
.mgx{position:absolute;right:12px;top:12px;z-index:5;width:40px;height:40px;border:1.5px solid #2E241B;background:#FAF5E9;font:600 15px 'IBM Plex Mono',monospace;cursor:pointer}
[dir=rtl] .mgx{right:auto;left:12px}
.mgv{display:flex;flex-direction:column;background:#E9DCC2 url(assets/paper.jpg);background-blend-mode:multiply;border-inline-end:2px solid #2E241B;min-height:0}
.mgstage{position:relative;flex:1;min-height:min(56svh,520px);overflow:hidden;display:grid;place-items:center;container-type:size}
.mgstage .zoomwrap{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;cursor:zoom-in}
.mgstage .zoomwrap.on{cursor:zoom-out;inset:0}
.mgstage .zoomwrap img{max-width:88cqw;max-height:84cqh;width:auto;height:auto;box-sizing:border-box;object-fit:contain;transition:transform .25s ease;background:#fff;padding:2.2%;box-shadow:0 14px 26px rgba(46,36,27,.25)}
.mgstage .zoomwrap.on img{transform:scale(2.6);box-shadow:none;padding:0;transition:transform .25s ease,transform-origin 0s}
.mgzhint{position:absolute;left:14px;bottom:12px;z-index:3;font:600 11px/1 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;background:#FAF5E9;border:1.5px solid #2E241B;padding:6px 8px 5px;pointer-events:none}
.mgthumbs{display:flex;gap:8px;padding:12px;border-top:2px solid #2E241B;background:#FAF5E9;overflow-x:auto}
.mgthumbs button{flex:none;width:86px;border:0;background:none;padding:0;cursor:pointer;font:600 10px/1.2 'IBM Plex Mono',monospace;letter-spacing:.05em;text-transform:uppercase;color:#6f604d;text-align:center}
.mgthumbs button span i{container-type:size}
.mgthumbs button span{display:block;aspect-ratio:4/3;margin-bottom:6px;border:2px solid transparent;background:#E9DCC2 center/cover;overflow:hidden;position:relative}
.mgthumbs button[aria-pressed=true]{color:#2E241B}
.mgthumbs button[aria-pressed=true] span{border-color:#C4593F}
/* mockups, drawn in code: swap for photographed mockups later */
.mk{position:absolute;inset:0}
.mk-frame{--wb:#ECE8E2;background:radial-gradient(110% 85% at 50% 38%,color-mix(in srgb,var(--wb) 55%,#fff),var(--wb) 62%,color-mix(in srgb,var(--wb) 86%,#000));transition:background .5s}
.mk-frame::after{content:"";position:absolute;inset:0;background:url(assets/paper.jpg);mix-blend-mode:multiply;opacity:.18;pointer-events:none}
.mk-frame .fr{position:absolute;left:50%;top:49%;translate:-50% -50%;background:#FBFAF7;border:1.15cqh solid #1d1b19;padding:7.5cqh 6.5cqh;box-shadow:-.5cqw 1.3cqh 1.8cqh rgba(0,0,0,.2),-.15cqw .3cqh .4cqh rgba(0,0,0,.25),inset 0 0 0 1px rgba(0,0,0,.06),inset .4cqh .6cqh .8cqh rgba(0,0,0,.08);z-index:1}
.mk-frame .fr img{display:block;max-height:52cqh;max-width:52cqw;width:auto;height:auto;box-shadow:0 0 0 1px rgba(0,0,0,.05),inset 0 0 1px #000}
.mgi{padding:clamp(22px,2.6vw,34px);overflow:auto;display:flex;flex-direction:column;gap:14px}
.mgi .kk{align-self:flex-start;font:12px/1 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#C4593F;background:#FAF5E9;border:1.5px solid #2E241B;padding:6px 9px 5px;rotate:-2deg}
.mgi h3{font:clamp(34px,2.4vw + 16px,58px)/.95 'Anton',Impact,sans-serif;text-transform:uppercase;margin:0}
.mgi .wh{font:600 21px/1.1 'Caveat','Aref Ruqaa',cursive;color:#C4593F;margin-top:-6px}
.mgi p{margin:0;color:#6f604d;font-size:15px;line-height:1.55}
.mgone{align-self:start;border:1.5px solid #2E241B;background:#2E241B;color:#FAF5E9;padding:9px 12px 8px;font:15px/1 'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.03em}
.ar-on .mgone{font-family:'Lalezar',sans-serif}
.mgopts{display:flex;flex-wrap:wrap;gap:6px}
.mgopts button{border:1.5px solid #2E241B;background:#FAF5E9;padding:8px 10px 7px;font:14px/1 'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.03em;cursor:pointer;display:flex;gap:8px;align-items:baseline}
.mgopts button small{font:11px 'IBM Plex Mono',monospace;color:#C4593F}
.mgopts button[aria-pressed=true]{background:#2E241B;color:#FAF5E9}.mgopts button[aria-pressed=true] small{color:#D9A441}
.mgopts button[disabled]{opacity:.45;cursor:not-allowed}
.mgspec{display:grid;grid-template-columns:auto 1fr;gap:0;border-top:1.5px solid #2E241B;font-size:14px}
.mgspec dt,.mgspec dd{margin:0;padding:8px 0;border-bottom:1px dashed rgba(46,36,27,.25)}
.mgspec dt{font:11px/1.6 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f604d;padding-inline-end:16px}
.mgspec dd{text-align:end}
.mgbuy{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px;position:sticky;bottom:calc(-1*clamp(22px,2.6vw,34px));z-index:4;background:#FAF5E9;margin-inline:calc(-1*clamp(22px,2.6vw,34px));padding:12px clamp(22px,2.6vw,34px);border-top:2px solid #2E241B}
.mgbuy .pr{font:clamp(26px,1.6vw + 16px,44px)/1 'Anton',Impact,sans-serif;margin-inline-end:auto}
.mgbuy{flex-wrap:nowrap}.mgbuy .mgbtn{white-space:nowrap}
@media (max-width:520px){.mgbuy .mgbtn{padding:10px 10px 8px;font-size:13.5px}.mgbuy #mggiftb .gl{display:none}}
.mgbtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:2px solid #2E241B;background:#2E241B;color:#FAF5E9;padding:12px 16px 10px;font:16px/1 'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;box-shadow:2px 2px 0 rgba(196,89,63,.4);text-decoration:none;transition:transform .15s}
.mgbtn:hover{transform:translate(-1px,-1px)}
.mgbtn.terra{background:#C4593F}.mgbtn.alt{background:#FAF5E9;color:#2E241B;box-shadow:2px 2px 0 rgba(46,36,27,.25)}
.mgbtn[disabled]{opacity:.4;pointer-events:none}
.ar-on .mgbtn,.ar-on .mgopts button,.ar-on .mgi h3{font-family:'Lalezar',sans-serif}
.mggift{display:none;border:2px solid #2E241B;background:#FFFDF8;padding:14px;gap:10px}
.mggift.on{display:grid;animation:mgIn .3s ease}
.mggift label{font:11px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f604d;display:grid;gap:5px}
.mggift input,.mggift textarea,.mgc input,.mgc textarea{width:100%;border:2px solid #2E241B;background:#fff;padding:10px 12px;font:600 18px/1.3 'Caveat','Aref Ruqaa',cursive;color:#2b3a55}
.mggift textarea,.mgc textarea{min-height:84px;resize:vertical}
.mggift .two,.mgc .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mgok{font:600 20px/1.2 'Caveat','Aref Ruqaa',cursive;color:#C4593F}
.mgnote{font:11px 'IBM Plex Mono',monospace;color:#9a8a74}
@media (max-width:820px){.mgdlg{position:fixed;inset:0;margin:0;width:100%;height:100%;max-height:none}.mgw{display:block;overflow:auto;max-height:100svh;height:100svh;border:0;box-shadow:none}.mgv{border:0;border-bottom:2px solid #2E241B}.mgstage{min-height:0;height:42svh;flex:none}.mgi{overflow:visible}.mgbuy{bottom:0;gap:8px;padding-block:10px calc(10px + env(safe-area-inset-bottom))}.mgbuy .pr{font-size:28px}.mgthumbs{padding:8px 12px}.mgthumbs button{width:70px}}

.mk-pc,.mk-stk,.mk-lap,.mk-cal,.mk-months{--wb:#ECE8E2;background:radial-gradient(110% 85% at 50% 38%,color-mix(in srgb,var(--wb) 55%,#fff),var(--wb) 62%,color-mix(in srgb,var(--wb) 86%,#000))}
.mk-pc .pcf,.mk-pc .pcb{position:absolute;width:56cqw;max-height:60cqh;aspect-ratio:3/2;background:#FBF8F1;box-shadow:0 1.4cqh 2.4cqh rgba(40,25,10,.28)}
.mk-pc .pcf{left:8%;top:12%;rotate:-6deg;padding:1.6cqw;z-index:2}
.mk-pc .pcf img{width:100%;height:100%;object-fit:cover;display:block}
.mk-pc .pcb{right:7%;bottom:12%;rotate:5deg;background:#FBF8F1 url(assets/paper.jpg);background-blend-mode:multiply;padding:3cqw;overflow:hidden}
.mk-pc .pcb::before{content:"";position:absolute;left:54%;top:10%;bottom:10%;width:1px;background:rgba(46,36,27,.35)}
.mk-pc .pcb em{position:absolute;left:5%;top:30%;width:45%;font:600 3.1cqw/1.25 'Caveat','Aref Ruqaa',cursive;color:#2b3a55;font-style:normal}
.mk-pc .pcb .st{position:absolute;right:5%;top:8%;width:12cqw;aspect-ratio:.82;background:#fff center/cover;border:.6cqw solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.3);rotate:3deg}
.mk-pc .pcb .pm{position:absolute;right:16%;top:10%;width:11cqw;aspect-ratio:1;border-radius:50%;border:1.5px solid rgba(43,58,85,.6);color:rgba(43,58,85,.75);display:grid;place-items:center;text-align:center;font:600 1.6cqw/1.2 'IBM Plex Mono',monospace;rotate:-14deg}
.mk-pc .pcb i{position:absolute;left:59%;right:6%;height:1px;background:rgba(46,36,27,.35)}
.mk-pc .pcb i:nth-of-type(1){top:56%}.mk-pc .pcb i:nth-of-type(2){top:68%}.mk-pc .pcb i:nth-of-type(3){top:80%}
.mk .sk{position:absolute;left:50%;top:50%;translate:-50% -50%;width:44cqh;max-width:46cqw;aspect-ratio:1;display:grid;place-items:center;rotate:-6deg;filter:drop-shadow(0 1cqh 1.2cqh rgba(40,25,10,.3))}
.mk .sk img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.mk .sk.rect img,.mk .sk.round img{width:100%;height:100%;object-fit:cover;border:1.6cqh solid #fff}
.mk .sk.rect{aspect-ratio:4/3}.mk .sk.round img{border-radius:50%}
.mk .sk.die img{filter:drop-shadow(0 0 0 #fff) drop-shadow(.5cqh 0 0 #fff) drop-shadow(-.5cqh 0 0 #fff) drop-shadow(0 .5cqh 0 #fff) drop-shadow(0 -.5cqh 0 #fff)}
.mk-lap .lid{position:absolute;left:50%;top:50%;translate:-50% -50%;width:72cqw;max-width:110cqh;aspect-ratio:1.5;background:linear-gradient(135deg,#bfc3c7,#9ea3a8);border-radius:2.4cqw;box-shadow:0 2cqh 3cqh rgba(30,30,30,.3),inset 0 0 0 .4cqw rgba(255,255,255,.25)}
.mk-lap .lid .cam{position:absolute;left:50%;top:50%;translate:-50% -50%;width:7cqw;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.18)}
.mk-lap .lid .sk{left:30%;top:42%;width:26cqh;max-width:26cqw;rotate:-9deg}
.mk-lap .lid .s2{position:absolute;right:16%;bottom:16%;width:10cqw;aspect-ratio:1;border-radius:50%;background:#C4593F;border:.8cqw solid #fff;rotate:12deg;box-shadow:0 .6cqh .8cqh rgba(0,0,0,.25)}
.mk-cal .cal{position:absolute;left:50%;top:50%;translate:-50% -50%;height:82%;aspect-ratio:.72;background:#FBF8F1 url(assets/paper.jpg);background-blend-mode:multiply;box-shadow:0 1.6cqh 2.6cqh rgba(40,25,10,.3);padding:5cqh 3cqh 3cqh;display:flex;flex-direction:column;gap:1.4cqh}
.mk-cal .cal .sp{position:absolute;left:6%;right:6%;top:1.4cqh;height:2cqh;background:radial-gradient(circle,#2E241B 0 38%,transparent 42%) 0 0/3.2cqh 2cqh repeat-x}
.mk-cal .cal img{width:100%;aspect-ratio:1.25;object-fit:cover;display:block}
.mk-cal .cal b{font:15cqh/.85 'Anton',Impact,sans-serif;color:#C4593F;font-weight:400}
.mk-cal .cal small{font:2.2cqh/1.1 'Anton',Impact,sans-serif;text-transform:uppercase;color:#2E241B}
.mk-cal.wall .nail{position:absolute;left:50%;top:4%;width:1.6cqh;aspect-ratio:1;border-radius:50%;background:#2E241B;translate:-50% 0;z-index:2}
.mk-cal.wall .nail::after{content:"";position:absolute;left:50%;top:50%;width:14cqh;height:7cqh;translate:-50% 0;border:.3cqh solid #6b4a2f;border-bottom:0;clip-path:polygon(50% 0,100% 100%,0 100%)}
.mk-cal.wall .cal{top:54%;height:80%}
.mk-cal .mo{flex:1;display:flex;flex-direction:column;gap:.8cqh;min-height:0}
.mk-cal .mo b{font:2.6cqh/1 'Anton',Impact,sans-serif;color:#2E241B;text-transform:uppercase}
.mk-cal .gr{flex:1;display:grid;grid-template-columns:repeat(7,1fr);gap:.3cqh}
.mk-cal .gr span{font:600 1.5cqh/1 'IBM Plex Mono',monospace;color:#2E241B;border-top:1px solid rgba(46,36,27,.25);padding-top:.4cqh}
.mk-cal .gr span.we{color:#C4593F}
.mk-months .mg12{position:absolute;inset:6%;display:grid;grid-template-columns:repeat(4,1fr);gap:2cqh;align-content:center}
.mk-months figure{margin:0;background:#fff;padding:.8cqh;box-shadow:0 .6cqh 1cqh rgba(40,25,10,.2)}
.mk-months figure:nth-child(odd){rotate:-1.5deg}.mk-months figure:nth-child(even){rotate:1.2deg}
.mk-months img{width:100%;aspect-ratio:1.2;object-fit:cover;display:block}
.mk-months figcaption{font:1.9cqh/1 'Anton',Impact,sans-serif;text-transform:uppercase;padding-top:.6cqh;text-align:center;color:#2E241B}
.mgpack{border:1.5px dashed rgba(46,36,27,.4);padding:12px;display:grid;gap:10px;background:#FFFDF8}
.mgpack .ph{display:flex;justify-content:space-between;font:12px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase}
.mgpack .sl{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.mgpack .sl>*{aspect-ratio:1;border:1.5px dashed rgba(46,36,27,.3);background:#FAF5E9;padding:3px;display:grid;place-items:center}
.mgpack .sl button{border-style:solid;border-color:#2E241B;cursor:pointer;position:relative}
.mgpack .sl>*{position:relative;overflow:visible}.mgpack .sl img{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:contain}
.mgpack .sl button::after{content:"✕";position:absolute;top:-7px;right:-7px;width:16px;height:16px;border-radius:50%;background:#2E241B;color:#fff;font:10px/16px sans-serif;text-align:center}
/* the bag drawer */
.mgbagd{position:fixed;inset:0;z-index:200;visibility:hidden;transition:visibility 0s .35s}
.mgbagd.on{visibility:visible;transition:none}
.mgbagd .sc{position:absolute;inset:0;background:rgba(30,24,17,.55);opacity:0;transition:opacity .3s}
.mgbagd.on .sc{opacity:1}
.mgbagd .pn{position:absolute;top:0;bottom:0;right:0;width:min(440px,100vw);background:#FAF5E9 url(assets/paper.jpg);background-blend-mode:multiply;border-inline-start:2px solid #2E241B;box-shadow:-6px 0 0 rgba(196,89,63,.35);display:flex;flex-direction:column;translate:105% 0;transition:translate .35s cubic-bezier(.2,.9,.3,1);color:#2E241B}
.mgbagd[dir=rtl] .pn{right:auto;left:0;translate:-105% 0;box-shadow:6px 0 0 rgba(196,89,63,.35)}
.mgbagd.on .pn{translate:0 0}
.mgbagd .hd{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:2px solid #2E241B}
.mgbagd .hd h3{margin:0;font:30px/1 'Anton',Impact,sans-serif;text-transform:uppercase}
.mgbagd .hd b{font:600 12px 'IBM Plex Mono',monospace;background:#C4593F;color:#fff;padding:4px 7px 3px}
.mgbagd .hd .x{margin-inline-start:auto;width:38px;height:38px;border:1.5px solid #2E241B;background:#FAF5E9;font:600 15px 'IBM Plex Mono',monospace;cursor:pointer}
.mgbagd .ls{flex:1;overflow:auto;padding:8px 20px;display:grid;align-content:start}
.mgbagd .it{display:grid;grid-template-columns:72px 1fr auto;gap:14px;align-items:center;padding:14px 0;border-bottom:1.5px dashed rgba(46,36,27,.25)}
.mgbagd .it .th{width:72px;aspect-ratio:1;background:#fff;padding:5px;box-shadow:2px 3px 0 rgba(46,36,27,.2);rotate:-2deg;display:grid;place-items:center}
.mgbagd .it .th img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.mgbagd .it h4{margin:0 0 4px;font:18px/1.05 'Anton',Impact,sans-serif;text-transform:uppercase}
.mgbagd .it small{display:block;font:11px/1.4 'IBM Plex Mono',monospace;color:#6f604d;letter-spacing:.04em}
.mgbagd .it .gf{font:600 17px/1.1 'Caveat','Aref Ruqaa',cursive;color:#C4593F;margin-top:3px;display:block}
.mgbagd .it .pr{display:grid;justify-items:end;gap:8px;font:22px/1 'Anton',Impact,sans-serif}
.mgbagd .it .rm{border:0;background:none;font:11px 'IBM Plex Mono',monospace;text-decoration:underline;color:#6f604d;cursor:pointer;padding:2px}
.mgbagd .em{text-align:center;padding:50px 10px;display:grid;gap:14px;justify-items:center}
.mgbagd .em p{margin:0;font:600 24px/1.2 'Caveat','Aref Ruqaa',cursive;color:#6f604d}
.mgbagd .ft{border-top:2px solid #2E241B;padding:16px 20px calc(16px + env(safe-area-inset-bottom));display:grid;gap:12px;background:#FAF5E9}
.mgbagd .ft .tt{display:flex;justify-content:space-between;align-items:baseline;font:11px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f604d}
.mgbagd .ft .tt b{font:34px/1 'Anton',Impact,sans-serif;color:#2E241B;letter-spacing:0}
.mgbagd .ft .mgbtn{width:100%}
.ar-on .mgbagd h3,.ar-on .mgbagd h4,.mgbagd[dir=rtl] h3,.mgbagd[dir=rtl] h4{font-family:'Lalezar',sans-serif}
#bag,.bag{cursor:pointer}
.mgcurl{display:inline-flex;gap:8px;align-items:center}.mgcur{background:transparent;color:inherit;border:1px solid currentColor;font:inherit;padding:3px 6px;letter-spacing:.06em}.mgcur option{color:#2E241B}
.mgacct{display:grid!important;place-items:center;text-decoration:none;color:#2E241B;padding:0!important;overflow:hidden;width:38px}
.mgacct img{width:100%;height:100%;object-fit:cover}
.mgacct b{font:16px/1 'Anton',Impact,sans-serif;color:#C4593F}

/* compose a postcard */
.mgc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0}
.mgc .cl{background:#E9DCC2 url(assets/paper.jpg);background-blend-mode:multiply;border-inline-end:2px solid #2E241B;display:grid;place-items:center;padding:clamp(18px,3vw,36px);position:relative;min-height:380px}
.mgc .cr{padding:clamp(20px,2.6vw,32px);display:grid;gap:14px;align-content:start;overflow:auto;max-height:88svh}
.mgc .pc{position:relative;width:100%;aspect-ratio:3/2;background:#FBF8F1 url(assets/paper.jpg);background-blend-mode:multiply;box-shadow:0 14px 24px rgba(46,36,27,.25);display:grid;grid-template-columns:1.15fr 1fr;padding:5%;gap:4%;container-type:inline-size;transition:transform .8s cubic-bezier(.5,0,.25,1),opacity .4s}
.mgc .pc::before{content:"";position:absolute;left:53.5%;top:9%;bottom:9%;width:1px;background:rgba(46,36,27,.35)}
.mgc .pc .m{font:600 4.4cqw/1.3 'Caveat',cursive;color:#2b3a55;white-space:pre-wrap;overflow:hidden;padding-top:6cqw;word-break:break-word}
.mgc .pc .m.ar{font-family:'Aref Ruqaa',serif;direction:rtl;text-align:right;font-size:4cqw;line-height:1.6}
.mgc .pc .r{position:relative;display:flex;flex-direction:column}
.mgc .pc .st{align-self:flex-end;width:28cqw;max-width:60%;aspect-ratio:.82;background:#fff center/cover;border:4px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.3);rotate:3deg}
.mgc .pc .pm{position:absolute;right:30%;top:2%;width:28cqw;max-width:60%;aspect-ratio:1;border-radius:50%;border:2px solid rgba(43,58,85,.7);color:rgba(43,58,85,.85);display:grid;place-items:center;text-align:center;font:600 2.4cqw/1.2 'IBM Plex Mono',monospace;rotate:-14deg;opacity:0;scale:1.6;transition:opacity .2s,scale .3s cubic-bezier(.3,1.6,.5,1)}
.mgc .pc.pmon .pm{opacity:1;scale:1}
.mgc .pc .ad{margin-top:auto;display:grid;gap:5cqw}
.mgc .pc .ad span{border-bottom:1px solid rgba(46,36,27,.35);min-height:5cqw;font:600 4.2cqw/1 'Caveat',cursive;color:#2b3a55;white-space:nowrap;overflow:hidden}
.mgc .env{position:absolute;inset:auto 8% 12% 8%;aspect-ratio:1200/840;opacity:0;transition:opacity .4s}
.mgc .env.on{opacity:1}
.mgc .env>span{position:absolute;display:block}
.mgc .env .ei{inset:0;background:url(assets/env_inside.webp) center/100% 100%}
.mgc .env .ep{inset:0;background:url(assets/env_pocket.webp) center/100% 100%;z-index:3}
.mgc .env .fl{left:0;right:0;top:0;height:60%;transform-origin:50% 0;background:url(assets/flap_out.webp) center/100% 100%;transform:rotateX(-180deg) ;opacity:0;z-index:4;transition:transform .7s cubic-bezier(.45,.05,.25,1),opacity .1s .3s}
.mgc .env.shut .fl{transform:none;opacity:1;transition:transform .7s cubic-bezier(.45,.05,.25,1),opacity .1s}
.mgc .env .sw{left:38%;top:44%;width:24%;aspect-ratio:1;background:url(assets/sealW.webp) center/100% 100%;z-index:5;opacity:0;scale:1.5;transition:opacity .2s .7s,scale .35s cubic-bezier(.3,1.7,.5,1) .7s}
.mgc .env.shut .sw{opacity:1;scale:1}
.mgc .pcw{position:relative;width:100%;z-index:2;transition:transform .8s cubic-bezier(.5,0,.25,1),opacity .3s .5s}
.mgc .pcw.go{transform:translateY(42%) scale(.7);opacity:0}
.mgc .thumbs{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}
.mgc .thumbs button{flex:none;width:74px;aspect-ratio:3/2;border:0;padding:3px;background:#fff;box-shadow:1px 2px 0 rgba(46,36,27,.2);cursor:pointer}
.mgc .thumbs button img{width:100%;height:100%;object-fit:cover}
.mgc .thumbs button[aria-pressed=true]{outline:3px solid #C4593F;outline-offset:2px}
.mgc h3{font:clamp(30px,2vw + 14px,48px)/.95 'Anton',Impact,sans-serif;text-transform:uppercase;margin:0}
.mgc label{font:11px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f604d;display:grid;gap:5px}
.mgc .share{display:none;gap:8px;flex-wrap:wrap}.mgc .share.on{display:flex}
@media (max-width:820px){.mgc{grid-template-columns:1fr}.mgc .cl{border:0;border-bottom:2px solid #2E241B;min-height:300px}.mgc .cr{max-height:none}}
.mgtoast{position:fixed;left:50%;bottom:24px;translate:-50% 20px;z-index:500;background:#2E241B;color:#FAF5E9;padding:12px 16px;font:15px 'IBM Plex Sans Arabic',system-ui;box-shadow:3px 3px 0 rgba(196,89,63,.45);opacity:0;transition:.3s;pointer-events:none}
.mgtoast.on{opacity:1;translate:-50% 0}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- 1. the Shop menu ---------- */
const MENU=[['shop.html','All products','كل المنتجات','hero','all'],['paintings.html','Paintings','لوحات','guitar'],['postcards.html','Postcards','بوست كارد','boattop'],['calendar.html','Calendar 2027','تقويم ٢٠٢٧','psea'],['stickers.html','Stickers','ستكرات','s-lemons'],['shop.html#apparel','Apparel · soon','ملابس · قريبًا','pelephant','soon']];
function buildMenu(){document.querySelectorAll('header nav a').forEach(a=>{if(!/shop\.html$/.test(a.getAttribute('href')||'')||a.closest('.mgdd'))return;
  const w=document.createElement('span');w.className='mgdd';a.parentNode.insertBefore(w,a);w.appendChild(a);
  const m=document.createElement('div');m.className='mgmenu';m.setAttribute('role','menu');w.appendChild(m);fillMenu(m);
  /* touch: first tap opens the menu, second tap follows the link */
  a.addEventListener('click',e=>{if(matchMedia('(hover:none)').matches&&!w.classList.contains('open')){e.preventDefault();w.classList.add('open')}});
  document.addEventListener('click',e=>{if(!w.contains(e.target))w.classList.remove('open')})})}
function fillMenu(m){m.innerHTML=MENU.map(([h,en,ar,k,c])=>`<a role="menuitem" href="${h}" class="${c||''}"><i style="background-image:url(${img(k)})"></i>${t(en,ar)}${c==='soon'?'':''}</a>`).join('')}
new MutationObserver(()=>document.querySelectorAll('.mgmenu').forEach(fillMenu)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

/* ---------- 2. one bag for the whole site ---------- */
const BAG={get(){try{return JSON.parse(localStorage.mgBag||'[]')}catch(e){return []}},set(a){try{localStorage.mgBag=JSON.stringify(a)}catch(e){}},
  count(){return this.get().length},remove(i){const a=this.get();a.splice(i,1);this.set(a);this.show(false);return a},clear(){this.set([]);this.show(false)},total(){return this.get().reduce((n,x)=>n+(+x.p||0),0)},add(item){const a=this.get();a.push(item||{});this.set(a);this.show(true);return a.length},
  show(bump){const n=this.count();document.querySelectorAll('#bagn').forEach(b=>b.textContent=ard(n));const sb=document.querySelector('.bag:not(.chip)');if(sb&&!sb.querySelector('#bagn'))sb.textContent=t('Bag ','السلة ')+ard(n);
    if(bump){const b=document.querySelector('#bag,.bag');if(b&&b.animate)b.animate([{transform:'scale(1.25) rotate(-6deg)'},{transform:'none'}],{duration:350})}}};
window.MGBag=BAG;
function toast(msg){let el=document.querySelector('.mgtoast');if(!el){el=document.createElement('div');el.className='mgtoast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2200)}

/* ---------- 3. the product window ---------- */
const FORMS={painting:[['file','High-res file · PDF + PNG','ملف عالي الدقة · PDF + PNG',12]],
  postcard:[['file','High-res file · PDF + PNG','ملف عالي الدقة · PDF + PNG',2]],
  sticker:[['one','Just this sticker','هالستكر لحاله',1],['pack','Add it to a pack of 6','ضيفه لباكيت ٦',3]],
  calendar:[['cal','Calendar PDF · A3 + A4','تقويم PDF · A3 + A4',8]],
  archive:[['arc','Past edition · archive','نسخة سابقة · أرشيف',0]],
  apparel:[['tee','Tee','بلوزة',0],['tote','Tote bag','شنطة',0],['mug','Mug','مج',0]]};
const VIEWSK={painting:[['art','The painting','اللوحة'],['frame','Framed','بإطار']],
  postcard:[['art','The card','البطاقة'],['pc','Front & back','وجه وظهر']],
  sticker:[['stk','The sticker','الستكر'],['lap','On a laptop','عاللابتوب']],
  calendar:[['cover','The cover','الغلاف'],['cwall','On the wall','عالحيط'],['months','12 months','١٢ شهر']],
  apparel:[['art','The painting','اللوحة']]};
/* a sticker pack you fill one sticker at a time, kept across pages */
const PACK={get(){try{return JSON.parse(localStorage.mgPack||'[]')}catch(e){return []}},set(a){try{localStorage.mgPack=JSON.stringify(a)}catch(e){}document.dispatchEvent(new CustomEvent('mgpack'))},
  add(k){const a=this.get();if(a.length>=6)return a;a.push(k);this.set(a);return a},remove(i){const a=this.get();a.splice(i,1);this.set(a)},clear(){this.set([])},
  toBag(){const a=this.get();if(a.length<6)return;BAG.add({k:'pack-'+Date.now(),kind:'sticker',t:'Your pack of 6',ta:'باكيتك · ٦ ستكرات',p:3,img:img(a[0]),pack:a});this.clear();toast(t('Your pack of 6 is in the bag ✶','باكيتك صار بالسلة ✶'))}};
window.MGPack=PACK;
let D=null,P={},view=0,form=0;
function ensureDlg(){if(D)return D;D=document.createElement('dialog');D.className='mgdlg';D.setAttribute('aria-label','Product');document.body.appendChild(D);
  D.addEventListener('click',e=>{if(e.target===D)D.close()});return D}
const WB={};
function wallTone(key,src){if(WB[key])return;const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d');x.drawImage(im,0,0,24,24);const d=x.getImageData(0,0,24,24).data;let R=0,G=0,B=0,n=0;
  const bins=new Array(12).fill(0),hs=new Array(12).fill(0),hc=new Array(12).fill(0);
  for(let i=0;i<d.length;i+=4){const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,dd=mx-mn;if(dd<.06)continue;const s=dd/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/dd)%6:mx===g?(b-r)/dd+2:(r-g)/dd+4;h*=60;if(h<0)h+=360;const w=s*(1-Math.abs(2*l-1)),k=Math.floor(h/30)%12;bins[k]+=w;hs[k]+=h*w;hc[k]+=s*w}
  let k=0;bins.forEach((v,j)=>{if(v>bins[k])k=j});if(!bins[k]){WB[key]='#ECE8E2';return}const H=hs[k]/bins[k],S=Math.min(.55,hc[k]/bins[k]);
  WB[key]=`hsl(${Math.round(H)} ${Math.round(18+S*40)}% 82%)`;document.querySelectorAll('.mk-frame').forEach(e=>e.style.setProperty('--wb',WB[key]))}catch(e){}};im.src=src}
function open(p){P=Object.assign({kind:'painting',place:'Gaza',placeAr:'غزة'},p);if(P.kind==='calendar'&&!P.key)P.key=(P.months||['hero'])[0];wallTone(p.key,img(p.key));view=0;form=Math.max(0,(FORMS[P.kind]||FORMS.painting).findIndex(f=>f[0]===P.form));render();const d=ensureDlg();if(!d.open)d.showModal();try{(window.peel||(()=>{}))()}catch(e){}}
const isCal=()=>P.kind==='calendar';
const views=()=>VIEWSK[P.kind]||VIEWSK.painting;
function mock(id){const s=img(P.key),wb=`--wb:${WB[P.key]||'#ECE8E2'}`,sh=P.shape||'rect';
  if(id==='art')return `<div class="zoomwrap" id="mgz"><img src="${P.big||s}" alt="${esc(t(P.title,P.titleAr))}" draggable="false"></div><span class="mgzhint">${t('click to zoom','اضغط لتكبّر')}</span>`;
  if(id==='frame')return `<div class="mk mk-frame" style="${wb}"><div class="fr"><img src="${s}" alt=""></div></div>`;
  if(id==='pc')return `<div class="mk mk-pc" style="${wb}"><div class="pcb"><span class="st" style="background-image:url(${img(STAMPK[(P.no||0)%6])})"></span><span class="pm">GAZA<br>✶</span><em>${t('Dear Lina,<br>a little piece of Gaza for you…','عزيزتي لينا،<br>قطعة صغيرة من غزة إلك…')}</em><i></i><i></i><i></i></div><div class="pcf"><img src="${s}" alt=""></div></div>`;
  if(id==='stk')return `<div class="mk mk-stk" style="${wb}"><div class="sk ${sh}"><img src="${s}" alt=""></div></div>`;
  if(id==='lap')return `<div class="mk mk-lap" style="${wb}"><div class="lid"><span class="cam"></span><div class="sk ${sh}"><img src="${s}" alt=""></div><span class="s2"></span></div></div>`;
  if(id==='cover')return `<div class="mk mk-cal" style="${wb}"><div class="cal"><span class="sp"></span><img src="${P.coverSrc||s}" alt=""><b>${ard(P.year||2027)}</b><small>${t('Twelve months painted in Gaza','١٢ شهر مرسومين في غزة')}</small></div></div>`;
  if(id==='cwall'){const m0=(P.months||[])[0]||P.key;return `<div class="mk mk-cal wall" style="${wb}"><span class="nail"></span><div class="cal"><span class="sp"></span><img src="${img(m0)}" alt=""><div class="mo"><b>${t('January','كانون الثاني')} ${ard(P.year||2027)}</b><div class="gr">${Array.from({length:35},(_,i)=>`<span class="${i%7===6||i%7===5?'we':''}">${i>2&&i<34?ard(i-2):''}</span>`).join('')}</div></div></div></div>`}
  if(id==='months'){const MN=AR()?['كانون٢','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين١','تشرين٢','كانون١']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `<div class="mk mk-months" style="${wb}"><div class="mg12">${(P.months||[]).map((k,i)=>`<figure><img src="${img(k)}" alt="" loading="lazy"><figcaption>${MN[i]}</figcaption></figure>`).join('')}</div></div>`}
  return ''}
function specs(f){const row=(a,b)=>`<dt>${a}</dt><dd>${b}</dd>`,dl=row(t('Delivery','التوصيل'),t('Instant download','تحميل فوري'));
  if(P.kind==='calendar')return row(t('Pages','الصفحات'),t('13 · a cover and 12 months','١٣ · غلاف و١٢ شهر'))+row(t('You get','بتاخذ'),t('PDF in A3 and A4','PDF بمقاسين A3 وA4'))+row(t('Months','الأشهر'),t('English and Levantine Arabic','إنجليزي وعربي شامي'))+row(t('Weekend','العطلة'),t('Fridays & Saturdays marked','الجمعة والسبت معلّمين'))+(P.archive?row(t('Edition','النسخة'),t('Sold out · shown as an archive','خلصت · معروضة كأرشيف')):dl);
  if(P.kind==='sticker')return row(t('You get','بتاخذ'),t('Transparent PNG + WhatsApp & Telegram','PNG شفاف + واتساب وتيليغرام'))+row(t('Size','المقاس'),'1000 × 1000 px')+row(t('A pack of 6','باكيت ٦'),t('Mix any six for €3','اختار أي ٦ بـ€٣'))+dl;
  return row(t('Original','الأصل'),t('Watercolour on cotton paper','ألوان مائية على ورق قطني'))+row(t('Original size','مقاس الأصل'),esc(P.size||'21 × 29.7 cm'))+row(t('You get','بتاخذ'),t('PDF + PNG · full resolution, 300 dpi','PDF + PNG · بأعلى دقة، ٣٠٠ dpi'))+row(t('Painted in','مكانها'),esc(t(P.place,P.placeAr)))+dl}
function packBox(){const a=PACK.get();return `<div class="mgpack"><div class="ph"><b>${t('Your pack','باكيتك')}</b><span>${ard(a.length)} / ${ard(6)}</span></div><div class="sl">${Array.from({length:6},(_,i)=>a[i]?`<button data-prm="${i}" aria-label="${t('Remove','شيل')}"><img src="${img(a[i])}" alt=""></button>`:'<span></span>').join('')}</div>${a.length>=6?`<button class="mgbtn terra" id="mgpackbag">${t('Put the pack in the bag · €3','حط الباكيت بالسلة · €٣')}</button>`:`<span class="mgnote">${t('Pick “Add it to a pack of 6”, then keep adding stickers.','اختار «ضيفه لباكيت ٦» وكمّل ضيف ستكرات.')}</span>`}</div>`}
function render(){const d=ensureDlg(),V=views(),F=P.archive?FORMS.archive:(FORMS[P.kind]||FORMS.painting),f=F[form]||F[0],soon=!f[3];d.dir=AR()?'rtl':'ltr';
  d.innerHTML=`<div class="mgw"><button class="mgx" aria-label="Close">✕</button>
   <div class="mgv"><div class="mgstage" id="mgstage">${mock((V[view]||V[0])[0])}</div>
     <div class="mgthumbs">${V.map((v,i)=>`<button data-v="${i}" aria-pressed="${i===view}"><span>${v[0]==='art'?`<i style="position:absolute;inset:8%;background:url(${img(P.key)}) center/cover"></i>`:`<i dir="ltr" style="position:absolute;left:0;top:0;transform:scale(.25);transform-origin:0 0;width:400%;height:400%">${mock(v[0])}</i>`}</span>${t(v[1],v[2])}</button>`).join('')}</div></div>
   <div class="mgi">
     <span class="kk">${esc(t(P.kindLabel||'Painting',P.kindLabelAr||'لوحة'))}${P.no?' · Nº '+ard(String(P.no).padStart(2,'0')):''}</span>
     <h3>${esc(t(P.title,P.titleAr))}</h3>
     <div class="wh">${P.sub?esc(t(...P.sub)):t((P.kind==='sticker'?'Cut from a painting from ':'Painted in ')+P.place,(P.kind==='sticker'?'مقصوص من لوحة من ':'انرسمت في ')+P.placeAr)}</div>
     <p>${esc(t(P.story||"A watercolour by Farah Al-Helou, painted by hand in Gaza. Farah's words about this painting go here: the day, the place, and what she wanted to keep from it.",P.storyAr||'لوحة مائية رسمتها فرح الحلو بإيدها في غزة. هون بتنكتب كلمة فرح عن اللوحة: اليوم، والمكان، وشو حبّت تحفظ منه.'))}</p>
     ${F.length>1?`<div class="mgopts">${F.map((x,i)=>`<button data-f="${i}" aria-pressed="${i===form}">${t(x[1],x[2])}<small>${x[3]?'€'+x[3]:t('soon','قريبًا')}</small></button>`).join('')}</div>`:`<div class="mgone">${t(F[0][1],F[0][2])}</div>`}
     <dl class="mgspec">${specs(f)}</dl>${P.kind==='sticker'&&!P.archive?packBox():''}
     <div class="mgbuy"><span class="pr">${P.archive?ard(P.year):soon?t('Coming soon','قريبًا'):'€'+f[3]}</span><button class="mgbtn terra" id="mgadd" ${soon?'disabled':''}>${P.archive?t('Archive','أرشيف'):f[0]==='pack'?t('Add to my pack','ضيفه لباكيتي'):t('Add to bag','أضف للسلة')}</button>${P.kind==='postcard'?`<button class="mgbtn alt" id="mgwrite"><span class="gl">${t('Write & send','اكتبها وابعتها')}</span> ✎</button>`:P.kind==='sticker'||P.archive?'':`<button class="mgbtn alt" id="mggiftb" aria-label="${t('Send it to someone','ابعثها لحد')}" ${soon?'disabled':''}><span class="gl">${t('Send it to someone','ابعثها لحد')}</span> ✉</button>`}</div>
     <div class="mggift" id="mggift">
       <div class="two"><label>${t('Their name','اسمه')}<input id="mgto" maxlength="40" placeholder="${t('Lina','لينا')}"></label><label>${t('Their email','إيميله')}<input id="mgem" type="email" maxlength="80" placeholder="lina@email.com" style="font:15px 'IBM Plex Sans Arabic',system-ui"></label></div>
       <label>${t('A note for them','كلمة إلهم')}<textarea id="mgmsg" maxlength="200" placeholder="${t('A little piece of Gaza for you…','قطعة صغيرة من غزة إلك…')}"></textarea></label>
       <button class="mgbtn" id="mggiftadd">${t('Buy as a gift','اشتريها هدية')} · €${f[3]||0}</button>
       <span class="mgnote">${t('We send it to them by email, with your note, once you check out.','بنبعتها إلهم على الإيميل مع كلمتك بعد الدفع.')}</span>
     </div>
     <span class="mgnote">${t('* placeholder prices and specs for the prototype','* الأسعار والمواصفات مؤقتة للنموذج')}</span>
   </div></div>`;
  d.querySelector('.mgx').onclick=()=>d.close();
  d.querySelectorAll('.mgthumbs button').forEach(b=>b.onclick=()=>{view=+b.dataset.v;render()});
  d.querySelectorAll('.mgopts button').forEach(b=>b.onclick=()=>{form=+b.dataset.f;render()});
  const z=d.querySelector('#mgz');if(z){const im=z.querySelector('img');
    z.onclick=e=>{z.classList.toggle('on');move(e)};
    const move=e=>{if(!z.classList.contains('on'))return;const r=z.getBoundingClientRect(),x=((e.clientX-r.left)/r.width*100),y=((e.clientY-r.top)/r.height*100);im.style.transformOrigin=`${x}% ${y}%`};
    z.onpointermove=move}
  const wr=d.querySelector('#mgwrite');if(wr)wr.onclick=()=>compose(P.key,P.title,P.titleAr);
  d.querySelectorAll('[data-prm]').forEach(b=>b.onclick=()=>{PACK.remove(+b.dataset.prm);render()});
  const pb=d.querySelector('#mgpackbag');if(pb)pb.onclick=()=>{PACK.toBag();render()};
  const addb=d.querySelector('#mgadd');if(addb&&f[0]==='pack')addb.onclick=()=>{const a=PACK.get();if(a.length>=6){toast(t('Your pack is full, put it in the bag','الباكيت مليان، حطّه بالسلة'));return}PACK.add(P.key);render();toast(t(`${P.title} is in your pack · ${PACK.get().length}/6`,`${P.titleAr} صار بباكيتك · ${ard(PACK.get().length)}/٦`))};
  else if(addb)addb.onclick=()=>{BAG.add({k:P.key,kind:P.kind,t:P.kind==='calendar'?`Calendar ${P.year}`:P.title,ta:P.kind==='calendar'?`تقويم ${ard(P.year)}`:P.titleAr,f:f[0],p:f[3],img:P.kind==='calendar'?(P.coverSrc||img(P.key)):undefined});addb.textContent=t('Added ✓','انضافت ✓');toast(t(`${P.title} · ${f[1]} is in your bag`,`${P.titleAr} · ${f[2]} صارت بالسلة`))};
  const gb=d.querySelector('#mggiftb');if(gb)gb.onclick=()=>{d.querySelector('#mggift').classList.toggle('on');setTimeout(()=>d.querySelector('#mgto')?.focus(),50)};
  const ga=d.querySelector('#mggiftadd');if(ga)ga.onclick=()=>{const to=d.querySelector('#mgto').value.trim(),em=d.querySelector('#mgem').value.trim();
    if(!to||!/.+@.+\..+/.test(em)){d.querySelector(to?'#mgem':'#mgto').focus();toast(t('Add their name and email','اكتب اسمه وإيميله'));return}
    BAG.add({k:P.key,kind:P.kind,t:P.title,ta:P.titleAr,f:f[0],p:f[3],gift:{to,em,m:d.querySelector('#mgmsg').value}});d.querySelector('#mggift').innerHTML=`<span class="mgok">${t(`A gift for ${esc(to)} is in your bag ✶ We'll send it with your note.`,`هدية لـ${esc(to)} صارت بالسلة ✶ بنبعتها مع كلمتك.`)}</span>`}}
window.MGProduct={open};

/* ---------- 4. send a postcard to someone you love ---------- */
const PCS=[['hero','Gaza Coast','ساحل غزة'],['blueflowers','White Dove','الحمامة البيضاء'],['waves','The Waves','الموج'],['boatman','The Boatman','الصياد'],['house','Home','البيت'],['ppoppies','Blue Poppies','شقائق زرقاء'],['dovegirl','Dove Girl','فتاة الحمام'],['pcartgirl','Girl with Cart','فتاة والعربة'],['pflower','Big Flower','الزهرة الكبيرة'],['hill','Hill & Boat','التلة والقارب'],['boattop','The Boat','القارب'],['psea','Sea & Clouds','بحر وغيوم'],['alley','The Alley','الزقاق'],['sparklers','Sparkler Night','ليلة الشماريخ'],['guitar','Guitar Girl','فتاة الجيتار']];
const STAMPK=['plemons','psea','pmoon','ptree','pwhale','pflower'];
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
let C=null,cs={c:0,m:'',to:'',f:''};
function compose(k,ti,ta){if(typeof k==='string'){let i=PCS.findIndex(p=>p[0]===k);if(i<0){PCS.push([k,ti||k,ta||ti||k]);i=PCS.length-1}cs.c=i}const d=ensureDlg();d.dir=AR()?'rtl':'ltr';const isAr=s=>/[؀-ۿ]/.test(s);
  const day=new Date(),dd=`${String(day.getDate()).padStart(2,'0')}·${String(day.getMonth()+1).padStart(2,'0')}·${String(day.getFullYear()).slice(2)}`;
  d.innerHTML=`<div class="mgw" style="grid-template-columns:1fr"><button class="mgx" aria-label="Close">✕</button><div class="mgc">
   <div class="cl"><div class="pcw" id="mgpcw"><div class="pc" id="mgpc"><div class="m" id="mgm"></div><div class="r"><span class="st" style="background-image:url(${img(STAMPK[cs.c%6])})"></span><span class="pm">GAZA<br>${dd}<br>✶</span><div class="ad"><span id="mgadto"></span><span></span><span></span></div></div></div></div>
     <div class="env" id="mgenv"><span class="ei"></span><span class="ep"></span><span class="fl"></span><span class="sw"></span></div></div>
   <div class="cr"><span class="kk" style="align-self:start;font:12px/1 'IBM Plex Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#C4593F;background:#FAF5E9;border:1.5px solid #2E241B;padding:6px 9px 5px;rotate:-2deg;justify-self:start">${t('A postcard from Gaza','بوست كارد من غزة')}</span>
     <h3>${t('Send it to someone you love','ابعتها لحد بتحبه')}</h3>
     <div class="thumbs" id="mgth">${PCS.map((p,i)=>`<button data-i="${i}" aria-pressed="${i===cs.c}" aria-label="${esc(t(p[1],p[2]))}"><img src="${img(p[0])}" alt="" loading="lazy"></button>`).join('')}</div>
     <label>${t('Your message','رسالتك')}<textarea id="mgcm" maxlength="220" placeholder="${t('Dear Lina, a little piece of Gaza for you…','عزيزتي لينا، قطعة صغيرة من غزة إلك…')}">${esc(cs.m)}</textarea></label>
     <div class="two"><label>${t('To','لمين')}<input id="mgct" maxlength="40" value="${esc(cs.to)}" placeholder="${t('Lina, Glasgow','لينا، غلاسكو')}"></label><label>${t('From','منك')}<input id="mgcf" maxlength="30" value="${esc(cs.f)}" placeholder="${t('Farah','فرح')}"></label></div>
     <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="mgbtn terra" id="mgseal">${t('Postmark & seal','اختمها وسكّر الظرف')}</button><a class="mgbtn alt" href="postcards.html#write">${t('More options','خيارات أكثر')}</a></div>
     <div class="share" id="mgshare"><span class="mgok" style="flex-basis:100%">${t('Sealed in Gaza ✶ now send it:','انختمت من غزة ✶ هلأ ابعتها:')}</span><a class="mgbtn" id="mgwa" target="_blank" rel="noopener">WhatsApp</a><a class="mgbtn alt" id="mgmail">${t('Email','إيميل')}</a><button class="mgbtn alt" id="mgcopy">${t('Copy link','انسخ الرابط')}</button></div>
     <span class="mgnote">${t('Free to send. The link opens an envelope for them; your words live inside the link itself.','الإرسال ببلاش. الرابط بيفتحلهم ظرف، وكلامك محفوظ جوّا الرابط نفسه.')}</span>
   </div></div></div>`;
  const pc=d.querySelector('#mgpc'),bg=()=>{pc.style.background=''};
  const upd=()=>{const m=d.querySelector('#mgm');m.textContent=(cs.m||t('Dear…','عزيزي…'))+(cs.f?'\n— '+cs.f:'');m.classList.toggle('ar',isAr(cs.m));d.querySelector('#mgadto').textContent=cs.to};
  const front=()=>{};upd();
  d.querySelector('.mgx').onclick=()=>d.close();
  d.querySelector('#mgth').onclick=e=>{const b=e.target.closest('button');if(!b)return;cs.c=+b.dataset.i;d.querySelectorAll('#mgth button').forEach(x=>x.setAttribute('aria-pressed',x===b));d.querySelector('.st').style.backgroundImage=`url(${img(STAMPK[cs.c%6])})`;
    pc.animate([{transform:'rotateY(0)'},{transform:'rotateY(90deg)'},{transform:'rotateY(0)'}],{duration:500});};
  [['#mgcm','m'],['#mgct','to'],['#mgcf','f']].forEach(([s,k])=>d.querySelector(s).oninput=e=>{cs[k]=e.target.value;upd()});
  d.querySelector('#mgseal').onclick=async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));pc.classList.add('pmon');await w(700);const env=d.querySelector('#mgenv');env.classList.add('on');await w(300);
    d.querySelector('#mgpcw').classList.add('go');await w(800);env.classList.add('shut');await w(1100);
    const base=location.href.replace(/[^/]*([?#].*)?$/,''),L=base+'postcards.html?pc='+enc({c:cs.c,s:cs.c%6,m:cs.m,t:cs.to,f:cs.f}),txt=t('A postcard from Gaza for you ✶','بوست كارد من غزة إلك ✶');
    d.querySelector('#mgwa').href='https://wa.me/?text='+encodeURIComponent(txt+'\n'+L);d.querySelector('#mgmail').href='mailto:?subject='+encodeURIComponent(txt)+'&body='+encodeURIComponent(txt+'\n\n'+L);
    d.querySelector('#mgcopy').onclick=async()=>{try{await navigator.clipboard.writeText(L);toast(t('Link copied','انتسخ الرابط'))}catch(e){prompt('Link',L)}};
    d.querySelector('#mgshare').classList.add('on')};
  if(!d.open)d.showModal()}
window.MGCompose=compose;

/* ---------- 6. accounts (prototype: kept in this browser; the real site uses a server + Google sign-in) ---------- */
const LS={get(k,d){try{return JSON.parse(localStorage[k]||'null')??d}catch(e){return d}},set(k,v){try{localStorage[k]=JSON.stringify(v)}catch(e){}}};
const USER={get(){return LS.get('mgUser',null)},
  set(u){LS.set('mgUser',u);const all=LS.get('mgUsers',{});if(u)all[u.email]=Object.assign(all[u.email]||{},u);LS.set('mgUsers',all);paintAcct()},
  find(em){return LS.get('mgUsers',{})[em]||null},
  out(){LS.set('mgUser',null);paintAcct()},
  async hash(pw){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mg:'+pw));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return 'x'+pw.length}},
  orders(){const u=this.get();return LS.get('mgOrders',[]).filter(o=>!u||o.em===u.email)},
  addOrder(o){const a=LS.get('mgOrders',[]);a.unshift(o);LS.set('mgOrders',a)}};
window.MGUser=USER;
function paintAcct(){const u=USER.get();document.querySelectorAll('.mgacct').forEach(a=>{a.href=u?'profile.html':'account.html';a.setAttribute('aria-label',u?t('Your profile','بروفايلك'):t('Sign in','سجّل دخول'));
  a.innerHTML=u?(u.photo?`<img src="${u.photo}" alt="">`:`<b>${esc((u.name||u.email||'?').trim()[0].toUpperCase())}</b>`):'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>'})}
function addAcct(){const tools=document.querySelector('header .tools');if(tools&&!tools.querySelector('.mgacct')){const a=document.createElement('a');a.className='chip mgacct';const bag=tools.querySelector('#bag,.bag');tools.insertBefore(a,bag||null)}
  const sh=document.querySelector('header>.bag');if(sh&&!document.querySelector('.mgacct')){const a=document.createElement('a');a.className='chip mgacct';sh.parentNode.insertBefore(a,sh)}
  const st=document.querySelector('footer a[href="story.html"]');const ul=st&&st.closest('ul');if(ul&&!ul.querySelector('[href="help.html"]')){ul.insertAdjacentHTML('beforeend',`<li><a href="help.html" data-ar="المساعدة والتواصل">Help &amp; contact</a></li><li><a href="terms.html" data-ar="الشروط والخصوصية">Terms &amp; privacy</a></li><li><a href="account.html" data-ar="حسابي">Your account</a></li>`);ul.querySelectorAll('[data-ar]').forEach(e=>{e.dataset.en=e.innerHTML;if(AR())e.innerHTML=e.dataset.ar})}
  paintAcct()}
new MutationObserver(paintAcct).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

/* ---------- 7. local currency: prices are kept in euros and shown in the visitor's currency.
   Prototype: guessed from the time zone. Real site: Cloudflare's CF-IPCountry header, same price table. ---------- */
const CUR={EUR:['€',1],USD:['$',1.08],GBP:['£',.85],ILS:['₪',4]};
function guessCur(){try{const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
  if(/^Asia\/(Gaza|Hebron|Jerusalem|Tel_Aviv)/.test(z))return 'ILS';if(/^Europe\/(London|Belfast|Guernsey|Jersey|Isle_of_Man)/.test(z))return 'GBP';
  if(/^Europe\//.test(z))return 'EUR';if(/^(America|Pacific\/Honolulu)/.test(z))return 'USD';return 'USD'}catch(e){return 'EUR'}}
let cur=(()=>{try{return localStorage.mgCur||guessCur()}catch(e){return guessCur()}})();if(!CUR[cur])cur='EUR';
const toLat=s=>s.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const money=e=>{const [sym,r]=CUR[cur],v=cur==='EUR'?e:Math.max(1,Math.round(e*r));return sym+ard(v)};
window.MGCur={get:()=>cur,money,set(c){if(!CUR[c])return;try{localStorage.mgCur=c}catch(e){}location.reload()}};
function convText(n){if(cur==='EUR'||!n.nodeValue||n.nodeValue.indexOf('€')<0)return;if(n.parentElement&&n.parentElement.closest('select,script,style'))return;const v0=n.nodeValue,v1=v0.replace(/€\s?([\d٠-٩]+(?:[.,][\d٠-٩]+)?)/g,(m,v)=>money(parseFloat(toLat(v).replace(',','.')))).replace(/([\d٠-٩]+(?:[.,][\d٠-٩]+)?)\s?€/g,(m,v)=>money(parseFloat(toLat(v).replace(',','.'))));if(v1!==v0)n.nodeValue=v1}
function convAll(root){if(cur==='EUR')return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())convText(n)}
function curSelect(){const L=document.querySelector('footer .legal');if(!L||L.querySelector('.mgcur'))return;
  L.insertAdjacentHTML('beforeend',`<label class="mgcurl">${t('Currency','العملة')} <select class="mgcur" aria-label="Currency">${Object.keys(CUR).map(c=>`<option value="${c}" ${c===cur?'selected':''}>${CUR[c][0]} ${c}</option>`).join('')}</select></label>`);
  L.querySelector('.mgcur').onchange=e=>MGCur.set(e.target.value)}
if(cur!=='EUR')new MutationObserver(ms=>ms.forEach(m=>{if(m.type==='characterData')convText(m.target);else m.addedNodes.forEach(x=>x.nodeType===3?convText(x):x.nodeType===1&&convAll(x))})).observe(document.documentElement,{childList:true,subtree:true,characterData:true});

/* ---------- 5. the bag drawer ---------- */
const KIND={painting:['Painting · PDF + PNG','لوحة · PDF + PNG'],postcard:['Postcard · PDF + PNG','بوست كارد · PDF + PNG'],sticker:['Stickers · PNG + WhatsApp','ستكرات · PNG + واتساب'],calendar:['PDF · A3 + A4','PDF · A3 + A4']};
const itemSrc=x=>x.img||(x.k?img(x.k):'assets/hero.webp');
const itemName=x=>t(x.t||'Mass & Grass piece',x.ta||x.t||'قطعة من ماس اند جراس');
const itemKind=x=>t(...(KIND[x.kind]||['Digital file','ملف رقمي']));
let BD=null;
function bagDrawer(){if(!BD){BD=document.createElement('div');BD.className='mgbagd';BD.setAttribute('role','dialog');BD.setAttribute('aria-modal','true');document.body.appendChild(BD);
    BD.addEventListener('click',e=>{if(e.target.closest('.sc,.x,[data-close]'))closeBag();const rm=e.target.closest('[data-rm]');if(rm){BAG.remove(+rm.dataset.rm);fillBag()}});
    addEventListener('keydown',e=>{if(e.key==='Escape'&&BD.classList.contains('on'))closeBag()})}
  fillBag();BD.dir=AR()?'rtl':'ltr';requestAnimationFrame(()=>BD.classList.add('on'));document.documentElement.style.overflow='hidden';setTimeout(()=>BD.querySelector('.x')?.focus(),50)}
function closeBag(){if(!BD)return;BD.classList.remove('on');document.documentElement.style.overflow=''}
function fillBag(){const a=BAG.get(),n=a.length;
  BD.innerHTML=`<div class="sc"></div><aside class="pn" aria-label="${t('Your bag','سلتك')}"><div class="hd"><h3>${t('Your bag','سلتك')}</h3><b>${ard(n)}</b><button class="x" aria-label="${t('Close','سكّر')}">✕</button></div>
   ${n?`<div class="ls">${a.map((x,i)=>`<div class="it"><span class="th"><img src="${esc(itemSrc(x))}" alt=""></span><div><h4>${esc(itemName(x))}</h4><small>${esc(itemKind(x))}</small>${x.gift?`<span class="gf">${t('A gift for ','هدية لـ')}${esc(x.gift.to)} ✉</span>`:''}${x.note?`<span class="gf">${t('For ','لـ')}${esc(x.note)}</span>`:''}</div><div class="pr">€${ard(+x.p||0)}<button class="rm" data-rm="${i}">${t('Remove','شيل')}</button></div></div>`).join('')}</div>
   <div class="ft"><div class="tt">${t('Total','المجموع')}<b>€${ard(BAG.total())}</b></div><a class="mgbtn terra" href="checkout.html">${t('Checkout','ادفع')} →</a><span class="mgnote" style="text-align:center">${t('Digital files · sent to your email right after you pay','ملفات رقمية · بتوصل إيميلك بعد الدفع مباشرة')}</span></div>`
   :`<div class="ls"><div class="em"><p>${t('Your bag is empty, for now.','السلة فاضية، لهلأ.')}</p><a class="mgbtn" href="shop.html">${t('Go to the shop','روح عالمتجر')}</a><button class="mgbtn alt" data-close>${t('Keep looking','كمّل تفرّج')}</button></div></div>`}</aside>`;
  BAG.show(false)}
window.MGBag.open=bagDrawer;window.MGBag.close=closeBag;
document.addEventListener('click',e=>{const b=e.target.closest('#bag,.bag');if(!b||b.closest('.mgbagd'))return;if(/checkout\.html/.test(location.pathname))return;e.preventDefault();e.stopPropagation();bagDrawer()},true);

function init(){buildMenu();addAcct();curSelect();convAll(document.body);BAG.show(false)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
