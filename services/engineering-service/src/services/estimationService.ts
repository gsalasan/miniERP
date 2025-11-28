import prisma from '../prisma/client';
import { Prisma, ItemType, SourceType, EstimationStatus } from '@prisma/client';
import { 
  PricingEngine, 
  PricingCalculationInput,
  BulkPricingResult
} from './PricingEngine.service';
import { 
  OverheadEngine, 
  OverheadCalculationInput,
  OverheadCalculationResult
} from './OverheadEngine.service';

export const getEstimations = async () => {
  return prisma.estimation.findMany({
    include: { 
      items: true 
    },
  });
};

export const getEstimationById = async (id: string) => {
  return prisma.estimation.findUnique({
    where: { id },
    include: { 
      items: true 
    },
  });
};

export const createEstimation = async (
  data: Prisma.EstimationCreateInput | Prisma.EstimationUncheckedCreateInput,
) => {
  return prisma.estimation.create({ data });
};

export const updateEstimation = async (
  id: string,
  data: Prisma.EstimationUpdateInput | Prisma.EstimationUncheckedUpdateInput,
) => {
  return prisma.estimation.update({ where: { id }, data });
};

export const deleteEstimation = async (id: string) => {
  return prisma.estimation.delete({ where: { id } });
};

interface CalculationItem {
  item_id: string;
  item_type: ItemType;
  quantity: number;
  source?: SourceType;
}

interface CalculationInput {
  project_id?: string;
  items: CalculationItem[];
  overhead_percentage?: number;
  profit_margin_percentage?: number;
  save_to_db?: boolean;
  version?: number;
  status?: EstimationStatus;
}

interface CalculationResult {
  project_id?: string;
  estimation_id?: string;
  saved?: boolean;
  items: Array<{
    item_id: string;
    item_type: ItemType;
    item_name: string;
    quantity: number;
    source: SourceType;
    hpp_per_unit: number;
    total_hpp: number;
    sell_price_per_unit: number;
    total_sell_price: number;
    markup_percentage?: number;
    markup_amount?: number;
  }>;
  summary: {
    total_direct_hpp: number;
    overhead_percentage: number;
    total_overhead_allocation: number;
    total_hpp: number;
    profit_margin_percentage: number;
    total_sell_price: number;
    gross_margin?: number;
    net_profit?: number;
  };
  overhead_breakdown?: Array<{
    category: string;
    allocated_amount: number;
    allocation_percentage: number;
  }>;
}

export const calculateEstimation = async (input: CalculationInput): Promise<CalculationResult> => {
  const { project_id, items, overhead_percentage = 0, profit_margin_percentage = 0 } = input;

  let total_direct_hpp = 0;
  const calculatedItems = [];

  // ==================== STEP 1: Calculate HPP per Item ====================
  for (const item of items) {
    const { item_id, item_type, quantity, source = SourceType.INTERNAL } = item;

    let itemName = '';
    let hppPerUnit = 0;

    if (item_type === ItemType.MATERIAL) {
      // Ambil data material
      const material = await prisma.material.findUnique({
        where: { id: item_id },
      });

      if (!material) {
        throw new Error(`Material with id ${item_id} not found`);
      }

      itemName = material.item_name;
      // Gunakan cost_rp sebagai HPP
      hppPerUnit = material.cost_rp ? Number(material.cost_rp) : 0;
    } else if (item_type === ItemType.SERVICE) {
      // Ambil data service
      const service = await prisma.service.findUnique({
        where: { id: item_id },
      });

      if (!service) {
        throw new Error(`Service with id ${item_id} not found`);
      }

      itemName = service.service_name;
      // Untuk service, HPP bisa diambil dari tabel lain atau dihitung
      // Sementara gunakan 0 atau bisa ditambahkan field cost di service
      hppPerUnit = 0;
    } else {
      throw new Error(`Invalid item_type: ${item_type}`);
    }

    const totalHpp = hppPerUnit * quantity;
    total_direct_hpp += totalHpp;

    // Store item dengan HPP
    calculatedItems.push({
      item_id,
      item_type,
      item_name: itemName,
      quantity,
      source,
      hpp_per_unit: hppPerUnit,
      total_hpp: totalHpp,
      sell_price_per_unit: 0, // Will be calculated by PricingEngine
      total_sell_price: 0, // Will be calculated by PricingEngine
      markup_percentage: 0,
      markup_amount: 0
    });
  }

  // ==================== STEP 2: Calculate Overhead Allocation ====================
  console.log('📊 Calculating overhead allocation...');
  
  const overheadInput: OverheadCalculationInput = {
    total_direct_hpp,
    use_default_percentage: overhead_percentage === 0,
    custom_percentage: overhead_percentage > 0 ? overhead_percentage : undefined
  };

  const overheadResult: OverheadCalculationResult = await OverheadEngine.calculateOverheadAllocation(overheadInput);
  
  const total_overhead_allocation = overheadResult.overhead_allocation;
  const total_hpp = overheadResult.total_hpp_with_overhead;

  console.log(`✅ Overhead calculated: ${overheadResult.overhead_percentage}% = Rp ${total_overhead_allocation.toLocaleString()}`);

  // ==================== STEP 3: Calculate Sell Prices using PricingEngine ====================
  console.log('💰 Calculating sell prices with markup...');

  const pricingInputs: PricingCalculationInput[] = calculatedItems.map(item => ({
    item_id: item.item_id,
    item_type: item.item_type,
    hpp_per_unit: item.hpp_per_unit,
    quantity: item.quantity
  }));

  const pricingResult: BulkPricingResult = await PricingEngine.calculateBulkSellPrices({
    items: pricingInputs,
    use_cache: true
  });

  console.log(`✅ Pricing calculated: Average markup ${pricingResult.summary.average_markup_percentage.toFixed(2)}%`);

  // ==================== STEP 4: Merge Pricing Results into calculatedItems ====================
  const finalItems = calculatedItems.map((item, index) => {
    const pricingItem = pricingResult.items[index];
    
    return {
      item_id: item.item_id,
      item_type: item.item_type,
      item_name: item.item_name,
      quantity: item.quantity,
      source: item.source,
      hpp_per_unit: item.hpp_per_unit,
      total_hpp: item.total_hpp,
      sell_price_per_unit: pricingItem.sell_price_per_unit,
      total_sell_price: pricingItem.total_sell_price,
      markup_percentage: pricingItem.markup_percentage,
      markup_amount: pricingItem.markup_amount_per_unit
    };
  });

  // ==================== STEP 5: Calculate Final Summary ====================
  const total_sell_price_before_profit = pricingResult.summary.total_sell_price;
  
  // Apply profit margin on top of sell price (optional, jika masih ingin ada profit margin tambahan)
  const profit_margin_amount = total_sell_price_before_profit * (profit_margin_percentage / 100);
  const final_sell_price = total_sell_price_before_profit + profit_margin_amount;

  // Calculate margins
  const gross_margin = total_sell_price_before_profit - total_direct_hpp;
  const net_profit = final_sell_price - total_hpp;

  console.log(`📈 Final Summary:
    - Direct HPP: Rp ${total_direct_hpp.toLocaleString()}
    - Overhead (${overheadResult.overhead_percentage}%): Rp ${total_overhead_allocation.toLocaleString()}
    - Total HPP: Rp ${total_hpp.toLocaleString()}
    - Sell Price (with markup): Rp ${total_sell_price_before_profit.toLocaleString()}
    - Additional Profit Margin: Rp ${profit_margin_amount.toLocaleString()}
    - Final Sell Price: Rp ${final_sell_price.toLocaleString()}
    - Net Profit: Rp ${net_profit.toLocaleString()}
  `);

  // ==================== STEP 6: Prepare Result ====================
  const result: CalculationResult = {
    project_id,
    items: finalItems,
    summary: {
      total_direct_hpp,
      overhead_percentage: overheadResult.overhead_percentage,
      total_overhead_allocation,
      total_hpp,
      profit_margin_percentage,
      total_sell_price: final_sell_price,
      gross_margin,
      net_profit
    },
    overhead_breakdown: overheadResult.overhead_breakdown.map(b => ({
      category: b.category,
      allocated_amount: b.allocated_amount,
      allocation_percentage: b.allocation_percentage_to_hpp
    }))
  };

  // ==================== STEP 7: Save to Database (Optional) ====================
  if (input.save_to_db) {
    console.log('💾 Saving estimation to database...');
    
    const savedEstimation = await prisma.estimations.create({
      data: {
        project_id: project_id,
        version: input.version || 1,
        status: input.status,
        total_direct_hpp,
        total_overhead_allocation,
        total_hpp,
        total_sell_price: final_sell_price,
        gross_margin_percentage: total_sell_price_before_profit > 0 
          ? (gross_margin / total_sell_price_before_profit) * 100 
          : 0,
        items: {
          create: finalItems.map((item) => ({
            item_id: item.item_id,
            item_type: item.item_type,
            quantity: item.quantity,
            source: item.source,
            hpp_at_estimation: item.hpp_per_unit,
            sell_price_at_estimation: item.sell_price_per_unit,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    result.estimation_id = savedEstimation.id;
    result.saved = true;

    console.log(`✅ Estimation saved with ID: ${savedEstimation.id}`);
  }

  return result;
};
