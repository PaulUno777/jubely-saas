const agent = {
  home: {
    title: "Agent space",
    createCustomer: "Create a customer",
    recordPurchase: "Record a purchase",
  },
  purchase: {
    title: "Record purchase",
    subtitle: "Credit loyalty points for an enrolled customer (1 point per 500 FCFA).",
    formTitle: "Purchase details",
    formHint: "Customer must already be enrolled at this store.",
    phone: "Phone (E.164)",
    phoneRequired: "Phone is required.",
    amount: "Amount (FCFA)",
    amountInvalid: "Enter a positive amount (minimum 500 FCFA for 1 point).",
    ruleHint: "MVP rule: 1 point per 500 FCFA (integer division).",
    submit: "Record purchase",
    submitting: "Recording…",
    success: "{points} points credited.",
    error: "Could not record purchase.",
    sessionRequired: "You must sign in.",
    goLogin: "Go to login",
    resultTitle: "Points credited",
    resultBody: "+{points} points awarded for this purchase.",
  },
} as const;

export default agent;
