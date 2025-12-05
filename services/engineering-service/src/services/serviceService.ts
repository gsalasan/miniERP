import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

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
  category?: string | null;
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
  // free-text description (creates a new ServiceDescription row when provided)
  deskripsi_text?: string | null;
  rekomendasi_tim_ids?: string[] | null;
  fase_proyek_id?: string | null;
  sbu_id?: string | null;
  category?: string | null;
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
  // free-text description (if provided, a new ServiceDescription will be created and assigned)
  deskripsi_text?: string | null;
  rekomendasi_tim_ids?: string[] | null;
  fase_proyek_id?: string | null;
  sbu_id?: string | null;
  category?: string | null;
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
      // Validate parent-child relationships for sub_sistem_id
      let kategoriSistemId = data.kategori_sistem_id ?? null;
      if (data.sub_sistem_id) {
        const subRows = (await prisma.$queryRaw`SELECT * FROM "ServiceSubSystem" WHERE "id"::text = ${data.sub_sistem_id}`) as any[];
        if (!subRows || subRows.length === 0) {
          throw new Error('sub_sistem_id does not exist');
        }
        const subRow = subRows[0];
        if (subRow && subRow.system_category_id) kategoriSistemId = subRow.system_category_id;
        const parentId = subRow.system_category_id;
        if (kategoriSistemId && parentId !== kategoriSistemId) {
          throw new Error('sub_sistem_id does not belong to the provided kategori_sistem_id');
        }
      }

      // Validate parent-child relationships for jenis_jasa_spesifik_id
      let kategoriJasaId = data.kategori_jasa_id ?? null;
      let jenisJasaSpesifikId = data.jenis_jasa_spesifik_id ?? null;
      if (jenisJasaSpesifikId) {
        const specRows = (await prisma.$queryRaw`SELECT * FROM "ServiceSpecificType" WHERE "id"::text = ${jenisJasaSpesifikId}`) as any[];
        if (!specRows || specRows.length === 0) {
          throw new Error('jenis_jasa_spesifik_id does not exist');
        }
        const specRow = specRows[0];
        if (specRow && specRow.category_id) kategoriJasaId = specRow.category_id;
        const parentId = specRow.category_id;
        if (kategoriJasaId && parentId !== kategoriJasaId) {
          throw new Error('jenis_jasa_spesifik_id does not belong to the provided kategori_jasa_id');
        }
      }

      let subSistemId = data.sub_sistem_id ?? null;

      // If caller provided free-text description, create a new ServiceDescription row
      let deskripsiIdForInsert = data.deskripsi_id ?? null;
      if (data.deskripsi_text !== undefined && data.deskripsi_text !== null && String(data.deskripsi_text).trim() !== '') {
        const descRows = (await prisma.$queryRaw`INSERT INTO "ServiceDescription" (id, text) VALUES (gen_random_uuid(), ${data.deskripsi_text}) RETURNING id`) as { id: string }[];
        deskripsiIdForInsert = descRows[0]?.id || null;
      }
      
      const inserted = (await prisma.$queryRaw`
        INSERT INTO "Service" (
          "service_name", "service_code", "item_type", 
          "unit", "default_duration", "is_active",
          "kategori_sistem_id", "sub_sistem_id", "kategori_jasa_id", "jenis_jasa_spesifik_id", "deskripsi_id", "fase_proyek_id", "sbu_id", "category"
        ) VALUES (
          ${data.service_name}, ${data.service_code}, ${data.item_type || 'Service'}, ${data.unit}::"ServiceUnit", ${data.default_duration ?? null}, ${data.is_active ?? true},
          ${kategoriSistemId || null}::uuid, ${subSistemId || null}::uuid, ${kategoriJasaId || null}::uuid, ${jenisJasaSpesifikId || null}::uuid, ${deskripsiIdForInsert || null}::uuid, ${data.fase_proyek_id || null}, ${data.sbu_id || null}, ${data.category || null}
        )
        RETURNING id
      `) as { id: string }[];

      const newId = inserted[0]?.id;
      if (!newId) {
        throw new Error('Insert did not return an id');
      }

      // If caller provided multiple team member ids, insert into join table
      if (data.rekomendasi_tim_ids && Array.isArray(data.rekomendasi_tim_ids) && data.rekomendasi_tim_ids.length > 0) {
        for (const memberId of data.rekomendasi_tim_ids) {
          try {
            await prisma.$queryRaw`
              INSERT INTO "ServiceTeamMember" (service_id, team_recommendation_id) VALUES (${newId}::uuid, ${memberId})
            `;
          } catch (err) {
            // ignore individual insert errors but log for debugging
            console.warn('Failed to insert ServiceTeamMember', { serviceId: newId, memberId, err });
          }
        }
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

      // Sanitize sortBy to a known-safe list to avoid SQL injection via column names
      const allowedSortBy = [
        'created_at',
        'updated_at',
        'service_name',
        'service_code',
        'item_type',
        'unit',
        'is_active',
      ];
      const sortBySafe = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';

      const skip = (page - 1) * limit;

      // Build SQL WHERE conditions
      const conditions: string[] = [];
      const params: unknown[] = [];

      // Add filters to SQL conditions
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const addFilter = (
        colName: string,
        value: unknown,
        opts?: { ilike?: boolean; enumType?: string }
      ) => {
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value === '')
        )
          return;
        const paramIndex = params.length + 1;
        const isIdLike =
          colName.endsWith('_id') ||
          (typeof value === 'string' && uuidRegex.test(value));
        if (opts?.ilike) {
          conditions.push(`"${colName}" ILIKE $${paramIndex}`);
          params.push(`%${String(value)}%`);
        } else if (opts?.enumType) {
          conditions.push(`"${colName}" = $${paramIndex}::"${opts.enumType}"`);
          params.push(value);
        } else if (isIdLike) {
          // Avoid forcing parameter cast to uuid; cast the column instead to compare as text
          conditions.push(`"${colName}"::text = $${paramIndex}`);
          params.push(String(value));
        } else {
          conditions.push(`"${colName}" = $${paramIndex}`);
          params.push(value);
        }
      };

      addFilter('service_name', filters.service_name, { ilike: true });
      addFilter('service_code', filters.service_code);
      addFilter('category', filters.category);
      addFilter('unit', filters.unit, { enumType: 'ServiceUnit' });
      addFilter('is_active', filters.is_active);
      addFilter('item_type', filters.item_type);

      // Add search condition (service_name or service_code ILIKE)
      if (search && String(search).trim() !== '') {
        const searchIndex = params.length + 1;
        conditions.push(`("service_name" ILIKE $${searchIndex} OR "service_code" ILIKE $${searchIndex})`);
        params.push(`%${String(search)}%`);
      }

      // Build Prisma.sql fragments for WHERE clause
      const whereFragments: Prisma.Sql[] = [];
      for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i];
        const values: unknown[] = [];
        const parts: string[] = [];
        let lastIndex = 0;
        const regex = /\$\d+/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(cond)) !== null) {
          parts.push(cond.slice(lastIndex, match.index));
          const paramNum = parseInt(match[0].slice(1), 10);
          values.push(params[paramNum - 1]);
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < cond.length) {
          parts.push(cond.slice(lastIndex));
        }
        // Prisma.sql requires array of strings interleaved with values
        const sqlArray: any[] = [];
        for (let pi = 0; pi < parts.length; pi++) {
          sqlArray.push(parts[pi]);
          if (pi < values.length) sqlArray.push(values[pi]);
        }
        whereFragments.push(Prisma.sql(sqlArray as any));
      }

      const where = whereFragments.length
        ? (Prisma.sql`WHERE ${Prisma.join(whereFragments as any, Prisma.sql` AND ` as any)}` as unknown as Prisma.Sql)
        : Prisma.empty;

      // Get total count for pagination using Prisma.sql
      const countSql = Prisma.sql`SELECT COUNT(*) as count FROM "Service" s ${where}`;
      const countResult = (await prisma.$queryRaw(countSql)) as { count: bigint }[];
      const total = Number(countResult[0].count);

      // Get services with pagination and sorting
      const orderDirection = sortOrder.toUpperCase();
      const dataSql = Prisma.sql`
        SELECT 
          s.*, 
          sys.name AS kategori_sistem_name,
          subsys.name AS sub_sistem_name,
          cat.name AS kategori_jasa_name,
          spec.name AS jenis_jasa_spesifik_name,
          sd.text AS deskripsi_text,
          (
            SELECT json_agg(json_build_object('id', team.id::text, 'name', team.name, 'type', team.team_type))
            FROM "ServiceTeamMember" stm
            JOIN "TeamRecommendation" team ON team.id::text = stm.team_recommendation_id::text
            WHERE stm.service_id::text = s.id::text
          ) AS team_members,
          team.name AS rekomendasi_tim_name,
          team.team_type AS rekomendasi_tim_type,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id::text = s.kategori_sistem_id::text
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id::text = s.sub_sistem_id::text
        LEFT JOIN "ServiceCategory" cat ON cat.id::text = s.kategori_jasa_id::text
        LEFT JOIN "ServiceSpecificType" spec ON spec.id::text = s.jenis_jasa_spesifik_id::text
        LEFT JOIN "ServiceDescription" sd ON sd.id::text = s.deskripsi_id::text
        LEFT JOIN "TeamRecommendation" team ON team.id::text = s.rekomendasi_tim_id::text
        LEFT JOIN "FaseProyekLookup" fase ON fase.id::text = s.fase_proyek_id::text
        LEFT JOIN "SBULookup" sbu ON sbu.id::text = s.sbu_id::text
        ${where}
        ORDER BY ${Prisma.raw(`s."${sortBySafe}" ${orderDirection}`)}
        LIMIT ${limit} OFFSET ${skip}
      `;

      let services: ServiceWithTaxonomy[];
      try {
        services = (await prisma.$queryRaw(dataSql)) as ServiceWithTaxonomy[];
      } catch (err: any) {
        console.error('Raw dataQuery failed', {
          params: [...params, limit, skip],
          message: err?.message,
          code: err?.code,
          meta: err?.meta,
        });

        // Try a simpler fallback query without JOINs to isolate whether JOINs cause the failure
        const fallbackSql = Prisma.sql`
          SELECT s.* FROM "Service" s
          ${where}
          ORDER BY ${Prisma.raw(`s."${sortBySafe}" ${orderDirection}`)}
          LIMIT ${limit} OFFSET ${skip}
        `;
        try {
          console.warn('Attempting fallback query without JOINs to isolate issue');
          const simple = (await prisma.$queryRaw(fallbackSql)) as ServiceWithTaxonomy[];
          services = simple;
        } catch (fallbackErr: any) {
          console.error('Fallback query also failed', {
            message: fallbackErr?.message,
            code: fallbackErr?.code,
            meta: fallbackErr?.meta,
          });
          throw err;
        }
      }

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
          team.team_type AS rekomendasi_tim_type,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id::text = s.kategori_sistem_id::text
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id::text = s.sub_sistem_id::text
        LEFT JOIN "ServiceCategory" cat ON cat.id::text = s.kategori_jasa_id::text
        LEFT JOIN "ServiceSpecificType" spec ON spec.id::text = s.jenis_jasa_spesifik_id::text
        LEFT JOIN "ServiceDescription" sd ON sd.id::text = s.deskripsi_id::text
        LEFT JOIN "TeamRecommendation" team ON team.id::text = s.rekomendasi_tim_id::text
        LEFT JOIN "FaseProyekLookup" fase ON fase.id::text = s.fase_proyek_id::text
        LEFT JOIN "SBULookup" sbu ON sbu.id::text = s.sbu_id::text
        WHERE s."id"::text = ${id}
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
          team.team_type AS rekomendasi_tim_type,
          fase.name AS fase_proyek_name,
          sbu.name AS sbu_name
        FROM "Service" s
        LEFT JOIN "ServiceSystemCategory" sys ON sys.id::text = s.kategori_sistem_id::text
        LEFT JOIN "ServiceSubSystem" subsys ON subsys.id::text = s.sub_sistem_id::text
        LEFT JOIN "ServiceCategory" cat ON cat.id::text = s.kategori_jasa_id::text
        LEFT JOIN "ServiceSpecificType" spec ON spec.id::text = s.jenis_jasa_spesifik_id::text
        LEFT JOIN "ServiceDescription" sd ON sd.id::text = s.deskripsi_id::text
        LEFT JOIN "TeamRecommendation" team ON team.id::text = s.rekomendasi_tim_id::text
        LEFT JOIN "FaseProyekLookup" fase ON fase.id::text = s.fase_proyek_id::text
        LEFT JOIN "SBULookup" sbu ON sbu.id::text = s.sbu_id::text
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
      const existingService = (await prisma.service.findUnique({ where: { id } })) as ServiceRow | null;
      if (!existingService) {
        throw new Error('Service not found');
      }

      // If service_code is being updated, check if it's unique
      if (data.service_code && data.service_code !== existingService.service_code) {
        const existingWithCode = await prisma.service.findFirst({ where: { service_code: data.service_code } });
        if (existingWithCode) {
          throw new Error('Service code already exists');
        }
      }

      // Compute/validate taxonomy relations
      let nextKategoriSistemId =
        data.kategori_sistem_id === undefined
          ? (existingService.kategori_sistem_id ?? null)
          : (data.kategori_sistem_id ?? null);
      let nextSubSistemId = data.sub_sistem_id === undefined ? (existingService.sub_sistem_id ?? null) : (data.sub_sistem_id ?? null);

      if (nextSubSistemId) {
        const subRow = (await prisma.$queryRaw`SELECT * FROM "ServiceSubSystem" WHERE "id"::text = ${nextSubSistemId}`) as any[];
        if (!subRow || subRow.length === 0) {
          throw new Error('sub_sistem_id does not exist');
        }
        const parentId = (subRow as any).system_category_id;
        if (parentId) nextKategoriSistemId = parentId;
      }

      let nextKategoriJasaId = data.kategori_jasa_id === undefined ? (existingService.kategori_jasa_id ?? null) : (data.kategori_jasa_id ?? null);
      let nextJenisJasaSpesifikId = data.jenis_jasa_spesifik_id === undefined ? (existingService.jenis_jasa_spesifik_id ?? null) : (data.jenis_jasa_spesifik_id ?? null);
      const kategoriJasaChanged = data.kategori_jasa_id !== undefined && data.kategori_jasa_id !== existingService.kategori_jasa_id;

      if (nextJenisJasaSpesifikId) {
        const specRow = (await prisma.$queryRaw`SELECT * FROM "ServiceSpecificType" WHERE "id"::text = ${nextJenisJasaSpesifikId}`) as any[];
        if (!specRow || specRow.length === 0) {
          throw new Error('jenis_jasa_spesifik_id does not exist');
        }
        const parentId = (specRow as any).category_id;
        if (parentId) nextKategoriJasaId = parentId;
      }

      // Handle deskripsi_text: create new ServiceDescription if provided
      let newDeskripsiId: string | null | undefined = undefined;
      if (data.deskripsi_text !== undefined) {
        if (data.deskripsi_text === null || String(data.deskripsi_text).trim() === '') {
          newDeskripsiId = null;
        } else {
          const descRows = (await prisma.$queryRaw`INSERT INTO "ServiceDescription" (id, text) VALUES (gen_random_uuid(), ${data.deskripsi_text}) RETURNING id`) as { id: string }[];
          newDeskripsiId = descRows[0]?.id || null;
        }
      }

      // Build Prisma client update payload
      const prismaUpdateData: any = {};
      if (data.service_name !== undefined) prismaUpdateData.service_name = data.service_name;
      if (data.service_code !== undefined) prismaUpdateData.service_code = data.service_code;
      if (data.item_type !== undefined) prismaUpdateData.item_type = data.item_type;
      if (data.fase_proyek_id !== undefined) prismaUpdateData.fase_proyek_id = data.fase_proyek_id || null;
      if (data.sbu_id !== undefined) prismaUpdateData.sbu_id = data.sbu_id || null;

      // Taxonomy computed values
      if (data.kategori_sistem_id !== undefined || nextKategoriSistemId !== (existingService.kategori_sistem_id ?? null)) {
        prismaUpdateData.kategori_sistem_id = nextKategoriSistemId || null;
      }
      if (data.sub_sistem_id !== undefined) prismaUpdateData.sub_sistem_id = nextSubSistemId || null;
      if (data.kategori_jasa_id !== undefined || nextKategoriJasaId !== (existingService.kategori_jasa_id ?? null)) {
        prismaUpdateData.kategori_jasa_id = nextKategoriJasaId || null;
      }
      if (data.jenis_jasa_spesifik_id !== undefined || kategoriJasaChanged) {
        prismaUpdateData.jenis_jasa_spesifik_id = nextJenisJasaSpesifikId || null;
      }
      if (newDeskripsiId !== undefined) prismaUpdateData.deskripsi_id = newDeskripsiId || null;
      else if (data.deskripsi_id !== undefined) prismaUpdateData.deskripsi_id = data.deskripsi_id || null;
      
      if (data.unit !== undefined) prismaUpdateData.unit = data.unit;
      if (data.default_duration !== undefined) prismaUpdateData.default_duration = data.default_duration;
      if (data.is_active !== undefined) prismaUpdateData.is_active = data.is_active;
      if (data.category !== undefined) prismaUpdateData.category = data.category || null;

      // Always update updated_at
      prismaUpdateData.updated_at = new Date();

      if (Object.keys(prismaUpdateData).length === 0) {
        throw new Error('No fields to update');
      }

      let updatedRecord: any;
      try {
        updatedRecord = await prisma.service.update({
          where: { id },
          data: prismaUpdateData,
        });
      } catch (err: any) {
        console.error('Prisma client update failed', {
          message: err?.message,
          code: err?.code,
          meta: err?.meta,
        });
        throw err;
      }

      return (await this.getServiceById(updatedRecord.id)) as ServiceWithTaxonomy;
    } catch (error) {
      throw new Error(
        `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Delete service by ID (soft delete)
  async deleteService(id: string): Promise<ServiceRow> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id"::text = ${id}
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
        DELETE FROM "Service" WHERE "id"::text = ${id} RETURNING *
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
        SELECT * FROM "Service" WHERE "id"::text = ${id}
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
        DELETE FROM "Service" WHERE "id"::text = ${id} RETURNING *
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
        SELECT * FROM "Service" WHERE "id"::text = ${id}
      `) as ServiceRow[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const restoredServices = (await prisma.$queryRaw`
        UPDATE "Service" 
        SET "is_active" = true, "updated_at" = ${new Date()}
        WHERE "id"::text = ${id}
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
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch service statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Search services for autocomplete
  async searchServices(query: string, limit: number = 20) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const services = await prisma.service.findMany({
        where: {
          OR: [
            { service_name: { contains: query, mode: 'insensitive' } },
            { service_code: { contains: query, mode: 'insensitive' } },
          ],
          is_active: true,
        },
        select: {
          id: true,
          service_name: true,
          service_code: true,
          unit: true,
          default_duration: true,
        },
        take: limit,
        orderBy: {
          service_name: 'asc',
        },
      });

      return services;
    } catch (error) {
      throw new Error(
        `Failed to search services: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export default new ServiceService();
