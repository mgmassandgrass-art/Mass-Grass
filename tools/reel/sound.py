# Score and sound effects for the painting reel, synthesised from scratch and placed on the
# events reel.html exports (capture.py writes them next to the video as <name>.events.json).
#   python3 sound.py reel.events.json out.wav [duration]
# Music: a light Arab ensemble (oud plucks, darbuka, riq, ney, a warm pad) in D harmonic minor,
# maqsum rhythm at 100 bpm. It starts when the bus leaves the globe, thins out for the night,
# and resolves to D major on the logo. Every action gets its own sound, panned to where it is.
import json, sys
import numpy as np

SR = 44100
EV = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 30.0
N = int(SR * DUR)
rs = np.random.RandomState(1)
music = np.zeros((2, N)); sfx = np.zeros((2, N))

def ev(kind, who=None):
    return [e for e in EV if e['type'] == kind and (who is None or e.get('who') == who)]
def first(kind, who=None):
    return ev(kind, who)[0]['t']

# ---------- building blocks ----------
def tt(d): return np.arange(int(d * SR)) / SR
def env_ad(d, a=.005, k=6.0):
    t = tt(d); return np.minimum(t / a, 1) * np.exp(-k * t)
def lp(x, fc):  # one-pole low-pass
    from scipy.signal import lfilter
    a = np.exp(-2 * np.pi * fc / SR)
    return lfilter([1 - a], [1, -a], x)
def bp(x, lo, hi):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, fc):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(2, fc, 'highpass', fs=SR, output='sos'), x)
def noise(d): return rs.randn(int(d * SR))
def chirp(f0, f1, d, curve=2.0):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** (1 / curve if f1 > f0 else curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

def put(bus, t0, x, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or len(x) == 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i:i + len(x)] += x * l * 1.41; bus[1, i:i + len(x)] += x * r * 1.41

# ---------- instruments ----------
def oud(f, d=1.2, bright=.6):
    # Karplus-Strong pluck, vectorised one period at a time, with a soft wooden body
    P = int(SR / f); n = int(d * SR)
    y = np.zeros(1 + P + n)
    y[1:1 + P] = lp(rs.uniform(-1, 1, P), 2000 + 6000 * bright)
    for s in range(1 + P, len(y), P):
        e = min(s + P, len(y))
        y[s:e] = .996 * .5 * (y[s - P:e - P] + y[s - P - 1:e - P - 1])
    y = y[1 + P:]
    body = bp(y, 180, 2400) * .6 + y * .4
    return body * env_ad(d, .002, 1.6) * .5

def dum(): t = tt(.45); return (np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-t * 22)) / SR) * np.exp(-t * 7) + .15 * lp(noise(.45), 400) * np.exp(-t * 30)) * .9
def tak(): return (bp(noise(.12), 2200, 5200) * np.exp(-tt(.12) * 45) + .4 * np.sin(2 * np.pi * 3300 * tt(.12)) * np.exp(-tt(.12) * 70)) * .45
def riq(): return hp(noise(.09), 6000) * np.exp(-tt(.09) * 40) * .22
def bell(f, d=2.0, k=2.2):
    t = tt(d); x = np.zeros_like(t)
    for m, a, dk in [(1, 1, 1), (2.76, .5, 1.7), (5.4, .25, 2.6), (8.93, .12, 3.5)]:
        x += a * np.sin(2 * np.pi * f * m * t) * np.exp(-k * dk * t)
    return x * np.minimum(t / .002, 1) * .3
def ney(f, d, vib=5.2):
    t = tt(d); fv = f * (1 + .006 * np.sin(2 * np.pi * vib * t) * np.minimum(t / .4, 1))
    ph = 2 * np.pi * np.cumsum(fv) / SR
    tone = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    breath = bp(noise(d), f * .8, f * 3) * .25
    e = np.minimum(t / .18, 1) * np.minimum((d - t) / .25, 1)
    return (tone + breath) * np.clip(e, 0, 1) * .22
def pad(freqs, d, a=1.2, r=1.5):
    t = tt(d); x = np.zeros_like(t)
    for f in freqs:
        for det in (-.004, .004):
            for h in range(1, 7):
                x += np.sin(2 * np.pi * f * (1 + det) * h * t + rs.rand() * 6) / h ** 1.6
    e = np.minimum(t / a, 1) * np.clip((d - t) / r, 0, 1)
    return lp(x, 1600) * e * .05

D4 = 293.66
def note(semi, base=D4): return base * 2 ** (semi / 12)

# ---------- reverb ----------
def reverb(x, secs=1.8, mix=.22):
    n = int(secs * SR); t = np.arange(n) / SR
    from scipy.signal import fftconvolve
    out = np.empty_like(x)
    for c in range(2):
        ir = np.random.RandomState(10 + c).randn(n) * np.exp(-t * 6.9 / secs)
        ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
        out[c] = fftconvolve(x[c], ir)[:x.shape[1]]
    return x * (1 - mix) + out * mix * 1.4

# ---------- music ----------
start = first('peel', 'bus')              # the bus leaves the globe
night = first('night'); moon = first('moon'); logo = first('logo'); stop = first('stop')
BEAT = 60 / 100; E8 = BEAT / 2
# hook: music-box notes falling with the snow
for i, tt0 in enumerate(np.arange(.15, start - .1, .17)):
    put(music, tt0 + rs.rand() * .05, bell(note(rs.choice([12, 15, 17, 19, 20, 24]), D4 * 2), 1.4, 3.0), .35, rs.uniform(-.6, .6))
# maqsum: D T . T D . T .
MAQ = ['D', 'T', None, 'T', 'D', None, 'T', None]
A = [7, 8, 7, 5, 3, 5, 3, 2, 0, 2, 3, 5, 7, None, None, None]
Bm = [12, 11, 8, 7, 8, 7, 5, 3, 2, 3, 2, 0, -1, 0, None, None]
A2 = [7, 8, 10, 8, 7, 5, 7, 8, 7, 5, 3, 2, 3, None, 5, None]
B2 = [12, 13, 12, 11, 12, 8, 7, 8, 7, 5, 3, 2, 0, None, None, None]
MEL = A + Bm + A2 + B2 + A + Bm
drums_end = night + .4
k = 0; t0 = start
while t0 < drums_end:
    step = k % 8
    hit = MAQ[step]
    if hit == 'D': put(music, t0, dum(), .9, 0)
    if hit == 'T': put(music, t0, tak(), .8, .15)
    if k % 2 == 1 or rs.rand() < .3: put(music, t0 + .01, riq(), .7 if k % 2 else .4, -.2)
    m = MEL[k % len(MEL)]
    if m is not None and t0 > start + BEAT * 2:   # two beats of drums before the oud comes in
        put(music, t0, oud(note(m - 12 + 12), 1.0, .55 + .2 * (k % 4 == 0)), .9, -.15)
    if step == 0: put(music, t0, oud(note(-12 if (k // 16) % 2 == 0 else -14 + 2), 1.6, .3), .7, .1)
    k += 1; t0 = start + k * E8
# night: drums fall away, a pad and a ney carry the moonlight
put(music, night - .3, pad([note(-12), note(-9), note(-5)], logo - night + .6, 1.5, 1.0), 1.0, 0)
for i, (s, d) in enumerate([(7, 1.2), (8, .6), (7, .6), (5, 1.1), (3, .6), (2, 1.4)]):
    tt0 = night + .4 + sum(x[1] for x in [(7, 1.2), (8, .6), (7, .6), (5, 1.1), (3, .6), (2, 1.4)][:i])
    if tt0 + d < logo: put(music, tt0, ney(note(s), d + .15), 1.0, .1)
# the build into the logo: darbuka roll
for j, tt0 in enumerate(np.arange(stop - 1.6, logo, .1)):
    put(music, tt0, tak(), .25 + .5 * j / 16, .1)
# logo: D major resolution, oud strum + pad + ney phrase, then let it ring out
for j, s in enumerate([-12, -5, 0, 4, 7, 12]):
    put(music, logo + j * .025, oud(note(s), 3.0, .7), .75, -.3 + j * .12)
put(music, logo, dum(), 1.1, 0)
put(music, logo, pad([note(-12), note(-8), note(-5), note(0)], DUR - logo, .6, 2.5), 1.3, 0)
ph = [(7, .5), (9, .5), (11, .5), (12, 1.6), (11, .4), (9, .4), (7, 2.2)]
tt0 = logo + 1.2
for s, d in ph:
    if tt0 + d < DUR - .2: put(music, tt0, ney(note(s), d + .1), .95, .05)
    tt0 += d
# riq shimmer + soft dums keep a pulse under the finale
for j, tt0 in enumerate(np.arange(logo + BEAT * 2, DUR - 1.5, BEAT)):
    if j % 2 == 0: put(music, tt0, dum(), .45, 0)
    put(music, tt0 + E8, riq(), .35, -.2)

# ---------- sound effects ----------
def S_shake():   # paper rattling + glass tinkle
    d = .8; t = tt(d); am = .5 + .5 * np.sin(2 * np.pi * 13 * t)
    x = bp(noise(d), 900, 5000) * am * np.sin(np.pi * t / d) * .35
    for i in range(10): x[int(rs.rand() * (len(x) - 30000)):][:30000] += bell(rs.uniform(1800, 3200), 30000 / SR, 9)[:len(x)] * .4
    return x
def S_engine():  # toy engine sputtering awake
    d = .75; t = tt(d); pulses = (np.sin(2 * np.pi * 17 * t) > .3).astype(float)
    return lp(pulses * noise(d) * .6 + pulses * np.sin(2 * np.pi * 70 * t), 900) * np.minimum(t / .05, 1) * .5
def S_peel():    # paper lifting off + a little pop
    d = .22; x = hp(noise(d), 2500) * np.exp(-tt(d) * 18) * .25
    p = chirp(380, 950, .09) * np.exp(-tt(.09) * 25) * .35
    x[:len(p)] += p; return x
def S_land():
    d = .25; t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 18) + 55) / SR) * np.exp(-t * 22) * .6 + lp(noise(d), 1200) * np.exp(-t * 40) * .25
def S_honk():    # beep-beep toy horn
    def one(f):
        t = tt(.17); w = np.sign(np.sin(2 * np.pi * f * t)) + np.sign(np.sin(2 * np.pi * f * 1.26 * t))
        return lp(w, 1800) * np.minimum(t / .01, 1) * np.minimum((.17 - t) / .02, 1) * .22
    x = np.zeros(int(.48 * SR)); a = one(440); x[:len(a)] += a; x[int(.23 * SR):int(.23 * SR) + len(a)] += one(440); return x
def S_startle():  # boing
    t = tt(.45); f = 330 * (1 + .25 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * .35
def S_whoosh(d=.55):
    t = tt(d); x = noise(d); out = np.zeros_like(x)
    for i, (lo, hi) in enumerate([(300, 700), (700, 1500), (1500, 3500)]):
        out += bp(x, lo, hi) * np.exp(-((t / d - (.3 + i * .2)) ** 2) / .03)
    return out * .5
def S_splash():
    d = 1.1; t = tt(d); x = lp(noise(d), 2500) * np.exp(-t * 5) * .8 + hp(noise(d), 3000) * np.exp(-t * 9) * .3
    for i in range(14):
        s = int((.05 + rs.rand() * .7) * SR); f0 = rs.uniform(300, 700)
        b = chirp(f0, f0 * 2.2, .06) * np.exp(-tt(.06) * 40) * .25
        x[s:s + len(b)] += b[:len(x) - s]
    return x
def S_drops():
    x = np.zeros(int(.6 * SR))
    for i in range(6):
        s = int(i * .07 * SR + rs.rand() * .03 * SR); f = rs.uniform(900, 1500)
        b = np.sin(2 * np.pi * np.cumsum(f * np.exp(-tt(.13) * 9)) / SR) * np.exp(-tt(.13) * 30) * .35
        x[s:s + len(b)] += b[:len(x) - s]
    return x
def S_hop(): return chirp(280, 820, .14) * np.exp(-tt(.14) * 12) * .4
def S_pick(): return bell(note(19), 1.2, 3) * 1.2 + bell(note(24), 1.2, 3) * .6
def S_flap(d):   # wing beats at the flap rate
    t = tt(d); beats = np.maximum(0, np.cos(2 * np.pi * 2.3 * t)) ** 6
    return bp(noise(d), 350, 1600) * beats * np.minimum(t / .3, 1) * np.clip((d - t) / .4, 0, 1) * .28
def S_night(): return pad([note(-24), note(-17)], 2.5, 1.2, 1.0) * 1.4
def S_flicker():
    x = bell(note(24), .4, 6) * .4; c = hp(noise(.05), 3000) * np.exp(-tt(.05) * 80) * .3
    x[:len(c)] += c; return x
def S_moon():    # the moon switches on: rising swell into a cluster of bells
    sw = S_whoosh(.6)[::-1] * .8
    x = np.zeros(int(3.6 * SR)); x[:len(sw)] += sw
    for j, s in enumerate([12, 19, 24, 27, 31, 36]):
        b = bell(note(s), 3.0, 1.2) * (1 - j * .1); o = int((.55 + j * .05) * SR); x[o:o + len(b)] += b[:len(x) - o]
    return x
def S_brake():
    t = tt(.45); f = 1500 - 300 * t / .45 + 40 * np.sin(2 * np.pi * 30 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .45) * .07 + lp(noise(.45), 900) * np.sin(np.pi * t / .45) * .12
def S_logo():    # brush sweep across the paper
    d = .9; t = tt(d); return bp(noise(d), 2000, 7000) * np.sin(np.pi * t / d) ** 2 * .3
def S_snow():
    d = DUR - first('snow'); t = tt(d); x = lp(noise(d), 600) * .08 * np.minimum(t / 1.5, 1)
    for i in range(16):
        b = bell(note(rs.choice([24, 27, 29, 31, 36]), D4), 1.2, 3.5) * .5; s = int(rs.rand() * (len(x) - len(b)))
        x[s:s + len(b)] += b
    return x

FX = {'shake': S_shake, 'engine': S_engine, 'peel': S_peel, 'land': S_land, 'honk': S_honk, 'startle': S_startle,
      'whoosh': S_whoosh, 'splash': S_splash, 'drops': S_drops, 'hop': S_hop, 'pick': S_pick, 'night': S_night,
      'flicker': S_flicker, 'moon': S_moon, 'brake': S_brake, 'stop': S_land, 'logo': S_logo, 'snow': S_snow}
GAIN = {'land': .9, 'peel': 1.0, 'honk': 1.0, 'splash': 1.0, 'moon': 1.0, 'stop': 1.3}
for e in EV:
    k = e['type']; pan = float(e.get('pan', 0)) * .7
    if k == 'flap': put(sfx, e['t'], S_flap(e['end'] - e['t']), 1.0, -.2); continue
    if k == 'drive':  # soft engine hum that follows the bus for the whole drive
        d = e['end'] - e['t']; t = tt(d)
        hum = lp((np.sin(2 * np.pi * 11 * t) > 0).astype(float) * noise(d), 500) * .06 + np.sin(2 * np.pi * 62 * t) * .02
        hum *= np.minimum(t / .4, 1) * np.clip((d - t) / .5, 0, 1)
        put(sfx, e['t'], hum, 1.0, .35); continue
    if k in FX: put(sfx, e['t'], FX[k](), GAIN.get(k, 1.0), pan)

# ---------- mix ----------
music = reverb(music, 2.0, .25); sfx = reverb(sfx, 1.2, .12)
mix = music * .55 + sfx * .9
fade = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1); mix *= fade
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= .89 / np.abs(mix).max()
import wave
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('wrote', OUT, round(N / SR, 2), 's')
