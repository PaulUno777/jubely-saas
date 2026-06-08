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
  dateRange: {
    sectionTitle: "Period",
    presets: {
      today: "Today",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      thisMonth: "This month",
      thisQuarter: "This quarter",
      yearToDate: "Since January",
    },
    customRange: "Custom range…",
    customTitle: "Custom date range",
    startLabel: "Start date",
    endLabel: "End date",
    apply: "Apply",
    cancel: "Cancel",
    invalidRange: "End date must be on or after the start date.",
    formats: {
      singleDay: "__date__",
      sameMonth: "__start__ – __end__",
      sameYear: "__start__ – __end__",
      crossYear: "__start__ – __end__",
      monthYear: "__date__",
      quarterYear: "__start__ – __end__ __year__",
    },
  },
} as const;

export default common;
