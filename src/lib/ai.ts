import { prisma } from './db';
import type { Lang } from './i18n';

// ───────────────────────────────────────────────────────────
// SmartMenus AI — restaurant-grounded menu assistant.
//
// Design goals (from the brief):
//  • Never a general-purpose chatbot — answers ONLY from this
//    restaurant's structured knowledge.
//  • Never invents ingredients, prices, promotions or allergens.
//  • Respects availability (never recommends a sold-out item).
//  • Never guarantees allergen safety; escalates to staff.
//  • Provider-abstracted: an LLM can be plugged in, but a
//    deterministic retrieval engine guarantees grounding and
//    works with zero external dependencies.
// ───────────────────────────────────────────────────────────

export type AiContext = {
  restaurantName: string;
  tagline?: string | null;
  welcomeMsg?: string | null;
  currency: string;
  lang: Lang;
  openingHours: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean; note: string | null }[];
  address?: string | null;
  phone?: string | null;
  wifiName?: string | null;
  faqs: { question: string; answer: string; questionFr?: string | null; answerFr?: string | null }[];
  /** item views from real analytics — lets the AI distinguish
   *  data-based popularity from a restaurant recommendation (§18/§28) */
  viewCounts: Record<string, number>;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    ingredients: string | null;
    allergens: string | null;
    dietaryTags: string | null;
    spiceLevel: string;
    status: string;
    isSpecial: boolean;
    recommended: boolean;
    aiNote: string | null;
    upsellNames: string[];
  }[];
};

export type AiResult = {
  answer: string;
  groundedOn: string[];
  suggestedItems: { id: string; name: string }[];
  unanswered: boolean;
};

const ALLERGEN_WORDS = [
  'allerg', 'gluten', 'dairy', 'milk', 'nut', 'peanut', 'shellfish', 'seafood',
  'egg', 'soy', 'sesame', 'lactose', 'coeliac', 'celiac',
];
const MEDICAL_WORDS = ['safe for', 'will i die', 'reaction', 'medical', 'anaphyl', 'cure', 'doctor', 'health'];
const SPICE_WORDS = ['spicy', 'spice', 'hot', 'mild', 'piment', 'épicé', 'epice'];
const VEG_WORDS = ['vegetarian', 'vegan', 'veggie', 'meat-free', 'meat free', 'sans viande', 'végétarien', 'vegetarien', 'végétalien'];
const LIGHT_WORDS = ['light', 'lighter', 'healthy', 'léger', 'leger'];
const SWEET_WORDS = ['dessert', 'sweet', 'sucré', 'sucre'];
const DRINK_WORDS = ['wine', 'drink', 'beer', 'cocktail', 'vin', 'boisson', 'bière', 'biere'];
const FISH_WORDS = ['fish', 'seafood', 'poisson', 'fruits de mer', 'prawn', 'shrimp', 'tuna', 'thon'];
const PRICE_WORDS = ['price', 'cost', 'how much', 'prix', 'combien'];
const HOURS_WORDS = ['open', 'opening', 'hours', 'close', 'heure', 'ouvert', 'horaire'];
const RECO_WORDS = ['recommend', 'suggest', 'popular', 'best', 'favourite', 'favorite', 'what should', 'quoi prendre', 'recommand', 'conseill', 'spécialité'];
const SPECIAL_WORDS = ['special', 'spécial', 'aujourd', 'today'];
const AVOID_WORDS = ["don't like", "dont like", 'no ', 'without', 'allerg', 'hate', "n'aime", 'sans '];
const AVAILABILITY_WORDS = ['available', 'sold out', 'sold-out', 'do you have', 'en stock', 'disponible', 'épuisé', 'epuise'];

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function has(text: string, words: string[]) {
  const n = norm(text);
  return words.some((w) => n.includes(norm(w)));
}

/** Retrieve the full structured knowledge for a restaurant. */
export async function buildAiContext(restaurantId: string, lang: Lang): Promise<AiContext | null> {
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      openingHours: { orderBy: { dayOfWeek: 'asc' } },
      faqs: { orderBy: { displayOrder: 'asc' } },
      items: { include: { category: true } },
    },
  });
  if (!r) return null;

  // real popularity signal: item_viewed counts over the last 30 days
  const since = new Date(Date.now() - 30 * 864e5);
  const views = await prisma.interaction.groupBy({
    by: ['entityId'],
    where: { restaurantId, event: 'item_viewed', entityId: { not: null }, createdAt: { gte: since } },
    _count: { entityId: true },
  });
  const viewCounts: Record<string, number> = {};
  for (const v of views) if (v.entityId) viewCounts[v.entityId] = v._count.entityId;

  const byId = new Map(r.items.map((i) => [i.id, i]));
  return {
    restaurantName: r.name,
    tagline: r.tagline,
    welcomeMsg: r.welcomeMsg,
    currency: r.currency,
    lang,
    viewCounts,
    openingHours: r.openingHours.map((h) => ({
      dayOfWeek: h.dayOfWeek, open: h.open, close: h.close, closed: h.closed, note: h.note,
    })),
    address: r.address,
    phone: r.phone,
    wifiName: r.wifiName,
    faqs: r.faqs.map((f) => ({
      question: f.question, answer: f.answer, questionFr: f.questionFr, answerFr: f.answerFr,
    })),
    items: r.items.map((i) => ({
      id: i.id,
      name: lang === 'fr' && i.nameFr ? i.nameFr : i.name,
      description: (lang === 'fr' && i.descriptionFr ? i.descriptionFr : i.description) || null,
      price: i.price,
      category: lang === 'fr' && i.category.nameFr ? i.category.nameFr : i.category.name,
      ingredients: i.ingredients,
      allergens: i.allergens,
      dietaryTags: i.dietaryTags,
      spiceLevel: i.spiceLevel,
      status: i.status,
      isSpecial: i.isSpecial,
      recommended: i.recommended,
      aiNote: i.aiNote,
      upsellNames: (i.upsellItemIds || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((x) => (lang === 'fr' && (x as any).nameFr ? (x as any).nameFr : (x as any).name)),
    })),
  };
}

function fmt(ctx: AiContext, n: number) {
  const cur = ctx.currency === 'MUR' ? 'Rs' : ctx.currency;
  return `${cur} ${n.toLocaleString('en-US')}`;
}

function visible(ctx: AiContext) {
  return ctx.items.filter((i) => i.status !== 'hidden');
}
function available(ctx: AiContext) {
  return visible(ctx).filter((i) => i.status === 'available');
}

/**
 * The deterministic grounded answer engine.
 * Returns an answer string + which items grounded it.
 */
export function answerFromContext(ctx: AiContext, question: string): AiResult {
  const fr = ctx.lang === 'fr';
  const q = question.trim();
  const items = visible(ctx);
  const avail = available(ctx);
  const grounded: string[] = [];
  const suggested: { id: string; name: string }[] = [];

  const push = (i: (typeof items)[number]) => {
    grounded.push(i.id);
    suggested.push({ id: i.id, name: i.name });
  };

  // ── 0. Empty question
  if (!q) {
    return {
      answer: fr
        ? "Posez-moi une question sur les plats, les ingrédients ou les allergènes."
        : 'Ask me about our dishes, ingredients, allergens or what to choose.',
      groundedOn: [],
      suggestedItems: [],
      unanswered: false,
    };
  }

  // ── 1. Medical / allergen-safety guardrail (highest priority)
  if (has(q, MEDICAL_WORDS)) {
    return {
      answer: fr
        ? "Je ne peux pas donner de conseils médicaux ni garantir qu'un plat est sans danger pour une allergie sévère. Confirmez toujours les ingrédients directement auprès du personnel."
        : "I can't give medical advice or guarantee that a dish is safe for a severe allergy. Always confirm ingredients directly with our staff.",
      groundedOn: [],
      suggestedItems: [],
      unanswered: false,
    };
  }

  // ── 2. FAQ match (restaurant-authored, highest trust)
  for (const f of ctx.faqs) {
    const fq = fr && f.questionFr ? f.questionFr : f.question;
    const fa = fr && f.answerFr ? f.answerFr : f.answer;
    if (keywordOverlap(q, fq) >= 0.5) {
      return { answer: fa, groundedOn: ['faq'], suggestedItems: [], unanswered: false };
    }
  }

  // ── 3. Opening hours
  if (has(q, HOURS_WORDS) && ctx.openingHours.length) {
    const lines = ctx.openingHours.map((h) => {
      const d = DAYS[fr ? 'fr' : 'en'][h.dayOfWeek];
      return h.closed || !h.open ? `${d}: ${fr ? 'fermé' : 'closed'}` : `${d}: ${h.open}–${h.close}`;
    });
    return {
      answer: (fr ? 'Nos horaires :\n' : 'Our opening hours:\n') + lines.join('\n'),
      groundedOn: ['hours'],
      suggestedItems: [],
      unanswered: false,
    };
  }

  // ── 4. Generic allergen question → list items containing that allergen
  // Guard: only when the question is really about allergens, not popularity
  // or recommendations ("most popular seafood dish" must NOT land here).
  const isRecoQuestion = has(q, RECO_WORDS) || has(q, ['popular', 'most', 'best', 'top', 'signature', 'favourite', 'favorite']);
  const allergenHit = ALLERGEN_WORDS.find((w) => has(q, [w]));
  if (allergenHit && !isRecoQuestion && has(q, ['contain', 'contains', 'have', 'which', 'does', 'contient', 'quel', 'quels'])) {
    const matches = items.filter((i) => i.allergens && norm(i.allergens).includes(norm(allergenHit)));
    if (matches.length) {
      matches.forEach(push);
      return {
        answer:
          (fr
            ? `D'après les informations du restaurant, les plats suivants mentionnent « ${allergenHit} » :\n`
            : `Based on the restaurant's information, these dishes list “${allergenHit}”:\n`) +
          matches.map((m) => `• ${m.name}`).join('\n') +
          (fr
            ? `\n\nJe ne peux pas garantir l'absence d'allergènes — confirmez auprès du personnel.`
            : `\n\nI can't guarantee allergen-free food — please confirm with staff.`),
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
    // we know the allergen vocabulary but no item lists it
    return {
      answer: fr
        ? `Aucun plat de la carte actuelle ne mentionne « ${allergenHit} » dans ses allergènes. Ce n'est pas une garantie — confirmez auprès du personnel.`
        : `No dish on the current menu lists “${allergenHit}” in its allergens. That is not a guarantee — please confirm with staff.`,
      groundedOn: [],
      suggestedItems: [],
      unanswered: false,
    };
  }

  // ── 5. Availability check for a named dish
  if (has(q, AVAILABILITY_WORDS)) {
    const named = findByMention(items, q);
    if (named.length) {
      const i = named[0];
      const isAvail = i.status === 'available';
      push(i);
      return {
        answer: isAvail
          ? fr
            ? `Oui — ${i.name} est disponible (${fmt(ctx, i.price)}).`
            : `Yes — ${i.name} is available (${fmt(ctx, i.price)}).`
          : fr
            ? `Non — ${i.name} est actuellement indisponible.`
            : `No — ${i.name} is currently unavailable.`,
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
  }

  // ── 6. Price question for a named dish
  if (has(q, PRICE_WORDS)) {
    const named = findByMention(items, q);
    if (named.length) {
      named.slice(0, 3).forEach(push);
      return {
        answer:
          (fr ? 'Les prix actuels :\n' : 'Current prices:\n') +
          named.slice(0, 3).map((i) => `• ${i.name} — ${fmt(ctx, i.price)}`).join('\n'),
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
  }

  // ── 7. Data-based popularity — must run BEFORE the dietary filters so
  // "most popular seafood dish" reports real view data, not a generic filter.
  const wantsPopularity = /\b(popular|most viewed|most-viewed|most ordered|best.?selling|top|favourite|favorite|signature)\b/i.test(q);
  if (wantsPopularity && Object.keys(ctx.viewCounts).length) {
    // narrow to a category if the question names one
    const cats = [...new Set(items.map((i) => i.category))];
    const namedCat = cats.find((c) => has(q, [c]));
    let pool = avail.filter((i) => (ctx.viewCounts[i.id] || 0) > 0);
    if (namedCat) pool = pool.filter((i) => i.category === namedCat);
    // narrow by a semantic qualifier ("most popular seafood dish")
    if (has(q, FISH_WORDS)) pool = pool.filter((i) => /fish|poisson|seafood|fruit de mer|prawn|crevette|shrimp|tuna|thon|calamari|lobster|homard|octopus|ourite|squid/.test(norm(`${i.name} ${i.description || ''} ${i.category} ${i.ingredients || ''}`)));
    else if (has(q, VEG_WORDS)) pool = pool.filter((i) => /vegetarian|vegan|vegetarien/.test(norm(i.dietaryTags || '')));
    else if (has(q, SWEET_WORDS)) pool = pool.filter((i) => /dessert|sweet|sucr|pastry|cake|tart|fondant/.test(norm(`${i.category} ${i.name}`)));
    else if (has(q, DRINK_WORDS)) pool = pool.filter((i) => /drink|wine|beer|cocktail|boisson|coffee|cafe|rum/.test(norm(`${i.category} ${i.name}`)));
    const ranked = [...pool].sort((a, b) => (ctx.viewCounts[b.id] || 0) - (ctx.viewCounts[a.id] || 0)).slice(0, 3);
    if (ranked.length) {
      ranked.forEach(push);
      const scope = namedCat ? ` ${namedCat.toLowerCase()}` : '';
      return {
        answer:
          (fr
            ? `D'après les données du restaurant, les plats${scope} les plus consultés sont :\n`
            : `Based on the restaurant's data, the most-viewed${scope} dishes are:\n`) +
          ranked.map((i) => `• ${i.name} — ${ctx.viewCounts[i.id]} ${fr ? 'vues' : 'views'}`).join('\n') +
          (fr ? `\n\nSouhaitez-vous une recommandation ?` : `\n\nWould you like a recommendation instead?`),
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
  }

  // ── 7b. Dietary / preference filtering (vegetarian, light, spicy, fish…)
  const filters: ((i: (typeof items)[number]) => boolean)[] = [];
  const reasons: string[] = [];

  if (has(q, VEG_WORDS)) {
    filters.push((i) => {
      const tags = norm(`${i.dietaryTags || ''} ${i.name} ${i.description || ''}`);
      return tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('vegetarien') || tags.includes('vegan');
    });
    reasons.push(fr ? 'végétarien' : 'vegetarian');
  }
  if (has(q, LIGHT_WORDS)) {
    filters.push((i) => {
      const t = norm(`${i.name} ${i.description || ''} ${i.category} ${i.dietaryTags || ''}`);
      return /salad|soupe|soup|grain|bowl|carpaccio|tartare|grilled|grill|vapeur|leger|light|fraicheur|fresh/.test(t);
    });
    reasons.push(fr ? 'léger' : 'light');
  }
  if (has(q, FISH_WORDS)) {
    filters.push((i) => {
      const t = norm(`${i.name} ${i.description || ''} ${i.category} ${i.dietaryTags || ''} ${i.ingredients || ''}`);
      return /fish|poisson|seafood|fruit de mer|prawn|crevette|shrimp|tuna|thon|calamari|lobster|homard|octopus|ourite|squid/.test(t);
    });
    reasons.push(fr ? 'poisson / fruits de mer' : 'fish / seafood');
  }
  if (has(q, SWEET_WORDS)) {
    filters.push((i) => /dessert|sweet|sucr|patiss|pastry|cake|tart|glace|ice cream|fondant|croissant|gâteau|gateau/.test(norm(`${i.category} ${i.name} ${i.description || ''}`)));
    reasons.push(fr ? 'dessert' : 'dessert');
  }
  if (has(q, DRINK_WORDS)) {
    filters.push((i) => /drink|wine|vin|beer|biere|bière|cocktail|boisson|jus|juice|coffee|cafe|thé|tea|rum|punch|eau|water|soda/.test(norm(`${i.category} ${i.name} ${i.description || ''}`)));
    reasons.push(fr ? 'boissons' : 'drinks');
  }

  // spice preference — detect negations FIRST ("don't like spicy" = mild).
  // Handles both English and French phrasings, including a few words
  // between the negation and the spice word ("n'aime pas les plats épicés").
  const qn = q.toLowerCase();
  const likesNoSpice =
    /\b(?:not|no)\s+(?:too\s+)?(?:spicy|hot)\b/.test(qn) ||
    /\bmild\b|\bdoux\b|\bpas\s+(?:trop\s+)?[eé]pic|\bnon\s+[eé]pic|\bsans\s+piment/.test(qn) ||
    /\b(?:don'?t|dont|do not)\s+like\b[^.!?]{0,30}\b(?:spic|hot|piment|[eé]pic)/.test(qn) ||
    /\bn'?aime\s+pas\b[^.!?]{0,30}\b(?:spic|hot|piment|[eé]pic)/.test(qn);
  const likesSpice = !likesNoSpice && /\bspic|spice|\bhot\b|[eé]pic|piment/.test(qn);
  let spicePref: string | null = null;
  if (likesNoSpice) spicePref = 'mild';
  else if (likesSpice) spicePref = 'hot';

  // exclusions ("don't like spicy", "no dairy")
  const exclusions: string[] = [];
  if (likesNoSpice) exclusions.push('hot');
  if (has(q, ['no dairy', 'dairy-free', 'dairy free', 'sans lactose', 'sans lait'])) exclusions.push('dairy');
  if (has(q, ['no nuts', 'nut-free', 'sans noix', 'sans fruits à coque'])) exclusions.push('nut');
  if (has(q, ['no meat', 'meat-free', 'sans viande'])) exclusions.push('meat');

  let pool = avail.slice();
  if (filters.length) pool = pool.filter((i) => filters.every((f) => f(i)));
  if (spicePref === 'mild') pool = pool.filter((i) => i.spiceLevel === 'none' || i.spiceLevel === 'mild');
  if (spicePref === 'hot') pool = pool.filter((i) => i.spiceLevel === 'medium' || i.spiceLevel === 'hot');
  for (const ex of exclusions) {
    if (ex === 'hot') pool = pool.filter((i) => i.spiceLevel !== 'hot');
    if (ex === 'dairy') pool = pool.filter((i) => !norm(i.allergens || '').includes('dairy') && !norm(i.allergens || '').includes('milk'));
    if (ex === 'nut') pool = pool.filter((i) => !norm(i.allergens || '').includes('nut'));
    if (ex === 'meat') pool = pool.filter((i) => /vegetarian|vegan|vegetarien|vegan/.test(norm(i.dietaryTags || '')));
  }

  if (filters.length || spicePref || exclusions.length) {
    if (pool.length) {
      const picks = rank(pool).slice(0, 3);
      picks.forEach(push);
      const reason = reasons.length ? reasons.join(', ') : fr ? 'vos critères' : 'your criteria';
      return {
        answer:
          (fr
            ? `Voici ce que je recommande pour ${reason} :\n`
            : `Here's what I'd recommend for ${reason}:\n`) +
          picks.map((i) => `• ${i.name} — ${fmt(ctx, i.price)}${i.dietaryTags ? ` (${i.dietaryTags})` : ''}`).join('\n') +
          (fr ? `\n\nAutre chose ?` : `\n\nAnything else?`),
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
    // nothing matched the filter — be honest
    return {
      answer: fr
        ? `Je ne trouve aucun plat disponible correspondant exactement à cela sur la carte actuelle. Demandez au personnel — ils peuvent adapter.`
        : `I can't find a currently available dish that matches that exactly on the menu. Ask our staff — they may be able to adapt something.`,
      groundedOn: [],
      suggestedItems: [],
      unanswered: false,
    };
  }

  // ── 8. Recommendation / popularity
  // The brief (§18) requires distinguishing DATA-BASED popularity from a
  // RESTAURANT recommendation — so we do exactly that.
  if (has(q, RECO_WORDS) || has(q, SPECIAL_WORDS) || isRecoQuestion) {
    // narrow to a category if one is named (e.g. "seafood dish")
    let pool = avail;
    const namedCat = ctx.items.length
      ? [...new Set(items.map((i) => i.category))]
          .find((c) => has(q, [c]))
      : undefined;
    if (namedCat) pool = pool.filter((i) => i.category === namedCat);

    // data-based popularity: rank by real item_viewed counts
    const hasViewData = pool.some((i) => (ctx.viewCounts[i.id] || 0) > 0);
    const wantsPopularity = has(q, ['popular', 'most', 'best', 'top', 'favourite', 'favorite', 'signature', 'viewed', 'ordered']);

    if (hasViewData && (wantsPopularity || !has(q, RECO_WORDS))) {
      const ranked = [...pool].sort((a, b) => (ctx.viewCounts[b.id] || 0) - (ctx.viewCounts[a.id] || 0));
      const picks = ranked.slice(0, 3).filter((i) => (ctx.viewCounts[i.id] || 0) > 0);
      if (picks.length) {
        picks.forEach(push);
        const scope = namedCat ? ` ${namedCat.toLowerCase()}` : '';
        return {
          answer:
            (fr
              ? `D'après les données du restaurant, les plats${scope} les plus consultés sont :\n`
              : `Based on the restaurant's data, the most-viewed${scope} dishes are:\n`) +
            picks.map((i) => `• ${i.name} — ${ctx.viewCounts[i.id]} ${fr ? 'vues' : 'views'}`).join('\n') +
            (fr
              ? `\n\nSouhaitez-vous que je recommande autre chose ?`
              : `\n\nWould you like a recommendation instead?`),
          groundedOn: grounded,
          suggestedItems: suggested,
          unanswered: false,
        };
      }
    }

    // fall back to restaurant recommendation (specials → recommended → ranked)
    const specials = pool.filter((i) => i.isSpecial);
    const recos = pool.filter((i) => i.recommended);
    const picks = (specials.length ? specials : recos.length ? recos : rank(pool)).slice(0, 3);
    if (picks.length) {
      picks.forEach(push);
      const header = specials.length
        ? fr ? "Les spécialités du jour :\n" : "Today's specials:\n"
        : fr ? 'Le restaurant recommande :\n' : 'The restaurant recommends:\n';
      return {
        answer: header + picks.map((i) => `• ${i.name} — ${fmt(ctx, i.price)}`).join('\n'),
        groundedOn: grounded,
        suggestedItems: suggested,
        unanswered: false,
      };
    }
  }

  // ── 9. Named-dish lookup ("what is in the X", "tell me about X")
  const named = findByMention(items, q);
  if (named.length) {
    const i = named[0];
    push(i);
    if (i.upsellNames.length) {
      // mention configured pairing (upsell), grounded in restaurant config
    }
    const bits: string[] = [i.name + (i.price ? ` — ${fmt(ctx, i.price)}` : '')];
    if (i.description) bits.push(i.description);
    if (i.ingredients) bits.push(`${fr ? 'Ingrédients' : 'Ingredients'}: ${i.ingredients}`);
    if (i.allergens) bits.push(`${fr ? 'Allergènes' : 'Allergens'}: ${i.allergens}`);
    if (i.dietaryTags) bits.push(`${fr ? 'Régime' : 'Dietary'}: ${i.dietaryTags}`);
    if (i.status !== 'available') bits.push(fr ? '⚠️ Actuellement indisponible.' : '⚠️ Currently unavailable.');
    if (i.aiNote) bits.push(i.aiNote);
    if (i.upsellNames.length)
      bits.push((fr ? 'Le restaurant recommande avec ceci : ' : 'The restaurant recommends with this: ') + i.upsellNames.join(', '));
    return { answer: bits.join('\n'), groundedOn: grounded, suggestedItems: suggested, unanswered: false };
  }

  // ── 10. Keyword search fallback over the menu (word-boundary matched, so
  // "helicopter landing pad" can't match "shaved" via the substring "have")
  const STOP = new Set(['have', 'does', 'what', 'which', 'your', 'with', 'that', 'this', 'they', 'them', 'from', 'about', 'there', 'their', 'would', 'could', 'should', 'give', 'make', 'tell', 'know', 'want', 'need', 'like', 'some', 'any', 'the', 'and', 'for', 'you', 'are', 'can', 'how', 'why', 'when', 'where']);
  const kw = norm(q).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
  const found = items.filter((i) => {
    const hay = norm(`${i.name} ${i.description || ''} ${i.ingredients || ''} ${i.dietaryTags || ''} ${i.category}`);
    const hayWords = new Set(hay.split(/[^a-z0-9]+/));
    return kw.some((w) => hayWords.has(w));
  });
  if (found.length) {
    const picks = found.slice(0, 4);
    picks.forEach(push);
    return {
      answer:
        (fr ? 'Voici ce que j’ai trouvé sur la carte :\n' : "Here's what I found on the menu:\n") +
        picks.map((i) => `• ${i.name} — ${fmt(ctx, i.price)}`).join('\n'),
      groundedOn: grounded,
      suggestedItems: suggested,
      unanswered: false,
    };
  }

  // ── 11. Nothing grounded → honest escalation (core guardrail)
  return {
    answer: fr
      ? "Je ne peux pas confirmer cela à partir des informations du menu du restaurant. Veuillez demander à un membre du personnel."
      : "I can't confirm that from the restaurant's menu information. Please ask a member of staff.",
    groundedOn: [],
    suggestedItems: [],
    unanswered: true,
  };
}

// ── helpers ────────────────────────────────────────────────

const DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
};

function rank(list: AiContext['items']) {
  // specials > recommended > then stable order
  return [...list].sort((a, b) => {
    const sa = (a.isSpecial ? 2 : 0) + (a.recommended ? 1 : 0);
    const sb = (b.isSpecial ? 2 : 0) + (b.recommended ? 1 : 0);
    return sb - sa;
  });
}

function findByMention(list: AiContext['items'], q: string) {
  const nq = norm(q);
  const scored = list
    .map((i) => {
      const name = norm(i.name);
      // how many name-words appear in the question
      const words = name.split(/\s+/).filter((w) => w.length > 3);
      const hits = words.filter((w) => nq.includes(w)).length;
      const exact = nq.includes(name) ? 3 : 0;
      return { i, score: hits + exact };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.i);
}

function keywordOverlap(a: string, b: string) {
  const stop = new Set(['the', 'a', 'is', 'do', 'you', 'have', 'what', 'how', 'are', 'of', 'in', 'to', 'and', 'le', 'la', 'les', 'de', 'du', 'est', 'que', 'quel', 'avez', 'vous', 'nous', 'un', 'une']);
  const A = new Set(norm(a).split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)));
  const B = norm(b).split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  if (!A.size || !B.length) return 0;
  const hits = B.filter((w) => A.has(w)).length;
  return hits / Math.max(B.length, 1);
}

/**
 * Optional LLM provider hook (abstracted).
 * If SM_AI_PROVIDER + SM_AI_KEY are set, this would call the vendor with
 * the grounded context as the ONLY knowledge source. Left as a clean seam
 * so the platform is not permanently dependent on one model vendor.
 */
export async function generateAnswer(
  restaurantId: string,
  lang: Lang,
  question: string,
): Promise<AiResult> {
  const ctx = await buildAiContext(restaurantId, lang);
  if (!ctx) {
    return { answer: '', groundedOn: [], suggestedItems: [], unanswered: true };
  }
  // Provider seam: real deployments can replace this call.
  return answerFromContext(ctx, question);
}
