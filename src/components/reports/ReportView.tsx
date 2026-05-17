import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Printer
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { TaskStatus } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#E11D48', '#8B5CF6', '#06B6D4'];

const ReportView: React.FC = () => {
  const { state } = useProject();
  const [reportType, setReportType] = useState<'status' | 'workload' | 'architecture'>('status');

  const completedTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = state.tasks.length;
  const progress = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden print:bg-white">
      {/* Header */}
      <div className="px-6 py-6 border-bottom border-[var(--color-divider)] bg-[var(--color-surface)]/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Executive Reporting</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              Project Performance & Strategic Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9" onClick={handlePrint}>
            <Printer size={16} className="mr-1.5" /> Print Report
          </Button>
          <Button variant="primary" size="sm" className="h-9 px-6 bg-indigo-600 hover:bg-indigo-700">
             <Download size={16} className="mr-1.5" /> Export Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6 print:p-0">
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col items-center">
          
          {/* Report Selector */}
          <div className="w-full flex p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl print:hidden">
            {[
              { id: 'status', label: 'Status Summary', icon: TrendingUp },
              { id: 'workload', label: 'Resource Load', icon: Clock },
              { id: 'architecture', label: 'Structure Audit', icon: RefreshCw },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                  reportType === type.id 
                    ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" 
                    : "text-[var(--color-text-muted)] hover:text-indigo-500"
                )}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>

          {/* Actual Report Sheet */}
          <div className="w-full bg-white border border-[var(--color-divider)] rounded-[2rem] shadow-2xl p-12 print:border-none print:shadow-none min-h-[1000px]">
             {/* Report Title Section */}
             <div className="flex justify-between items-start mb-16 border-b border-gray-100 pb-12">
                <div>
                   <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Official Project Pulse Report</div>
                   <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">{state.name}</h2>
                   <p className="text-slate-500 mt-2 font-medium">Reporting Period: Jan 2026 - Present</p>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated At</div>
                   <div className="text-sm font-mono font-bold text-slate-600">{new Date().toLocaleString()}</div>
                </div>
             </div>

             {reportType === 'status' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-2 duration-500">
                   {/* Key Performance Indicators */}
                   <div className="grid grid-cols-3 gap-8">
                      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                         <div className="flex items-center gap-3 mb-4 text-emerald-600">
                            <CheckCircle2 size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Completion</span>
                         </div>
                         <div className="text-5xl font-display font-black text-slate-900">{progress}%</div>
                         <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                         </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                         <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <AlertCircle size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Open Defects</span>
                         </div>
                         <div className="text-5xl font-display font-black text-slate-900">{state.defects.length}</div>
                         <p className="text-slate-500 text-xs mt-4 font-medium uppercase tracking-tight">Requiring immediate attention</p>
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                         <div className="flex items-center gap-3 mb-4 text-indigo-600">
                            <RefreshCw size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Velocity</span>
                         </div>
                         <div className="text-5xl font-display font-black text-slate-900">High</div>
                         <p className="text-slate-500 text-xs mt-4 font-medium uppercase tracking-tight">Based on trailing task metrics</p>
                      </div>
                   </div>

                   {/* Milestone Progress */}
                   <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                        <ChevronRight className="text-indigo-500" size={20} />
                        Strategic Roadmap Progress
                      </h3>
                      <div className="space-y-6">
                         {state.tasks.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 5).map(task => (
                           <div key={task.id} className="flex items-center gap-6 group">
                              <div className="w-16 text-[10px] font-mono font-black text-slate-400">{task.id}</div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-800">{task.name}</span>
                                    <span className="text-xs font-bold text-slate-400">{task.progress}%</span>
                                 </div>
                                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 group-hover:bg-indigo-500 transition-all rounded-full" style={{ width: `${task.progress}%` }} />
                                 </div>
                              </div>
                              <div className="w-24 text-right">
                                 <span className={clsx(
                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                                    task.status === TaskStatus.COMPLETED ? "text-emerald-600" : "text-amber-600"
                                 )}>{task.status}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Project Insights Area */}
                   <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-100">
                      <div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Risk Assessment</h4>
                         <p className="text-sm text-slate-600 leading-relaxed italic">
                           "The project shows strong alignment across backend services, however, UI refinement for complex subtask workflows requires additional testing. Current defect burn rate is optimal."
                         </p>
                      </div>
                      <div>
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Immediate Actions</h4>
                         <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex gap-2">• Finalize integration of pulse templates</li>
                            <li className="flex gap-2">• Resolve critical S2 defects in identity module</li>
                            <li className="flex gap-2">• Alignment meeting scheduled for next sprint</li>
                         </ul>
                      </div>
                   </div>
                </div>
             )}

             {reportType === 'workload' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-xl font-bold text-slate-800">Team Allocation Pulse</h3>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregate Workload by Lead</div>
                    </div>

                    <div className="h-[400px] w-full bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={state.members.map(m => ({
                             name: m.name.split(' ')[0],
                             tasks: state.tasks.filter(t => t.assignee === m.name).length,
                             active: state.tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED).length
                          }))}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                             <ChartTooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f1f5f9' }}
                             />
                             <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                             <Bar dataKey="tasks" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Assigned" />
                             <Bar dataKey="active" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Active Pipeline" />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="card p-6 bg-indigo-50 border-indigo-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Congestion Warning</h4>
                          <p className="text-xs text-indigo-900 leading-relaxed font-bold">
                             {state.members.filter(m => state.tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED).length > 5).map(m => m.name).join(', ') || 'No'} resources are currently exceeding the standard 5-task active threshold.
                          </p>
                       </div>
                       <div className="card p-6 bg-slate-50">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Resource Efficiency</h4>
                          <p className="text-xs text-slate-900 leading-relaxed">
                             Team velocity is currently tracking at {Math.round(totalTasks / (state.members.length || 1))} tasks per capita across the board.
                          </p>
                       </div>
                    </div>
                </div>
             )}

             {reportType === 'architecture' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-xl font-bold text-slate-800">System Structure Audit</h3>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weighting by Architectural Component</div>
                    </div>

                    <div className="flex gap-12 items-center h-[400px] bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                       <div className="flex-1 h-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(
                                    state.tasks.reduce((acc, t) => {
                                      acc[t.module] = (acc[t.module] || 0) + 1;
                                      return acc;
                                    }, {} as any)
                                  ).map(([name, value]) => ({ name, value }))}
                                  innerRadius={80}
                                  outerRadius={120}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {state.tasks.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <ChartTooltip 
                                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                       </div>
                       
                       <div className="w-[300px] space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Distribution Analysis</h4>
                          <div className="space-y-3">
                             {Object.entries(
                                state.tasks.reduce((acc, t) => {
                                  acc[t.module] = (acc[t.module] || 0) + 1;
                                  return acc;
                                }, {} as any)
                             ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4).map(([name, count]: any, i) => (
                                <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                      <span className="text-xs font-bold text-slate-700">{name}</span>
                                   </div>
                                   <span className="text-[10px] font-mono font-black text-slate-400">{Math.round((count / state.tasks.length) * 100)}%</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="card p-8 border-l-4 border-l-indigo-500 bg-indigo-50/30">
                       <h4 className="text-sm font-bold text-slate-900 mb-2">Architectural Cohesion Insight</h4>
                       <p className="text-xs text-slate-600 leading-relaxed italic">
                          "The current architecture shows a healthy distribution across major modules. The {Object.entries(state.tasks.reduce((acc, t) => { acc[t.module] = (acc[t.module] || 0) + 1; return acc; }, {} as any)).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]} module represents the primary gravity center of the current sprint."
                       </p>
                    </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
