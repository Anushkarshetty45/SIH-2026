import { BedCategory } from '@prisma/client';

/**
 * Centralized CareGrid Freshness and Staleness Configuration
 * Based on SRS and Operational Domain Specifications.
 */

// Default freshness thresholds (minutes)
export const FRESHNESS_THRESHOLDS = {
  BEDS_MINUTES: 120, // 2 hours target
  EQUIPMENT_MINUTES: 120, // 2 hours target
  INVENTORY_MINUTES: 120, // 2 hours target
  TIER_2_ESCALATION_MINUTES: 240, // 4 hours critical overdue -> District authority
} as const;

/**
 * Life-critical bed categories that require conservative availability handling
 * when stale. An unverified ICU or ventilator bed could result in death during emergency routing.
 */
export const LIFE_CRITICAL_BED_CATEGORIES: readonly BedCategory[] = [
  BedCategory.ICU,
  BedCategory.OXYGEN,
  BedCategory.VENTILATOR,
] as const;

/**
 * Keywords and categories representing life-critical medical equipment.
 */
export const LIFE_CRITICAL_EQUIPMENT_KEYWORDS: readonly string[] = [
  'VENTILATOR',
  'OXYGEN',
  'DEFIBRILLATOR',
  'DIALYSIS',
  'LIFE_SUPPORT',
  'CRITICAL_CARE',
  'SUCTION',
  'INFUSION_PUMP',
  'BIPAP',
  'CPAP',
] as const;

/**
 * Life-critical warning message appended when operational data is stale.
 */
export const STALE_LIFE_CRITICAL_WARNING =
  'STALE AVAILABILITY: Human re-verification required before emergency dispatch';

/**
 * Checks whether a given bed category is life-critical.
 */
export function isLifeCriticalBedCategory(category: BedCategory): boolean {
  return LIFE_CRITICAL_BED_CATEGORIES.includes(category);
}

/**
 * Checks whether an equipment item is life-critical based on its name and category.
 */
export function isLifeCriticalEquipment(name: string, category: string): boolean {
  const normalized = `${name} ${category}`.toUpperCase();
  return LIFE_CRITICAL_EQUIPMENT_KEYWORDS.some((kw) => normalized.includes(kw));
}
