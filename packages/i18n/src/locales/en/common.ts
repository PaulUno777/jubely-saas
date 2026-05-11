const common = {
  form: {
    email: "Email",
    password: "Password",
    tenant: "Tenant slug",
    tenantOptional: "Tenant slug (leave empty for superadmin login)",
    name: "Full name",
    phone: "Phone (E.164, e.g. +33...)",
    emailOptional: "Email (optional)",
    submit: "Create customer",
    creating: "Creating…",
    continue: "Continue",
    back: "Back",
    copy: "Copy",
    goLogin: "Go to login",
  },
  nav: {
    staff: {
      createCustomer: "Create customer",
      qr: "Client QR (demo)",
    },
  },
} as const;

export default common;
