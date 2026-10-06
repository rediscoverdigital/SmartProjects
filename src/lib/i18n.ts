// SmartMenus i18n — EN / FR with room for more languages.
// Architecture: flat key→string maps; a restaurant's approved translations
// live on the content itself (nameFr/descriptionFr), so the UI chrome is
// translated here and the CONTENT is translated in the database.

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = { en: 'English', fr: 'Français' };

type Dict = Record<string, string>;

const en: Dict = {
  'common.back': 'Back',
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.done': 'Done',
  'common.save': 'Save',
  'common.retry': 'Retry',
  'common.send': 'Send',
  'common.loading': 'Loading…',

  'guest.youAreAt': 'You are at',
  'guest.table': 'Table',
  'guest.viewMenu': 'View menu',
  'guest.askAi': 'Ask AI',
  'guest.specials': "Today's specials",
  'guest.callStaff': 'Call staff',
  'guest.requestBill': 'Request bill',
  'guest.aboutUs': 'About us',
  'guest.feedback': 'Feedback',
  'guest.order': 'Order',
  'guest.home': 'Home',
  'guest.menu': 'Menu',
  'guest.ask': 'Ask AI',

  'menu.search': 'Search the menu',
  'menu.all': 'All',
  'menu.noResults': 'No dishes found',
  'menu.noResultsHint': 'Try a different word, or browse the categories.',
  'menu.special': 'Special',
  'menu.soldOut': 'Sold out',
  'menu.unavailable': 'Currently unavailable',
  'menu.comingSoon': 'Coming soon',
  'menu.recommended': 'Recommended',
  'menu.chefRecommends': "The restaurant recommends",
  'menu.ingredients': 'Ingredients',
  'menu.allergens': 'Allergens',
  'menu.dietary': 'Dietary',
  'menu.addToOrder': 'Add to order',
  'menu.added': 'Added',
  'menu.prepTime': 'min',
  'menu.kcal': 'kcal',
  'menu.askAbout': 'Ask AI about this dish',
  'menu.spice.none': 'Not spicy',
  'menu.spice.mild': 'Mild',
  'menu.spice.medium': 'Medium',
  'menu.spice.hot': 'Hot',

  'ai.title': 'AI Assistant',
  'ai.greeting': "Hey — I'm the menu assistant.",
  'ai.subtitle':
    'Ask about dishes, ingredients, allergens, pairings or what to choose.',
  'ai.tryAsking': 'Try asking',
  'ai.placeholder': 'Ask about dishes, allergens, pairings…',
  'ai.thinking': 'Thinking…',
  'ai.disclaimer':
    'I answer only from this restaurant’s information. I can’t guarantee allergen safety — please confirm with staff.',
  'ai.unknown':
    "I can't confirm that from the restaurant's menu information. Please ask a member of staff.",
  'ai.callStaff': 'Call staff',

  'action.callStaffTitle': 'Call a member of staff?',
  'action.callStaffBody': 'A member of our team will come to your table.',
  'action.callStaffCta': 'Call staff',
  'action.callStaffDone': 'Request sent',
  'action.callStaffDoneBody': 'A member of our team has been notified.',
  'action.billTitle': 'Request the bill?',
  'action.billCta': 'Request bill',
  'action.billDone': 'Bill requested',
  'action.billDoneBody': 'Your waiter has been notified.',
  'action.sendAnother': 'Send another request',
  'action.whatDoYouNeed': 'What do you need?',

  'feedback.title': 'How was your experience?',
  'feedback.placeholder': 'Tell us more (optional)',
  'feedback.submit': 'Submit feedback',
  'feedback.thanks': 'Thank you for your feedback.',
  'feedback.backToMenu': 'Back to menu',
  'feedback.rateHint': 'Tap to rate',

  'order.title': 'Your order',
  'order.empty': 'Your order is empty.',
  'order.emptyHint': 'Add dishes from the menu to get started.',
  'order.note': 'Notes for the kitchen',
  'order.notePlaceholder': 'Allergies, preferences, timing…',
  'order.total': 'Total',
  'order.submit': 'Send to kitchen',
  'order.noPayment':
    'No payment is taken in the app — you settle at the restaurant.',
  'order.sent': 'Order sent',
  'order.sentBody': 'The kitchen has been notified.',
  'order.reference': 'Reference',
  'order.remove': 'Remove',

  'about.title': 'About',
  'about.hours': 'Opening hours',
  'about.findUs': 'Find us',
  'about.wifi': 'Wi-Fi',
  'about.services': 'Services',

  'err.unavailable': 'This menu is currently unavailable.',
  'err.unavailableBody': 'Please ask a member of staff for assistance.',
  'err.notFound': "We couldn't find this menu.",
  'err.notFoundBody':
    'Please scan the QR code again or ask staff for assistance.',
  'err.network': 'Connection issue',
  'err.networkBody': 'Please check your connection and try again.',
  'err.suspended': 'This menu is temporarily unavailable.',
  'err.suspendedBody': 'Please ask a member of staff for assistance.',

  'disclaimer.allergens':
    'Dietary and allergen information is provided by the restaurant. Customers with severe allergies should confirm ingredients directly with restaurant staff.',
};

const fr: Dict = {
  'common.back': 'Retour',
  'common.close': 'Fermer',
  'common.cancel': 'Annuler',
  'common.done': 'Terminé',
  'common.save': 'Enregistrer',
  'common.retry': 'Réessayer',
  'common.send': 'Envoyer',
  'common.loading': 'Chargement…',

  'guest.youAreAt': 'Vous êtes à la',
  'guest.table': 'Table',
  'guest.viewMenu': 'Voir la carte',
  'guest.askAi': 'Assistant',
  'guest.specials': 'Spécialités du jour',
  'guest.callStaff': 'Appeler le service',
  'guest.requestBill': "Demander l'addition",
  'guest.aboutUs': 'À propos',
  'guest.feedback': 'Votre avis',
  'guest.order': 'Commander',
  'guest.home': 'Accueil',
  'guest.menu': 'Carte',
  'guest.ask': 'Assistant',

  'menu.search': 'Rechercher dans la carte',
  'menu.all': 'Tout',
  'menu.noResults': 'Aucun plat trouvé',
  'menu.noResultsHint': 'Essayez un autre mot ou parcourez les catégories.',
  'menu.special': 'Spécialité',
  'menu.soldOut': 'Épuisé',
  'menu.unavailable': 'Indisponible',
  'menu.comingSoon': 'Bientôt',
  'menu.recommended': 'Recommandé',
  'menu.chefRecommends': 'Le restaurant recommande',
  'menu.ingredients': 'Ingrédients',
  'menu.allergens': 'Allergènes',
  'menu.dietary': 'Régime',
  'menu.addToOrder': 'Ajouter',
  'menu.added': 'Ajouté',
  'menu.prepTime': 'min',
  'menu.kcal': 'kcal',
  'menu.askAbout': "Demander à l'assistant",
  'menu.spice.none': 'Non épicé',
  'menu.spice.mild': 'Doux',
  'menu.spice.medium': 'Moyen',
  'menu.spice.hot': 'Épicé',

  'ai.title': 'Assistant',
  'ai.greeting': "Bonjour — je suis l'assistant du menu.",
  'ai.subtitle':
    'Posez vos questions sur les plats, ingrédients, allergènes ou accords.',
  'ai.tryAsking': 'Essayez de demander',
  'ai.placeholder': 'Posez une question…',
  'ai.thinking': 'Réflexion…',
  'ai.disclaimer':
    'Je réponds uniquement à partir des informations du restaurant. Je ne peux pas garantir l’absence d’allergènes — confirmez avec le personnel.',
  'ai.unknown':
    "Je ne peux pas confirmer cela à partir des informations du menu. Veuillez demander à un membre du personnel.",
  'ai.callStaff': 'Appeler le service',

  'action.callStaffTitle': 'Appeler un membre du personnel ?',
  'action.callStaffBody': 'Un membre de notre équipe viendra à votre table.',
  'action.callStaffCta': 'Appeler le service',
  'action.callStaffDone': 'Demande envoyée',
  'action.callStaffDoneBody': 'Un membre de notre équipe a été prévenu.',
  'action.billTitle': "Demander l'addition ?",
  'action.billCta': "Demander l'addition",
  'action.billDone': 'Addition demandée',
  'action.billDoneBody': 'Votre serveur a été prévenu.',
  'action.sendAnother': 'Envoyer une autre demande',
  'action.whatDoYouNeed': 'De quoi avez-vous besoin ?',

  'feedback.title': 'Comment était votre expérience ?',
  'feedback.placeholder': 'Dites-nous en plus (optionnel)',
  'feedback.submit': 'Envoyer',
  'feedback.thanks': 'Merci pour votre retour.',
  'feedback.backToMenu': 'Retour à la carte',
  'feedback.rateHint': 'Touchez pour noter',

  'order.title': 'Votre commande',
  'order.empty': 'Votre commande est vide.',
  'order.emptyHint': 'Ajoutez des plats depuis la carte.',
  'order.note': 'Notes pour la cuisine',
  'order.notePlaceholder': 'Allergies, préférences, timing…',
  'order.total': 'Total',
  'order.submit': 'Envoyer en cuisine',
  'order.noPayment':
    "Aucun paiement n'est pris dans l'application — vous réglez au restaurant.",
  'order.sent': 'Commande envoyée',
  'order.sentBody': 'La cuisine a été prévenue.',
  'order.reference': 'Référence',
  'order.remove': 'Retirer',

  'about.title': 'À propos',
  'about.hours': "Heures d'ouverture",
  'about.findUs': 'Nous trouver',
  'about.wifi': 'Wi-Fi',
  'about.services': 'Services',

  'err.unavailable': 'Cette carte est actuellement indisponible.',
  'err.unavailableBody': 'Veuillez demander de l’aide à un membre du personnel.',
  'err.notFound': 'Nous n’avons pas trouvé cette carte.',
  'err.notFoundBody':
    'Veuillez scanner à nouveau le code QR ou demander de l’aide.',
  'err.network': 'Problème de connexion',
  'err.networkBody': 'Vérifiez votre connexion et réessayez.',
  'err.suspended': 'Cette carte est temporairement indisponible.',
  'err.suspendedBody': 'Veuillez demander de l’aide à un membre du personnel.',

  'disclaimer.allergens':
    'Les informations diététiques et allergènes sont fournies par le restaurant. Les clients ayant des allergies sévères doivent confirmer les ingrédients directement auprès du personnel.',
};

const DICTS: Record<Lang, Dict> = { en, fr };

export function t(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}

export function makeT(lang: Lang) {
  return (key: string) => t(lang, key);
}

export function isLang(v: string | undefined | null): v is Lang {
  return v === 'en' || v === 'fr';
}
