# Step reel.html frame by frame in Chromium (with motion blur) and encode the video.
#   REEL_WORK=dir python3 capture.py video out.mp4      -> silent MP4 + events.json next to it
#   REEL_WORK=dir python3 capture.py stills 0 3.5 12     -> still_<t>.jpg in REEL_WORK
import base64, functools, http.server, json, os, shutil, subprocess, sys, threading
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.environ.get('REEL_WORK', 'reelwork'))
shutil.copy(HERE + '/reel.html', WORK + '/reel.html')
http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=WORK))
threading.Thread(target=srv.serve_forever, daemon=True).start()
FPS = 30
mode = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.on('pageerror', lambda e: print('pageerror:', e))
    pg.goto(f'http://127.0.0.1:{srv.server_port}/reel.html?capture', wait_until='load')
    pg.evaluate('window.ready')
    dur = pg.evaluate('DUR')
    grab = lambda t, blur: base64.b64decode(pg.evaluate(f'frame({t}, {FPS}, {blur})').split(',')[1])
    if mode == 'stills':
        for t in sys.argv[2:]:
            open(f'{WORK}/still_{t}.jpg', 'wb').write(grab(float(t), 1))
    else:
        out = sys.argv[2]
        json.dump(pg.evaluate('window.EVENTS'), open(os.path.splitext(out)[0] + '.events.json', 'w'), indent=1)
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                               '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out],
                              stdin=subprocess.PIPE)
        for f in range(int(FPS * dur)):
            ff.stdin.write(grab(f / FPS, int(os.environ.get('BLUR', 5))))
            if f % 150 == 0: print('frame', f, flush=True)
        ff.stdin.close(); ff.wait()
    b.close()
