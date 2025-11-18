import prisma from '../prisma/client';

// Interface untuk hasil pencarian gabungan
export interface SearchResult {
  id: string;
  name: string;
  type: 'material' | 'service';
  code?: string;
  category?: string;
  brand?: string;
  vendor?: string;
  unit?: string;
  cost?: number;
  currency?: string;
  status?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface untuk hasil pencarian dengan pagination
export interface SearchResponse {
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    materials: number;
    services: number;
  };
}

 

class SearchService {
  // Fungsi utama untuk pencarian gabungan materials dan services
  async searchItems(
    query: string,
    page: number = 1,
    limit: number = 10,
    type?: 'material' | 'service' | 'both'
  ): Promise<SearchResponse> {
    try {
      const searchType = type || 'both';
      const skip = (page - 1) * limit;

      let materials: any[] = [];
      let services: any[] = [];
      let totalMaterials = 0;
      let totalServices = 0;

      // Pencarian materials jika type adalah 'material' atau 'both'
      if (searchType === 'material' || searchType === 'both') {
        const materialResults = await this.searchMaterials(query, 1, 1000); // Ambil banyak untuk sorting gabungan
        materials = materialResults.data;
        totalMaterials = materialResults.total;
      }

      // Pencarian services jika type adalah 'service' atau 'both'
      if (searchType === 'service' || searchType === 'both') {
        const serviceResults = await this.searchServices(query, 1, 1000); // Ambil banyak untuk sorting gabungan
        services = serviceResults.data;
        totalServices = serviceResults.total;
      }

      // Gabungkan dan format hasil
      const combinedResults: SearchResult[] = [
        ...materials.map(material => this.formatMaterialResult(material)),
        ...services.map(service => this.formatServiceResult(service)),
      ];

      // Sort berdasarkan relevance (nama yang mengandung query di awal lebih prioritas)
      combinedResults.sort((a, b) => {
        const aStartsWith = a.name
          .toLowerCase()
          .startsWith(query.toLowerCase());
        const bStartsWith = b.name
          .toLowerCase()
          .startsWith(query.toLowerCase());

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Jika sama-sama starts with atau tidak, sort berdasarkan created_at
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      // Terapkan pagination pada hasil gabungan
      const totalItems = totalMaterials + totalServices;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedResults = combinedResults.slice(skip, skip + limit);

      return {
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages,
        },
        summary: {
          materials: totalMaterials,
          services: totalServices,
        },
      };
    } catch (error) {
      console.error('Error in searchItems:', error);
      throw new Error('Failed to search items');
    }
  }

  // Pencarian khusus materials
  private async searchMaterials(
    query: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      // Gunakan raw query untuk pencarian materials yang lebih fleksibel
      const searchQuery = `%${query}%`;

      const countResult = (await prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM "Material" 
        WHERE "item_name" ILIKE ${searchQuery}
           OR "brand" ILIKE ${searchQuery}
           OR "vendor" ILIKE ${searchQuery}
           OR "owner_pn" ILIKE ${searchQuery}
           OR "sbu" ILIKE ${searchQuery}
           OR "system" ILIKE ${searchQuery}
           OR "subsystem" ILIKE ${searchQuery}
      `) as any[];

      const total = countResult[0]?.count || 0;

      const materials = (await prisma.$queryRaw`
        SELECT * FROM "Material" 
        WHERE "item_name" ILIKE ${searchQuery}
           OR "brand" ILIKE ${searchQuery}
           OR "vendor" ILIKE ${searchQuery}
           OR "owner_pn" ILIKE ${searchQuery}
           OR "sbu" ILIKE ${searchQuery}
           OR "system" ILIKE ${searchQuery}
           OR "subsystem" ILIKE ${searchQuery}
        ORDER BY 
          CASE 
            WHEN "item_name" ILIKE ${query + '%'} THEN 1
            WHEN "item_name" ILIKE ${searchQuery} THEN 2
            ELSE 3
          END,
          "created_at" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `) as any[];

      return {
        data: materials,
        total,
      };
    } catch (error) {
      console.error('Error searching materials:', error);
      return { data: [], total: 0 };
    }
  }

  // Pencarian khusus services
  private async searchServices(
    query: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const searchQuery = `%${query}%`;

      const countResult = (await prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM "Service" 
        WHERE "service_name" ILIKE ${searchQuery}
           OR "service_code" ILIKE ${searchQuery}
           OR "item_type" ILIKE ${searchQuery}
      `) as any[];

      const total = countResult[0]?.count || 0;

      const services = (await prisma.$queryRaw`
        SELECT * FROM "Service" 
        WHERE "service_name" ILIKE ${searchQuery}
           OR "service_code" ILIKE ${searchQuery}
           OR "item_type" ILIKE ${searchQuery}
        ORDER BY 
          CASE 
            WHEN "service_name" ILIKE ${query + '%'} THEN 1
            WHEN "service_name" ILIKE ${searchQuery} THEN 2
            ELSE 3
          END,
          "created_at" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `) as any[];

      return {
        data: services,
        total,
      };
    } catch (error) {
      console.error('Error searching services:', error);
      return { data: [], total: 0 };
    }
  }

  // Format hasil material untuk response yang konsisten
  private formatMaterialResult(material: any): SearchResult {
    return {
      id: material.id,
      name: material.item_name,
      type: 'material',
      code: material.owner_pn,
      category: material.components,
      brand: material.brand,
      vendor: material.vendor,
      unit: material.satuan,
      cost: material.cost_rp || material.cost_ori,
      currency: material.curr,
      status: material.status,
      is_active: material.status === 'Active',
      created_at: material.created_at,
      updated_at: material.updated_at,
    };
  }

  // Format hasil service untuk response yang konsisten
  private formatServiceResult(service: any): SearchResult {
    return {
      id: service.id,
      name: service.service_name,
      type: 'service',
      code: service.service_code,
      unit: service.unit,
      cost: service.internal_cost_per_hour || service.freelance_cost_per_hour,
      status: service.is_active ? 'Active' : 'Inactive',
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at,
    };
  }

  // Pencarian cepat untuk autocomplete/suggestions
  async quickSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const results = await this.searchItems(query, 1, limit);
      return results.data;
    } catch (error) {
      console.error('Error in quickSearch:', error);
      return [];
    }
  }
}

export default new SearchService();