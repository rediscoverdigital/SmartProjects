import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ───────────────────────────────────────────────────────────
// SmartMenus seed — three pilot tenants (matching the brief's
// pilot programme: fine-dining, casual grill, café) with real,
// bilingual, allergen-annotated menus so the AI has something
// genuine to ground on.
// ───────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'demo';
const IMG = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

async function main() {
  console.log('Seeding SmartMenus…');
  const pw = await bcrypt.hash(DEMO_PASSWORD, 10);

  // wipe (idempotent dev seed)
  await prisma.auditLog.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.physicalObject.deleteMany();
  await prisma.tableObj.deleteMany();
  await prisma.location.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  // ══════════════════════════════════════════════════════════
  // 1. CÔTE SAUVAGE — fine dining, west coast, FR-first
  // ══════════════════════════════════════════════════════════
  const sauvage = await prisma.restaurant.create({
    data: {
      slug: 'cote-sauvage',
      name: 'Côte Sauvage',
      tagline: 'West-coast fire, Indian Ocean catch.',
      description:
        'A fine-dining room on the wild west coast. Open-fire cooking, Indian Ocean catch, a cellar of old-world wines.',
      address: 'Coastal Road, Flic-en-Flac, Mauritius',
      phone: '+230 453 8800',
      email: 'hello@cotesauvage.mu',
      wifiName: 'CoteSauvage_Guest',
      wifiPassword: 'fireandsea',
      instagram: 'cotesauvage',
      website: 'https://cotesauvage.mu',
      logoText: 'Côte Sauvage',
      primaryColor: '#0C1824',
      accentColor: '#C0A86C',
      surfaceColor: '#0A0F16',
      textColor: '#F4F1E8',
      themeMode: 'dark',
      buttonStyle: 'pill',
      welcomeMsg:
        'Good evening. Your table is ready — start with the menu, or ask us anything.',
      currency: 'MUR',
      defaultLang: 'fr',
      plan: 'pro',
      featOrder: true,
      featSpecials: true,
      aiMonthlyQuota: 5000,
      coverImage: IMG('1414235077428-338989a2e8c0'),
    },
  });

  const sEntrees = await prisma.category.create({
    data: { restaurantId: sauvage.id, name: 'Starters', nameFr: 'Entrées', description: 'Small plates to begin.', descriptionFr: 'Petites assiettes pour commencer.', displayOrder: 1, icon: '🌊' },
  });
  const sPlats = await prisma.category.create({
    data: { restaurantId: sauvage.id, name: 'Mains', nameFr: 'Plats', description: 'From the fire and the sea.', descriptionFr: 'Du feu et de la mer.', displayOrder: 2, icon: '🔥' },
  });
  const sDesserts = await prisma.category.create({
    data: { restaurantId: sauvage.id, name: 'Desserts', nameFr: 'Desserts', description: 'To finish.', descriptionFr: 'Pour finir.', displayOrder: 3, icon: '🍮' },
  });
  const sDrinks = await prisma.category.create({
    data: { restaurantId: sauvage.id, name: 'Drinks', nameFr: 'Boissons', description: 'Wine, cocktails, and the bar.', descriptionFr: 'Vins, cocktails et bar.', displayOrder: 4, icon: '🍷' },
  });

  const sauvageItems = [
    // ── Entrées
    {
      cat: sEntrees.id, name: 'Octopus Carpaccio', nameFr: "Carpaccio d'ourite",
      desc: 'West-coast octopus, lemon oil, bird chilli, pickled shallot.',
      descFr: "Ourite de la côte ouest, huile de citron, piment oiseau, échalote pickles.",
      price: 580, img: IMG('1544025162-d76694265947'), ing: 'octopus, olive oil, lemon, chilli, shallot, sea salt',
      aller: 'mollusc', diet: 'Seafood, Gluten-free, Dairy-free', spice: 'medium', prep: 15,
      special: true, reco: true, note: 'The kitchen likes this with a rum punch — citrus against the chilli.',
    },
    {
      cat: sEntrees.id, name: 'Yellowfin Tuna Tartare', nameFr: 'Tartare de thon',
      desc: 'Knife-cut tuna, avocado, sesame, lime, grilled nori.',
      descFr: 'Thon coupé au couteau, avocat, sésame, citron vert, nori grillé.',
      price: 620, img: IMG('1559339352-11d035aa65de'), ing: 'yellowfin tuna, avocado, sesame, lime, nori, soy',
      aller: 'fish, sesame, soy', diet: 'Seafood, Dairy-free', spice: 'none', prep: 12,
    },
    {
      cat: sEntrees.id, name: 'Burrata & Heirloom Tomato', nameFr: 'Burrata & tomates anciennes',
      desc: 'Creamy burrata, marinated heirloom tomatoes, basil oil, sourdough.',
      descFr: 'Burrata crémeuse, tomates anciennes marinées, huile de basilic, pain au levain.',
      price: 540, img: IMG('1546069901-ba9599a7e63c'), ing: 'burrata, tomato, basil, olive oil, sourdough',
      aller: 'dairy, gluten', diet: 'Vegetarian', spice: 'none', prep: 10,
    },
    // ── Plats
    {
      cat: sPlats.id, name: 'Heart of Palm Risotto', nameFr: 'Risotto au palmiste',
      desc: 'Carnaroli, light coconut broth, heart of palm, lemon thyme. The vegetarian signature.',
      descFr: 'Carnaroli, bouillon léger coco, palmiste, thym citron. La signature végétarienne.',
      price: 720, img: IMG('1476124369491-e7addf5db371'), ing: 'carnaroli rice, heart of palm, coconut milk, lemon thyme, parmesan, onion',
      aller: 'dairy', diet: 'Vegetarian, Gluten-free', spice: 'mild', prep: 22,
      reco: true, note: 'Our vegetarian signature — rich but not heavy.',
    },
    {
      cat: sPlats.id, name: 'Catch of the Day', nameFr: 'Pêche du jour',
      desc: 'Whole grilled, per the boats. Salsa verde, burnt lemon, island greens.',
      descFr: 'Grillée entière, selon les bateaux. Salsa verde, citron brûlé, verdure de l’île.',
      price: 890, img: IMG('1519708227418-c8fd9a32b7a2'), ing: 'market fish, herbs, lemon, olive oil, island greens',
      aller: 'fish', diet: 'Seafood, Gluten-free, Dairy-free', spice: 'mild', prep: 25,
      special: true, reco: true,
    },
    {
      cat: sPlats.id, name: 'Lobster Thermidor', nameFr: 'Homard thermidor',
      desc: 'Local lobster, mustard cream, gratinated, shaved fennel salad.',
      descFr: 'Homard local, crème moutarde, gratiné, salade de fenouil.',
      price: 1450, img: IMG('1559737558-2f5a35f4523b'), ing: 'lobster, cream, mustard, cheese, fennel',
      aller: 'crustacean, dairy, mustard', diet: 'Seafood', spice: 'none', prep: 30,
      special: true,
    },
    {
      cat: sPlats.id, name: 'Charred Venison Loin', nameFr: 'Filet de cerf grillé',
      desc: 'Mauritian venison, juniper rub, smoked bone marrow, blackberry.',
      descFr: 'Cerf mauricien, rub de genièvre, moelle fumée, mûre.',
      price: 1180, img: IMG('1544025162-d76694265947'), ing: 'venison, juniper, bone marrow, blackberry, butter',
      aller: 'dairy', diet: '', spice: 'none', prep: 28, reco: true,
      note: 'The cellar recommends the Bordeaux with this.',
    },
    // ── Desserts
    {
      cat: sDesserts.id, name: 'Dark Chocolate Fondant', nameFr: 'Fondant au chocolat noir',
      desc: 'Molten centre, salted caramel, vanilla ice cream.',
      descFr: 'Cœur coulant, caramel salé, glace vanille.',
      price: 420, img: IMG('1567620905732-2d1ec7ab7445'), ing: 'dark chocolate, butter, eggs, sugar, flour, vanilla',
      aller: 'dairy, egg, gluten', diet: 'Vegetarian', spice: 'none', prep: 15, reco: true,
    },
    {
      cat: sDesserts.id, name: 'Passion Fruit Pavlova', nameFr: 'Pavlova au fruit de la passion',
      desc: 'Crisp meringue, passion fruit curd, whipped cream.',
      descFr: 'Meringue croustillante, curd de fruit de la passion, crème fouettée.',
      price: 380, img: IMG('1488477181946-6428a0291777'), ing: 'egg white, sugar, passion fruit, cream',
      aller: 'egg, dairy', diet: 'Vegetarian, Gluten-free', spice: 'none', prep: 10,
    },
    // ── Drinks
    {
      cat: sDrinks.id, name: 'Signature Rum Punch', nameFr: 'Rum punch signature',
      desc: 'Aged Mauritian rum, citrus, cane syrup, nutmeg.',
      descFr: 'Rhum mauricien vieilli, agrumes, sirop de canne, muscade.',
      price: 220, img: IMG('1551024709-8f23befc6f87'), ing: 'aged rum, lime, orange, cane syrup, nutmeg',
      aller: 'alcohol', diet: '', spice: 'none', prep: 5,
    },
    {
      cat: sDrinks.id, name: 'House Chenin Blanc (glass)', nameFr: 'Chenin de la maison (verre)',
      desc: 'Dry, mineral, a good match for fish and shellfish.',
      descFr: 'Sec, minéral, parfait avec poisson et fruits de mer.',
      price: 180, img: IMG('1510812431401-41d2bd2722f3'), ing: 'wine (sulphites)',
      aller: 'sulphites', diet: '', spice: 'none', prep: 2,
    },
  ];

  const createdSauvage: Record<string, string> = {};
  for (let idx = 0; idx < sauvageItems.length; idx++) {
    const it = sauvageItems[idx];
    const row = await prisma.menuItem.create({
      data: {
        restaurantId: sauvage.id, categoryId: it.cat, name: it.name, nameFr: it.nameFr,
        description: it.desc, descriptionFr: it.descFr, price: it.price, currency: 'MUR',
        image: it.img, ingredients: it.ing, allergens: it.aller, dietaryTags: it.diet,
        spiceLevel: it.spice, prepMinutes: it.prep, status: 'available',
        featured: !!it.special, recommended: !!it.reco, isSpecial: !!it.special,
        aiNote: it.note || null, displayOrder: idx,
      },
    });
    createdSauvage[it.name] = row.id;
  }
  // configure a cross-sell: venison → house chenin
  await prisma.menuItem.update({
    where: { id: createdSauvage['Charred Venison Loin'] },
    data: { upsellItemIds: createdSauvage['House Chenin Blanc (glass)'] },
  });

  // ══════════════════════════════════════════════════════════
  // 2. HARBOUR & CO. — casual grill, English-first
  // ══════════════════════════════════════════════════════════
  const harbour = await prisma.restaurant.create({
    data: {
      slug: 'harbour-co',
      name: 'Harbour & Co.',
      tagline: 'Grill, cold beer, harbour light.',
      description:
        'A harbour-side grill. Smash burgers, smoked ribs, lagoon catch and very cold beer.',
      address: 'Quay D, Port Louis Waterfront, Mauritius',
      phone: '+230 211 4455',
      email: 'book@harbourandco.mu',
      wifiName: 'Harbour_Guest',
      wifiPassword: 'coldbeer',
      instagram: 'harbourandco',
      logoText: 'Harbour & Co.',
      primaryColor: '#180C0C',
      accentColor: '#D9762F',
      surfaceColor: '#120807',
      textColor: '#F5EDE6',
      themeMode: 'dark',
      buttonStyle: 'rounded',
      welcomeMsg: "Welcome to the harbour. Browse the grill, or ask what's good today.",
      currency: 'MUR',
      defaultLang: 'en',
      plan: 'growth',
      featOrder: true,
      coverImage: IMG('1517248135467-4c7edcad34c4'),
    },
  });

  const hShare = await prisma.category.create({
    data: { restaurantId: harbour.id, name: 'To Share', nameFr: 'À partager', displayOrder: 1, icon: '🍽️' },
  });
  const hGrill = await prisma.category.create({
    data: { restaurantId: harbour.id, name: 'From the Grill', nameFr: 'Du grill', displayOrder: 2, icon: '🔥' },
  });
  const hPlates = await prisma.category.create({
    data: { restaurantId: harbour.id, name: 'Plates', nameFr: 'Assiettes', displayOrder: 3, icon: '🐟' },
  });
  const hDrinks = await prisma.category.create({
    data: { restaurantId: harbour.id, name: 'Drinks', nameFr: 'Boissons', displayOrder: 4, icon: '🍺' },
  });

  const harbourItems = [
    { cat: hShare.id, name: 'Chilli Wings', desc: 'Crispy, tossed in tamarind chilli, spring onion, sesame.', price: 320, img: IMG('1567620905732-2d1ec7ab7445'), ing: 'chicken wings, tamarind, chilli, spring onion, sesame', aller: 'sesame', diet: '', spice: 'hot', prep: 14, reco: true },
    { cat: hShare.id, name: 'Salt & Pepper Calamari', desc: 'Flash-fried, lime, chilli salt.', price: 340, img: IMG('1599487488170-d11ec9c172f0'), ing: 'squid, flour, chilli, lime, salt', aller: 'gluten, mollusc', diet: 'Seafood', spice: 'medium', prep: 12 },
    { cat: hGrill.id, name: 'Harbour Smash Burger', desc: 'Two smashed patties, cheddar, pickle, secret sauce, brioche, fries.', price: 420, img: IMG('1568901346375-23c9450c58cd'), ing: 'beef, cheddar, pickle, brioche bun, fries, sauce', aller: 'gluten, dairy, egg', diet: '', spice: 'none', prep: 18, reco: true },
    { cat: hGrill.id, name: 'Smoked Ribs', desc: 'Half rack, cane-sugar glaze, slaw.', price: 560, img: IMG('1544025162-d76694265947'), ing: 'pork ribs, cane sugar, spices, cabbage', aller: '', diet: '', spice: 'mild', prep: 25, reco: true },
    { cat: hGrill.id, name: 'Grilled Lagoon Catch', desc: 'Market fish, grilled, herb butter, charred greens.', price: 490, img: IMG('1519708227418-c8fd9a32b7a2'), ing: 'market fish, butter, herbs, greens', aller: 'fish, dairy', diet: 'Seafood, Gluten-free', spice: 'none', prep: 22, special: true, reco: true },
    { cat: hPlates.id, name: 'Harbour Fish Curry', desc: 'Coconut, curry leaf, rice, roti.', price: 380, img: IMG('1585937421612-70a008356fbe'), ing: 'fish, coconut, curry leaf, rice, roti', aller: 'fish, gluten', diet: 'Seafood', spice: 'medium', prep: 20 },
    { cat: hPlates.id, name: 'Garden Bowl', desc: 'Quinoa, roasted veg, feta, herbs, lemon.', price: 340, img: IMG('1512621776951-a57141f2eefd'), ing: 'quinoa, vegetables, feta, herbs, lemon', aller: 'dairy', diet: 'Vegetarian, Gluten-free', spice: 'none', prep: 12, reco: true },
    { cat: hPlates.id, name: 'Harbour Fries', desc: 'Triple-cooked, sea salt, garlic aioli.', price: 150, img: IMG('1573080496219-bb080dd4f877'), ing: 'potato, oil, salt, garlic, egg', aller: 'egg', diet: 'Vegetarian', spice: 'none', prep: 8 },
    { cat: hDrinks.id, name: 'Draft Lager (pint)', desc: 'Ice-cold, local brewery.', price: 180, img: IMG('1535958636474-b021ee887b13'), ing: 'beer (gluten)', aller: 'gluten, alcohol', diet: '', spice: 'none', prep: 2 },
    { cat: hDrinks.id, name: 'Rum & Tonic', desc: 'Local white rum, tonic, lime.', price: 240, img: IMG('1551538827-9c037cb4f32a'), ing: 'rum, tonic, lime', aller: 'alcohol', diet: '', spice: 'none', prep: 4 },
  ];
  const createdHarbour: Record<string, string> = {};
  for (let idx = 0; idx < harbourItems.length; idx++) {
    const it = harbourItems[idx];
    const row = await prisma.menuItem.create({
      data: {
        restaurantId: harbour.id, categoryId: it.cat, name: it.name, description: it.desc,
        price: it.price, currency: 'MUR', image: it.img, ingredients: it.ing,
        allergens: it.aller, dietaryTags: it.diet, spiceLevel: it.spice, prepMinutes: it.prep,
        status: 'available', featured: !!it.special, recommended: !!it.reco,
        isSpecial: !!it.special, displayOrder: idx,
      },
    });
    createdHarbour[it.name] = row.id;
  }
  await prisma.menuItem.update({
    where: { id: createdHarbour['Harbour Smash Burger'] },
    data: { upsellItemIds: createdHarbour['Harbour Fries'] },
  });

  // ══════════════════════════════════════════════════════════
  // 3. ATELIER CASCAVELLE — café, light theme
  // ══════════════════════════════════════════════════════════
  const atelier = await prisma.restaurant.create({
    data: {
      slug: 'atelier-cascavelle',
      name: 'Atelier Cascavelle',
      tagline: 'Coffee, pastry, slow mornings.',
      description: 'A bakery-café at Cascavelle. Slow coffee, laminated pastry, all-day brunch.',
      address: 'Cascavelle Shopping Village, Mauritius',
      phone: '+230 452 1100',
      email: 'bonjour@ateliercascavelle.mu',
      wifiName: 'Atelier_Guest',
      wifiPassword: 'slowmornings',
      instagram: 'ateliercascavelle',
      logoText: 'Atelier Cascavelle',
      primaryColor: '#3E4A38',
      accentColor: '#7E8F72',
      surfaceColor: '#FBFBF6',
      textColor: '#2A2E27',
      themeMode: 'light',
      buttonStyle: 'rounded',
      welcomeMsg: 'Morning. The board is on the menu — pastry goes quickly.',
      currency: 'MUR',
      defaultLang: 'en',
      plan: 'starter',
      featAi: true,
      featOrder: false,
      featSpecials: true,
      coverImage: IMG('1554118811-1e0d58224f24'),
    },
  });

  const aBrunch = await prisma.category.create({
    data: { restaurantId: atelier.id, name: 'Brunch', nameFr: 'Brunch', displayOrder: 1, icon: '🍳' },
  });
  const aPastry = await prisma.category.create({
    data: { restaurantId: atelier.id, name: 'Pastry', nameFr: 'Pâtisserie', displayOrder: 2, icon: '🥐' },
  });
  const aCoffee = await prisma.category.create({
    data: { restaurantId: atelier.id, name: 'Coffee & Tea', nameFr: 'Café & thé', displayOrder: 3, icon: '☕' },
  });
  const aCold = await prisma.category.create({
    data: { restaurantId: atelier.id, name: 'Cold Bar', nameFr: 'Bar froid', displayOrder: 4, icon: '🧊' },
  });

  const atelierItems = [
    { cat: aBrunch.id, name: 'Avocado, Chilli, Egg', desc: 'Sourdough, crushed avocado, feta, poached egg, chilli oil.', price: 280, img: IMG('1525351484163-7529414344d8'), ing: 'sourdough, avocado, feta, egg, chilli', aller: 'gluten, dairy, egg', diet: 'Vegetarian', spice: 'mild', prep: 12, reco: true },
    { cat: aBrunch.id, name: 'Market Grain Bowl', desc: 'Brown rice, roasted vegetables, chickpeas, tahini, herbs.', price: 260, img: IMG('1512621776951-a57141f2eefd'), ing: 'brown rice, vegetables, chickpeas, tahini, herbs', aller: 'sesame', diet: 'Vegan, Gluten-free', spice: 'none', prep: 10, reco: true },
    { cat: aBrunch.id, name: 'Creole Shakshuka', desc: 'Tomato rougaille, two eggs, grilled bread.', price: 270, img: IMG('1590412200988-a436970781fa'), ing: 'tomato, egg, onion, spices, bread', aller: 'egg, gluten', diet: 'Vegetarian, Spicy', spice: 'medium', prep: 15, special: true },
    { cat: aPastry.id, name: 'Almond Croissant', desc: 'Laminated, baked through the morning. Almond cream.', price: 95, img: IMG('1555507036-ab1f4038808a'), ing: 'flour, butter, almond, sugar, egg', aller: 'gluten, dairy, egg, nuts', diet: 'Vegetarian', spice: 'none', prep: 2, special: true, reco: true },
    { cat: aPastry.id, name: 'Vanilla Custard Tart', desc: 'Buttery shell, Madagascan vanilla custard.', price: 110, img: IMG('1488477181946-6428a0291777'), ing: 'flour, butter, milk, egg, vanilla', aller: 'gluten, dairy, egg', diet: 'Vegetarian', spice: 'none', prep: 2, status: 'sold_out' },
    { cat: aPastry.id, name: 'Dark Chocolate Cookie', desc: 'Brown butter, sea salt, 70% chocolate.', price: 75, img: IMG('1499636136210-6f4ee915583e'), ing: 'flour, butter, sugar, chocolate, egg', aller: 'gluten, dairy, egg', diet: 'Vegetarian', spice: 'none', prep: 1 },
    { cat: aCoffee.id, name: 'Flat White', desc: 'Double shot, silky microfoam.', price: 130, img: IMG('1509042239860-f550ce710b93'), ing: 'coffee, milk', aller: 'dairy', diet: 'Vegetarian', spice: 'none', prep: 4, reco: true },
    { cat: aCoffee.id, name: 'Pour-over Filter', desc: 'Single origin, brewed to order.', price: 150, img: IMG('1495474472287-4d71bcdd2085'), ing: 'coffee', aller: '', diet: 'Vegan, Dairy-free', spice: 'none', prep: 6 },
    { cat: aCoffee.id, name: 'Masala Chai', desc: 'Black tea, spices, steamed milk.', price: 120, img: IMG('1571934811356-5cc061b6821f'), ing: 'tea, spices, milk, sugar', aller: 'dairy', diet: 'Vegetarian', spice: 'none', prep: 5 },
    { cat: aCold.id, name: 'Alouda of the Week', desc: 'The island milk drink, our way. Often vanilla, sometimes pistachio.', price: 90, img: IMG('1571091718767-18b5b1457add'), ing: 'milk, basil seed, vanilla, sugar', aller: 'dairy', diet: 'Vegetarian', spice: 'none', prep: 4, special: true },
    { cat: aCold.id, name: 'Fresh Lime & Mint', desc: 'Pressed lime, mint, soda.', price: 100, img: IMG('1551538827-9c037cb4f32a'), ing: 'lime, mint, soda, sugar', aller: '', diet: 'Vegan, Gluten-free', spice: 'none', prep: 3 },
  ];
  for (let idx = 0; idx < atelierItems.length; idx++) {
    const it = atelierItems[idx];
    await prisma.menuItem.create({
      data: {
        restaurantId: atelier.id, categoryId: it.cat, name: it.name, description: it.desc,
        price: it.price, currency: 'MUR', image: it.img, ingredients: it.ing,
        allergens: it.aller, dietaryTags: it.diet, spiceLevel: it.spice, prepMinutes: it.prep,
        status: it.status || 'available', featured: !!it.special, recommended: !!it.reco,
        isSpecial: !!it.special, displayOrder: idx,
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // Locations, tables, NFC/QR objects
  // ══════════════════════════════════════════════════════════
  const sRoom = await prisma.location.create({ data: { restaurantId: sauvage.id, name: 'Main Dining Room', kind: 'room', displayOrder: 1 } });
  const sTerrace = await prisma.location.create({ data: { restaurantId: sauvage.id, name: 'Sea Terrace', kind: 'terrace', displayOrder: 2 } });
  const hRoom = await prisma.location.create({ data: { restaurantId: harbour.id, name: 'Harbour Floor', kind: 'room', displayOrder: 1 } });
  const aRoom = await prisma.location.create({ data: { restaurantId: atelier.id, name: 'Café Floor', kind: 'room', displayOrder: 1 } });

  async function mkTable(restaurantId: string, locationId: string, label: string, seats: number, code: string, nfc?: string, type = 'table_number') {
    const table = await prisma.tableObj.create({ data: { restaurantId, locationId, label, seats } });
    await prisma.physicalObject.create({
      data: {
        restaurantId, tableId: table.id, publicCode: code, nfcUid: nfc || null,
        objectType: type, label: `${label} · NFC + QR`, status: 'active',
      },
    });
    return table;
  }

  const sauvageTables: Record<string, string> = {};
  for (let i = 1; i <= 14; i++) {
    const loc = i <= 8 ? sRoom.id : sTerrace.id;
    const code = `C${String(i).padStart(2, '0')}${['A','B','C','D'][i % 4]}`;
    const t = await mkTable(sauvage.id, loc, `Table ${i}`, 2 + (i % 4), code, i % 3 === 0 ? `04:A2:${String(i).padStart(2, '0')}:8F:42:K` : undefined);
    sauvageTables[`T${i}`] = t.id;
  }
  // Table 8 is the hero from the reference screenshots
  await prisma.physicalObject.updateMany({ where: { tableId: sauvageTables['T8'] }, data: { publicCode: 'T8SAUV' } });

  const harbourTables: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    const code = `H${String(i).padStart(2, '0')}${['K','M','N'][i % 3]}`;
    const t = await mkTable(harbour.id, hRoom.id, `Table ${i}`, 4, code);
    harbourTables[`T${i}`] = t.id;
  }
  await prisma.physicalObject.updateMany({ where: { tableId: harbourTables['T3'] }, data: { publicCode: 'T3HARB' } });

  const atelierTables: Record<string, string> = {};
  for (let i = 1; i <= 8; i++) {
    const code = `A${String(i).padStart(2, '0')}${['P','Q'][i % 2]}`;
    const t = await mkTable(atelier.id, aRoom.id, `Table ${i}`, 2, code, undefined, 'counter');
    atelierTables[`T${i}`] = t.id;
  }
  await prisma.physicalObject.updateMany({ where: { tableId: atelierTables['T1'] }, data: { publicCode: 'T1ATEL' } });

  // ══════════════════════════════════════════════════════════
  // Opening hours
  // ══════════════════════════════════════════════════════════
  for (const r of [sauvage, harbour, atelier]) {
    const hours =
      r.id === atelier.id
        ? [[0, '08:00', '16:00', false], [1, '07:00', '17:00', false], [2, '07:00', '17:00', false], [3, '07:00', '17:00', false], [4, '07:00', '17:00', false], [5, '07:00', '18:00', false], [6, '08:00', '18:00', false]]
        : [[0, '11:30', '22:00', false], [1, '12:00', '22:00', false], [2, '12:00', '22:00', false], [3, '12:00', '22:00', false], [4, '12:00', '22:30', false], [5, '12:00', '23:00', false], [6, '11:30', '23:00', false]];
    for (const [d, o, c, closed] of hours as [number, string, string, boolean][]) {
      await prisma.openingHour.create({ data: { restaurantId: r.id, dayOfWeek: d, open: o, close: c, closed } });
    }
  }

  // ══════════════════════════════════════════════════════════
  // FAQs (restaurant-authored AI knowledge)
  // ══════════════════════════════════════════════════════════
  const faqs: { r: string; q: string; qf?: string; a: string; af?: string }[] = [
    { r: sauvage.id, q: 'Do you have parking?', qf: 'Avez-vous un parking ?', a: 'Yes — complimentary valet parking at the entrance from 18:00.', af: "Oui — voiturier gratuit à l'entrée à partir de 18h00." },
    { r: sauvage.id, q: 'Is there a dress code?', qf: 'Y a-t-il un code vestimentaire ?', a: 'Smart casual. No beachwear in the dining room.', af: 'Chic décontracté. Pas de tenue de plage dans la salle.' },
    { r: sauvage.id, q: 'Can you cater for dietary requirements?', qf: 'Pouvez-vous adapter selon le régime ?', a: 'The kitchen can adapt many dishes — please tell your waiter and confirm ingredients directly.', af: 'La cuisine peut adapter de nombreux plats — parlez-en à votre serveur et confirmez les ingrédients.' },
    { r: harbour.id, q: 'Do you show live sport?', a: 'Yes — big screens on the harbour floor for major matches.', af: 'Oui — grands écrans pour les grands matchs.' },
    { r: harbour.id, q: 'Are you family friendly?', a: 'Very. High chairs and a kids menu are available — just ask.', af: 'Tout à fait. Chaises hautes et menu enfant disponibles.' },
    { r: atelier.id, q: 'Do you have Wi-Fi?', qf: 'Avez-vous le Wi-Fi ?', a: 'Yes — free guest Wi-Fi. The password is on the table card.', af: 'Oui — Wi-Fi invité gratuit. Le mot de passe est sur la carte.' },
    { r: atelier.id, q: 'Can I work here?', a: 'Absolutely — we have power points along the wall bench.', af: 'Bien sûr — des prises le long du banc mural.' },
  ];
  for (let i = 0; i < faqs.length; i++) {
    await prisma.faq.create({ data: { restaurantId: faqs[i].r, question: faqs[i].q, questionFr: faqs[i].qf, answer: faqs[i].a, answerFr: faqs[i].af, displayOrder: i } });
  }

  // ══════════════════════════════════════════════════════════
  // Users
  // ══════════════════════════════════════════════════════════
  await prisma.user.create({ data: { email: 'leo.a@example.org', name: 'Léo Andrian', passwordHash: pw, role: 'super_admin', restaurantId: null } });
  await prisma.user.create({ data: { email: 'grace.l@example.com', name: 'Grace Laval', passwordHash: pw, role: 'owner', restaurantId: sauvage.id } });
  await prisma.user.create({ data: { email: 'julien.m@example.com', name: 'Julien Morel', passwordHash: pw, role: 'owner', restaurantId: sauvage.id } });
  await prisma.user.create({ data: { email: 'xena.w@example.org', name: 'Xena Wong', passwordHash: pw, role: 'staff', restaurantId: sauvage.id } });
  await prisma.user.create({ data: { email: 'wendy.h@example.net', name: 'Wendy Ho', passwordHash: pw, role: 'owner', restaurantId: harbour.id } });
  await prisma.user.create({ data: { email: 'fiona.g@example.net', name: 'Fiona Grant', passwordHash: pw, role: 'owner', restaurantId: atelier.id } });

  // ══════════════════════════════════════════════════════════
  // Subscriptions
  // ══════════════════════════════════════════════════════════
  await prisma.subscription.create({ data: { restaurantId: sauvage.id, plan: 'pro', monthlyPrice: 6500, status: 'active', renewsAt: new Date(Date.now() + 20 * 864e5) } });
  await prisma.subscription.create({ data: { restaurantId: harbour.id, plan: 'growth', monthlyPrice: 3000, status: 'active', renewsAt: new Date(Date.now() + 12 * 864e5) } });
  await prisma.subscription.create({ data: { restaurantId: atelier.id, plan: 'starter', monthlyPrice: 1500, status: 'trial', renewsAt: new Date(Date.now() + 5 * 864e5) } });

  // ══════════════════════════════════════════════════════════
  // Demo analytics — 30 days of realistic traffic so the
  // dashboard isn't empty on first run.
  // ══════════════════════════════════════════════════════════
  await seedAnalytics(sauvage.id, sauvageTables, 30);
  await seedAnalytics(harbour.id, harbourTables, 30);
  await seedAnalytics(atelier.id, atelierTables, 30);

  // service requests + feedback so the operational screens have content
  const now = Date.now();
  await prisma.serviceRequest.createMany({
    data: [
      { restaurantId: sauvage.id, tableId: sauvageTables['T12'], kind: 'call_staff', label: 'Call staff', status: 'new', createdAt: new Date(now - 2 * 60000) },
      { restaurantId: sauvage.id, tableId: sauvageTables['T8'], kind: 'bill', label: 'Request bill', status: 'new', createdAt: new Date(now - 5 * 60000) },
      { restaurantId: sauvage.id, tableId: sauvageTables['T4'], kind: 'water', label: 'Water', status: 'acknowledged', createdAt: new Date(now - 9 * 60000) },
      { restaurantId: harbour.id, tableId: harbourTables['T5'], kind: 'call_staff', label: 'Call staff', status: 'new', createdAt: new Date(now - 3 * 60000) },
      { restaurantId: harbour.id, tableId: harbourTables['T9'], kind: 'napkins', label: 'Napkins', status: 'resolved', createdAt: new Date(now - 40 * 60000), resolvedAt: new Date(now - 32 * 60000) },
      { restaurantId: atelier.id, tableId: atelierTables['T2'], kind: 'high_chair', label: 'High chair', status: 'new', createdAt: new Date(now - 6 * 60000) },
    ],
  });

  await prisma.feedback.createMany({
    data: [
      { restaurantId: sauvage.id, tableId: sauvageTables['T8'], rating: 5, comment: 'Outstanding — the catch of the day was perfect.', createdAt: new Date(now - 3 * 3600e3) },
      { restaurantId: sauvage.id, tableId: sauvageTables['T3'], rating: 4, comment: 'Beautiful room. Service a touch slow at the start.', createdAt: new Date(now - 26 * 3600e3) },
      { restaurantId: sauvage.id, tableId: sauvageTables['T11'], rating: 5, comment: 'The sommelier pairing was excellent.', createdAt: new Date(now - 50 * 3600e3) },
      { restaurantId: harbour.id, tableId: harbourTables['T3'], rating: 5, comment: 'Best smash burger on the island.', createdAt: new Date(now - 4 * 3600e3) },
      { restaurantId: harbour.id, tableId: harbourTables['T7'], rating: 3, comment: 'Food was good but the wait was long.', createdAt: new Date(now - 28 * 3600e3) },
      { restaurantId: atelier.id, tableId: atelierTables['T1'], rating: 5, comment: 'Almond croissant is worth the trip.', createdAt: new Date(now - 6 * 3600e3) },
    ],
  });

  console.log('✓ Seed complete.');
  console.log('  Tenants: Côte Sauvage, Harbour & Co., Atelier Cascavelle');
  console.log('  Demo logins (password: demo):');
  console.log('    leo.a@example.org   — super admin');
  console.log('    grace.l@example.com — Côte Sauvage owner');
  console.log('    julien.m@example.com — Côte Sauvage owner');
  console.log('    xena.w@example.org  — Côte Sauvage staff');
  console.log('    wendy.h@example.net — Harbour & Co. owner');
  console.log('    fiona.g@example.net — Atelier Cascavelle owner');
}

// realistic daily traffic generator
async function seedAnalytics(restaurantId: string, tables: Record<string, string>, days: number) {
  const tableIds = Object.values(tables);
  const menuItems = await prisma.menuItem.findMany({ where: { restaurantId }, select: { id: true, name: true, categoryId: true, recommended: true, isSpecial: true } });
  const itemIds = menuItems.map((i) => i.id);
  const events = ['category_viewed', 'item_viewed', 'search_started', 'filter_used', 'ai_opened', 'ai_question_submitted', 'call_waiter_requested', 'bill_requested', 'feedback_started'];
  // weight some items as more popular so the AI's "most viewed" answer is meaningful
  const popular = menuItems.filter((i) => i.recommended || i.isSpecial);
  const rows: any[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - d);
    // weekend lift
    const dow = dayStart.getDay();
    const base = dow === 0 || dow === 6 ? 55 : 34;
    const sessions = base + Math.floor(Math.random() * 26);
    for (let s = 0; s < sessions; s++) {
      const t = dayStart.getTime() + Math.floor(Math.random() * 13 * 3600e3) + 11 * 3600e3;
      if (t > Date.now()) continue;
      const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
      const source = Math.random() < 0.68 ? 'nfc' : 'qr';
      rows.push({ restaurantId, tableId, event: source === 'nfc' ? 'nfc_scan' : 'qr_scan', createdAt: new Date(t) });
      rows.push({ restaurantId, tableId, event: 'session_started', createdAt: new Date(t + 500) });
      const depth = 3 + Math.floor(Math.random() * 7);
      for (let e = 0; e < depth; e++) {
        const ev = events[Math.floor(Math.random() * events.length)];
        let entityId: string | null = null;
        let entityLabel: string | null = null;
        if (ev === 'item_viewed' && itemIds.length) {
          // 65% of item views land on a recommended/special dish → real popularity signal
          const src = popular.length && Math.random() < 0.65 ? popular : menuItems;
          const pick = src[Math.floor(Math.random() * src.length)];
          entityId = pick.id;
          entityLabel = pick.name;
        }
        rows.push({ restaurantId, tableId, event: ev, entityId, entityLabel, createdAt: new Date(t + (e + 1) * 20000) });
      }
    }
  }
  // batch insert
  const chunk = 800;
  for (let i = 0; i < rows.length; i += chunk) {
    await prisma.interaction.createMany({ data: rows.slice(i, i + chunk) });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
