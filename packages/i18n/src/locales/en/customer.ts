const customer = {
  home: {
    title: "Customer space",
    welcome: "Welcome to your Jubelee loyalty space.",
    enroll: "Enroll",
    myQr: "My QR",
  },
  enroll: {
    title: "Enroll in a store",
    hint: "Scan the store QR (or paste its token), then enter your details to enroll.",
    storeQrLabel: "Store QR (token)",
    submit: "Enroll",
  },
  qr: {
    title: "Your QR",
    placeholder: "Log in to see your enrollment QR. This screen will be wired in Phase 2+.",
    tokenLabel: "Customer QR (token)",
  },
} as const;

export default customer;
