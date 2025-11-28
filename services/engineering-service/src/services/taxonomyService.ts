import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export type Pagination = { page?: number; limit?: number };

function normalizePagination(p?: Pagination) {
  const page = Math.max(1, Number(p?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(p?.limit || 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function listTable(
  table: string,
  whereSql: string,
  params: unknown[],
  orderBy = 'name',
  limit = 20,
  skip = 0,
) {
  // Whitelist allowed taxonomy tables and allowed orderBy columns to avoid SQL injection
  const allowedTables = new Set([
    'ServiceSystemCategory',
    'ServiceSubSystem',
    'ServiceCategory',
    'ServiceSpecificType',
    'ServiceDescription',
    'TeamRecommendation',
    'FaseProyekLookup',
    'SBULookup',
  ]);
  const allowedOrderBys = new Set(['name', 'text', 'id']);

  if (!allowedTables.has(table)) {
    throw new Error(`Unsafe table name: ${table}`);
  }
  if (!allowedOrderBys.has(orderBy)) {
    throw new Error(`Unsafe orderBy column: ${orderBy}`);
  }

  // table and orderBy are validated/whitelisted above, so it's safe to interpolate them
  // Build SQL strings using positional $n placeholders for the WHERE params and
  // then append LIMIT/OFFSET as additional positional params. Use
  // $queryRawUnsafe with the final SQL string and parameter array to avoid
  // sql-template-tag interpolation issues for dynamic $n placeholders.
  const tableName = table;
  const orderByCol = orderBy;

  const whereClause = whereSql && whereSql.length > 0 ? ` ${whereSql}` : '';

  const dataQuery = `SELECT * FROM "${tableName}"${whereClause} ORDER BY "${orderByCol}" ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const countQuery = `SELECT COUNT(*)::int AS count FROM "${tableName}"${whereClause}`;

  const queryParams = [...params, limit, skip];

  const items = (await prisma.$queryRawUnsafe(dataQuery, ...queryParams)) as unknown[];
  const countRow = (await prisma.$queryRawUnsafe(countQuery, ...params)) as unknown[];
  const total = Number((countRow[0] as { count: number })?.count || 0);
  return { data: items, total };
}

export const taxonomyService = {
  async listSystemCategories(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const { data, total } = await listTable('ServiceSystemCategory', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getSystemCategory(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "ServiceSystemCategory" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createSystemCategory(data: { name: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "ServiceSystemCategory" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateSystemCategory(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "ServiceSystemCategory" SET name = COALESCE(${data.name ?? null}, name), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteSystemCategory(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "ServiceSystemCategory" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  async listSubSystems(q?: { system_category_id?: string; search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q?.system_category_id) {
      // Cast column to text and compare to parameter as text to avoid text = uuid operator errors
      clauses.push(`system_category_id::text = $${params.length + 1}`);
      params.push(q.system_category_id);
    }
    if (q?.search) {
      clauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${q.search}%`);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { data, total } = await listTable('ServiceSubSystem', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getSubSystem(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "ServiceSubSystem" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createSubSystem(data: { name: string; system_category_id: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "ServiceSubSystem" (id, name, system_category_id) VALUES (gen_random_uuid(), ${data.name}, ${data.system_category_id}::uuid) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateSubSystem(id: string, data: { name?: string; system_category_id?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "ServiceSubSystem" SET name = COALESCE(${data.name ?? null}, name), system_category_id = COALESCE(${data.system_category_id ?? null}::uuid, system_category_id), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteSubSystem(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "ServiceSubSystem" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // Service Categories
  async listServiceCategories(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const { data, total } = await listTable('ServiceCategory', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getServiceCategory(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "ServiceCategory" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createServiceCategory(data: { name: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "ServiceCategory" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateServiceCategory(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "ServiceCategory" SET name = COALESCE(${data.name ?? null}, name), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteServiceCategory(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "ServiceCategory" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // Specific Types
  async listSpecificTypes(q?: { category_id?: string; search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q?.category_id) {
      // Normalize comparison by casting DB column to text and comparing to parameter as text
      clauses.push(`category_id::text = $${params.length + 1}`);
      params.push(q.category_id);
    }
    if (q?.search) {
      clauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${q.search}%`);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { data, total } = await listTable('ServiceSpecificType', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getSpecificType(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "ServiceSpecificType" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createSpecificType(data: { name: string; category_id: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "ServiceSpecificType" (id, name, category_id) VALUES (gen_random_uuid(), ${data.name}, ${data.category_id}::uuid) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateSpecificType(id: string, data: { name?: string; category_id?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "ServiceSpecificType" SET name = COALESCE(${data.name ?? null}, name), category_id = COALESCE(${data.category_id ?? null}::uuid, category_id), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteSpecificType(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "ServiceSpecificType" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // Descriptions
  async listDescriptions(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE text ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const { data, total } = await listTable('ServiceDescription', whereSql, params, 'text', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getDescription(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "ServiceDescription" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createDescription(data: { text: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "ServiceDescription" (id, text) VALUES (gen_random_uuid(), ${data.text}) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateDescription(id: string, data: { text?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "ServiceDescription" SET text = COALESCE(${data.text ?? null}, text), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteDescription(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "ServiceDescription" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // Team Recommendations
  async listTeamRecs(q?: { search?: string; type?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q?.type) {
      // compare enum column as text to avoid uuid/enum operator issues
      clauses.push(`team_type::text = $${params.length + 1}`);
      params.push(q.type);
    }
    if (q?.search) {
      clauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${q.search}%`);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { data, total } = await listTable('TeamRecommendation', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getTeamRec(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "TeamRecommendation" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createTeamRec(data: { name: string; type?: string }) {
    const teamType = data.type || 'INTERNAL';
    const rows = (await prisma.$queryRaw`INSERT INTO "TeamRecommendation" (id, name, team_type) VALUES (gen_random_uuid(), ${data.name}, ${teamType}::"TeamType") RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateTeamRec(id: string, data: { name?: string; type?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "TeamRecommendation" SET name = COALESCE(${data.name ?? null}, name), team_type = COALESCE(${data.type ?? null}::"TeamType", team_type), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteTeamRec(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "TeamRecommendation" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // FaseProyek
  async listFaseProyeks(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const { data, total } = await listTable('FaseProyekLookup', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getFaseProyek(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "FaseProyekLookup" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createFaseProyek(data: { name: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "FaseProyekLookup" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateFaseProyek(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "FaseProyekLookup" SET name = COALESCE(${data.name ?? null}, name), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteFaseProyek(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "FaseProyekLookup" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // SBU
  async listSBUs(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const { data, total } = await listTable('SBULookup', whereSql, params, 'name', limit, skip);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getSBU(id: string) {
    const rows = (await prisma.$queryRaw`SELECT * FROM "SBULookup" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },

  async createSBU(data: { name: string }) {
    const rows = (await prisma.$queryRaw`INSERT INTO "SBULookup" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },

  async updateSBU(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRaw(
      Prisma.sql`UPDATE "SBULookup" SET name = COALESCE(${data.name ?? null}, name), updated_at = now() WHERE id::text = ${id} RETURNING *`,
    )) as unknown[];
    return rows[0];
  },

  async deleteSBU(id: string) {
    const rows = (await prisma.$queryRaw`DELETE FROM "SBULookup" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },
};

export default taxonomyService;

