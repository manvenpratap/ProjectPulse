import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

// Note: In this environment, we might need to use require if types are messy or just standard imports
// Since we are running with tsx, imports should work.

async function generate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse';
  wb.created = new Date();

  // Dashboard
  const ds = wb.addWorksheet('Dashboard');
  ds.columns = [{ header: 'Metric', key: 'm', width: 25 }, { header: 'Value', key: 'v', width: 40 }];
  ds.addRow({ m: 'Project Name', v: 'DEMO: NexGen Platform Evolution' });
  ds.addRow({ m: 'Description', v: 'Demonstration project showcasing all features including dependencies, subtasks, and custom attributes.' });

  // Tasks
  const ts = wb.addWorksheet('Tasks');
  ts.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Task Name', key: 'name', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Progress', key: 'progress', width: 10 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Dependencies', key: 'dependsOn', width: 25 },
    { header: 'Effort (d)', key: 'estDays', width: 12 },
  ];

  const demoTasks = [
    ['TASK-001', 'Architectural Blueprint', 'Completed', 'Critical', 'Sarah Chen', '2026-05-01', '100%', 'Core', '', 5],
    ['TASK-002', 'Database Schema Design', 'Completed', 'High', 'Sarah Chen', '2026-05-05', '100%', 'Core', 'TASK-001', 3],
    ['TASK-003', 'Auth Service Implementation', 'In Progress', 'High', 'Naomi Nagata', '2026-06-15', '45%', 'Identity', 'TASK-002', 8],
    ['TASK-004', 'Frontend Desktop Layout', 'In Progress', 'Medium', 'Marcus Wong', '2026-06-20', '60%', 'UI', '', 4.5],
    ['TASK-005', 'Mobile Responsive Refactor', 'Not Started', 'Medium', 'Marcus Wong', '2026-07-10', '0%', 'UI', 'TASK-004', 6],
    ['TASK-006', 'API Gateway Integration', 'Blocked', 'High', 'Naomi Nagata', '2026-06-30', '0%', 'Core', 'TASK-003, TASK-007', 4],
    ['TASK-007', 'Cloud Infrastructure (AWS)', 'Completed', 'Critical', 'James Holden', '2026-05-10', '100%', 'DevOps', '', 3],
    ['TASK-008', 'CI/CD Pipeline Setup', 'In Progress', 'High', 'James Holden', '2026-06-05', '80%', 'DevOps', 'TASK-007', 7],
  ];

  demoTasks.forEach(t => ts.addRow(t));

  // Styling
  [ds, ts].forEach(sheet => {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  });

  const distDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const filePath = path.join(distDir, 'demo-data.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Successfully generated demo data at: ${filePath}`);
}

generate().catch(console.error);
