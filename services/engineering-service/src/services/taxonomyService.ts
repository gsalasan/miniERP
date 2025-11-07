import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

export type Pagination = { page?: number; limit?: number };

function normalizePagination(p?: Pagination) {
  const page = Math.max(1, Number(p?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(p?.limit || 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export const taxonomyService = {
  // ServiceSystemCategory
  async listSystemCategories(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServiceSystemCategory" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "ServiceSystemCategory" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getSystemCategory(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "ServiceSystemCategory" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createSystemCategory(data: { name: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "ServiceSystemCategory" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateSystemCategory(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "ServiceSystemCategory" SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteSystemCategory(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "ServiceSystemCategory" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // ServiceSubSystem
  async listSubSystems(q?: { system_category_id?: string; search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q?.system_category_id) {
      clauses.push(`system_category_id::text = $${params.length + 1}`);
      params.push(q.system_category_id);
      clauses.push(`system_category_id = $${params.length + 1}::uuid`);
      params.push(q.system_category_id);
    }
    if (q?.search) {
      clauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${q.search}%`);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServiceSubSystem" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "ServiceSubSystem" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getSubSystem(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "ServiceSubSystem" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createSubSystem(data: { name: string; system_category_id: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "ServiceSubSystem" (id, name, system_category_id) VALUES (gen_random_uuid(), ${data.name}, ${data.system_category_id}::uuid) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateSubSystem(id: string, data: { name?: string; system_category_id?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "ServiceSubSystem" SET 
        name = COALESCE($2, name),
        system_category_id = COALESCE($3::uuid, system_category_id),
        updated_at = now()
       WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
      data.system_category_id ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteSubSystem(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "ServiceSubSystem" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // ServiceCategory
  async listServiceCategories(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServiceCategory" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "ServiceCategory" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getServiceCategory(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "ServiceCategory" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createServiceCategory(data: { name: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "ServiceCategory" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateServiceCategory(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "ServiceCategory" SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteServiceCategory(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "ServiceCategory" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // ServiceSpecificType
  async listSpecificTypes(q?: { category_id?: string; search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q?.category_id) {
      clauses.push(`category_id::text = $${params.length + 1}`);
      params.push(q.category_id);
      clauses.push(`category_id = $${params.length + 1}::uuid`);
      params.push(q.category_id);
    }
    if (q?.search) {
      clauses.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${q.search}%`);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "ServiceSpecificType" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "ServiceSpecificType" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getSpecificType(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "ServiceSpecificType" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createSpecificType(data: { name: string; category_id: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "ServiceSpecificType" (id, name, category_id) VALUES (gen_random_uuid(), ${data.name}, ${data.category_id}::uuid) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateSpecificType(id: string, data: { name?: string; category_id?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "ServiceSpecificType" SET 
        name = COALESCE($2, name),
        category_id = COALESCE($3::uuid, category_id),
        updated_at = now()
       WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
      data.category_id ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteSpecificType(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "ServiceSpecificType" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // ServiceDescription
  async listDescriptions(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE text ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT id, text, text AS name, created_at, updated_at FROM "ServiceDescription" ${whereSql} ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "ServiceDescription" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getDescription(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "ServiceDescription" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createDescription(data: { text: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "ServiceDescription" (id, text) VALUES (gen_random_uuid(), ${data.text}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateDescription(id: string, data: { text?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "ServiceDescription" SET text = COALESCE($2, text), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.text ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteDescription(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "ServiceDescription" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // TeamRecommendation
  async listTeamRecs(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "TeamRecommendation" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "TeamRecommendation" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getTeamRec(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "TeamRecommendation" WHERE id = ${id}::uuid`) as unknown[];
    return rows[0] || null;
  },
  async createTeamRec(data: { name: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "TeamRecommendation" (id, name) VALUES (gen_random_uuid(), ${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateTeamRec(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "TeamRecommendation" SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteTeamRec(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "TeamRecommendation" WHERE id = ${id}::uuid RETURNING *`) as unknown[];
    return rows[0];
  },

  // FaseProyekLookup
  async listFaseProyeks(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "FaseProyekLookup" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "FaseProyekLookup" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getFaseProyek(id: string) {
    const rows =
      (await prisma.$queryRaw`SELECT * FROM "FaseProyekLookup" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },
  async createFaseProyek(data: { name: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "FaseProyekLookup" (name) VALUES (${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateFaseProyek(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "FaseProyekLookup" SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteFaseProyek(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "FaseProyekLookup" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },

  // SBULookup
  async listSBUs(q?: { search?: string } & Pagination) {
    const { page, limit, skip } = normalizePagination(q);
    const whereSql = q?.search ? `WHERE name ILIKE $1` : '';
    const params: unknown[] = q?.search ? [`%${q.search}%`] : [];
    const items = (await prisma.$queryRawUnsafe(
      `SELECT * FROM "SBULookup" ${whereSql} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      limit,
      skip,
    )) as unknown[];
    const countRow = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "SBULookup" ${whereSql}`,
      ...params,
    )) as unknown[];
    const total = Number((countRow[0] as { count: number })?.count || 0);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
  async getSBU(id: string) {
  const rows = (await prisma.$queryRaw`SELECT * FROM "SBULookup" WHERE id::text = ${id}`) as unknown[];
    return rows[0] || null;
  },
  async createSBU(data: { name: string }) {
    const rows =
      (await prisma.$queryRaw`INSERT INTO "SBULookup" (name) VALUES (${data.name}) RETURNING *`) as unknown[];
    return rows[0];
  },
  async updateSBU(id: string, data: { name?: string }) {
    const rows = (await prisma.$queryRawUnsafe(
      `UPDATE "SBULookup" SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING *`,
      id,
      data.name ?? null,
    )) as unknown[];
    return rows[0];
  },
  async deleteSBU(id: string) {
    const rows =
      (await prisma.$queryRaw`DELETE FROM "SBULookup" WHERE id::text = ${id} RETURNING *`) as unknown[];
    return rows[0];
  },
};

export default taxonomyService;
