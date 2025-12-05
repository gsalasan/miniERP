import axios, { AxiosInstance } from 'axios';
import { projectApi as projectsClient } from './projectApi';

const PROJECT_BASE = import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:4007';
const ENGINEERING_BASE = import.meta.env.VITE_ENGINEERING_SERVICE_URL || 'http://localhost:4001';

const projectApi: AxiosInstance = axios.create({
  baseURL: `${PROJECT_BASE.replace(/\/+$/, '')}/api/v1/dashboards`,
  headers: { 'Content-Type': 'application/json' },
});

const engineeringApi: AxiosInstance = axios.create({
  baseURL: `${ENGINEERING_BASE.replace(/\/+$/, '')}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

const attachAuth = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

attachAuth(projectApi);
attachAuth(engineeringApi);

export const getProjectDashboard = async (projectId: string) => {
  // Try project-service dashboard endpoint first; if not found, fall back to engineering dashboard
  try {
    const resp = await projectApi.get(`/projects/${projectId}`);
    return resp.data?.data ?? resp.data ?? resp;
  } catch (err: any) {
    // If 404 or endpoint missing, fallback to engineering dashboard as best-effort
    const status = err?.response?.status;
    if (status === 404 || status === 501 || status === 400) {
      try {
        const resp2 = await engineeringApi.get('/dashboards/engineering', { params: { projectId } });
        const eng = resp2.data?.data ?? resp2.data ?? resp2;

        // Map engineering dashboard to the shape expected by ProjectDashboardPage
        const projectFromEng = eng?.project || eng?.projectDetail || eng?.project_info || eng?.projectData || null;

        const getTimelineStatus = () => {
          if (eng?.timelineStatus) return eng.timelineStatus;
          if (eng?.scheduleStatus) return eng.scheduleStatus;
          const sd = eng?.statusDistribution || eng?.raw?.statusDistribution || [];
          if (!sd || !sd.length) return 'Unknown';
          const onTrack = sd.find((s: any) => /ON_TRACK|ONTRACK|on track/i.test(String(s.status)));
          if (onTrack) return 'On Track';
          const overdue = sd.find((s: any) => /OVERDUE|overdue/i.test(String(s.status)));
          if (overdue) return 'Overdue';
          return 'At Risk';
        };

        const mappedProject = {
          project_name:
            projectFromEng?.project_name || projectFromEng?.name || projectFromEng?.title || eng?.name || eng?.project_name || '',
          customer: projectFromEng?.customer || (eng?.client ? { company_name: eng.client } : projectFromEng?.customer_name ? { company_name: projectFromEng.customer_name } : null),
          start_date: projectFromEng?.start_date || projectFromEng?.startDate || eng?.startDate || null,
          end_date: projectFromEng?.end_date || projectFromEng?.endDate || eng?.endDate || null,
          estimated_hpp: projectFromEng?.estimated_hpp || projectFromEng?.estimatedHpp || eng?.estimated_hpp || eng?.estimatedHpp || 0,
          actual_cost: projectFromEng?.actual_cost || eng?.actual_cost || eng?.actualCost || 0,
        };

        const mapped = {
          timelineStatus: getTimelineStatus(),
          budgetStatus: eng?.budgetStatus || eng?.financialStatus || 'Unknown',
          overallProgress: eng?.overallProgress ?? eng?.progress ?? eng?.completionPercentage ?? 0,
          budgetUsedPercentage: eng?.budgetUsedPercentage ?? eng?.budgetUsed ?? 0,
          project: mappedProject,
          milestones: eng?.milestones || projectFromEng?.milestones || eng?.timeline || [],
          urgentTasks: eng?.urgentTasks || eng?.overdueTasks || [],
          relatedProjects: eng?.relatedProjects || eng?.projectList || [],
          engineering: eng,
        };

        return mapped;
      } catch (e) {
        throw e;
      }
    }

    throw err;
  }
};

export const getOperationsDashboard = async (params?: Record<string, any>) => {
  // Prefer project-service operations dashboard if available; fallback to engineering-service
  let eng: any = null;
  try {
    const respProject = await projectApi.get('/operations', { params });
    eng = respProject.data?.data ?? respProject.data ?? respProject;
  } catch (err: any) {
    const status = err?.response?.status;
    // If forbidden, bubble up so frontend can show proper message
    if (status === 403) throw err;

    // fallback to engineering for other errors (not found / unsupported)
    const resp = await engineeringApi.get('/dashboards/engineering', { params });
    eng = resp.data?.data ?? resp.data ?? resp;
  }

  // If the project-service already returned the operations dashboard in the
  // expected shape, return it directly. Otherwise, map engineering-service
  // response into the frontend expected shape.
  // Heuristic: project-service returns keys like `totalActiveProjects` or `projectList`.
  if (eng && (typeof eng.totalActiveProjects !== 'undefined' || typeof eng.projectList !== 'undefined')) {
    return eng;
  }

  // Map engineering-service response to frontend shape
  const totalActiveProjects = eng?.projects?.length ?? eng?.volumeMetrics?.completedEstimations ?? 0;
  const totalContractValue = eng?.totalContractValue ?? 0;
  const averageMargin = eng?.averageMargin ?? 0;

  // Portfolio health: derive simple buckets from statusDistribution if available
  const sd = eng?.statusDistribution || eng?.raw?.statusDistribution || [];
  const onTrack = sd.find((s:any) => /ON_TRACK|ONTRACK|on track/i.test(String(s.status)))?.count || 0;
  const atRisk = sd.find((s:any) => /RISK|AT_RISK|at risk/i.test(String(s.status)))?.count || 0;
  const overdue = sd.find((s:any) => /OVERDUE|overdue/i.test(String(s.status)))?.count || 0;

  const teamUtilization = (eng?.teamUtilization || eng?.workloadMetrics?.details || []).map((d:any) => ({ assigneeName: d.assigneeName || d.engineerName || d.engineerId || 'Unknown', value: d.count || d.hours || d.value || 0 }));

  // Normalization helpers to adapt various backend shapes
  const normalizeNumber = (v: any) => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const parsed = Number(v);
    return isNaN(parsed) ? 0 : parsed;
  };

  const normalizeProject = (p: any) => {
    if (!p) return p;
    // Build aliases so Project Workspace components find the same fields
    const projectNumber = p.project_number || p.projectNo || p.project_no || p.number || p.code || null;
    const projectName = p.project_name || p.name || p.title || p.nama || '';
    const customerObj =
      p.customer ||
      (p.client ? { customer_name: p.client } : p.customer_name ? { customer_name: p.customer_name } : null);
    const salesOrders = p.sales_orders || p.salesOrders || (p.contract_value ? [{ contract_value: p.contract_value }] : null);

    return {
      // canonical ids
      id: p.id || p.projectId || p.project_id || p._id || String(p.id || p.projectId || p.project_id || p._id || ''),
      project_number: projectNumber,
      project_name: projectName,
      // keep legacy fields mapped
      name: projectName,
      customer: customerObj,
      pm_user: p.pm_user || p.project_manager || p.pm || null,
      // include sales_orders and contract_value so ProjectsListPage can compute contract value
      sales_orders: salesOrders,
      contract_value: p.contract_value || (Array.isArray(salesOrders) && salesOrders[0]?.contract_value) || 0,
      // metrics
      progress: normalizeNumber(p.progress) || normalizeNumber(p.percentage) || 0,
      margin: normalizeNumber(p.margin) || normalizeNumber(p.averageMargin) || 0,
      status: p.status || p.state || null,
      timelineStatus: p.timelineStatus || p.scheduleStatus || null,
      raw: p,
    };
  };

  const mapped = {
    totalActiveProjects: normalizeNumber(totalActiveProjects),
    totalContractValue: normalizeNumber(totalContractValue),
    averageMargin: normalizeNumber(averageMargin),
    portfolioHealth: { onTrack, atRisk, overdue },
    vendorPerformance: eng?.vendorPerformance || eng?.vendors || [],
    projectList: (eng?.projects || eng?.projectList || []).map(normalizeProject),
    teamUtilization,
    raw: eng,
  };

  // If projectList exists but projects don't include `customer`, try
  // fetching projects via the normal `projectApi` client so frontend can
  // render `customer.customer_name` the same way as Project list page.
  try {
    const list = mapped.projectList || [];
    const missingCustomer = list.length > 0 && list.every((p: any) => !p.customer);
    // Always prefer canonical projects from project-service when possible so
    // the UI shows identical fields as Project Workspace. Use provided status
    // filter if present in params.
    try {
      const statusParam = params?.status || (params && params.period ? undefined : undefined);
      const fallbackProjects = await projectsClient.getProjects(statusParam ? { status: statusParam } : undefined);
      if (Array.isArray(fallbackProjects) && fallbackProjects.length > 0) {
        // Normalize canonical projects into the same shape used by dashboard
        mapped.projectList = fallbackProjects.map(normalizeProject);
      } else if (missingCustomer) {
        // If canonical request returned empty but original mapped list lacked customer,
        // keep original mapped list so UI still shows something.
      }
    } catch (e) {
      // ignore fallback errors and keep original mapped list
    }
  } catch (e) {
    // ignore
  }

  return mapped;
};

export default { projectApi, engineeringApi };
