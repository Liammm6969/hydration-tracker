import {
  Droplets,
  Coffee,
  Leaf,
  Apple,
  GlassWater,
  type LucideIcon,
} from 'lucide-react-native';

export interface DrinkConfig {
  key: string;
  label: string;
  factor: number;
  icon: LucideIcon;
  color: string;
  amounts: number[];
}

export const DRINKS: Record<string, DrinkConfig> = {
  water: {
    key: 'water',
    label: 'Water',
    factor: 1.0,
    icon: Droplets,
    color: '#4FC3F7',
    amounts: [250, 500],
  },
  coffee: {
    key: 'coffee',
    label: 'Coffee',
    factor: 0.85,
    icon: Coffee,
    color: '#8D6E63',
    amounts: [150, 250],
  },
  tea: {
    key: 'tea',
    label: 'Tea',
    factor: 0.95,
    icon: Leaf,
    color: '#81C784',
    amounts: [200, 350],
  },
  juice: {
    key: 'juice',
    label: 'Juice',
    factor: 0.95,
    icon: Apple,
    color: '#FFB74D',
    amounts: [200, 350],
  },
  soda: {
    key: 'soda',
    label: 'Soda',
    factor: 0.8,
    icon: GlassWater,
    color: '#E57373',
    amounts: [250, 330],
  },
};

export const DRINK_KEYS = Object.keys(DRINKS);

export const DEFAULT_GOAL = 2000;
export const DEFAULT_WAKE_HOUR = 7;
export const DEFAULT_WAKING_HOURS = 16;
