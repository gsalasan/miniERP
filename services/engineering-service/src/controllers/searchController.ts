import { Request, Response } from 'express';
import searchService, { SearchResponse } from '../services/searchService';

interface SearchQueryParams {
  q?: string;
  page?: string;
  limit?: string;
  type?: 'material' | 'service' | 'both';
}

class SearchController {
  // Handler untuk GET /items/search?q=...
  async searchItems(req: Request, res: Response): Promise<Response> {
    try {
      const {
        q,
        page = '1',
        limit = '10',
        type = 'both',
      } = req.query as SearchQueryParams;

      // Validasi parameter query
      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required and cannot be empty',
          data: null,
        });
      }

      // Validasi dan konversi parameter pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page must be a positive integer',
          data: null,
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a positive integer between 1 and 100',
          data: null,
        });
      }

      // Validasi type parameter
      const validTypes = ['material', 'service', 'both'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be one of: material, service, both',
          data: null,
        });
      }

      // Eksekusi pencarian
      const searchResults: SearchResponse = await searchService.searchItems(
        q.trim(),
        pageNum,
        limitNum,
        type as 'material' | 'service' | 'both'
      );

      // Response sukses
      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: searchResults.data,
        pagination: searchResults.pagination,
        summary: searchResults.summary,
        query: {
          q: q.trim(),
          type,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error('Error in searchItems controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during search',
        data: null,
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }

  // Handler untuk quick search (untuk autocomplete/suggestions)
  async quickSearch(req: Request, res: Response): Promise<Response> {
    try {
      const { q, limit = '5' } = req.query as {
        q?: string;
        limit?: string;
      };

      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required and cannot be empty',
          data: [],
        });
      }

      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a positive integer between 1 and 20',
          data: [],
        });
      }

      const results = await searchService.quickSearch(q.trim(), limitNum);

      return res.status(200).json({
        success: true,
        message: 'Quick search completed successfully',
        data: results,
        query: {
          q: q.trim(),
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error('Error in quickSearch controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during quick search',
        data: [],
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }

  // Handler untuk health check endpoint search
  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json({
        success: true,
        message: 'Search service is healthy',
        timestamp: new Date().toISOString(),
        service: 'engineering-service-search',
      });
    } catch (error) {
      console.error('Error in search health check:', error);
      return res.status(500).json({
        success: false,
        message: 'Search service health check failed',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  }
}

export default new SearchController();