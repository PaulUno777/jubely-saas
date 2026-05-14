export const comingSoonPagesFr = {
  badge: "Bientôt disponible",
  revenue: {
    title: "Revenus & MRR",
    subtitle: "Les analyses consolidées de facturation et de MRR seront ajoutées dans une phase ultérieure.",
  },
  users: {
    title: "Utilisateurs multi-tenants",
    subtitle: "L’annuaire et la recherche sur tous les comptes marchands ne font pas partie de la phase 1.",
  },
  subscriptions: {
    title: "Abonnements",
    subtitle: "Renouvellements, factures et relances seront branchés à l’intégration de la facturation.",
  },
  plans: {
    title: "Offres & tarifs",
    subtitle: "Gestion du catalogue et grilles tarifaires prévues dans une version ultérieure.",
  },
  integrations: {
    title: "API & intégrations",
    subtitle: "Webhooks, clés API et connecteurs partenaires après les parcours fidélité principaux.",
  },
  system: {
    title: "Santé système",
    subtitle: "Sondes en direct et état des dépendances remplaceront les données d’exemple quand la télémétrie sera branchée.",
  },
  audit: {
    title: "Journaux & audit",
    subtitle: "Pistes d’audit immuables et export prévus avec les jalons conformité.",
  },
} as const;

export const sampleDashboardFr = {
  kpis: {
    mrrTotal: { detail: "par mois", delta: "+18,4 %" },
    tenantsActive: { detail: "+3 ce mois · 2 essais", delta: "+14,3 %" },
    endCustomers: { detail: "+1 204 vs mois dernier", delta: "+10,3 %" },
    systemAlerts: { detail: "2 paiements en retard", delta: "Action requise" },
  },
  mrrSummary: {
    current: "2,87 M FCFA",
    growth30d: "+18,4 %",
    projectedArr: "34,4 M FCFA",
  },
  mrrMonths: {
    nov: "nov.",
    dec: "déc.",
    jan: "janv.",
    feb: "févr.",
    mar: "mars",
    apr: "avr.",
  },
  planNames: {
    business: "Business",
    growth: "Growth",
    starter: "Starter",
    trial: "Essai",
  },
  tenants: {
    chezMama: { name: "Chez Mama" },
    boulangerieSoleil: { name: "Boulangerie Soleil" },
    cafeRiviera: { name: "Café Riviera" },
    marketNord: { name: "Market Nord" },
  },
  alerts: {
    paymentLate: {
      title: "Paiement en retard de 12 jours",
      detail: "Market Nord · offre Growth",
    },
    trialExpires: {
      title: "Fin d’essai dans 3 jours",
      detail: "Café Riviera · offre Starter",
    },
    webhookFailures: {
      title: "Échecs webhook API",
      detail: "Boulangerie Soleil · 4 relances en 1 h",
    },
  },
  infrastructure: {
    apiGo: { label: "API Go", value: "42 ms" },
    postgres: { label: "PostgreSQL", value: "99,98 %" },
    redis: { label: "Redis", value: "1,2 ms" },
    sms: { label: "SMS Nexah", value: "98,1 %" },
    bullmq: { label: "BullMQ", value: "47 jobs" },
    fly: { label: "Fly.io", value: "3 instances" },
  },
  audit: {
    tenantCreated: {
      title: "Tenant créé",
      target: "Chez Mama",
      actor: "root@jubelee.app",
      when: "Il y a 2 h",
    },
    planUpdated: {
      title: "Offre mise à jour",
      target: "Boulangerie Soleil",
      actor: "root@jubelee.app",
      when: "Il y a 5 h",
    },
    tenantSuspended: {
      title: "Tenant suspendu",
      target: "Market Nord",
      actor: "root@jubelee.app",
      when: "Hier",
    },
    adminCreated: {
      title: "Administrateur créé",
      target: "Café Riviera",
      actor: "root@jubelee.app",
      when: "Hier",
    },
    rootLogin: {
      title: "Connexion root",
      target: "Portail production",
      actor: "root@jubelee.app",
      when: "Il y a 2 jours",
    },
  },
} as const;
