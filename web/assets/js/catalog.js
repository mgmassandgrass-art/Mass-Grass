/* Mass & Grass · the shop's own list of pieces.
   Product id == image file (assets/<id>.webp, thumbnail assets/t-<id>.webp for paintings).
   The server's catalog (the admin's products, prices and hidden pieces) replaces this list when the page
   is served by the Worker; opened as plain files (previews) the site sells from this list. */
window.MG_DEFAULT = {
  prices: { painting: 12, postcard: 2, sticker: 1, pack: 3, calendar: 10, calendarPrint: 30, design: 6, book: 10 },
  products: [
    /* paintings */
    ['painting', 'hero', 'Gaza Coast', 'ساحل غزة'],
    ['painting', 'sparklers', 'Sparkler Night', 'ليلة الشماريخ'],
    ['painting', 'dovegirl', 'Dove Girl', 'فتاة الحمام'],
    ['painting', 'boattop', 'The Boat', 'القارب'],
    ['painting', 'guitar', 'Guitar Girl', 'فتاة الجيتار'],
    ['painting', 'pmoon', 'Moon Swing', 'أرجوحة القمر'],
    ['painting', 'house', 'Home', 'البيت'],
    ['painting', 'alley', 'The Alley', 'الزقاق'],
    ['painting', 'blueflowers', 'White Dove', 'الحمامة البيضاء'],
    ['painting', 'seafish', 'Sea Fish', 'سمك البحر'],
    ['painting', 'pcartgirl', 'Girl with Cart', 'فتاة والعربة'],
    ['painting', 'hill', 'Hill & Boat', 'التلة والقارب'],
    ['painting', 'pelephant', 'Elephant on a Bike', 'فيل على دراجة'],
    ['painting', 'waves', 'The Waves', 'الموج'],
    ['painting', 'deirbalah', 'Deir al-Balah', 'دير البلح'],
    ['painting', 'pflower', 'Big Flower', 'الزهرة الكبيرة'],
    ['painting', 'pmoonsleep', 'Moon Sleeper', 'نائمة على القمر'],
    ['painting', 'psea', 'Sea & Clouds', 'بحر وغيوم'],
    ['painting', 'bikeride', 'Bike Ride', 'مشوار بالدراجة'],
    ['painting', 'snowglobe', 'Snow Globe', 'كرة الثلج'],
    ['painting', 'boatman', 'The Boatman', 'الصياد'],
    /* postcards */
    ['postcard', 'hero', 'Gaza Coast', 'ساحل غزة'],
    ['postcard', 'blueflowers', 'White Dove', 'الحمامة البيضاء'],
    ['postcard', 'waves', 'The Waves', 'الموج'],
    ['postcard', 'boatman', 'The Boatman', 'الصياد'],
    ['postcard', 'house', 'Home', 'البيت'],
    ['postcard', 'dovegirl', 'Dove Girl', 'فتاة الحمام'],
    ['postcard', 'pcartgirl', 'Girl with Cart', 'فتاة والعربة'],
    ['postcard', 'pflower', 'Big Flower', 'الزهرة الكبيرة'],
    ['postcard', 'hill', 'Hill & Boat', 'التلة والقارب'],
    ['postcard', 'boattop', 'The Boat', 'القارب'],
    ['postcard', 'psea', 'Sea & Clouds', 'بحر وغيوم'],
    ['postcard', 'alley', 'The Alley', 'الزقاق'],
    ['postcard', 'sparklers', 'Sparkler Night', 'ليلة الشماريخ'],
    ['postcard', 'guitar', 'Guitar Girl', 'فتاة الجيتار'],
    ['postcard', 'pmoonsleep', 'Moon Sleeper', 'نائمة على القمر'],
    /* stickers: Farah's own sheet first (die-cut), then cuts from the paintings */
    ['sticker', 's-lemons', 'Lemons', 'ليمون', 'die'],
    ['sticker', 's-pomegranate', 'Pomegranate of Palestine', 'رمّان فلسطين', 'die'],
    ['sticker', 's-kaak', 'Jerusalem Ka’ak', 'كعك القدس', 'die'],
    ['sticker', 's-olives', 'Olives', 'زيتون', 'die'],
    ['sticker', 's-jaffa', 'Jaffa Orange', 'برتقال يافا', 'die'],
    ['sticker', 's-cactus', 'Cactus & Watermelon', 'صبر وبطيخ', 'die'],
    ['sticker', 's-jug', 'Clay Jug', 'إبريق الفخار', 'die'],
    ['sticker', 's-family', 'Roots', 'جذور', 'die'],
    ['sticker', 's-fishers', 'Gaza Fishers', 'صيادو غزة', 'die'],
    ['sticker', 's-coast', 'Gaza Coast', 'ساحل غزة', 'die'],
    ['sticker', 's-whale', 'Bike Ride', 'مشوار بالدراجة', 'die'],
    ['sticker', 'girl-bike', 'Elephant on a Bike', 'فيل على دراجة', 'die'],
    ['sticker', 'sparklers', 'Sparkler Night', 'ليلة الشماريخ', 'round'],
    ['sticker', 'pmoon', 'Moon Swing', 'أرجوحة القمر', 'round'],
    ['sticker', 'dovegirl', 'Dove Girl', 'فتاة الحمام', 'round'],
    ['sticker', 'guitar', 'Guitar Girl', 'فتاة الجيتار', 'rect'],
    ['sticker', 'house', 'Home', 'البيت', 'round'],
    ['sticker', 'boattop', 'The Boat', 'القارب', 'round'],
    ['sticker', 'seafish', 'Sea Fish', 'سمك البحر', 'rect'],
    ['sticker', 'waves', 'The Waves', 'الموج', 'rect'],
    ['sticker', 'psea', 'Sea & Clouds', 'بحر وغيوم', 'round'],
    ['sticker', 'blueflowers', 'White Dove', 'الحمامة البيضاء', 'rect'],
    ['sticker', 'pflower', 'Big Flower', 'الزهرة الكبيرة', 'round'],
    ['sticker', 'pmoonsleep', 'Moon Sleeper', 'نائمة على القمر', 'round']
  ].map(function (x) { return { kind: x[0], id: x[1], title_en: x[2], title_ar: x[3], extra: x[4] ? { shape: x[4] } : {} }; }),
  /* the book (kind 'book', one PDF at prices.book). Its pages come from the admin's Book panel (the server's catalog carries them);
     without the server the reader reads assets/book/book.json, whose eight pages are TEMPORARY placeholders */
  book: {
    id: 'zero-waste', title: ['Zero Waste & Our Palestinian Ancestors', 'صفر نفايات وأجدادنا الفلسطينيون'],
    credit: ['Text: Najla Abdellatif, drawings: Farah Al-Helou', 'النص: نجلاء عبد اللطيف، الرسوم: فرح الحلو'],
    cover: 'assets/book/pg-01.webp', page: 'book.html', manifest: 'assets/book/book.json', pages: 112, year: 2026
  },
  /* the 2027 calendar, "Things kept in bottles": the cover and all twelve months (assets c27-MM*, rendered from the owner's calendar artifact) */
  calendar: {
    id: 'calendar-2027', title: ['Things kept in bottles, 2027', 'أشياء نحفظها في قوارير، 2027'], cover: 'assets/t-v2-00.webp', page: 'calendar.html',
    short: ['Things kept in bottles', 'أشياء نحفظها في قوارير'], year: 2027,
    line: ['A watercolour bottle for every month, on your desk all year.', 'قارورة بالألوان المائية لكل شهر، على مكتبكم طوال العام.'],
    /* the calendars page shows it in this photograph: each month is a whole render (cdp-MM), the base shows January */
    mock: { base: 'assets/cdm-base.webp', w: 1100, h: 1187, page: 'assets/cdp-{m}.webp', whole: true, s: 1, foot: .872 },
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsAr: ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'],
    pages: [
      { k: 'c27-00', m: 0, n: ['The cover', 'الغلاف'], s: ['2027', '2027'], q: ['Things kept in bottles, watercolours by Farah Al-Helou.', 'أشياء نحفظها في قوارير، ألوان مائية لفرح الحلو.'],
        d: ['A heart kept in a bottle, flowers growing from it, and someone sitting on the cork to keep watch.', 'قلب محفوظ في قارورة تنبت منه الأزهار، وعلى الفلّينة من يجلس ليحرسه.'] },
      { k: 'c27-01', m: 1, n: ['January', 'كانون الثاني'], s: ['Winter 2027', 'شتاء 2027'], q: ['Some lights are only found by those who reach.', 'بعض الأضواء لا يجدها إلا من يمدّ يده إليها.'],
        d: ['A girl in a red coat reaches up to a single star inside a bottle full of night.', 'فتاة بمعطف أحمر تمدّ يدها إلى نجمة واحدة داخل قارورة من ليل.'] },
      { k: 'c27-02', m: 2, n: ['February', 'شباط'], s: ['Winter 2027', 'شتاء 2027'], q: ['Everything that grows begins somewhere unseen.', 'كل ما ينمو يبدأ في مكانٍ لا يُرى.'],
        d: ['A heart made of roots in a round bottle, and a small tree in blossom growing out of it.', 'قلب من جذور في قارورة مستديرة، تنبت منه شجرة صغيرة مزهرة.'] },
      { k: 'c27-03', m: 3, n: ['March', 'آذار'], s: ['Spring 2027', 'ربيع 2027'], q: ['Slowness is also a way of arriving.', 'البطء أيضًا طريقة للوصول.'],
        d: ['A snail with a spiral shell carries a single red flower up through a green bottle.', 'حلزون بصدفة لولبية يحمل زهرة حمراء واحدة في قارورة خضراء.'] },
      { k: 'c27-04', m: 4, n: ['April', 'نيسان'], s: ['Spring 2027', 'ربيع 2027'], q: ['What we tend in silence learns to bloom.', 'ما نرعاه بصمت يتعلّم أن يزهر.'],
        d: ['A small garden of spring flowers kept in a bottle, with a paper tag tied to its neck.', 'حديقة صغيرة من أزهار الربيع في قارورة، وعلى عنقها بطاقة ورقية.'] },
      { k: 'c27-05', m: 5, n: ['May', 'أيار'], s: ['Spring 2027', 'ربيع 2027'], q: ['We carry whole worlds no one else can see.', 'نحمل عوالم كاملة لا يراها أحد سوانا.'],
        d: ['A girl sits on a small green planet inside a bottle of night, with the stars only she can see.', 'فتاة تجلس على كوكب أخضر صغير داخل قارورة من ليل، ومعها نجوم لا يراها سواها.'] },
      { k: 'c27-06', m: 6, n: ['June', 'حزيران'], s: ['Summer 2027', 'صيف 2027'], q: ['Keep a little light for the days that forget.', 'احتفظوا بقليل من الضوء للأيام التي تنسى.'],
        d: ['A smiling sun kept in a yellow bottle, its light spilling over the paper.', 'شمس مبتسمة محفوظة في قارورة صفراء، ينسكب ضوؤها على الورق.'] },
      { k: 'c27-07', m: 7, n: ['July', 'تموز'], s: ['Summer 2027', 'صيف 2027'], q: ['Home is not a place, it is what we carry.', 'البيت ليس مكانًا، بل ما نحمله معنا.'],
        d: ['A whale swims inside the bottle with a small town of houses on its back.', 'حوت يسبح داخل القارورة وعلى ظهره بلدة صغيرة من البيوت.'] },
      { k: 'c27-08', m: 8, n: ['August', 'آب'], s: ['Summer 2027', 'صيف 2027'], q: ['To leave is also to believe in somewhere.', 'أن نرحل يعني أيضًا أن نؤمن بمكانٍ ما.'],
        d: ['A ship on a small sea inside the bottle, and a tree growing out of its neck toward a bird that has just left.', 'سفينة على بحر صغير داخل القارورة، وشجرة تنمو من عنقها نحو طائر غادر للتوّ.'] },
      { k: 'c27-09', m: 9, n: ['September', 'أيلول'], s: ['Autumn 2027', 'خريف 2027'], q: ['Even the sun bows; looking up is a choice.', 'حتى الشمس تنحني، والنظر إلى الأعلى اختيار.'],
        d: ['A sunflower hangs upside down from the cork; a boy with his school bag stands below and looks up at it.', 'زهرة شمس معلّقة بالمقلوب من الفلّينة، وتحتها ولد بحقيبته المدرسية ينظر إليها.'] },
      { k: 'c27-10', m: 10, n: ['October', 'تشرين الأول'], s: ['Autumn 2027', 'خريف 2027'], q: ['Some words are kept, not sent.', 'بعض الكلمات تُحفظ ولا تُرسل.'],
        d: ['A letter sealed in a bottle among autumn leaves, never posted.', 'رسالة مختومة في قارورة بين أوراق الخريف، لم تُرسل قط.'] },
      { k: 'c27-11', m: 11, n: ['November', 'تشرين الثاني'], s: ['Autumn 2027', 'خريف 2027'], q: ['Rest is not stopping, it is gathering.', 'الراحة ليست توقفًا، بل جمعٌ للقوة.'],
        d: ['A girl curled up inside a sea shell in a round green bottle, resting.', 'فتاة تستريح متكوّرة داخل صدفة بحرية في قارورة خضراء مستديرة.'] },
      { k: 'c27-12', m: 12, n: ['December', 'كانون الأول'], s: ['Winter 2027', 'شتاء 2027'], q: ['Every road we take is a way back to ourselves.', 'كل طريق نسلكه طريقُ عودةٍ إلى أنفسنا.'],
        d: ['A heart-shaped sun over a small house, and a yellow road that winds back to it through green hills.', 'شمس على شكل قلب فوق بيت صغير، وطريق أصفر يعود إليه بين التلال الخضراء.'] }
    ]
  },
  /* an earlier calendar set for 2027: Farah's 2026 calendar "Palestine, a journey through time and space" (old houses and
     their details in watercolour), its dates, holidays and year redrawn for 2027 by tools/redate_2026.py (assets ps-MM, pd-MM) */
  palestine: {
    id: 'palestine-2027', title: ['Palestine, a journey through time and space, 2027', 'فلسطين، رحلة عبر الزمان والمكان، 2027'],
    short: ['Palestine, a journey through time and space', 'فلسطين، رحلة عبر الزمان والمكان'], img: 'assets/t-ps-00.webp', cover: 'assets/t-ps-00.webp', page: 'palestine.html', first: 2026, year: 2027,
    line: ['A Palestinian house for every month: doors, windows, stairs and tiles.', 'بيت فلسطيني لكل شهر: أبواب ونوافذ وأدراج وبلاط.'],
    mock: { base: 'assets/pdm-base.webp', w: 1100, h: 1100, page: 'assets/pdp-{m}.webp', pg: [17.5455, 9.0909, 65.2727, 80.0909], s: .94, foot: .914, edge: true },
    pages: [
      { k: 'ps-00', m: 0, n: ['The cover', 'الغلاف'], q: ['Palestine, a journey through time and space.', 'فلسطين، رحلة عبر الزمان والمكان.'], d: ['A clay jug on a tiled plate, and the calendar\'s name.', 'جرّة فخار على صحن من البلاط، واسم التقويم.'] },
      { k: 'ps-01', m: 1, n: ["Taboon", "الطابون"], q: ["Taboon", "الطابون"], d: ["Hand-sculpted from golden clay and ancient grit, the taboon is a thermal masterpiece: a living monument where the earth's warmth meets the scent of belonging.", "الطابون مصنوع باليد من الطين الذهبي والحصى القديم، تحفة تحفظ الحرارة: نصب حيّ يلتقي فيه دفء الأرض برائحة الانتماء."] },
      { k: 'ps-02', m: 2, n: ["The Sabat's passage", "ممرّ الساباط"], q: ["The Sabat's passage", "ممرّ الساباط"], d: ["The sabat is the architecture of intimacy: a stone embrace that weaves private lives into the fabric of the public street.", "الساباط عمارة الألفة: عناق من حجر ينسج الحياة الخاصة في نسيج الشارع."] },
      { k: 'ps-03', m: 3, n: ["The balcony's embrace (al-Shurfa)", "الشرفة"], q: ["The balcony's embrace (al-Shurfa)", "الشرفة"], d: ["A suspended sanctuary where stories unfold under the open sky, breathing in the view, embracing the moment.", "ملاذ معلّق تتفتح فيه الحكايات تحت السماء المفتوحة، تتنفس المنظر وتحتضن اللحظة."] },
      { k: 'ps-04', m: 4, n: ["The gate", "البوابة"], q: ["The gate", "البوابة"], d: ["A timeless threshold to countless stories, standing sentinel, where every knock echoes through the past.", "عتبة خالدة لحكايات لا تُحصى، حارسة واقفة، يتردد فيها كل طرق عبر الماضي."] },
      { k: 'ps-05', m: 5, n: ["The mosaic underfoot", "البلاط تحت الأقدام"], q: ["The mosaic underfoot", "البلاط تحت الأقدام"], d: ["Each tile is a burst of colour and pattern, telling a silent story of geometry and the art of Jerusalem's traditional floor tiles.", "كل بلاطة انفجار من لون ونقش، تحكي بصمت قصة الهندسة وفنّ البلاط المقدسي التقليدي."] },
      { k: 'ps-06', m: 6, n: ["The shaded aperture", "النافذة الظليلة"], q: ["The shaded aperture", "النافذة الظليلة"], d: ["A semi-open space that dances with light beneath the vine trellis, where shade and joy are born together.", "مساحة نصف مفتوحة ترقص مع الضوء تحت عريشة العنب، حيث يولد الظل والفرح معًا."] },
      { k: 'ps-07', m: 7, n: ["The art of al-Ablaq", "فنّ الأبلق"], q: ["The art of al-Ablaq", "فنّ الأبلق"], d: ["A masterpiece of masonry where contrasting colours interlock in elegant stripes, adding dramatic beauty and historical depth.", "تحفة من البناء تتشابك فيها الألوان المتباينة في خطوط أنيقة، تمنح المكان جمالًا وعمقًا تاريخيًا."] },
      { k: 'ps-08', m: 8, n: ["The stone lattice window (al-Qamariya)", "القمرية"], q: ["The stone lattice window (al-Qamariya)", "القمرية"], d: ["A lattice window gently breaks the light, separating inside from outside without severing their connection, letting shadows tell their story.", "نافذة مشبّكة تكسر الضوء برفق، تفصل الداخل عن الخارج دون أن تقطع الصلة بينهما، وتترك الظلال تحكي حكايتها."] },
      { k: 'ps-09', m: 9, n: ["The crowned roof", "السطح المقبّب"], q: ["The crowned roof", "السطح المقبّب"], d: ["Flat roofs and domes made to keep the heat out: a stone fabric that balances mass and void in one geometry.", "أسطح وقباب صُنعت لتصدّ الحرّ: نسيج من حجر يوازن بين الكتلة والفراغ في هندسة واحدة."] },
      { k: 'ps-10', m: 10, n: ["The courtyard's sun", "شمس الحوش"], q: ["The courtyard's sun", "شمس الحوش"], d: ["A ray of sunlight slips into the courtyard, a quiet bond between light and stone, a space that gently holds family gatherings.", "شعاع شمس يتسلل إلى الحوش، صلة هادئة بين الضوء والحجر، ومكان يحتضن لمّة العائلة برفق."] },
      { k: 'ps-11', m: 11, n: ["The stone staircase", "الدرج الحجري"], q: ["The stone staircase", "الدرج الحجري"], d: ["An organic ascent connecting the levels of the earth through walls of light and shadow, celebrating the passage of time.", "صعود يصل طبقات الأرض بين جدران من ضوء وظل، احتفاءً بمرور الزمن."] },
      { k: 'ps-12', m: 12, n: ["The hanging lantern", "القنديل المعلّق"], q: ["The hanging lantern", "القنديل المعلّق"], d: ["A geometric glow breaking the stone's silence, where warm light meets ancient mass to turn the void into a living scene.", "وهج هندسي يكسر صمت الحجر، يلتقي فيه الضوء الدافئ بالكتلة القديمة فيحوّل الفراغ إلى مشهد حيّ."] }
    ]
  }
};
