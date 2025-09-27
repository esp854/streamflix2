// Flexible subscription plans loaded from environment variables, with safe defaults
export interface PlanDef {
  amount: number;
  currency: string;
  name: string;
  duration: number; // days
  description?: string;
}

export type PlansMap = Record<string, PlanDef>;

const defaultPlans: PlansMap = {
  free: { amount: 0, currency: "XOF", name: "Gratuit", duration: 30, description: "Accès limité avec publicités" },
  basic: { amount: 2000, currency: "XOF", name: "Basic", duration: 30, description: "SD, 1 appareil" },
  standard: { amount: 3000, currency: "XOF", name: "Standard", duration: 30, description: "HD, 2 appareils, téléchargements" },
  premium: { amount: 4000, currency: "XOF", name: "Premium", duration: 30, description: "4K, 4 appareils, contenu exclusif" },
  vip: { amount: 5000, currency: "XOF", name: "VIP", duration: 30, description: "4K, appareils illimités, accès anticipé" },
};

function isValidPlan(obj: any): obj is PlanDef {
  return obj && typeof obj === 'object'
    && typeof obj.amount === 'number' && !Number.isNaN(obj.amount)
    && typeof obj.currency === 'string'
    && typeof obj.name === 'string'
    && typeof obj.duration === 'number' && !Number.isNaN(obj.duration);
}

function parsePlansJson(jsonStr: string): PlansMap | null {
  try {
    const raw = JSON.parse(jsonStr);
    if (!raw || typeof raw !== 'object') return null;
    const out: PlansMap = {} as any;
    for (const [key, val] of Object.entries(raw)) {
      if (val && typeof val === 'object') {
        const plan = {
          amount: Number((val as any).amount),
          currency: String((val as any).currency || 'XOF'),
          name: String((val as any).name || key),
          duration: Number((val as any).duration || 30),
          description: (val as any).description ? String((val as any).description) : undefined,
        } as PlanDef;
        if (isValidPlan(plan)) {
          out[key] = plan;
        }
      }
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function fromEnv(): PlansMap | null {
  // Highest priority: JSON map in SUBSCRIPTION_PLANS_JSON
  if (process.env.SUBSCRIPTION_PLANS_JSON) {
    const parsed = parsePlansJson(process.env.SUBSCRIPTION_PLANS_JSON);
    if (parsed) return parsed;
  }

  // Next: per-plan env overrides
  const ids = ['free', 'basic', 'standard', 'premium', 'vip'];
  const overrides: PlansMap = {} as any;
  let anyOverride = false;

  for (const id of ids) {
    const upper = id.toUpperCase();
    const amountStr = process.env[`PLAN_${upper}_AMOUNT`];
    const nameStr = process.env[`PLAN_${upper}_NAME`];
    const durationStr = process.env[`PLAN_${upper}_DURATION_DAYS`];
    const currencyStr = process.env[`PLAN_${upper}_CURRENCY`];
    const descStr = process.env[`PLAN_${upper}_DESC`];

    if (amountStr || nameStr || durationStr || currencyStr || descStr) {
      anyOverride = true;
      const base = defaultPlans[id as keyof typeof defaultPlans] || { amount: 0, currency: 'XOF', name: id, duration: 30 } as PlanDef;
      const amount = amountStr !== undefined ? Number(amountStr) : base.amount;
      const duration = durationStr !== undefined ? Number(durationStr) : base.duration;
      const currency = currencyStr || base.currency || 'XOF';
      const name = nameStr || base.name || id;
      const description = descStr ?? base.description;
      const plan: PlanDef = { amount, currency, name, duration, ...(description ? { description } : {}) };
      if (isValidPlan(plan)) {
        overrides[id] = plan;
      }
    }
  }

  if (anyOverride) {
    return { ...defaultPlans, ...overrides };
  }

  return null;
}

export const plans: PlansMap = fromEnv() || defaultPlans;
