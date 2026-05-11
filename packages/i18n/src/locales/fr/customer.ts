const customer = {
  home: {
    title: "Espace client",
    welcome: "Bienvenue dans votre espace fidélité Jubelee.",
    enroll: "S’inscrire",
    myQr: "Mon QR",
  },
  enroll: {
    title: "S’inscrire dans un magasin",
    hint: "Scannez le QR du magasin (ou collez le token), puis saisissez vos infos pour vous inscrire.",
    storeQrLabel: "QR magasin (token)",
    submit: "S’inscrire",
  },
  qr: {
    title: "Votre QR",
    placeholder: "Connectez-vous pour afficher le QR. Écran câblé en Phase 2+.",
    tokenLabel: "QR client (token)",
  },
} as const;

export default customer;
