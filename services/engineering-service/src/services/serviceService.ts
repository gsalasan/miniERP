import { PrismaClient } from '@prisma/client';

// Enum definitions to match database schema
enum ServiceUnit {
  Jam = 'Jam',
  Hari = 'Hari',
}

// Service interface
// Base service row with FK ids
interface ServiceRow {
  id: string;
  service_name: string;
  service_code: string;
  item_type: string;
  sbu?: string;
  fase_proyek?: string;
  unit: ServiceUnit;
  default_duration?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // FK columns (nullable)
  kategori_sistem_id?: string | null;
  sub_sistem_id?: string | null;
  kategori_jasa_id?: string | null;
  jenis_jasa_spesifik_id?: string | null;
  deskripsi_id?: string | null;
  rekomendasi_tim_id?: string | null;
}

// Extended type with joined taxonomy names/texts for responses
interface ServiceWithTaxonomy extends ServiceRow {
  kategori_sistem_name?: string | null;
  sub_sistem_name?: string | null;
  kategori_jasa_name?: string | null;
  jenis_jasa_spesifik_name?: string | null;
  deskripsi_text?: string | null;
  rekomendasi_tim_name?: string | null;
  fase_proyek_name?: string | null;
  sbu_name?: string | null;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export interface CreateServiceData {
  service_name: string;
  service_code: string;
  item_type?: string;
  unit: ServiceUnit;
  default_duration?: number;
  is_active?: boolean;
  // taxonomy FKs
  kategori_sistem_id?: string | null;
  sub_sistem_id?: string | null;
  kategori_jasa_id?: string | null;
  jenis_jasa_spesifik_id?: string | null;
  deskripsi_id?: string | null;
  rekomendasi_tim_id?: string | null;
  fase_proyek_id?: string | null;
  sbu_id?: string | null;
}

export interface UpdateServiceData {
  service_name?: string;
  service_code?: string;
  item_type?: string;
  unit?: ServiceUnit;
  default_duration?: number;
  is_active?: boolean;
  // taxonomy FKs
  kategori_sistem_id?: string | null;
  sub_sistem_id?: string | null;
  kategori_jasa_id?: string | null;
  jenis_jasa_spesifik_id?: string | null;
  deskripsi_id?: string | null;
  rekomendasi_tim_id?: string | null;
  fase_proyek_id?: string | null;
  sbu_id?: string | null;
}

export interface ServiceFilters {
  service_name?: string;
  service_code?: string;
  category?: string;
  unit?: ServiceUnit;
  is_active?: boolean;
  item_type?: string;
}

export interface GetServicesOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: ServiceFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ServiceService {
  // Create a new service
  async createService(data: CreateServiceData): Promise<ServiceWithTaxonomy> {
    try {
      // Auto-fill/validate parent-child relations for taxonomy
      let kategoriSistemId = data.kategori_sistem_id ?? null;
      let subSistemId = data.sub_sistem_id ?? null;
      let kategoriJasaId = data.kategori_jasa_id ?? null;
      let jenisJasaSpesifikId = data.jenis_jasa_spesifik_id ?? null;

      if (subSistemId && !kategoriSistemId) {
        const rows = (await prisma.$queryRaw`
          SELECT system_category_id FROM "ServiceSubSystem" WHERE id = ${subSistemId}::uuid
        `) as { system_category_id: string }[];
        if (rows.length) kategoriSistemId = rows[0].system_category_id;
      }
      if (subSistemId && kategoriSistemId) {
        const rows = (await prisma.$queryRaw`
          SELECT 1 FROM "ServiceSubSystem" WHERE id = ${subSistemId}::uuid AND system_category_id = ${
            kategoriSistemId
          }::uuid
        `) as unknown[];
        if (rows.length === 0) {
          throw new Error('sub_sistem_id does not belong to the provided ' + 'kategori_sistem_id');
        }
      }

      if (jenisJasaSpesifikId && !kategoriJasaId) {
        const rows = (await prisma.$queryRaw`
          SELECT category_id FROM "ServiceSpecificType" WHERE id = ${jenisJasaSpesifikId}::uuid
        `) as { category_id: string }[];
        if (rows.length) kategoriJasaId = rows[0].category_id;
      }
      if (jenisJasaSpesifikId && kategoriJasaId) {
        const rows = (await prisma.$queryRaw`
          SELECT 1 FROM "ServiceSpecificType" WHERE id = ${jenisJasaSpesifikId}::uuid AND category_id = ${
            kategoriJasaId
          }::uuid
        `) as unknown[];
        if (rows.length === 0) {
          throw new Error(
            'jenis_jasa_spesifik_id does not belong to the provided ' + 'kategori_jasa_id',
          );
        }
      }

      const query = `
        INSERT INTO "Service" (
          "service_name", "service_code", "item_type", 
          "unit", "default_duration", "is_active",
          "kategori_sistem_id", "sub_sistem_id", "kategori_jasa_id", "jenis_jasa_spesifik_id", "deskripsi_id", "rekomendasi_tim_id", "fase_proyek_id", "sbu_id"
        ) VALUES (
          $1, $2, $3, $4::"ServiceUnit", $5, $6,
          $7::uuid, $8::uuid, $9::uuid, $10::uuid, $11::uuid, $12::uuid, $13, $14
        )
        RETURNING id
      `;

      const inserted = (await prisma.$queryRawUnsafe(
        query,
        data.service_name,
        data.service_code,
        data.item_type || 'Service',
        data.unit,
        data.default_duration ?? null,
        data.is_active ?? true,
        kategoriSistemId || null,
        subSistemId || null,
        kategoriJasaId || null,
        jenisJasaSpesifikId || null,
        data.deskripsi_id || null,
        data.rekomendasi_tim_id || null,
        data.fase_proyek_id || null,
        data.sbu_id || null,
      )) as { id: string }[];
      const newId = inserted[0]?.id;
      if (!newId) {
        throw new Error('Insert did not return an id');
      }
      return (await this.getServiceById(newId)) as ServiceWithTaxonomy;
    } catch (error) {
      throw new Error(
        `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Get all services with filtering, pagination, and search
  async getServices(options: GetServicesOptions = {}): Promise<{
    data: ServiceWithTaxonomy[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        filters = {},
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;

      // Build SQL WHERE conditions
      const conditions: string[] = [];
      const params: unknown[] = [];

      // Add filters to SQL conditions
      if (filters.service_name) {
        conditions.push(`"service_name" ILIKE $${params.length + 1}`);
        params.push(`%${filters.service_name}%`);
      }
      if (filters.service_code) {
        conditions.push(`"service_code" ILIKE $${params.length + 1}`);
        params.push(`%${filters.service_code}%`);
      }
      if (filters.unit) {
        conditions.push(`"unit" = $${params.length + 1}::"ServiceUnit"`);
        params.push(filters.unit);
      }
      if (filters.is_active !== undefined) {
        conditions.push(`"is_active" = $${params.length + 1}`);
        params.push(filters.is_active);
      }
      if (filters.item_type) {
        conditions.push(`"item_type" = $${params.length + 1}`);
        params.push(filters.item_type);
      }

      // Add search functionality
      if (search) {
        conditions.push(`(
          "service_name" ILIKE $${params.length + 1} OR 
          "service_code" ILIKE $${params.length + 1} OR 
          "item_type" ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as count FROM "Service" s ${whereClause}`;

      const countResult = (await prisma.$queryRawUnsafe(countQuery, ...params)) as {
        count: bigint;
      }[];
      const total = Number(countResult[0].count);

      // Get services with pagination and sorting
      const orderDirection = sortOrder.toUpperCase();
      const dataQuery = `
        SELECT 
          s.*, 
          sys.name AS kategori_sistem_name,
          subsys.name AS sub_sistem_name,
          cat.name AS kategori_jasa_name,
          spec.name AS jenis_jasa_spesifik_name,
          sd.text AS deskripsi_text,
          team.name AS rekomendasi_tim_name,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id = s.kategori_sistem_id
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id = s.sub_sistem_id
        LEFT JOIN "ServiceCategory" cat ON cat.id = s.kategori_jasa_id
        LEFT JOIN "ServiceSpecificType" spec ON spec.id = s.jenis_jasa_spesifik_id
        LEFT JOIN "ServiceDescription" sd ON sd.id = s.deskripsi_id
        LEFT JOIN "TeamRecommendation" team ON team.id = s.rekomendasi_tim_id
        LEFT JOIN "FaseProyekLookup" fase ON fase.id = s.fase_proyek_id
        LEFT JOIN "SBULookup" sbu ON sbu.id = s.sbu_id
        ${whereClause}
        ORDER BY s."${sortBy}" ${orderDirection}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const services = (await prisma.$queryRawUnsafe(
        dataQuery,
        ...params,
        limit,
        skip,
      )) as ServiceWithTaxonomy[];

      const totalPages = Math.ceil(total / limit);

      return {
        data: services,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Get service by ID
  async getServiceById(id: string): Promise<ServiceWithTaxonomy | null> {
    try {
      const services = (await prisma.$queryRaw`
        SELECT 
          s.*, 
          sys.name AS kategori_sistem_name,
          subsys.name AS sub_sistem_name,
          cat.name AS kategori_jasa_name,
          spec.name AS jenis_jasa_spesifik_name,
          sd.text AS deskripsi_text,
          team.name AS rekomendasi_tim_name,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id = s.kategori_sistem_id
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id = s.sub_sistem_id
        LEFT JOIN "ServiceCategory" cat ON cat.id = s.kategori_jasa_id
        LEFT JOIN "ServiceSpecificType" spec ON spec.id = s.jenis_jasa_spesifik_id
        LEFT JOIN "ServiceDescription" sd ON sd.id = s.deskripsi_id
        LEFT JOIN "TeamRecommendation" team ON team.id = s.rekomendasi_tim_id
        LEFT JOIN "FaseProyekLookup" fase ON fase.id = s.fase_proyek_id
        LEFT JOIN "SBULookup" sbu ON sbu.id = s.sbu_id
        WHERE s."id" = ${id}::uuid
  `) as ServiceWithTaxonomy[];
      return services.length > 0 ? services[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Get service by service code
  async getServiceByCode(service_code: string): Promise<ServiceWithTaxonomy | null> {
    try {
      const services = (await prisma.$queryRaw`
        SELECT 
          s.*, 
          sys.name AS kategori_sistem_name,
          subsys.name AS sub_sistem_name,
          cat.name AS kategori_jasa_name,
          spec.name AS jenis_jasa_spesifik_name,
          sd.text AS deskripsi_text,
          team.name AS rekomendasi_tim_name,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id = s.kategori_sistem_id
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id = s.sub_sistem_id
        LEFT JOIN "ServiceCategory" cat ON cat.id = s.kategori_jasa_id
        LEFT JOIN "ServiceSpecificType" spec ON spec.id = s.jenis_jasa_spesifik_id
        LEFT JOIN "ServiceDescription" sd ON sd.id = s.deskripsi_id
        LEFT JOIN "TeamRecommendation" team ON team.id = s.rekomendasi_tim_id
        LEFT JOIN "FaseProyekLookup" fase ON fase.id = s.fase_proyek_id
        LEFT JOIN "SBULookup" sbu ON sbu.id = s.sbu_id
        WHERE s."service_code" = ${service_code}
  `) as ServiceWithTaxonomy[];
      return services.length > 0 ? services[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch service by code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Update service by ID
  async updateService(id: string, data: UpdateServiceData): Promise<ServiceWithTaxonomy> {
    try {
      // Check if service exists
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const existingService = existingServices[0];

      // If service_code is being updated, check if it's unique
      if (data.service_code && data.service_code !== existingService.service_code) {
        const existingWithCode = (await prisma.$queryRaw`
          SELECT * FROM "Service" WHERE "service_code" = ${data.service_code}
        `) as ServiceRow[];
        if (existingWithCode.length > 0) {
          throw new Error('Service code already exists');
        }
      }

      // Compute/validate taxonomy relations
      let nextKategoriSistemId =
        data.kategori_sistem_id === undefined
          ? (existingService.kategori_sistem_id ?? null)
          : data.kategori_sistem_id;
      let nextSubSistemId =
        data.sub_sistem_id === undefined
          ? (existingService.sub_sistem_id ?? null)
          : data.sub_sistem_id;
      let nextKategoriJasaId =
        data.kategori_jasa_id === undefined
          ? (existingService.kategori_jasa_id ?? null)
          : data.kategori_jasa_id;
      let nextJenisJasaSpesifikId =
        data.jenis_jasa_spesifik_id === undefined
          ? (existingService.jenis_jasa_spesifik_id ?? null)
          : data.jenis_jasa_spesifik_id;

      // If service category changes but specific type isn't explicitly provided, clear it to avoid invalid pairing
      const originalKategoriJasaId = existingService.kategori_jasa_id ?? null;
      const kategoriJasaChanged =
        data.kategori_jasa_id !== undefined && nextKategoriJasaId !== originalKategoriJasaId;
      if (kategoriJasaChanged && data.jenis_jasa_spesifik_id === undefined) {
        nextJenisJasaSpesifikId = null;
      }

      if (nextSubSistemId) {
        const sub = (await prisma.$queryRaw`
          SELECT system_category_id FROM "ServiceSubSystem" WHERE id = ${nextSubSistemId}::uuid
        `) as { system_category_id: string }[];
        if (sub.length) {
          const parentId = sub[0].system_category_id;
          if (!nextKategoriSistemId) nextKategoriSistemId = parentId;
          if (nextKategoriSistemId && parentId !== nextKategoriSistemId) {
            throw new Error(
              'sub_sistem_id does not belong to the current/provided ' + 'kategori_sistem_id',
            );
          }
        }
      }

      if (nextJenisJasaSpesifikId) {
        const spec = (await prisma.$queryRaw`
          SELECT category_id FROM "ServiceSpecificType" WHERE id = ${nextJenisJasaSpesifikId}::uuid
        `) as { category_id: string }[];
        if (spec.length) {
          const parentId = spec[0].category_id;
          if (!nextKategoriJasaId) nextKategoriJasaId = parentId;
          if (nextKategoriJasaId && parentId !== nextKategoriJasaId) {
            throw new Error(
              'jenis_jasa_spesifik_id does not belong to the current/provided ' +
                'kategori_jasa_id',
            );
          }
        }
      }

      // Build SET clause dynamically
      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.service_name !== undefined) {
        updates.push(`"service_name" = $${params.length + 1}`);
        params.push(data.service_name);
      }
      if (data.service_code !== undefined) {
        updates.push(`"service_code" = $${params.length + 1}`);
        params.push(data.service_code);
      }
      if (data.item_type !== undefined) {
        updates.push(`"item_type" = $${params.length + 1}`);
        params.push(data.item_type);
      }
      if (data.fase_proyek_id !== undefined) {
        updates.push(`"fase_proyek_id" = $${params.length + 1}`);
        params.push(data.fase_proyek_id || null);
      }
      if (data.sbu_id !== undefined) {
        updates.push(`"sbu_id" = $${params.length + 1}`);
        params.push(data.sbu_id || null);
      }
      // taxonomy FKs (using computed values for parents)
      if (
        data.kategori_sistem_id !== undefined ||
        nextKategoriSistemId !== (existingService.kategori_sistem_id ?? null)
      ) {
        updates.push(`"kategori_sistem_id" = $${params.length + 1}::uuid`);
        params.push(nextKategoriSistemId || null);
      }
      if (data.sub_sistem_id !== undefined) {
        updates.push(`"sub_sistem_id" = $${params.length + 1}::uuid`);
        params.push(nextSubSistemId || null);
      }
      if (
        data.kategori_jasa_id !== undefined ||
        nextKategoriJasaId !== (existingService.kategori_jasa_id ?? null)
      ) {
        updates.push(`"kategori_jasa_id" = $${params.length + 1}::uuid`);
        params.push(nextKategoriJasaId || null);
      }
      if (data.jenis_jasa_spesifik_id !== undefined || kategoriJasaChanged) {
        updates.push(`"jenis_jasa_spesifik_id" = $${params.length + 1}::uuid`);
        params.push(nextJenisJasaSpesifikId || null);
      }
      if (data.deskripsi_id !== undefined) {
        updates.push(`"deskripsi_id" = $${params.length + 1}::uuid`);
        params.push(data.deskripsi_id || null);
      }
      if (data.rekomendasi_tim_id !== undefined) {
        updates.push(`"rekomendasi_tim_id" = $${params.length + 1}::uuid`);
        params.push(data.rekomendasi_tim_id || null);
      }
      if (data.unit !== undefined) {
        updates.push(`"unit" = $${params.length + 1}::"ServiceUnit"`);
        params.push(data.unit);
      }
      if (data.default_duration !== undefined) {
        updates.push(`"default_duration" = $${params.length + 1}`);
        params.push(data.default_duration);
      }
      if (data.is_active !== undefined) {
        updates.push(`"is_active" = $${params.length + 1}`);
        params.push(data.is_active);
      }

      // Always update updated_at
      updates.push(`"updated_at" = $${params.length + 1}`);
      params.push(new Date());

      if (updates.length === 1) {
        // Only updated_at
        throw new Error('No fields to update');
      }

      const updateQuery = `
        UPDATE "Service" 
        SET ${updates.join(', ')}
        WHERE "id" = $${params.length + 1}::uuid
        RETURNING *
      `;
      params.push(id);

      const updated = (await prisma.$queryRawUnsafe(updateQuery, ...params)) as ServiceRow[];
      const updatedId = updated[0]?.id;
      if (!updatedId) throw new Error('Failed to update service');
      return (await this.getServiceById(updatedId)) as ServiceWithTaxonomy;
    } catch (error) {
      throw new Error(
        `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Delete service by ID (hard delete)
  async deleteService(id: string): Promise<ServiceRow> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
        DELETE FROM "Service" WHERE "id" = ${id}::uuid RETURNING *
      `) as ServiceRow[];

      return deletedServices[0];
    } catch (error) {
      throw new Error(
        `Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Hard delete service by ID
  async hardDeleteService(id: string): Promise<ServiceRow> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
        DELETE FROM "Service" WHERE "id" = ${id}::uuid RETURNING *
      `) as ServiceRow[];

      return deletedServices[0];
    } catch (error) {
      throw new Error(
        `Failed to permanently delete service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Restore service (set is_active back to true)
  async restoreService(id: string): Promise<ServiceRow> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const restoredServices = (await prisma.$queryRaw`
        UPDATE "Service" 
        SET "is_active" = true, "updated_at" = ${new Date()}
        WHERE "id" = ${id}::uuid
        RETURNING *
      `) as ServiceRow[];

      return restoredServices[0];
    } catch (error) {
      throw new Error(
        `Failed to restore service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byUnit: { unit: string; count: number }[];
  }> {
    try {
      const [totalResult, activeResult, inactiveResult, byUnitResult] =
        await Promise.all([
          prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service"` as Promise<{ count: bigint }[]>,
          prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service" WHERE "is_active" = true` as Promise<
            { count: bigint }[]
          >,
          prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service" WHERE "is_active" = false` as Promise<
            { count: bigint }[]
          >,
          prisma.$queryRaw`SELECT "unit", COUNT(*) as count FROM "Service" GROUP BY "unit"` as Promise<
            { unit: string; count: bigint }[]
          >,
        ]);

      return {
        total: Number(totalResult[0].count),
        active: Number(activeResult[0].count),
        inactive: Number(inactiveResult[0].count),
        byUnit: byUnitResult.map((item) => ({
          unit: item.unit,
          count: Number(item.count),
        })),
        // byCategory removed
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch service statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export default new ServiceService();
