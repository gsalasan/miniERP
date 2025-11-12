import { PrismaClient, Estimation } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const getEstimations = async () => {
  return prisma.estimation.findMany({
    include: { project: true, items: true },
  });
};

export const getEstimationById = async (id: string) => {
  return prisma.estimation.findUnique({
    where: { id },
    include: { project: true, items: true },
  });
};

export const createEstimation = async (data: Estimation) => {
  return prisma.estimation.create({ data });
};

export const updateEstimation = async (id: string, data: Partial<Estimation>) => {
  return prisma.estimation.update({ where: { id }, data });
};

export const deleteEstimation = async (id: string) => {
  return prisma.estimation.delete({ where: { id } });
};

interface CalculationItem {
  item_id: string;
  item_type: 'MATERIAL' | 'SERVICE';
  quantity: number;
  source?: 'INTERNAL' | 'EXTERNAL';
}

interface CalculationInput {
  project_id: string;
  items: CalculationItem[];
  overhead_percentage?: number;
  profit_margin_percentage?: number;
  save_to_db?: boolean;
  version?: number;
  status?: string;
}

interface CalculationResult {
  project_id: string;
  estimation_id?: string;
  saved?: boolean;
  items: Array<{
    item_id: string;
    item_type: string;
    item_name: string;
    quantity: number;
    source: string;
    hpp_per_unit: number;
    total_hpp: number;
    sell_price_per_unit: number;
    total_sell_price: number;
  }>;
  summary: {
    total_direct_hpp: number;
    overhead_percentage: number;
    total_overhead_allocation: number;
    total_hpp: number;
    profit_margin_percentage: number;
    total_sell_price: number;
  };
}

export const calculateEstimation = async (input: CalculationInput): Promise<CalculationResult> => {
  const { project_id, items, overhead_percentage = 0, profit_margin_percentage = 0 } = input;

  let total_direct_hpp = 0;
  const calculatedItems = [];

  // Proses setiap item
  for (const item of items) {
    const { item_id, item_type, quantity, source = 'INTERNAL' } = item;

    let itemName = '';
    let hppPerUnit = 0;

    if (item_type === 'MATERIAL') {
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
    } else if (item_type === 'SERVICE') {
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

    // Hitung sell price (HPP + profit margin)
    const sellPricePerUnit = hppPerUnit * (1 + profit_margin_percentage / 100);
    const totalSellPrice = sellPricePerUnit * quantity;

    calculatedItems.push({
      item_id,
      item_type,
      item_name: itemName,
      quantity,
      source,
      hpp_per_unit: hppPerUnit,
      total_hpp: totalHpp,
      sell_price_per_unit: sellPricePerUnit,
      total_sell_price: totalSellPrice,
    });
  }

  // Hitung overhead allocation
  const total_overhead_allocation = total_direct_hpp * (overhead_percentage / 100);
  
  // Hitung total HPP (direct + overhead)
  const total_hpp = total_direct_hpp + total_overhead_allocation;

  // Hitung total sell price dengan profit margin
  const total_sell_price = total_hpp * (1 + profit_margin_percentage / 100);

  const result: CalculationResult = {
    project_id,
    items: calculatedItems,
    summary: {
      total_direct_hpp,
      overhead_percentage,
      total_overhead_allocation,
      total_hpp,
      profit_margin_percentage,
      total_sell_price,
    },
  };

  // Simpan ke database jika diminta
  if (input.save_to_db) {
    const savedEstimation = await prisma.estimation.create({
      data: {
        project_id,
        version: input.version || 1,
        status: input.status as any,
        total_direct_hpp,
        total_overhead_allocation,
        total_hpp,
        total_sell_price,
        items: {
          create: calculatedItems.map((item) => ({
            item_id: item.item_id,
            item_type: item.item_type as any,
            quantity: item.quantity,
            source: item.source as any,
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
  }

  return result;
};
