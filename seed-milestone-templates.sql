-- Insert sample milestone templates
INSERT INTO milestone_templates (template_name, project_type, milestones) VALUES
(
  'Standard Construction Project',
  'Construction',
  '[
    {"name": "Project Initiation", "duration_days": 7, "status": "PLANNED"},
    {"name": "Design & Planning", "duration_days": 14, "status": "PLANNED"},
    {"name": "Procurement", "duration_days": 21, "status": "PLANNED"},
    {"name": "Construction Phase 1", "duration_days": 30, "status": "PLANNED"},
    {"name": "Construction Phase 2", "duration_days": 30, "status": "PLANNED"},
    {"name": "Testing & Commissioning", "duration_days": 14, "status": "PLANNED"},
    {"name": "Project Handover", "duration_days": 7, "status": "PLANNED"}
  ]'::json
),
(
  'IT System Implementation',
  'IT',
  '[
    {"name": "Requirements Gathering", "duration_days": 7, "status": "PLANNED"},
    {"name": "System Design", "duration_days": 14, "status": "PLANNED"},
    {"name": "Development", "duration_days": 45, "status": "PLANNED"},
    {"name": "Testing & QA", "duration_days": 14, "status": "PLANNED"},
    {"name": "User Training", "duration_days": 7, "status": "PLANNED"},
    {"name": "Go-Live & Support", "duration_days": 7, "status": "PLANNED"}
  ]'::json
),
(
  'Engineering Services Project',
  'Engineering',
  '[
    {"name": "Site Survey & Assessment", "duration_days": 5, "status": "PLANNED"},
    {"name": "Engineering Design", "duration_days": 21, "status": "PLANNED"},
    {"name": "Material Procurement", "duration_days": 14, "status": "PLANNED"},
    {"name": "Installation", "duration_days": 30, "status": "PLANNED"},
    {"name": "Testing & Integration", "duration_days": 10, "status": "PLANNED"},
    {"name": "Documentation & Training", "duration_days": 5, "status": "PLANNED"},
    {"name": "Final Acceptance", "duration_days": 3, "status": "PLANNED"}
  ]'::json
)
ON CONFLICT (template_name) DO NOTHING;
