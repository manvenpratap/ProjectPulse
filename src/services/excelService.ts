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
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Module Type', key: 'moduleType', width: 14 },
    { header: 'Release', key: 'release', width: 14 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'Actual Completion Date', key: 'actCompletionDate', width: 18 },
    { header: 'Actual Effort (d)', key: 'actDays', width: 14 },
    { header: 'GUI Screens', key: 'guiScreens', width: 25 },
    { header: 'Notes', key: 'notes', width: 35 },
    { header: 'Subtasks', key: 'subtasks', width: 40 },
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
      estDays: t.estDays || 0,
      category: t.category || 'Feature',
      moduleType: t.moduleType || 'Server',
      release: t.release || 'v1.0.0',
      startDate: t.startDate || '',
      actCompletionDate: t.actCompletionDate || '',
      actDays: t.actDays || 0,
      guiScreens: t.guiScreens?.join(', ') || '',
      notes: t.notes || '',
      subtasks: t.subtasks && t.subtasks.length > 0 ? JSON.stringify(t.subtasks) : ''
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
    { header: 'Reproduction Steps', key: 'steps', width: 40 },
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
      desc: d.desc,
      steps: d.steps || ''
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
    { header: 'Emp ID', key: 'empId', width: 14 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Birthday', key: 'birthday', width: 14 },
    { header: 'Skills', key: 'skills', width: 35 },
    { header: 'Join Date', key: 'joinDate', width: 14 },
  ];

  (state.members || []).forEach(m => {
    tms.addRow({
      id: m.id,
      name: m.name,
      role: m.role,
      status: m.status,
      reportsTo: m.reportsTo,
      email: m.email,
      phone: m.phone,
      empId: m.empId || '',
      location: m.location || '',
      birthday: m.birthday || '',
      skills: m.skills?.join(', ') || '',
      joinDate: m.joinDate || ''
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

  // 9. Sprint Retros Sheet
  const rts = wb.addWorksheet('Retros');
  rts.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Title', key: 'title', width: 35 },
    { header: 'Description', key: 'desc', width: 45 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Target Sprint', key: 'targetSprint', width: 16 },
    { header: 'Votes', key: 'votes', width: 10 },
    { header: 'Created Date', key: 'createdAt', width: 15 },
  ];

  (state.retros || []).forEach(r => {
    rts.addRow({
      id: r.id,
      category: r.category,
      title: r.title,
      desc: r.desc,
      author: r.author,
      assignedTo: r.assignedTo || '',
      status: r.status || '',
      targetSprint: r.targetSprint || '',
      votes: r.votes || 0,
      createdAt: r.createdAt || ''
    });
  });

  // 10. Features Sheet (Architecture / Functional Matrix)
  const fts = wb.addWorksheet('Features');
  fts.columns = [
    { header: 'Feature Name', key: 'name', width: 25 },
    { header: 'Screens', key: 'screens', width: 35 },
    { header: 'Description', key: 'desc', width: 45 },
  ];

  (state.features || []).forEach(f => {
    fts.addRow({
      name: f.name,
      screens: f.screens?.join(', ') || '',
      desc: f.desc || ''
    });
  });

  // 11. Activity Logs Sheet
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
  [ds, ts, dels, rs, dfs, decs, tms, rels, rts, fts, ls].forEach(sheet => {
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

export const importProjectExcel = async (fileOrBuffer: File | Blob | ArrayBuffer): Promise<Partial<ProjectState>> => {
  const wb = new ExcelJS.Workbook();
  let buffer: ArrayBuffer;

  if (fileOrBuffer instanceof ArrayBuffer) {
    buffer = fileOrBuffer;
  } else if (typeof (fileOrBuffer as any).arrayBuffer === 'function') {
    buffer = await (fileOrBuffer as Blob).arrayBuffer();
  } else {
    buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(fileOrBuffer as Blob);
    });
  }

  await wb.xlsx.load(buffer);
  
  const tasksSheet = wb.getWorksheet('Tasks');
  if (!tasksSheet) throw new Error('Invalid Excel format: "Tasks" sheet missing');

  const tasks: any[] = [];
  tasksSheet.eachRow((row, i) => {
    if (i === 1) return; // Skip header
    const rawSubtasks = row.getCell(19).text;
    let parsedSubtasks: any[] = [];
    if (rawSubtasks) {
      try {
        if (rawSubtasks.trim().startsWith('[')) {
          parsedSubtasks = JSON.parse(rawSubtasks);
        }
      } catch (e) {
        parsedSubtasks = [];
      }
    }

    const t: any = {
      id: row.getCell(1).text || `TASK-${String(tasks.length + 1).padStart(3, '0')}`,
      name: row.getCell(2).text,
      status: row.getCell(3).text || 'Not Started',
      priority: row.getCell(4).text || 'Medium',
      assignee: row.getCell(5).text || 'Unassigned',
      dueDate: row.getCell(6).text || '',
      progress: parseInt(row.getCell(7).text.replace('%', '')) || 0,
      module: row.getCell(8).text || 'General',
      dependsOn: row.getCell(9).text ? row.getCell(9).text.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      estDays: parseFloat(row.getCell(10).text) || 1,
      category: row.getCell(11).text || 'Feature',
      moduleType: row.getCell(12).text || 'Server',
      release: row.getCell(13).text || 'v1.0.0',
      startDate: row.getCell(14).text || new Date().toISOString().split('T')[0],
      actCompletionDate: row.getCell(15).text || undefined,
      actDays: parseFloat(row.getCell(16).text) || undefined,
      guiScreens: row.getCell(17).text ? row.getCell(17).text.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      notes: row.getCell(18).text || '',
      subtasks: parsedSubtasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (t.name) tasks.push(t);
  });

  // Parse Deliveries Sheet if present
  const deliveriesSheet = wb.getWorksheet('Deliveries');
  const deliveries: any[] = [];
  if (deliveriesSheet) {
    deliveriesSheet.eachRow((row, i) => {
      if (i === 1) return; // Skip header
      const d: any = {
        id: row.getCell(1).text || `DEL-${String(deliveries.length + 1).padStart(3, '0')}`,
        almId: row.getCell(2).text || '',
        name: row.getCell(3).text,
        pdn: row.getCell(4).text || '',
        pdnProcessingDate: row.getCell(5).text || '',
        componentsDelivered: row.getCell(6).text || '',
        category: row.getCell(7).text || 'Feature Release',
        module: row.getCell(8).text || 'General',
        moduleType: row.getCell(9).text || 'Server',
        releaseVersion: row.getCell(10).text || 'v1.0.0',
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
        linkedTasks: row.getCell(25).text ? row.getCell(25).text.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        linkedScreens: row.getCell(26).text ? row.getCell(26).text.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        rollbackPlan: row.getCell(27).text || '',
        notes: row.getCell(28).text || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (d.name) deliveries.push(d);
    });
  }

  // Parse RAID Items Sheet if present
  const raidSheet = wb.getWorksheet('RAID Items') || wb.getWorksheet('RAID');
  const raids: any[] = [];
  if (raidSheet) {
    raidSheet.eachRow((row, i) => {
      if (i === 1) return;
      const r: any = {
        id: row.getCell(1).text || `RAID-${raids.length + 1}`,
        type: row.getCell(2).text || 'Risk',
        title: row.getCell(3).text || 'Untitled Item',
        desc: row.getCell(4).text || '',
        impact: row.getCell(5).text || 'Medium',
        probability: row.getCell(6).text || 'Medium',
        severity: row.getCell(7).text || 'Medium',
        owner: row.getCell(8).text || '',
        dueDate: row.getCell(9).text || '',
        status: row.getCell(10).text || 'Active',
        mitigation: row.getCell(11).text || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (r.title) raids.push(r);
    });
  }

  // Parse Defects Sheet if present
  const defectSheet = wb.getWorksheet('Defects');
  const defects: any[] = [];
  if (defectSheet) {
    defectSheet.eachRow((row, i) => {
      if (i === 1) return;
      const df: any = {
        id: row.getCell(1).text || `DEF-${defects.length + 1}`,
        title: row.getCell(2).text || 'Untitled Defect',
        type: row.getCell(3).text || 'Functional Bug',
        severity: row.getCell(4).text || 'S3 - Medium',
        priority: row.getCell(5).text || 'Medium',
        status: row.getCell(6).text || 'New',
        linkedType: row.getCell(7).text || 'Task',
        linkedId: row.getCell(8).text || '',
        assignee: row.getCell(9).text || '',
        reporter: row.getCell(10).text || '',
        desc: row.getCell(11).text || '',
        steps: row.getCell(12).text || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (df.title) defects.push(df);
    });
  }

  // Parse Decisions Sheet if present
  const decSheet = wb.getWorksheet('Decisions');
  const decisions: any[] = [];
  if (decSheet) {
    decSheet.eachRow((row, i) => {
      if (i === 1) return;
      const dc: any = {
        id: row.getCell(1).text || `DEC-${decisions.length + 1}`,
        title: row.getCell(2).text || 'Untitled Decision',
        desc: row.getCell(3).text || '',
        status: row.getCell(4).text || 'Pending Sign-off',
        impact: row.getCell(5).text || 'Medium',
        approver: row.getCell(6).text || '',
        proposedBy: row.getCell(7).text || '',
        rationale: row.getCell(8).text || '',
        dueDate: row.getCell(9).text || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (dc.title) decisions.push(dc);
    });
  }

  // Parse Team Members Sheet if present
  const memSheet = wb.getWorksheet('Team Members') || wb.getWorksheet('Members');
  const members: any[] = [];
  if (memSheet) {
    memSheet.eachRow((row, i) => {
      if (i === 1) return;
      const rawSkills = row.getCell(11).text;
      const skills = rawSkills ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

      const m: any = {
        id: row.getCell(1).text || `MEM-${String(members.length + 1).padStart(3, '0')}`,
        name: row.getCell(2).text || 'Team Member',
        role: row.getCell(3).text || 'Developer',
        status: row.getCell(4).text || 'Active',
        reportsTo: row.getCell(5).text || '',
        email: row.getCell(6).text || '',
        phone: row.getCell(7).text || '',
        empId: row.getCell(8).text || '',
        location: row.getCell(9).text || '',
        birthday: row.getCell(10).text || '',
        skills: skills.length > 0 ? skills : ['Generalist'],
        joinDate: row.getCell(12).text || '',
        plannedLeaves: []
      };
      if (m.name) members.push(m);
    });
  }

  // Parse Releases Sheet if present
  const relSheet = wb.getWorksheet('Releases');
  const releases: any[] = [];
  if (relSheet) {
    relSheet.eachRow((row, i) => {
      if (i === 1) return;
      const rl: any = {
        id: row.getCell(1).text || `rel-${releases.length + 1}`,
        name: row.getCell(2).text || 'v1.0.0',
        startDate: row.getCell(3).text || '',
        date: row.getCell(4).text || '',
        status: row.getCell(5).text || 'Planned'
      };
      if (rl.name) releases.push(rl);
    });
  }

  // Parse Retros Sheet if present
  const retroSheet = wb.getWorksheet('Retros') || wb.getWorksheet('Sprint Retros');
  const retros: any[] = [];
  if (retroSheet) {
    retroSheet.eachRow((row, i) => {
      if (i === 1) return;
      const r: any = {
        id: row.getCell(1).text || `RETRO-${String(retros.length + 1).padStart(2, '0')}`,
        category: row.getCell(2).text || 'went_well',
        title: row.getCell(3).text || 'Untitled Item',
        desc: row.getCell(4).text || '',
        author: row.getCell(5).text || 'Anonymous',
        assignedTo: row.getCell(6).text || undefined,
        status: row.getCell(7).text || undefined,
        targetSprint: row.getCell(8).text || undefined,
        votes: parseInt(row.getCell(9).text) || 0,
        createdAt: row.getCell(10).text || new Date().toISOString()
      };
      if (r.title) retros.push(r);
    });
  }

  // Parse Features Sheet if present
  const featSheet = wb.getWorksheet('Features') || wb.getWorksheet('Functional Matrix');
  const features: any[] = [];
  if (featSheet) {
    featSheet.eachRow((row, i) => {
      if (i === 1) return;
      const scRaw = row.getCell(2).text;
      const screens = scRaw ? scRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const feat: any = {
        name: row.getCell(1).text || 'Feature',
        screens,
        desc: row.getCell(3).text || ''
      };
      if (feat.name) features.push(feat);
    });
  }

  // Parse Activity Logs Sheet if present
  const logSheet = wb.getWorksheet('Activity Logs') || wb.getWorksheet('Logs');
  const logEntries: any[] = [];
  if (logSheet) {
    logSheet.eachRow((row, i) => {
      if (i === 1) return;
      const l: any = {
        ts: row.getCell(1).text || new Date().toISOString(),
        action: row.getCell(2).text || 'System Update',
        assignee: row.getCell(3).text || 'User',
        taskId: row.getCell(4).text || '',
        taskName: row.getCell(5).text || '',
        module: row.getCell(6).text || 'General',
        field: row.getCell(7).text || '',
        oldVal: row.getCell(8).text || '',
        newVal: row.getCell(9).text || '',
        comment: row.getCell(10).text || ''
      };
      logEntries.push(l);
    });
  }

  const dashboardSheet = wb.getWorksheet('Dashboard');
  let projectName = 'Imported Project';
  let projectDesc = '';
  if (dashboardSheet) {
    dashboardSheet.eachRow((row) => {
      const label = row.getCell(1).text.toLowerCase().trim();
      if (label.includes('project name')) {
        projectName = row.getCell(2).text || projectName;
      } else if (label.includes('description')) {
        projectDesc = row.getCell(2).text || projectDesc;
      }
    });
  }

  return {
    name: projectName,
    desc: projectDesc,
    tasks,
    deliveries: deliveries.length > 0 ? deliveries : [],
    raids: raids.length > 0 ? raids : [],
    defects: defects.length > 0 ? defects : [],
    decisions: decisions.length > 0 ? decisions : [],
    members: members.length > 0 ? members : [],
    releases: releases.length > 0 ? releases : [],
    retros: retros.length > 0 ? retros : [],
    features: features.length > 0 ? features : [],
    log: logEntries.length > 0 ? logEntries : [{ 
      ts: new Date().toISOString(), 
      action: 'Imported from Excel', 
      taskId: 'SYSTEM', 
      taskName: 'Excel Import', 
      module: 'System', 
      assignee: 'User',
      field: '',
      oldVal: '',
      newVal: '',
      comment: `Relational import from workbook: ${tasks.length} tasks, ${deliveries.length} deliveries, ${raids.length} RAID, ${defects.length} defects, ${releases.length} releases`
    }]
  };
};
