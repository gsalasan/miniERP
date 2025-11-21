import prisma from '../prisma/client';
import { ItemType } from '@prisma/client';

const FINANCE_SERVICE_URL = process.env.FINANCE_SERVICE_URL || 'http://localhost:8080';

async function fetchFromFinance<T>(path: string): Promise<T | null> {
  try {
    const url = `${FINANCE_SERVICE_URL}${path}`;
    const res: any = await (global as any).fetch(url);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json as T;
  } catch {
    return null;
  }
}

// ==================== INTERFACES ====================

export interface PricingCalculationInput {
  item_id: string;
  item_type: ItemType;
  hpp_per_unit: number;
  quantity: number;
  category?: string;
}

export interface BulkPricingInput {
  items: PricingCalculationInput[];
  use_cache?: boolean;
}

export interface PricingCalculationResult {
  item_id: string;
  item_type: ItemType;
  hpp_per_unit: number;
  markup_percentage: number;
  markup_amount_per_unit: number;
  sell_price_per_unit: number;
  quantity: number;
  total_hpp: number;
  total_markup: number;
  total_sell_price: number;
  category: string;
  rule_applied: string;
}

export interface BulkPricingResult {
  items: PricingCalculationResult[];
  summary: {
    total_items: number;
    total_hpp: number;
    total_markup: number;
    total_sell_price: number;
    average_markup_percentage: number;
  };
}

export interface PricingRule {
  id: number;
  category: string;
  markup_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface MarkupValidationResult {
  is_valid: boolean;
  category: string;
  requested_markup: number;
  allowed_markup: number;
  message: string;
}

// ==================== CUSTOM ERRORS ====================

export class PricingEngineError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'PricingEngineError';
  }
}

export class PricingRuleNotFoundError extends PricingEngineError {
  constructor(category: string) {
    super(
      `Pricing rule not found for category: ${category}`,
      'PRICING_RULE_NOT_FOUND',
      { category }
    );
    this.name = 'PricingRuleNotFoundError';
  }
}

export class InvalidMarkupError extends PricingEngineError {
  constructor(markup: number, category: string) {
    super(
      `Invalid markup percentage: ${markup}% for category: ${category}`,
      'INVALID_MARKUP',
      { markup, category }
    );
    this.name = 'InvalidMarkupError';
  }
}

// ==================== CACHE MANAGEMENT ====================

class PricingRulesCache {
  private cache: Map<string, PricingRule> = new Map();
  private lastRefresh: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  set(category: string, rule: PricingRule): void {
    this.cache.set(category.toLowerCase(), rule);
  }

  get(category: string): PricingRule | undefined {
    return this.cache.get(category.toLowerCase());
  }

  clear(): void {
    this.cache.clear();
    this.lastRefresh = null;
  }

  isExpired(): boolean {
    if (!this.lastRefresh) return true;
    const now = new Date();
    return (now.getTime() - this.lastRefresh.getTime()) > this.CACHE_TTL_MS;
  }

  markRefreshed(): void {
    this.lastRefresh = new Date();
  }

  getStats() {
    return {
      size: this.cache.size,
      lastRefresh: this.lastRefresh,
      isExpired: this.isExpired(),
      categories: Array.from(this.cache.keys())
    };
  }
}

const pricingCache = new PricingRulesCache();

// ==================== HELPER FUNCTIONS ====================

/**
 * Mendapatkan kategori item berdasarkan item_type dan item_id
 */
async function getItemCategory(item_id: string, item_type: ItemType): Promise<string> {
  try {
    if (item_type === ItemType.MATERIAL) {
      const material = await prisma.material.findUnique({
        where: { id: item_id },
        select: { system: true, category: true }
      });

      if (!material) {
        console.warn(`Material not found: ${item_id}, using default category`);
        return 'MATERIAL_DEFAULT';
      }

      // Prioritas: category > system > default
      return material.category || material.system || 'MATERIAL_DEFAULT';
    } else if (item_type === ItemType.SERVICE) {
      const service = await prisma.service.findUnique({
        where: { id: item_id },
        select: { category: true }
      });

      if (!service) {
        console.warn(`Service not found: ${item_id}, using default category`);
        return 'SERVICE_DEFAULT';
      }

      return service.category || 'SERVICE_DEFAULT';
    }

    return 'UNKNOWN';
  } catch (error) {
    console.error(`Error getting item category for ${item_id}:`, error);
    return item_type === ItemType.MATERIAL ? 'MATERIAL_DEFAULT' : 'SERVICE_DEFAULT';
  }
}

/**
 * Default markup percentages jika tidak ada di database
 */
const DEFAULT_MARKUP_PERCENTAGES: Record<string, number> = {
  'MATERIAL_DEFAULT': 25.0,
  'SERVICE_DEFAULT': 30.0,
  'UNKNOWN': 20.0
};

// ==================== CORE PRICING ENGINE METHODS ====================

/**
 * 1. Calculate Sell Price - Single Item
 * 
 * Menghitung harga jual untuk satu item berdasarkan HPP dan markup rule
 * 
 * @param input - PricingCalculationInput
 * @returns PricingCalculationResult
 */
export async function calculateSellPrice(
  input: PricingCalculationInput
): Promise<PricingCalculationResult> {
  try {
    const { item_id, item_type, hpp_per_unit, quantity, category } = input;

    // Validasi input
    if (hpp_per_unit < 0) {
      throw new PricingEngineError(
        'HPP per unit cannot be negative',
        'INVALID_HPP',
        { hpp_per_unit }
      );
    }

    if (quantity <= 0) {
      throw new PricingEngineError(
        'Quantity must be greater than 0',
        'INVALID_QUANTITY',
        { quantity }
      );
    }

    // Dapatkan kategori jika tidak disediakan
    const itemCategory = category || await getItemCategory(item_id, item_type);

    // Dapatkan markup percentage dari pricing rule
    const markupPercentage = await getCachedMarkupPercentage(itemCategory);

    // Kalkulasi
    const markupAmountPerUnit = hpp_per_unit * (markupPercentage / 100);
    const sellPricePerUnit = hpp_per_unit + markupAmountPerUnit;
    const totalHpp = hpp_per_unit * quantity;
    const totalMarkup = markupAmountPerUnit * quantity;
    const totalSellPrice = sellPricePerUnit * quantity;

    return {
      item_id,
      item_type,
      hpp_per_unit,
      markup_percentage: markupPercentage,
      markup_amount_per_unit: markupAmountPerUnit,
      sell_price_per_unit: sellPricePerUnit,
      quantity,
      total_hpp: totalHpp,
      total_markup: totalMarkup,
      total_sell_price: totalSellPrice,
      category: itemCategory,
      rule_applied: `${itemCategory} (${markupPercentage}%)`
    };
  } catch (error) {
    if (error instanceof PricingEngineError) {
      throw error;
    }
    throw new PricingEngineError(
      `Failed to calculate sell price: ${error.message}`,
      'CALCULATION_ERROR',
      { input, original_error: error.message }
    );
  }
}

/**
 * 2. Calculate Bulk Sell Prices
 * 
 * Batch calculation untuk multiple items - lebih efisien daripada loop manual
 * 
 * @param bulkInput - BulkPricingInput
 * @returns BulkPricingResult
 */
export async function calculateBulkSellPrices(
  bulkInput: BulkPricingInput
): Promise<BulkPricingResult> {
  try {
    const { items, use_cache = true } = bulkInput;

    // Refresh cache jika expired dan use_cache = true
    if (use_cache && pricingCache.isExpired()) {
      await refreshPricingRulesCache();
    }

    // Process semua items secara parallel untuk performance
    const results = await Promise.all(
      items.map(item => calculateSellPrice(item))
    );

    // Hitung summary
    const totalItems = results.length;
    const totalHpp = results.reduce((sum, r) => sum + r.total_hpp, 0);
    const totalMarkup = results.reduce((sum, r) => sum + r.total_markup, 0);
    const totalSellPrice = results.reduce((sum, r) => sum + r.total_sell_price, 0);
    const averageMarkupPercentage = totalHpp > 0 
      ? (totalMarkup / totalHpp) * 100 
      : 0;

    return {
      items: results,
      summary: {
        total_items: totalItems,
        total_hpp: Math.round(totalHpp * 100) / 100,
        total_markup: Math.round(totalMarkup * 100) / 100,
        total_sell_price: Math.round(totalSellPrice * 100) / 100,
        average_markup_percentage: Math.round(averageMarkupPercentage * 100) / 100
      }
    };
  } catch (error) {
    throw new PricingEngineError(
      `Failed to calculate bulk sell prices: ${error.message}`,
      'BULK_CALCULATION_ERROR',
      { total_items: bulkInput.items.length, error: error.message }
    );
  }
}

/**
 * 3. Get Total Sell Price
 * 
 * Helper function untuk menghitung total harga jual = harga per unit × quantity
 * 
 * @param sellPricePerUnit - Harga jual per unit
 * @param quantity - Jumlah unit
 * @returns Total harga jual
 */
export function getTotalSellPrice(sellPricePerUnit: number, quantity: number): number {
  if (sellPricePerUnit < 0 || quantity < 0) {
    throw new PricingEngineError(
      'Sell price and quantity cannot be negative',
      'INVALID_INPUT',
      { sellPricePerUnit, quantity }
    );
  }
  return Math.round(sellPricePerUnit * quantity * 100) / 100;
}

/**
 * 4. Validate Markup Policy
 * 
 * Validasi apakah markup percentage sesuai dengan kebijakan yang ada
 * 
 * @param category - Kategori item
 * @param requestedMarkup - Markup yang diminta (%)
 * @returns MarkupValidationResult
 */
export async function validateMarkupPolicy(
  category: string,
  requestedMarkup: number
): Promise<MarkupValidationResult> {
  try {
    const rule = await getPricingRuleByCategory(category);
    const allowedMarkup = rule?.markup_percentage || DEFAULT_MARKUP_PERCENTAGES[category] || 20;

    // Toleransi 5% untuk fleksibilitas
    const TOLERANCE_PERCENTAGE = 5;
    const minAllowed = allowedMarkup - TOLERANCE_PERCENTAGE;
    const maxAllowed = allowedMarkup + TOLERANCE_PERCENTAGE;

    const isValid = requestedMarkup >= minAllowed && requestedMarkup <= maxAllowed;

    return {
      is_valid: isValid,
      category,
      requested_markup: requestedMarkup,
      allowed_markup: allowedMarkup,
      message: isValid
        ? `Markup ${requestedMarkup}% is valid for category ${category}`
        : `Markup ${requestedMarkup}% is outside allowed range (${minAllowed}% - ${maxAllowed}%) for category ${category}`
    };
  } catch (error) {
    throw new PricingEngineError(
      `Failed to validate markup policy: ${error.message}`,
      'VALIDATION_ERROR',
      { category, requestedMarkup, error: error.message }
    );
  }
}

/**
 * 5. Get Pricing Rule By Category
 * 
 * Helper untuk mengambil pricing rule dari database berdasarkan kategori
 * 
 * @param category - Kategori item
 * @returns PricingRule | null
 */
export async function getPricingRuleByCategory(category: string): Promise<PricingRule | null> {
  try {
    // Try finance-service API first
    const apiResult = await fetchFromFinance<any>(`/api/pricing-rules/category/${encodeURIComponent(category)}`);
    let ruleObj: any = null;
    if (apiResult) {
      ruleObj = (apiResult as any).category ? apiResult : (apiResult as any).data;
    }

    // Fallback to local DB if API not available or not found
    if (!ruleObj) {
      ruleObj = await prisma.pricing_rules.findUnique({ where: { category } });
      if (!ruleObj) {
        console.warn(`Pricing rule not found for category: ${category}, will use default`);
        return null;
      }
    }

    return {
      id: ruleObj.id,
      category: ruleObj.category,
      markup_percentage: Number(ruleObj.markup_percentage),
      created_at: ruleObj.created_at,
      updated_at: ruleObj.updated_at
    };
  } catch (error) {
    console.error(`Error fetching pricing rule for ${category}:`, error);
    return null;
  }
}

/**
 * 6. Refresh Pricing Rules Cache
 * 
 * Refresh cache dengan data terbaru dari database
 * Optional: untuk performance optimization
 * 
 * @returns Number of rules loaded
 */
export async function refreshPricingRulesCache(): Promise<number> {
  try {
    // Try finance-service first
    const apiResult = await fetchFromFinance<any>(`/api/pricing-rules`);
    const rules: any[] = apiResult && (apiResult as any).data
      ? (apiResult as any).data
      : await prisma.pricing_rules.findMany();

    pricingCache.clear();

    for (const rule of rules) {
      pricingCache.set(rule.category, {
        id: rule.id,
        category: rule.category,
        markup_percentage: Number(rule.markup_percentage),
        created_at: rule.created_at,
        updated_at: rule.updated_at
      });
    }

    pricingCache.markRefreshed();

    console.log(`✅ Pricing rules cache refreshed: ${rules.length} rules loaded`);
    return rules.length;
  } catch (error) {
    console.error('❌ Failed to refresh pricing rules cache:', error);
    throw new PricingEngineError(
      `Failed to refresh pricing rules cache: ${error.message}`,
      'CACHE_REFRESH_ERROR',
      { error: (error as any).message }
    );
  }
}

/**
 * 7. Get Cached Markup Percentage
 * 
 * Ambil markup percentage dari cache atau database dengan fallback ke default
 * 
 * @param category - Kategori item
 * @returns Markup percentage
 */
export async function getCachedMarkupPercentage(category: string): Promise<number> {
  try {
    // Cek cache dulu
    const cachedRule = pricingCache.get(category);
    if (cachedRule) {
      return cachedRule.markup_percentage;
    }

    // Jika tidak ada di cache, ambil dari database
    const rule = await getPricingRuleByCategory(category);
    if (rule) {
      // Store ke cache untuk next time
      pricingCache.set(category, rule);
      return rule.markup_percentage;
    }

    // Fallback ke default
    const defaultMarkup = DEFAULT_MARKUP_PERCENTAGES[category] || 
                          DEFAULT_MARKUP_PERCENTAGES['UNKNOWN'];
    
    console.warn(`Using default markup ${defaultMarkup}% for category: ${category}`);
    return defaultMarkup;
  } catch (error) {
    console.error(`Error getting markup percentage for ${category}:`, error);
    return DEFAULT_MARKUP_PERCENTAGES['UNKNOWN'];
  }
}

// ==================== UTILITY METHODS ====================

/**
 * Get Cache Statistics
 * 
 * Untuk monitoring dan debugging
 */
export function getCacheStats() {
  return pricingCache.getStats();
}

/**
 * Clear Cache
 * 
 * Untuk force refresh atau cleanup
 */
export function clearCache(): void {
  pricingCache.clear();
  console.log('✅ Pricing rules cache cleared');
}

/**
 * Preload Common Categories
 * 
 * Preload kategori yang sering digunakan untuk optimasi
 */
export async function preloadCommonCategories(categories: string[]): Promise<void> {
  try {
    const rules = await prisma.pricing_rules.findMany({
      where: {
        category: {
          in: categories
        }
      }
    });

    for (const rule of rules) {
      pricingCache.set(rule.category, {
        id: rule.id,
        category: rule.category,
        markup_percentage: Number(rule.markup_percentage),
        created_at: rule.created_at,
        updated_at: rule.updated_at
      });
    }

    console.log(`✅ Preloaded ${rules.length} pricing rules for common categories`);
  } catch (error) {
    console.error('❌ Failed to preload common categories:', error);
  }
}

// ==================== EXPORTS ====================

export const PricingEngine = {
  calculateSellPrice,
  calculateBulkSellPrices,
  getTotalSellPrice,
  validateMarkupPolicy,
  getPricingRuleByCategory,
  refreshPricingRulesCache,
  getCachedMarkupPercentage,
  getCacheStats,
  clearCache,
  preloadCommonCategories
};

export default PricingEngine;
