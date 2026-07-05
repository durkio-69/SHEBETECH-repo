import React from 'react';
import {
  Smartphone,
  Tablet,
  Tv,
  Speaker,
  Shirt,
  Home,
  Sparkles,
  ShoppingBag,
  Leaf,
  Baby,
  Users,
  Flame,
  Truck,
  Heart,
  Tag,
  Package,
  Watch,
  Gamepad2,
  Camera,
  Book,
  Car,
  Utensils,
  Dumbbell,
  Laptop,
  type LucideIcon,
} from 'lucide-react';

// Registry of icon names admins can pick for a category, mapped to components.
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Smartphone,
  Tablet,
  Tv,
  Speaker,
  Shirt,
  Home,
  Sparkles,
  ShoppingBag,
  Leaf,
  Baby,
  Users,
  Flame,
  Truck,
  Heart,
  Tag,
  Package,
  Watch,
  Gamepad2,
  Camera,
  Book,
  Car,
  Utensils,
  Dumbbell,
  Laptop,
};

export const ICON_OPTIONS = Object.keys(ICON_REGISTRY);

export function getIconByName(name?: string): LucideIcon {
  if (name && ICON_REGISTRY[name]) return ICON_REGISTRY[name];
  return Package;
}

// Rotating color themes so dynamically-created categories still look
// intentional (background tint + border + icon color), Jumia-circle style.
export const CATEGORY_COLOR_THEMES = [
  { bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-900/60', icon: 'text-orange-600' },
  { bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-900/60', icon: 'text-red-600' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-900/60', icon: 'text-emerald-600' },
  { bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-900/60', icon: 'text-sky-600' },
  { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-900/60', icon: 'text-purple-600' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-900/60', icon: 'text-indigo-600' },
  { bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-900/60', icon: 'text-teal-600' },
  { bg: 'bg-pink-50 dark:bg-pink-950/40', border: 'border-pink-200 dark:border-pink-900/60', icon: 'text-pink-600' },
  { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-900/60', icon: 'text-amber-600' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-900/60', icon: 'text-cyan-600' },
];

export function getCategoryTheme(index: number) {
  return CATEGORY_COLOR_THEMES[index % CATEGORY_COLOR_THEMES.length];
}
