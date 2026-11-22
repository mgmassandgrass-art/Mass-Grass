exec(open('comp.py').read().split("out=put(ph.copy()")[0])
for m in range(1,13):
    o=np.clip(put(ph.copy(),QR,P+f'p{m:02d}.png',m),0,255).astype(np.uint8)
    cv2.imwrite(f'cdm-{m:02d}.png',o[420:1260,940:1780])
print('ok')
