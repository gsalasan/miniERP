// Journal Entries Service
import { prisma } from '../lib/prisma';

export interface CreateJournalEntryDto {
  transaction_date: string;
  description?: string;
  account_id: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
}

export interface UpdateJournalEntryDto {
  transaction_date?: string;
  description?: string;
  account_id?: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
}

export interface JournalEntryFilters {
  account_id?: number;
  start_date?: string;
  end_date?: string;
}

class JournalEntriesService {
  // Expose prisma for raw queries
  public prisma = prisma;

  /**
   * Get all journal entries with optional filters
   */
  async getAllJournalEntries(filters?: JournalEntryFilters) {
    try {
      let query = `
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filters?.account_id) {
        params.push(filters.account_id);
        query += ` AND je.account_id = $${params.length}`;
      }

      if (filters?.start_date) {
        params.push(filters.start_date);
        query += ` AND je.transaction_date >= $${params.length}::date`;
      }

      if (filters?.end_date) {
        params.push(filters.end_date);
        query += ` AND je.transaction_date <= $${params.length}::date`;
      }

      query += ` ORDER BY je.transaction_date DESC`;

      const entries: any[] = await prisma.$queryRawUnsafe(query, ...params);

      return entries;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  /**
   * Get journal entries by account ID
   */
  async getByAccountId(accountId: number) {
    try {
      const entries: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.account_id = $1
        ORDER BY je.transaction_date DESC
      `, accountId);

      return entries;
    } catch (error) {
      console.error('Error fetching journal entries by account:', error);
      throw error;
    }
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(id: string) {
    try {
      const entries: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, id);

      if (!entries || entries.length === 0) {
        throw new Error('Journal entry not found');
      }

      return entries[0];
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      throw error;
    }
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(data: CreateJournalEntryDto) {
    try {
      // Validate that either debit or credit is provided (but not both)
      if ((data.debit && data.credit) || (!data.debit && !data.credit)) {
        throw new Error('Either debit or credit must be provided (but not both)');
      }

      // Validate account exists
      const account = await prisma.chartOfAccounts.findUnique({
        where: { id: data.account_id },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Build dynamic INSERT query based on whether reference_id exists
      let query: string;
      let params: any[];

      if (data.reference_id) {
        // Include reference_id with UUID cast
        query = `
          INSERT INTO journal_entries (
            transaction_date, description, account_id, debit, credit,
            reference_id, reference_type, created_by, created_at, updated_at
          ) VALUES (
            $1::date, $2, $3, $4, $5, $6::uuid, $7, $8, NOW(), NOW()
          ) RETURNING *
        `;
        params = [
          data.transaction_date,
          data.description || null,
          data.account_id,
          data.debit || null,
          data.credit || null,
          data.reference_id,
          data.reference_type || null,
          data.created_by || null
        ];
      } else {
        // Skip reference_id column
        query = `
          INSERT INTO journal_entries (
            transaction_date, description, account_id, debit, credit,
            reference_type, created_by, created_at, updated_at
          ) VALUES (
            $1::date, $2, $3, $4, $5, $6, $7, NOW(), NOW()
          ) RETURNING *
        `;
        params = [
          data.transaction_date,
          data.description || null,
          data.account_id,
          data.debit || null,
          data.credit || null,
          data.reference_type || null,
          data.created_by || null
        ];
      }

      const result: any[] = await prisma.$queryRawUnsafe(query, ...params);
      const entry = result[0];

      // Get account details
      const entryWithAccount: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, entry.id);

      return entryWithAccount[0];
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(id: string, data: UpdateJournalEntryDto) {
    try {
      // Check if entry exists using raw SQL
      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM journal_entries WHERE id = $1::bigint',
        id
      );

      if (!existing || existing.length === 0) {
        throw new Error('Journal entry not found');
      }

      // Validate debit/credit if both are being updated
      if (data.debit !== undefined && data.credit !== undefined) {
        if ((data.debit && data.credit) || (!data.debit && !data.credit)) {
          throw new Error('Either debit or credit must be provided (but not both)');
        }
      }

      // Validate account if being updated
      if (data.account_id) {
        const account = await prisma.chartOfAccounts.findUnique({
          where: { id: data.account_id },
        });

        if (!account) {
          throw new Error('Account not found');
        }
      }

      // Build dynamic UPDATE query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.transaction_date !== undefined) {
        updates.push(`transaction_date = $${paramIndex}::date`);
        values.push(data.transaction_date);
        paramIndex++;
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(data.description);
        paramIndex++;
      }
      if (data.account_id !== undefined) {
        updates.push(`account_id = $${paramIndex}`);
        values.push(data.account_id);
        paramIndex++;
      }
      if (data.debit !== undefined) {
        updates.push(`debit = $${paramIndex}`);
        values.push(data.debit);
        paramIndex++;
      }
      if (data.credit !== undefined) {
        updates.push(`credit = $${paramIndex}`);
        values.push(data.credit);
        paramIndex++;
      }
      if (data.reference_id !== undefined) {
        updates.push(`reference_id = $${paramIndex}`);
        values.push(data.reference_id);
        paramIndex++;
      }
      if (data.reference_type !== undefined) {
        updates.push(`reference_type = $${paramIndex}`);
        values.push(data.reference_type);
        paramIndex++;
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const query = `
        UPDATE journal_entries
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}::bigint
        RETURNING *
      `;

      const result: any[] = await prisma.$queryRawUnsafe(query, ...values);

      // Get entry with account details
      const entryWithAccount: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, id);

      return entryWithAccount[0];
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string) {
    try {
      // Check if entry exists using raw SQL
      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM journal_entries WHERE id = $1::bigint',
        id
      );

      if (!existing || existing.length === 0) {
        throw new Error('Journal entry not found');
      }

      // Delete using raw SQL
      await prisma.$queryRawUnsafe(
        'DELETE FROM journal_entries WHERE id = $1::bigint',
        id
      );

      return { message: 'Journal entry deleted successfully' };
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  /**
   * Get account balance summary
   */
  async getAccountBalance(accountId: number) {
    try {
      // Use raw SQL aggregation query
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COALESCE(SUM(debit), 0) as total_debit,
          COALESCE(SUM(credit), 0) as total_credit,
          COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as balance
        FROM journal_entries
        WHERE account_id = $1
      `, accountId);

      const balance = result[0];

      return {
        account_id: accountId,
        total_debit: Number(balance.total_debit),
        total_credit: Number(balance.total_credit),
        balance: Number(balance.balance),
      };
    } catch (error) {
      console.error('Error calculating account balance:', error);
      throw error;
    }
  }
}

export default new JournalEntriesService();
