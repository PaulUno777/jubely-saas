const customer = {
  home: {
    title: "Customer space",
    welcome: "Welcome to your Jubelee loyalty space.",
    enroll: "Enroll",
    myQr: "My QR",
    wallet: "Wallet",
  },
  enroll: {
    title: "Enroll in a store",
    hint: "Scan the store QR (or paste its token), then enter your details to enroll.",
    storeQrLabel: "Store QR (token)",
    submit: "Enroll",
  },
  join: {
    subtitle: "Join this store’s loyalty program.",
    formTitle: "Your details",
    formHint: "Verify your phone with the one-time code, then enroll. Set PUBLIC_OTP_LOG_CODE=true on the API to see codes in logs when SMS is not wired.",
    name: "Full name",
    phone: "Phone (E.164, e.g. +237…)",
    email: "Email (optional)",
    sendOtp: "Send code",
    otpSent: "Code sent (check SMS or server logs in dev).",
    otpCode: "One-time code",
    verifyOtp: "Verify code",
    otpVerified: "Phone verified",
    verifiedHint: "You can complete enrollment below.",
    enroll: "Complete enrollment",
    enrolled: "Welcome! Saving your customer QR…",
    loading: "Loading store…",
    notFound: "Store not found or inactive.",
    invalidSlug: "Missing store slug.",
    genericError: "Something went wrong",
  },
  wallet: {
    title: "Wallet",
    hint: "Your saved customer QR from the last enrollment on this device.",
    empty: "No customer QR saved yet. Enroll from a store join link or the enroll page.",
    clear: "Forget this device",
  },
  qr: {
    title: "Your QR",
    placeholder: "Log in to see your enrollment QR. This screen will be wired in Phase 2+.",
    tokenLabel: "Customer QR (token)",
  },
} as const;

export default customer;
