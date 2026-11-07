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

  // 3. Deliveries Sheet (ALM / PDN Release Workstation)
  const dels = wb.addWorksheet('Deliveries');
  dels.columns = [
    { header: 'Delivery ID', key: 'id', width: 14 },
    { header: 'ALM Defect ID', key: 'almId', width: 16 },
    { header: 'Description - ALM Description', key: 'name', width: 42 },
    { header: 'PDN Reference', key: 'pdn', width: 18 },
    { header: 'PDN Processing Date', key: 'pdnProcessingDate', width: 18 },
    { header: 'Components Delivered', key: 'componentsDelivered', width: 32 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Module Type', key: 'moduleType', width: 14 },
    { header: 'Release Version', key: 'releaseVersion', width: 16 },
    { header: 'Target Environment', key: 'environment', width: 16 },
    { header: 'ALM Status', key: 'almStatus', width: 16 },
    { header: 'Deployment Status', key: 'status', width: 20 },
    { header: 'Sign-off Status', key: 'signOffStatus', width: 16 },
    { header: 'Approver', key: 'approver', width: 20 },
    { header: 'Smoke Test Status', key: 'smokeTestStatus', width: 16 },
    { header: 'Reporter', key: 'reportedBy', width: 18 },
    { header: 'Developer / Fixed By', key: 'fixedBy', width: 20 },
    { header: 'Target Delivery Date', key: 'targetDeliveryDate', width: 18 },
    { header: 'Actual Delivery Date', key: 'actualDeliveryDate', width: 18 },
    { header: 'Lead Time (d)', key: 'leadTimeDays', width: 14 },
    { header: 'Delay Variance (d)', key: 'variance', width: 16 },
    { header: 'Linked Type', key: 'linkedType', width: 14 },
    { header: 'Linked ID / Scope', key: 'linkedId', width: 28 },
    { header: 'Linked Tasks', key: 'linkedTasks', width: 22 },
    { header: 'Linked Screens', key: 'linkedScreens', width: 22 },
    { header: 'Rollback Plan', key: 'rollbackPlan', width: 35 },
    { header: 'Notes', key: 'notes', width: 35 },
  ];

  (state.deliveries || []).forEach(d => {
    dels.addRow({
      id: d.id,
      almId: d.almId,
      name: d.name,
      pdn: d.pdn,
      pdnProcessingDate: d.pdnProcessingDate,
      componentsDelivered: d.componentsDelivered,
      category: d.category,
      module: d.module,
      moduleType: d.moduleType,
      releaseVersion: d.releaseVersion,
      environment: d.environment,
      almStatus: d.almStatus,
      status: d.status,
      signOffStatus: d.signOffStatus,
      approver: d.approver,
      smokeTestStatus: d.smokeTestStatus,
      reportedBy: d.reportedBy,
      fixedBy: d.fixedBy,
      targetDeliveryDate: d.targetDeliveryDate,
      actualDeliveryDate: d.actualDeliveryDate || '',
      leadTimeDays: d.leadTimeDays || 0,
      variance: d.variance || 0,
      linkedType: d.linkedType,
      linkedId: d.linkedId,
      linkedTasks: d.linkedTasks?.join(', ') || '',
      linkedScreens: d.linkedScreens?.join(', ') || '',
      rollbackPlan: d.rollbackPlan || '',
      notes: d.notes || ''
    });
  });

  // 4. RAID Sheet
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

  // 5. Defects Sheet
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

  // 6. Decisions Sheet
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

  // 7. Team Members Sheet
  const tms = wb.addWorksheet('Team Members');
  tms.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Role', key: 'role', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Reports To', key: 'reportsTo', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
  ];

  (state.members || []).forEach(m => {
    tms.addRow({
      id: m.id,
      name: m.name,
      role: m.role,
      status: m.status,
      reportsTo: m.reportsTo,
      email: m.email,
      phone: m.phone
    });
  });

  // 8. Releases Sheet
  const rels = wb.addWorksheet('Releases');
  rels.columns = [
    { header: 'Release ID', key: 'id', width: 14 },
    { header: 'Release Version', key: 'name', width: 20 },
    { header: 'Start Date', key: 'startDate', width: 16 },
    { header: 'Target Date', key: 'date', width: 16 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  (state.releases || []).forEach(rel => {
    rels.addRow({
      id: rel.id,
      name: rel.name,
      startDate: rel.startDate,
      date: rel.date,
      status: rel.status
    });
  });

  // 9. Activity Logs Sheet
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
  [ds, ts, dels, rs, dfs, decs, tms, rels, ls].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'FF0D0D0F' } 
    };
    sheet.getRow(1).font = { color: { argb: 'FF38BDF8' }, bold: true };
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
            category: 'Feature',
            startDate: new Date().toISOString().split('T')[0],
            subtasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          tasks.push(t);
        });

        // Parse Deliveries Sheet if present
        const deliveriesSheet = wb.getWorksheet('Deliveries');
        const deliveries: any[] = [];
        if (deliveriesSheet) {
          deliveriesSheet.eachRow((row, i) => {
            if (i === 1) return; // Skip header
            const d: any = {
              id: row.getCell(1).text,
              almId: row.getCell(2).text,
              name: row.getCell(3).text,
              pdn: row.getCell(4).text,
              pdnProcessingDate: row.getCell(5).text,
              componentsDelivered: row.getCell(6).text,
              category: row.getCell(7).text,
              module: row.getCell(8).text,
              moduleType: row.getCell(9).text || 'Server',
              releaseVersion: row.getCell(10).text || 'v1.1.0',
              environment: row.getCell(11).text || 'QA',
              almStatus: row.getCell(12).text || 'New',
              status: row.getCell(13).text || 'Scheduled',
              signOffStatus: row.getCell(14).text || 'Pending',
              approver: row.getCell(15).text || '',
              smokeTestStatus: row.getCell(16).text || 'Not Run',
              reportedBy: row.getCell(17).text || '',
              fixedBy: row.getCell(18).text || '',
              targetDeliveryDate: row.getCell(19).text || '',
              actualDeliveryDate: row.getCell(20).text || null,
              leadTimeDays: parseFloat(row.getCell(21).text) || 0,
              variance: parseFloat(row.getCell(22).text) || 0,
              linkedType: row.getCell(23).text || 'None',
              linkedId: row.getCell(24).text || '',
              linkedTasks: row.getCell(25).text ? row.getCell(25).text.split(',').map((s: string) => s.trim()) : [],
              linkedScreens: row.getCell(26).text ? row.getCell(26).text.split(',').map((s: string) => s.trim()) : [],
              rollbackPlan: row.getCell(27).text || '',
              notes: row.getCell(28).text || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            if (d.name) deliveries.push(d);
          });
        }

        const dashboardSheet = wb.getWorksheet('Dashboard');
        const projectName = dashboardSheet?.getRow(2).getCell(2).text || 'Imported Project';

        resolve({
          name: projectName,
          tasks,
          deliveries: deliveries.length > 0 ? deliveries : undefined,
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
            comment: `Batch import from spreadsheet (${tasks.length} tasks, ${deliveries.length} deliveries)`
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
