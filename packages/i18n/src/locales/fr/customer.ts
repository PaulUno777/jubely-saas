const customer = {
  home: {
    title: "Espace client",
    welcome: "Bienvenue dans votre espace fidélité Jubelee.",
    enroll: "S’inscrire",
    myQr: "Mon QR",
    wallet: "Portefeuille",
  },
  enroll: {
    title: "S’inscrire dans un magasin",
    hint: "Scannez le QR du magasin (ou collez le token), puis saisissez vos infos pour vous inscrire.",
    storeQrLabel: "QR magasin (token)",
    submit: "S’inscrire",
  },
  join: {
    subtitle: "Rejoignez le programme fidélité de cette enseigne.",
    formTitle: "Vos informations",
    formHint: "Vérifiez votre téléphone avec le code à usage unique, puis finalisez l’inscription. Activez PUBLIC_OTP_LOG_CODE=true sur l’API pour voir les codes dans les journaux sans SMS.",
    name: "Nom complet",
    phone: "Téléphone (E.164, ex. +237…)",
    email: "Email (optionnel)",
    sendOtp: "Envoyer le code",
    otpSent: "Code envoyé (SMS ou logs serveur en dev).",
    otpCode: "Code à usage unique",
    verifyOtp: "Vérifier le code",
    otpVerified: "Téléphone vérifié",
    verifiedHint: "Vous pouvez finaliser l’inscription ci-dessous.",
    enroll: "Finaliser l’inscription",
    enrolled: "Bienvenue ! Enregistrement de votre QR client…",
    loading: "Chargement…",
    notFound: "Magasin introuvable ou inactif.",
    invalidSlug: "Identifiant magasin manquant.",
    genericError: "Une erreur est survenue",
  },
  wallet: {
    title: "Portefeuille",
    hint: "Votre QR client sauvegardé après la dernière inscription sur cet appareil.",
    empty: "Aucun QR client sur cet appareil. Inscrivez-vous via le lien du magasin ou la page d’inscription.",
    clear: "Oublier sur cet appareil",
  },
  qr: {
    title: "Votre QR",
    placeholder: "Connectez-vous pour afficher le QR. Écran câblé en Phase 2+.",
    tokenLabel: "QR client (token)",
  },
} as const;

export default customer;
