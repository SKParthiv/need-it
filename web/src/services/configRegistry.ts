export type ConfigType = 'boolean' | 'integer' | 'decimal' | 'string' | 'enum';
export type ConfigCategory = 'clock' | 'fees' | 'orders' | 'flags' | 'support' | 'maintenance' | 'system';
export type RiskLevel = 'L' | 'M' | 'H';
export type ReachTarget = 'customer' | 'helper' | 'club' | 'public';
export type EffectTiming = 'live' | 'next_session' | 'deploy';

export interface RegistryItem {
  key: string;
  type: ConfigType;
  category: ConfigCategory;
  default: any;
  min?: number;
  max?: number;
  enumValues?: string[];
  unit?: string;
  description: string;
  risk: RiskLevel;
  reach: ReachTarget[];
  effect: EffectTiming;
  public: boolean;
  safeOffBehaviour?: string;
}

export interface ConfigEntry {
  key: string;
  value: any;
  version: number;
  updatedBy: string;
  updatedAt: string;
}

export interface ConfigRevision {
  id: string;
  key: string;
  oldValue: any;
  newValue: any;
  versionAfter: number;
  changeSetId: string;
  reason: string;
  actor: string;
  createdAt: string;
  rolledBackFrom?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'apply' | 'rollback' | 'reset' | 'gate_deny';
  targetKey?: string;
  before?: any;
  after?: any;
  reason: string;
  result: 'ok' | 'denied' | 'failed';
  changeSetId?: string;
}

export const CONFIG_REGISTRY: Record<string, RegistryItem> = {
  // Campus Clock (Timer Feature)
  'clock.enabled': {
    key: 'clock.enabled',
    type: 'boolean',
    category: 'clock',
    default: true,
    description: 'Toggle campus timer/clock widget in student and delivery interfaces',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Hides the campus timer banner completely',
  },
  'clock.title': {
    key: 'clock.title',
    type: 'string',
    category: 'clock',
    default: 'Night Delivery Window Closes',
    description: 'Subject / purpose of the active timer countdown',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'clock.target_time': {
    key: 'clock.target_time',
    type: 'string',
    category: 'clock',
    default: '21:30',
    description: 'Daily cutoff time (24-hour HH:MM format IST) or countdown deadline',
    risk: 'M',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'clock.description': {
    key: 'clock.description',
    type: 'string',
    category: 'clock',
    default: 'Hostel night gates close at 9:30 PM. Complete handovers and verify OTPs before curfew.',
    description: 'Explanatory campus message shown alongside countdown clock',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'clock.audience': {
    key: 'clock.audience',
    type: 'enum',
    category: 'clock',
    default: 'both',
    enumValues: ['both', 'customer', 'helper'],
    description: 'Which student apps display the active timer',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'clock.urgency': {
    key: 'clock.urgency',
    type: 'enum',
    category: 'clock',
    default: 'normal',
    enumValues: ['normal', 'warning', 'urgent'],
    description: 'Visual indicator tone for the countdown badge',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },

  // Platform Fees & Limits
  'fees.min_inr': {
    key: 'fees.min_inr',
    type: 'integer',
    category: 'fees',
    default: 20,
    min: 0,
    max: 500,
    unit: '₹',
    description: 'Minimum delivery fee allowed per errand request',
    risk: 'M',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'fees.max_inr': {
    key: 'fees.max_inr',
    type: 'integer',
    category: 'fees',
    default: 50,
    min: 0,
    max: 500,
    unit: '₹',
    description: 'Maximum delivery fee cap allowed per errand request',
    risk: 'M',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'fees.base_inr': {
    key: 'fees.base_inr',
    type: 'integer',
    category: 'fees',
    default: 20,
    min: 0,
    max: 100,
    unit: '₹',
    description: 'Suggested starting base helper fee for standard errand',
    risk: 'M',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'orders.waiting_long_minutes': {
    key: 'orders.waiting_long_minutes',
    type: 'integer',
    category: 'orders',
    default: 15,
    min: 5,
    max: 720,
    unit: 'min',
    description: 'Minutes before an unaccepted order triggers amber waiting alert',
    risk: 'M',
    reach: ['customer', 'helper', 'club'],
    effect: 'live',
    public: true,
  },
  'orders.max_items_per_request': {
    key: 'orders.max_items_per_request',
    type: 'integer',
    category: 'orders',
    default: 10,
    min: 1,
    max: 50,
    unit: 'items',
    description: 'Maximum separate items allowed in a single errand post',
    risk: 'M',
    reach: ['customer'],
    effect: 'live',
    public: true,
  },
  'orders.max_order_value_inr': {
    key: 'orders.max_order_value_inr',
    type: 'integer',
    category: 'orders',
    default: 1000,
    min: 50,
    max: 5000,
    unit: '₹',
    description: 'Maximum total items value cap for an errand',
    risk: 'H',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'handover.code_expiry_minutes': {
    key: 'handover.code_expiry_minutes',
    type: 'integer',
    category: 'orders',
    default: 60,
    min: 5,
    max: 1440,
    unit: 'min',
    description: 'Handover OTP validity period before re-issuance',
    risk: 'M',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'chat.max_photo_mb': {
    key: 'chat.max_photo_mb',
    type: 'integer',
    category: 'orders',
    default: 5,
    min: 1,
    max: 20,
    unit: 'MB',
    description: 'Maximum allowed image size for Cloudinary price receipt evidence',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
  },

  // Feature Flags
  'flag.requests_posting': {
    key: 'flag.requests_posting',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Allow campus students to post new errands (Kill switch)',
    risk: 'H',
    reach: ['customer'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Disables the Post Request form and shows pause notice',
  },
  'flag.requests_accepting': {
    key: 'flag.requests_accepting',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Allow delivery agents to accept open errands (Kill switch)',
    risk: 'H',
    reach: ['helper'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Feed orders display as paused/locked',
  },
  'flag.signups_customer': {
    key: 'flag.signups_customer',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Allow new customer accounts to register',
    risk: 'M',
    reach: ['public'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Registration form states campus admissions closed',
  },
  'flag.signups_helper': {
    key: 'flag.signups_helper',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Allow new delivery agents to apply and onboard',
    risk: 'M',
    reach: ['public'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Helper recruitment portal states helper capacity full',
  },
  'flag.chatbot_ask': {
    key: 'flag.chatbot_ask',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Enable Ask NEEDIT smart shop assistant floating modal',
    risk: 'L',
    reach: ['customer', 'helper'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Hides chatbot floating button and modal',
  },
  'flag.strict_veg_filter': {
    key: 'flag.strict_veg_filter',
    type: 'boolean',
    category: 'flags',
    default: true,
    description: 'Strictly prohibit non-vegetarian keywords (Campus mandate)',
    risk: 'H',
    reach: ['customer'],
    effect: 'live',
    public: true,
    safeOffBehaviour: 'Standard policy filter active',
  },

  // Support & Contacts
  'support.email': {
    key: 'support.email',
    type: 'string',
    category: 'support',
    default: 'support@sastra.ac.in',
    description: 'Official student support email displayed across app',
    risk: 'L',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'support.whatsapp': {
    key: 'support.whatsapp',
    type: 'string',
    category: 'support',
    default: '+91 94440 00000',
    description: 'Emergency WhatsApp hotline for rapid campus mediation',
    risk: 'L',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'support.hours': {
    key: 'support.hours',
    type: 'string',
    category: 'support',
    default: '8:00 AM - 10:00 PM IST',
    description: 'Operating assistance hours',
    risk: 'L',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },

  // Maintenance Mode
  'maintenance.state': {
    key: 'maintenance.state',
    type: 'enum',
    category: 'maintenance',
    default: 'off',
    enumValues: ['off', 'notice', 'active'],
    description: 'Campus maintenance operational state (Off, Notice banner, or Active lockdown)',
    risk: 'H',
    reach: ['public', 'customer', 'helper', 'club'],
    effect: 'live',
    public: true,
  },
  'maintenance.title': {
    key: 'maintenance.title',
    type: 'string',
    category: 'maintenance',
    default: 'Campus Infrastructure Scheduled Maintenance',
    description: 'Maintenance banner headline',
    risk: 'M',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'maintenance.message': {
    key: 'maintenance.message',
    type: 'string',
    category: 'maintenance',
    default: 'NEEDIT servers are undergoing routine maintenance. Errands will resume shortly.',
    description: 'Detailed explanation shown during maintenance',
    risk: 'M',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },
  'maintenance.expected_end': {
    key: 'maintenance.expected_end',
    type: 'string',
    category: 'maintenance',
    default: 'Tonight, 11:00 PM IST',
    description: 'Estimated restoration time',
    risk: 'M',
    reach: ['public', 'customer', 'helper'],
    effect: 'live',
    public: true,
  },
};

export function getDefaultConfigValues(): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, item] of Object.entries(CONFIG_REGISTRY)) {
    result[key] = item.default;
  }
  return result;
}

export function validateConfigValue(key: string, value: any): { valid: boolean; error?: string } {
  const item = CONFIG_REGISTRY[key];
  if (!item) {
    return { valid: false, error: `Unknown configuration key: ${key}` };
  }

  if (item.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { valid: false, error: `${key} must be a boolean (true/false)` };
    }
  } else if (item.type === 'integer' || item.type === 'decimal') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: `${key} must be a valid number` };
    }
    if (item.min !== undefined && num < item.min) {
      return { valid: false, error: `${key} cannot be less than ${item.min}` };
    }
    if (item.max !== undefined && num > item.max) {
      return { valid: false, error: `${key} cannot exceed ${item.max}` };
    }
  } else if (item.type === 'enum' && item.enumValues) {
    if (!item.enumValues.includes(String(value))) {
      return { valid: false, error: `${key} must be one of: ${item.enumValues.join(', ')}` };
    }
  } else if (item.type === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, error: `${key} must be text` };
    }
  }

  return { valid: true };
}
