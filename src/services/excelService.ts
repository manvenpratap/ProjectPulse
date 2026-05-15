import ExcelJS from 'exceljs';
import { ProjectState, Task, TaskStatus } from '../types';
import { fmtDate } from '../utils/projectUtils';

export const exportProjectExcel = async (state: ProjectState) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse';
  wb.lastModifiedBy = 'ProjectPulse';
  wb.created = new Date();
  wb.modified = new Date();

  // 1. Executive Dashboard (Summary)
  const ds = wb.addWorksheet('Dashboard');
  ds.columns = [{ header: 'Metric', key: 'm', width: 25 }, { header: 'Value', key: 'v', width: 20 }];
  ds.addRow({ m: 'Project Name', v: state.name });
  ds.addRow({ m: 'Total Tasks', v: state.tasks.length });
  ds.addRow({ m: 'Completed', v: state.tasks.filter(t => t.status === TaskStatus.COMPLETED).length });
  ds.addRow({ m: 'Defects', v: state.defects.length });

  // 2. Tasks Sheet
  const ts = wb.addWorksheet('Tasks');
  ts.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Task Name', key: 'name', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Progress', key: 'progress', width: 10 },
    { header: 'Module', key: 'module', width: 20 },
  ];

  state.tasks.forEach(t => {
    ts.addRow({ 
      id: t.id, 
      name: t.name, 
      status: t.status, 
      priority: t.priority, 
      assignee: t.assignee, 
      dueDate: t.dueDate, 
      progress: t.progress + '%',
      module: t.module
    });
  });

  // Style headers
  [ds, ts].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'FF4F46E5' } 
    };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });

  // Generate buffer and trigger download
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ProjectPulse_${state.name || 'Project'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
