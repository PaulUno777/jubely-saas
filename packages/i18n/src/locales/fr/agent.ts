const agent = {
  home: {
    title: "Espace agent",
    createCustomer: "Créer un client",
    recordPurchase: "Enregistrer un achat",
  },
  purchase: {
    title: "Enregistrer un achat",
    subtitle: "Créditer des points pour un client déjà inscrit (1 point par 500 FCFA).",
    formTitle: "Détails de l'achat",
    formHint: "Le client doit déjà être inscrit dans cette enseigne.",
    phone: "Téléphone (E.164)",
    phoneRequired: "Le téléphone est requis.",
    amount: "Montant (FCFA)",
    amountInvalid: "Saisissez un montant positif (minimum 500 FCFA pour 1 point).",
    ruleHint: "Règle MVP : 1 point par 500 FCFA (division entière).",
    submit: "Enregistrer l'achat",
    submitting: "Enregistrement…",
    success: "{points} points crédités.",
    error: "Impossible d'enregistrer l'achat.",
    sessionRequired: "Connexion requise.",
    goLogin: "Aller à la connexion",
    resultTitle: "Points crédités",
    resultBody: "+{points} points attribués pour cet achat.",
  },
} as const;

export default agent;
