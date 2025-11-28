import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

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

      // Use unsafe raw execution here with positional parameters because the
      // SQL string uses explicit $1..$n placeholders. Building a fully
      // parameterized Prisma.sql fragment for this dynamic set of optional
      // filters is more involved. Keep this localized and safe by only
      // interpolating validated filter values above.
      const [materials, totalResult] = await Promise.all([
        prisma.$queryRawUnsafe(dataQuery, ...queryParams) as Promise<Material[]>,
        prisma.$queryRawUnsafe(countQuery, ...queryParams.slice(0, -2)) as Promise<[{ count: bigint }]>,
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
        SELECT * FROM "Material" WHERE "id"::text = ${id}
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
      // Normalize lookups: ensure SBULookup, MaterialSystemCategory, MaterialSubSystem exist
      let sbu_id: string | null = null;
      let kategori_sistem_id: string | null = null;
      let sub_sistem_id: string | null = null;

      if (data.sbu) {
        // find or create SBULookup
        const rows = (await prisma.$queryRaw`
          SELECT id FROM "SBULookup" WHERE name = ${data.sbu}
        `) as Array<{ id: string }>;
        if (rows && rows.length) {
          sbu_id = rows[0].id;
        } else {
          const inserted = (await prisma.$queryRaw`
            INSERT INTO "SBULookup" (id, name) VALUES (gen_random_uuid(), ${data.sbu}) RETURNING id
          `) as Array<{ id: string }>;
          sbu_id = inserted[0].id;
        }
      }

      if (data.system) {
        const rows = (await prisma.$queryRaw`
          SELECT id FROM "MaterialSystemCategory" WHERE name = ${data.system}
        `) as Array<{ id: string }>;
        if (rows && rows.length) {
          kategori_sistem_id = rows[0].id;
        } else {
          const inserted = (await prisma.$queryRaw`
            INSERT INTO "MaterialSystemCategory" (id, name) VALUES (gen_random_uuid(), ${data.system}) RETURNING id
          `) as Array<{ id: string }>;
          kategori_sistem_id = inserted[0].id;
        }
      }

      if (data.subsystem) {
        // ensure category id exists to attach subsystem
        let finalSysCatId = kategori_sistem_id;
        if (!finalSysCatId) {
          const first = (await prisma.$queryRaw`SELECT id FROM "MaterialSystemCategory" LIMIT 1`) as Array<{ id: string }>;
          if (first && first.length) finalSysCatId = first[0].id;
          else {
            const created = (await prisma.$queryRaw`
              INSERT INTO "MaterialSystemCategory" (id, name) VALUES (gen_random_uuid(), 'Uncategorized') RETURNING id
            `) as Array<{ id: string }>;
            finalSysCatId = created[0].id;
          }
        }

        const subsRows = (await prisma.$queryRaw`
          SELECT id FROM "MaterialSubSystem" WHERE name = ${data.subsystem} AND system_category_id = ${finalSysCatId}::uuid
        `) as Array<{ id: string }>;
        if (subsRows && subsRows.length) {
          sub_sistem_id = subsRows[0].id;
        } else {
          const inserted = (await prisma.$queryRaw`
            INSERT INTO "MaterialSubSystem" (id, name, system_category_id) VALUES (gen_random_uuid(), ${data.subsystem}, ${finalSysCatId}::uuid) RETURNING id
          `) as Array<{ id: string }>;
          sub_sistem_id = inserted[0].id;
        }
        kategori_sistem_id = finalSysCatId;
      }

      const result = (await prisma.$queryRaw`
        INSERT INTO "Material" (
          "sbu", "system", "subsystem", "components", "item_name", 
          "brand", "owner_pn", "vendor", "status", "location",
          "cost_ori", "curr", "satuan", "cost_rp", "cost_validity",
          "kategori_sistem_id", "sub_sistem_id", "sbu_id"
        ) VALUES (
          ${data.sbu}, ${data.system}, ${data.subsystem}, ${data.components ?? null}::"Components", ${data.item_name},
          ${data.brand}, ${data.owner_pn}, ${data.vendor}, ${data.status}::"MaterialStatus", ${data.location}::"MaterialLocation",
          ${data.cost_ori || null}, ${data.curr}, ${data.satuan}, 
          ${data.cost_rp || null}, ${data.cost_validity},
          ${kategori_sistem_id}::uuid, ${sub_sistem_id}::uuid, ${sbu_id}::uuid
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
  let kategoriAssigned = false;

      // Build dynamic update query
      if (data.sbu !== undefined) {
        updateFields.push(`"sbu" = $${paramIndex++}`);
        values.push(data.sbu);

        // ensure SBULookup exists and set sbu_id
        if (data.sbu) {
          const rows = (await prisma.$queryRaw`SELECT id FROM "SBULookup" WHERE name = ${data.sbu}`) as Array<{ id: string }>;
          let sbuId: string | null = null;
          if (rows && rows.length) sbuId = rows[0].id;
          else {
            const inserted = (await prisma.$queryRaw`INSERT INTO "SBULookup" (id, name) VALUES (gen_random_uuid(), ${data.sbu}) RETURNING id`) as Array<{ id: string }>;
            sbuId = inserted[0].id;
          }
          updateFields.push(`"sbu_id" = $${paramIndex++}::uuid`);
          values.push(sbuId);
        } else {
          updateFields.push(`"sbu_id" = $${paramIndex++}::uuid`);
          values.push(null);
        }
      }

      if (data.system !== undefined) {
        updateFields.push(`"system" = $${paramIndex++}`);
        values.push(data.system);

          if (data.system) {
          const rows = (await prisma.$queryRaw`SELECT id FROM "MaterialSystemCategory" WHERE name = ${data.system}`) as Array<{ id: string }>;
          let kategoriId: string | null = null;
          if (rows && rows.length) kategoriId = rows[0].id;
          else {
            const inserted = (await prisma.$queryRaw`INSERT INTO "MaterialSystemCategory" (id, name) VALUES (gen_random_uuid(), ${data.system}) RETURNING id`) as Array<{ id: string }>;
            kategoriId = inserted[0].id;
          }
          updateFields.push(`"kategori_sistem_id" = $${paramIndex++}::uuid`);
          values.push(kategoriId);
          kategoriAssigned = true;
        } else {
          updateFields.push(`"kategori_sistem_id" = $${paramIndex++}::uuid`);
          values.push(null);
          kategoriAssigned = true;
        }
      }

      if (data.subsystem !== undefined) {
        updateFields.push(`"subsystem" = $${paramIndex++}`);
        values.push(data.subsystem);

        if (data.subsystem) {
          // determine category id to attach subsystem
          let catId: string | null = null;
          const catRows = (await prisma.$queryRaw`SELECT id FROM "MaterialSystemCategory" WHERE name = ${data.system}`) as Array<{ id: string }>;
          if (catRows && catRows.length) catId = catRows[0].id;
          if (!catId) {
            const first = (await prisma.$queryRaw`SELECT id FROM "MaterialSystemCategory" LIMIT 1`) as Array<{ id: string }>;
            if (first && first.length) catId = first[0].id;
            else {
              const created = (await prisma.$queryRaw`INSERT INTO "MaterialSystemCategory" (id, name) VALUES (gen_random_uuid(), 'Uncategorized') RETURNING id`) as Array<{ id: string }>;
              catId = created[0].id;
            }
          }

          const subsRows = (await prisma.$queryRaw`SELECT id FROM "MaterialSubSystem" WHERE name = ${data.subsystem} AND system_category_id = ${catId}::uuid`) as Array<{ id: string }>;
          let subsId: string | null = null;
          if (subsRows && subsRows.length) subsId = subsRows[0].id;
          else {
            const inserted = (await prisma.$queryRaw`INSERT INTO "MaterialSubSystem" (id, name, system_category_id) VALUES (gen_random_uuid(), ${data.subsystem}, ${catId}::uuid) RETURNING id`) as Array<{ id: string }>;
            subsId = inserted[0].id;
          }

          updateFields.push(`"sub_sistem_id" = $${paramIndex++}::uuid`);
          values.push(subsId);
          // ensure kategori_sistem_id references the same category (only if not already set by system update)
          if (!kategoriAssigned) {
            updateFields.push(`"kategori_sistem_id" = $${paramIndex++}::uuid`);
            values.push(catId);
            kategoriAssigned = true;
          }
        } else {
          updateFields.push(`"sub_sistem_id" = $${paramIndex++}::uuid`);
          values.push(null);
        }
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
          SELECT * FROM "Material" WHERE "id"::text = ${id}
        `) as Material[];
        return current[0] || null;
      }

      // Always update the updated_at field when there are changes
      updateFields.push('"updated_at" = NOW()');

      // Build the SET clause and parameter array
      const setClause = updateFields.join(', ');
      // Add id as the last parameter for WHERE clause
      const params = [...values, id];

      // Build the SQL query string
      const sql = `UPDATE "Material" SET ${setClause} WHERE "id"::text = $${params.length} RETURNING *`;

      const result = await prisma.$queryRawUnsafe(sql, ...params) as Material[];
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
        DELETE FROM "Material" WHERE "id"::text = ${id}
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
      // Use normalized lookup tables instead of legacy distinct text columns
      const [sbusRows, systemRows, subsystemRows, vendorRows, brandRows] = (await Promise.all([
        prisma.$queryRaw`SELECT name FROM "SBULookup" WHERE name IS NOT NULL ORDER BY name`,
        prisma.$queryRaw`SELECT name FROM "MaterialSystemCategory" ORDER BY name`,
        prisma.$queryRaw`SELECT name FROM "MaterialSubSystem" ORDER BY name`,
        prisma.$queryRaw`SELECT DISTINCT "vendor" FROM "Material" WHERE "vendor" IS NOT NULL ORDER BY "vendor"`,
        prisma.$queryRaw`SELECT DISTINCT "brand" FROM "Material" WHERE "brand" IS NOT NULL ORDER BY "brand"`,
      ])) as [
        Array<{ name: string }>,
        Array<{ name: string }>,
        Array<{ name: string }>,
        Array<{ vendor: string }>,
        Array<{ brand: string }>,
      ];

      return {
        sbus: sbusRows.map(r => r.name),
        systems: systemRows.map(r => r.name),
        subsystems: subsystemRows.map(r => r.name),
        vendors: vendorRows.map(item => item.vendor),
        brands: brandRows.map(item => item.brand),
        statuses: Object.values(MaterialStatus),
        locations: Object.values(MaterialLocation),
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  // FITUR 3.2.C: Search materials for autocomplete
  async searchMaterials(query: string, limit: number = 20) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const materials = await prisma.material.findMany({
        where: {
          OR: [
            { item_name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { owner_pn: { contains: query, mode: 'insensitive' } },
            { vendor: { contains: query, mode: 'insensitive' } },
          ],
          status: { in: ['Active', 'Discontinue'] }, // Exclude EOL
        },
        select: {
          id: true,
          item_name: true,
          brand: true,
          vendor: true,
          owner_pn: true,
          cost_rp: true,
          satuan: true,
          curr: true,
          status: true,
        },
        take: limit,
        orderBy: {
          item_name: 'asc',
        },
      });

      return materials;
    } catch (error) {
      console.error('Error searching materials:', error);
      throw error;
    }
  }

  // FITUR 3.2.C: Create material with vendor and initial price
  async createMaterialWithVendor(data: {
    item_name: string;
    owner_pn?: string;
    category?: string;
    brand?: string;
    satuan: string;
    status?: string;
    location?: string;
    initialPrice: {
      vendor: string;
      price: number;
      currency: string;
      exchangeRate?: number;
      cost_validity?: string;
    };
  }) {
    try {
      const {
        item_name,
        owner_pn,
        category,
        brand,
        satuan,
        status = 'Active',
        location = 'Local',
        initialPrice,
      } = data;

      // Validate required fields
      if (!item_name || !satuan || !initialPrice) {
        throw new Error('Missing required fields: item_name, satuan, or initialPrice');
      }

      if (!initialPrice.vendor || !initialPrice.price || !initialPrice.currency) {
        throw new Error('Missing required price fields: vendor, price, or currency');
      }

      // Check for duplicate by owner_pn
      if (owner_pn) {
        const existingMaterial = await prisma.material.findFirst({
          where: { owner_pn },
        });

        if (existingMaterial) {
          throw new Error(
            `Material dengan P/N "${owner_pn}" sudah ada di database dengan nama "${existingMaterial.item_name}"`
          );
        }
      }

      // Execute transaction
      const result = await prisma.$transaction(async tx => {
        // 1. Find or create vendor
        let vendor = await tx.vendors.findFirst({
          where: {
            vendor_name: {
              equals: initialPrice.vendor,
              mode: 'insensitive',
            },
          },
        });

        if (!vendor) {
          vendor = await tx.vendors.create({
            data: {
              vendor_name: initialPrice.vendor,
              classification: 'Local',
              is_preferred: false,
            },
          });
        }

        // 2. Convert currency to IDR if needed
        const exchangeRate = initialPrice.exchangeRate || 1;
        const priceInIdr =
          initialPrice.currency === 'IDR'
            ? initialPrice.price
            : initialPrice.price * exchangeRate;

        // 3. Create material
        const newMaterial = await tx.material.create({
          data: {
            item_name,
            owner_pn: owner_pn || undefined,
            brand: brand || undefined,
            satuan,
            status: status as MaterialStatus,
            location: location as MaterialLocation,
            vendor: initialPrice.vendor,
            cost_rp: priceInIdr,
            cost_ori: initialPrice.price,
            curr: initialPrice.currency,
            cost_date: new Date(),
            cost_validity: initialPrice.cost_validity
              ? new Date(initialPrice.cost_validity)
              : undefined,
          },
        });

        // 4. Create vendor pricelist entry
        await tx.vendorPricelist.create({
          data: {
            material_id: newMaterial.id,
            vendor_id: vendor.id,
            price: initialPrice.price,
            currency: initialPrice.currency,
            price_updated_at: new Date(),
          },
        });

        // 5. Return full material data with vendor info
        const materialWithVendor = await tx.material.findUnique({
          where: { id: newMaterial.id },
          include: {
            vendorPricelist: {
              include: {
                Vendor: true,
              },
              orderBy: {
                price_updated_at: 'desc',
              },
              take: 1,
            },
          },
        });

        return materialWithVendor;
      });

      return result;
    } catch (error) {
      console.error('Error creating material with vendor:', error);
      throw error;
    }
  }
}

export default new MaterialService();