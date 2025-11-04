import { PrismaClient } from '@prisma/client';

// Enum definitions to match database schema
enum MaterialStatus {
  Active = 'Active',
  EndOfLife = 'EndOfLife',
  Discontinue = 'Discontinue',
}

enum MaterialLocation {
  Local = 'Local',
  Import = 'Import',
}

// Material interface
interface Material {
  id: string;
  sbu?: string;
  system?: string;
  subsystem?: string;
  components?: string;
  item_name: string;
  brand?: string;
  owner_pn?: string;
  vendor?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  cost_ori?: number;
  curr?: string;
  satuan?: string;
  cost_rp?: number;
  cost_date: Date;
  cost_validity?: Date;
  created_at: Date;
  updated_at: Date;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export interface CreateMaterialData {
  sbu?: string;
  system?: string;
  subsystem?: string;
  components?: string;
  item_name: string;
  brand?: string;
  owner_pn?: string;
  vendor?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  cost_ori?: number;
  curr?: string;
  satuan?: string;
  cost_rp?: number;
  cost_validity?: Date;
}

export interface UpdateMaterialData {
  sbu?: string;
  system?: string;
  subsystem?: string;
  components?: string;
  item_name?: string;
  brand?: string;
  owner_pn?: string;
  vendor?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  cost_ori?: number;
  curr?: string;
  satuan?: string;
  cost_rp?: number;
  cost_validity?: Date;
}

export interface MaterialFilters {
  sbu?: string;
  system?: string;
  subsystem?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  vendor?: string;
  brand?: string;
}

class MaterialService {
  // Get all materials with optional filtering and pagination
  async getAllMaterials(
    page: number = 1,
    limit: number = 10,
    filters?: MaterialFilters,
    searchTerm?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereConditions: Record<string, unknown> = {};

      // Apply filters
      if (filters) {
        if (filters.sbu)
          whereConditions.sbu = { contains: filters.sbu, mode: 'insensitive' };
        if (filters.system)
          whereConditions.system = {
            contains: filters.system,
            mode: 'insensitive',
          };
        if (filters.subsystem)
          whereConditions.subsystem = {
            contains: filters.subsystem,
            mode: 'insensitive',
          };
        if (filters.status) whereConditions.status = filters.status;
        if (filters.location) whereConditions.location = filters.location;
        if (filters.vendor)
          whereConditions.vendor = {
            contains: filters.vendor,
            mode: 'insensitive',
          };
        if (filters.brand)
          whereConditions.brand = {
            contains: filters.brand,
            mode: 'insensitive',
          };
      }

      // Apply search term
      if (searchTerm) {
        whereConditions.OR = [
          { item_name: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } },
          { vendor: { contains: searchTerm, mode: 'insensitive' } },
          { owner_pn: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Use raw query since Material model is not available in this Prisma client
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM "Material" 
        WHERE ($1::text IS NULL OR "sbu" ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR "system" ILIKE '%' || $2 || '%')
          AND ($3::text IS NULL OR "subsystem" ILIKE '%' || $3 || '%')
          AND ($4::"MaterialStatus" IS NULL OR "status" = $4)
          AND ($5::"MaterialLocation" IS NULL OR "location" = $5)
          AND ($6::text IS NULL OR "vendor" ILIKE '%' || $6 || '%')
          AND ($7::text IS NULL OR "brand" ILIKE '%' || $7 || '%')
          AND ($8::text IS NULL OR (
            "item_name" ILIKE '%' || $8 || '%' OR
            "brand" ILIKE '%' || $8 || '%' OR
            "vendor" ILIKE '%' || $8 || '%' OR
            "owner_pn" ILIKE '%' || $8 || '%'
          ))
      `;

      const dataQuery = `
        SELECT * FROM "Material" 
        WHERE ($1::text IS NULL OR "sbu" ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR "system" ILIKE '%' || $2 || '%')
          AND ($3::text IS NULL OR "subsystem" ILIKE '%' || $3 || '%')
          AND ($4::"MaterialStatus" IS NULL OR "status" = $4)
          AND ($5::"MaterialLocation" IS NULL OR "location" = $5)
          AND ($6::text IS NULL OR "vendor" ILIKE '%' || $6 || '%')
          AND ($7::text IS NULL OR "brand" ILIKE '%' || $7 || '%')
          AND ($8::text IS NULL OR (
            "item_name" ILIKE '%' || $8 || '%' OR
            "brand" ILIKE '%' || $8 || '%' OR
            "vendor" ILIKE '%' || $8 || '%' OR
            "owner_pn" ILIKE '%' || $8 || '%'
          ))
        ORDER BY "created_at" DESC
        LIMIT $9 OFFSET $10
      `;

      const queryParams = [
        filters?.sbu || null,
        filters?.system || null,
        filters?.subsystem || null,
        filters?.status || null,
        filters?.location || null,
        filters?.vendor || null,
        filters?.brand || null,
        searchTerm || null,
        limit,
        skip,
      ];

      const [materials, totalResult] = await Promise.all([
        prisma.$queryRawUnsafe(dataQuery, ...queryParams) as Promise<
          Material[]
        >,
        prisma.$queryRawUnsafe(
          countQuery,
          ...queryParams.slice(0, -2)
        ) as Promise<[{ count: bigint }]>,
      ]);

      const total = Number(totalResult[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        data: materials,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  }

  // Get material by ID
  async getMaterialById(id: string): Promise<Material | null> {
    try {
      const material = (await prisma.$queryRaw`
        SELECT * FROM "Material" WHERE "id" = ${id}::uuid
      `) as Material[];

      return material[0] || null;
    } catch (error) {
      console.error('Error fetching material by ID:', error);
      throw error;
    }
  }

  // Create new material
  async createMaterial(data: CreateMaterialData): Promise<Material> {
    try {
      const result = (await prisma.$queryRaw`
        INSERT INTO "Material" (
          "sbu", "system", "subsystem", "components", "item_name", 
          "brand", "owner_pn", "vendor", "status", "location",
          "cost_ori", "curr", "satuan", "cost_rp", "cost_validity"
        ) VALUES (
          ${data.sbu}, ${data.system}, ${data.subsystem}, ${data.components ?? null}::"Components", ${data.item_name},
          ${data.brand}, ${data.owner_pn}, ${data.vendor}, ${data.status}::"MaterialStatus", ${data.location}::"MaterialLocation",
          ${data.cost_ori || null}, ${data.curr}, ${data.satuan}, 
          ${data.cost_rp || null}, ${data.cost_validity}
        ) 
        RETURNING *
      `) as Material[];

      return result[0];
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  // Update material
  async updateMaterial(
    id: string,
    data: UpdateMaterialData
  ): Promise<Material | null> {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (data.sbu !== undefined) {
        updateFields.push(`"sbu" = $${paramIndex++}`);
        values.push(data.sbu);
      }
      if (data.system !== undefined) {
        updateFields.push(`"system" = $${paramIndex++}`);
        values.push(data.system);
      }
      if (data.subsystem !== undefined) {
        updateFields.push(`"subsystem" = $${paramIndex++}`);
        values.push(data.subsystem);
      }
      if (data.components !== undefined) {
        updateFields.push(`"components" = $${paramIndex++}::"Components"`);
        values.push(data.components ?? null);
      }
      if (data.item_name !== undefined) {
        updateFields.push(`"item_name" = $${paramIndex++}`);
        values.push(data.item_name);
      }
      if (data.brand !== undefined) {
        updateFields.push(`"brand" = $${paramIndex++}`);
        values.push(data.brand);
      }
      if (data.owner_pn !== undefined) {
        updateFields.push(`"owner_pn" = $${paramIndex++}`);
        values.push(data.owner_pn);
      }
      if (data.vendor !== undefined) {
        updateFields.push(`"vendor" = $${paramIndex++}`);
        values.push(data.vendor);
      }
      if (data.status !== undefined) {
        updateFields.push(`"status" = $${paramIndex++}::"MaterialStatus"`);
        values.push(data.status);
      }
      if (data.location !== undefined) {
        updateFields.push(`"location" = $${paramIndex++}::"MaterialLocation"`);
        values.push(data.location);
      }
      if (data.cost_ori !== undefined) {
        updateFields.push(`"cost_ori" = $${paramIndex++}`);
        values.push(data.cost_ori || null);
      }
      if (data.curr !== undefined) {
        updateFields.push(`"curr" = $${paramIndex++}`);
        values.push(data.curr);
      }
      if (data.satuan !== undefined) {
        updateFields.push(`"satuan" = $${paramIndex++}`);
        values.push(data.satuan);
      }
      if (data.cost_rp !== undefined) {
        updateFields.push(`"cost_rp" = $${paramIndex++}`);
        values.push(data.cost_rp || null);
      }
      if (data.cost_validity !== undefined) {
        updateFields.push(`"cost_validity" = $${paramIndex++}`);
        values.push(data.cost_validity);
      }

      // If no fields to update, just return current material without error
      if (updateFields.length === 0) {
        const current = (await prisma.$queryRaw`
          SELECT * FROM "Material" WHERE "id" = ${id}::uuid
        `) as Material[];
        return current[0] || null;
      }

      // Always update the updated_at field when there are changes
      updateFields.push(`"updated_at" = NOW()`);

      const query = `
        UPDATE "Material" 
        SET ${updateFields.join(', ')}
        WHERE "id" = $${paramIndex}::uuid
        RETURNING *
      `;
      values.push(id);

      const result = (await prisma.$queryRawUnsafe(
        query,
        ...values
      )) as Material[];
      return result[0] || null;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  // Delete material
  async deleteMaterial(id: string): Promise<boolean> {
    try {
      const result = (await prisma.$queryRaw`
        DELETE FROM "Material" WHERE "id" = ${id}::uuid
        RETURNING "id"
      `) as Array<{ id: string }>;

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Get materials statistics
  async getMaterialsStats() {
    try {
      const stats = (await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_materials,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_materials,
          COUNT(CASE WHEN status = 'EndOfLife' THEN 1 END) as eol_materials,
          COUNT(CASE WHEN status = 'Discontinue' THEN 1 END) as discontinued_materials,
          COUNT(CASE WHEN location = 'Local' THEN 1 END) as local_materials,
          COUNT(CASE WHEN location = 'Import' THEN 1 END) as import_materials
        FROM "Material"
      `) as Array<{
        total_materials: bigint;
        active_materials: bigint;
        eol_materials: bigint;
        discontinued_materials: bigint;
        local_materials: bigint;
        import_materials: bigint;
      }>;

      const result = stats[0];
      return {
        totalMaterials: Number(result.total_materials),
        activeMaterials: Number(result.active_materials),
        eolMaterials: Number(result.eol_materials),
        discontinuedMaterials: Number(result.discontinued_materials),
        localMaterials: Number(result.local_materials),
        importMaterials: Number(result.import_materials),
      };
    } catch (error) {
      console.error('Error fetching materials statistics:', error);
      throw error;
    }
  }

  // Get unique values for dropdown filters
  async getFilterOptions() {
    try {
      const [sbus, systems, subsystems, vendors, brands] = (await Promise.all([
        prisma.$queryRaw`SELECT DISTINCT "sbu" FROM "Material" WHERE "sbu" IS NOT NULL ORDER BY "sbu"`,
        prisma.$queryRaw`SELECT DISTINCT "system" FROM "Material" WHERE "system" IS NOT NULL ORDER BY "system"`,
        prisma.$queryRaw`SELECT DISTINCT "subsystem" FROM "Material" WHERE "subsystem" IS NOT NULL ORDER BY "subsystem"`,
        prisma.$queryRaw`SELECT DISTINCT "vendor" FROM "Material" WHERE "vendor" IS NOT NULL ORDER BY "vendor"`,
        prisma.$queryRaw`SELECT DISTINCT "brand" FROM "Material" WHERE "brand" IS NOT NULL ORDER BY "brand"`,
      ])) as [
        Array<{ sbu: string }>,
        Array<{ system: string }>,
        Array<{ subsystem: string }>,
        Array<{ vendor: string }>,
        Array<{ brand: string }>,
      ];

      return {
        sbus: sbus.map(item => item.sbu),
        systems: systems.map(item => item.system),
        subsystems: subsystems.map(item => item.subsystem),
        vendors: vendors.map(item => item.vendor),
        brands: brands.map(item => item.brand),
        statuses: Object.values(MaterialStatus),
        locations: Object.values(MaterialLocation),
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}

export default new MaterialService();