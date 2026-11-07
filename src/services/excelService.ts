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
  ds.columns = [{ header: 'Metric', key: 'm', width: 30 }, { header: 'Value', key: 'v', width: 35 }];
  ds.addRow({ m: 'Project Name', v: state.name });
  ds.addRow({ m: 'Project Description', v: state.desc || 'N/A' });
  ds.addRow({ m: 'Total Tasks', v: state.tasks.length });
  ds.addRow({ m: 'Completed Tasks', v: state.tasks.filter(t => t.status === TaskStatus.COMPLETED).length });
  ds.addRow({ m: 'Total Defects Registered', v: state.defects.length });
  ds.addRow({ m: 'Active RAID Items', v: state.raids.length });
  ds.addRow({ m: 'Business Decisions Signed-off', v: state.decisions.length });
  ds.addRow({ m: 'Team Capacity count', v: state.members.length });

  // 2. Tasks Sheet
  const ts = wb.addWorksheet('Tasks');
  ts.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Task Name', key: 'name', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Dependencies', key: 'dependsOn', width: 25 },
    { header: 'Effort (d)', key: 'estDays', width: 12 },
  ];

  state.tasks.forEach(t => {
    ts.addRow({ 
      id: t.id, 
      name: t.name, 
      status: t.status, 
      priority: t.priority, 
      assignee: t.assignee, 
      dueDate: t.dueDate, 
      progress: (t.progress || 0) + '%',
      module: t.module,
      dependsOn: t.dependsOn?.join(', ') || '',
      estDays: t.estDays || 0
    });
  });

  // 3. RAID Sheet
  const rs = wb.addWorksheet('RAID Items');
  rs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Description', key: 'desc', width: 45 },
    { header: 'Impact', key: 'impact', width: 12 },
    { header: 'Probability', key: 'probability', width: 15 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Owner', key: 'owner', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Mitigation Plan', key: 'mitigation', width: 45 },
  ];

  (state.raids || []).forEach(r => {
    rs.addRow({
      id: r.id,
      type: r.type,
      title: r.title,
      desc: r.desc,
      impact: r.impact,
      probability: r.probability || 'N/A',
      severity: r.severity || 'N/A',
      owner: r.owner,
      dueDate: r.dueDate,
      status: r.status,
      mitigation: r.mitigation
    });
  });

  // 4. Defects Sheet
  const dfs = wb.addWorksheet('Defects');
  dfs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Severity', key: 'severity', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Linked To', key: 'linkedType', width: 12 },
    { header: 'Linked ID', key: 'linkedId', width: 15 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Reporter', key: 'reporter', width: 20 },
    { header: 'Description', key: 'desc', width: 40 },
  ];

  (state.defects || []).forEach(d => {
    dfs.addRow({
      id: d.id,
      title: d.title,
      type: d.type,
      severity: d.severity,
      priority: d.priority,
      status: d.status,
      linkedType: d.linkedType,
      linkedId: d.linkedId,
      assignee: d.assignee,
      reporter: d.reporter,
      desc: d.desc
    });
  });

  // 5. Decisions Sheet
  const decs = wb.addWorksheet('Decisions');
  decs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Description', key: 'desc', width: 40 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Impact', key: 'impact', width: 15 },
    { header: 'Approver', key: 'approver', width: 20 },
    { header: 'Proposed By', key: 'proposedBy', width: 20 },
    { header: 'Rationale', key: 'rationale', width: 40 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
  ];

  (state.decisions || []).forEach(d => {
    decs.addRow({
      id: d.id,
      title: d.title,
      desc: d.desc,
      status: d.status,
      impact: d.impact,
      approver: d.approver,
      proposedBy: d.proposedBy,
      rationale: d.rationale,
      dueDate: d.dueDate
    });
  });

  // 6. Logs Sheet
  const ls = wb.addWorksheet('Activity Logs');
  ls.columns = [
    { header: 'Timestamp', key: 'ts', width: 22 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Assignee', key: 'assignee', width: 15 },
    { header: 'Task ID', key: 'taskId', width: 12 },
    { header: 'Task Name', key: 'taskName', width: 35 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Modified Field', key: 'field', width: 15 },
    { header: 'Old Value', key: 'oldVal', width: 15 },
    { header: 'New Value', key: 'newVal', width: 15 },
    { header: 'Comment', key: 'comment', width: 40 },
  ];

  (state.log || []).forEach(l => {
    ls.addRow({
      ts: l.ts,
      action: l.action,
      assignee: l.assignee,
      taskId: l.taskId,
      taskName: l.taskName,
      module: l.module,
      field: l.field,
      oldVal: l.oldVal,
      newVal: l.newVal,
      comment: l.comment
    });
  });

  // Style headers on all worksheets
  [ds, ts, rs, dfs, decs, ls].forEach(sheet => {
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

export const importProjectExcel = async (file: File): Promise<Partial<ProjectState>> => {
  const wb = new ExcelJS.Workbook();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        await wb.xlsx.load(buffer);
        
        const tasksSheet = wb.getWorksheet('Tasks');
        if (!tasksSheet) throw new Error('Invalid Excel format: "Tasks" sheet missing');

        const tasks: any[] = [];
        tasksSheet.eachRow((row, i) => {
          if (i === 1) return; // Skip header
          const t: any = {
            id: row.getCell(1).text,
            name: row.getCell(2).text,
            status: row.getCell(3).text,
            priority: row.getCell(4).text,
            assignee: row.getCell(5).text,
            dueDate: row.getCell(6).text,
            progress: parseInt(row.getCell(7).text.replace('%', '')) || 0,
            module: row.getCell(8).text,
            dependsOn: row.getCell(9).text ? row.getCell(9).text.split(',').map((s: string) => s.trim()) : [],
            estDays: parseFloat(row.getCell(10).text) || 0,
            // Defaulting others
            category: 'Feature',
            startDate: new Date().toISOString().split('T')[0],
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          tasks.push(t);
        });

        const dashboardSheet = wb.getWorksheet('Dashboard');
        const projectName = dashboardSheet?.getRow(2).getCell(2).text || 'Imported Project';

        resolve({
          name: projectName,
          tasks,
          log: [{ 
            ts: new Date().toISOString(), 
            action: 'Imported from Excel', 
            taskId: 'SYSTEM', 
            taskName: 'Excel Import', 
            module: 'System', 
            assignee: 'User',
            field: '',
            oldVal: '',
            newVal: '',
            comment: 'Batch import from spreadsheet'
          }]
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
