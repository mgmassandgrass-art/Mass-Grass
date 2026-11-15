exec(open('/home/user/Mass-Grass/tools/shelf_mockups.py').read().split('# 1 ·')[0])
W2='/home/user/Mass-Grass/web/assets/'
SC={'wall':[(1067,252),(1492,254),(1496,856),(1066,856)],'flat':[(878,218),(1605,228),(1613,1190),(872,1189)]}
V2={0:'000',1:'001',2:'002',3:'003',4:'004',5:'005',6:'006',7:'008',8:'009',9:'010',10:'011',11:'012',12:'013'}
for n,Q in SC.items():
    bl=load(S+'w-'+n+'.png')
    for m,k in V2.items():
        pg=load('/home/user/Mass-Grass/drafts/calendar-v2/pg-%s.jpg'%k)
        out=put(bl.copy(),bl,pg,Q,keep_dark_top=70,soft=.5)
        Image.fromarray(np.clip(out,0,255).astype('uint8')).resize((1920,1080),Image.LANCZOS).save(W2+'cw%s-%02d.webp'%(n[0],m),quality=84)
print('ok')
