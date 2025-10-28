import { PrismaClient } from '@prisma/client';

// Enum definitions to match database schema
enum ServiceUnit {
  Jam = 'Jam',
  Hari = 'Hari',
}

// Service interface
interface Service {
  id: string;
  service_name: string;
  service_code: string;
  item_type: string;
  category?: string;
  unit: ServiceUnit;
  internal_cost_per_hour?: number;
  freelance_cost_per_hour?: number;
  default_duration?: number;
  is_active: boolean;
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

export interface CreateServiceData {
  service_name: string;
  service_code: string;
  item_type?: string;
  category?: string;
  unit: ServiceUnit;
  internal_cost_per_hour?: number;
  freelance_cost_per_hour?: number;
  default_duration?: number;
  is_active?: boolean;
}

export interface UpdateServiceData {
  service_name?: string;
  service_code?: string;
  item_type?: string;
  category?: string;
  unit?: ServiceUnit;
  internal_cost_per_hour?: number;
  freelance_cost_per_hour?: number;
  default_duration?: number;
  is_active?: boolean;
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
  async createService(data: CreateServiceData): Promise<Service> {
    try {
      const query = `
        INSERT INTO "Service" (
          "service_name", "service_code", "item_type", "category", 
          "unit", "internal_cost_per_hour", "freelance_cost_per_hour", 
          "default_duration", "is_active"
        ) VALUES (
          $1, $2, $3, $4, $5::"ServiceUnit", $6, $7, $8, $9
        )
        RETURNING *
      `;

      const service = (await prisma.$queryRawUnsafe(
        query,
        data.service_name,
        data.service_code,
        data.item_type || 'Service',
        data.category,
        data.unit,
        data.internal_cost_per_hour,
        data.freelance_cost_per_hour,
        data.default_duration,
        data.is_active ?? true
      )) as Service[];
      return service[0];
    } catch (error) {
      throw new Error(
        `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get all services with filtering, pagination, and search
  async getServices(options: GetServicesOptions = {}): Promise<{
    data: Service[];
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
      if (filters.category) {
        conditions.push(`"category" = $${params.length + 1}`);
        params.push(filters.category);
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
          "category" ILIKE $${params.length + 1} OR 
          "item_type" ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as count FROM "Service" ${whereClause}`;

      const countResult = (await prisma.$queryRawUnsafe(
        countQuery,
        ...params
      )) as { count: bigint }[];
      const total = Number(countResult[0].count);

      // Get services with pagination and sorting
      const orderDirection = sortOrder.toUpperCase();
      const dataQuery = `
        SELECT * FROM "Service" 
        ${whereClause}
        ORDER BY "${sortBy}" ${orderDirection}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const services = (await prisma.$queryRawUnsafe(
        dataQuery,
        ...params,
        limit,
        skip
      )) as Service[];

      const totalPages = Math.ceil(total / limit);

      return {
        data: services as Service[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const services = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as Service[];
      return services.length > 0 ? services[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get service by service code
  async getServiceByCode(service_code: string): Promise<Service | null> {
    try {
      const services = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "service_code" = ${service_code}
      `) as Service[];
      return services.length > 0 ? services[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch service by code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update service by ID
  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    try {
      // Check if service exists
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as Service[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const existingService = existingServices[0];

      // If service_code is being updated, check if it's unique
      if (
        data.service_code &&
        data.service_code !== existingService.service_code
      ) {
        const existingWithCode = (await prisma.$queryRaw`
          SELECT * FROM "Service" WHERE "service_code" = ${data.service_code}
        `) as Service[];
        if (existingWithCode.length > 0) {
          throw new Error('Service code already exists');
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
      if (data.category !== undefined) {
        updates.push(`"category" = $${params.length + 1}`);
        params.push(data.category);
      }
      if (data.unit !== undefined) {
        updates.push(`"unit" = $${params.length + 1}::"ServiceUnit"`);
        params.push(data.unit);
      }
      if (data.internal_cost_per_hour !== undefined) {
        updates.push(`"internal_cost_per_hour" = $${params.length + 1}`);
        params.push(data.internal_cost_per_hour);
      }
      if (data.freelance_cost_per_hour !== undefined) {
        updates.push(`"freelance_cost_per_hour" = $${params.length + 1}`);
        params.push(data.freelance_cost_per_hour);
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

      const updatedServices = (await prisma.$queryRawUnsafe(
        updateQuery,
        ...params
      )) as Service[];
      return updatedServices[0];
    } catch (error) {
      throw new Error(
        `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

<<<<<<< HEAD
  // Delete service by ID (soft delete by setting is_active to false)
=======
  // Delete service by ID (hard delete)
>>>>>>> main
  async deleteService(id: string): Promise<Service> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as Service[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
<<<<<<< HEAD
        UPDATE "Service" 
        SET "is_active" = false, "updated_at" = ${new Date()}
        WHERE "id" = ${id}::uuid
        RETURNING *
=======
        DELETE FROM "Service" WHERE "id" = ${id}::uuid RETURNING *
>>>>>>> main
      `) as Service[];

      return deletedServices[0];
    } catch (error) {
      throw new Error(
        `Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Hard delete service by ID
  async hardDeleteService(id: string): Promise<Service> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as Service[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const deletedServices = (await prisma.$queryRaw`
        DELETE FROM "Service" WHERE "id" = ${id}::uuid RETURNING *
      `) as Service[];

      return deletedServices[0];
    } catch (error) {
      throw new Error(
        `Failed to permanently delete service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Restore service (set is_active back to true)
  async restoreService(id: string): Promise<Service> {
    try {
      const existingServices = (await prisma.$queryRaw`
        SELECT * FROM "Service" WHERE "id" = ${id}::uuid
      `) as Service[];

      if (existingServices.length === 0) {
        throw new Error('Service not found');
      }

      const restoredServices = (await prisma.$queryRaw`
        UPDATE "Service" 
        SET "is_active" = true, "updated_at" = ${new Date()}
        WHERE "id" = ${id}::uuid
        RETURNING *
      `) as Service[];

      return restoredServices[0];
    } catch (error) {
      throw new Error(
        `Failed to restore service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byUnit: { unit: string; count: number }[];
    byCategory: { category: string; count: number }[];
  }> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        byUnitResult,
        byCategoryResult,
      ] = await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service"` as Promise<
          { count: bigint }[]
        >,
        prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service" WHERE "is_active" = true` as Promise<
          { count: bigint }[]
        >,
        prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service" WHERE "is_active" = false` as Promise<
          { count: bigint }[]
        >,
        prisma.$queryRaw`SELECT "unit", COUNT(*) as count FROM "Service" GROUP BY "unit"` as Promise<
          { unit: string; count: bigint }[]
        >,
        prisma.$queryRaw`SELECT "category", COUNT(*) as count FROM "Service" WHERE "category" IS NOT NULL GROUP BY "category"` as Promise<
          { category: string; count: bigint }[]
        >,
      ]);

      return {
        total: Number(totalResult[0].count),
        active: Number(activeResult[0].count),
        inactive: Number(inactiveResult[0].count),
        byUnit: byUnitResult.map(item => ({
          unit: item.unit,
          count: Number(item.count),
        })),
        byCategory: byCategoryResult.map(item => ({
          category: item.category || 'Unknown',
          count: Number(item.count),
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch service statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default new ServiceService();
