import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TaskStatus } from '../../types';
import { getWeekNumber } from '../../utils/projectUtils';

const BurndownChart: React.FC = () => {
  const { state } = useProject();
  const { tasks, log } = state;

  // Calculate Burndown Data
  const generateBurndownData = () => {
    const startDates = tasks.map(t => new Date(t.startDate)).filter(d => !isNaN(d.getTime()));
    const endDates = tasks.map(t => new Date(t.dueDate)).filter(d => !isNaN(d.getTime()));
    
    const start = startDates.length ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
    const end = endDates.length ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date(start.getTime() + 30 * 864e5);
    
    // Ensure we have at least a few data points
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 864e5) || 7;
    const interval = Math.max(1, Math.ceil(totalDays / 10));
    
    const totalEffort = tasks.reduce((s, t) => s + (t.estHours || 0), 0);
    const data = [];

    for (let i = 0; i <= totalDays; i += interval) {
      const currentPoint = new Date(start.getTime() + i * 864e5);
      
      // Ideal remaining
      const ideal = Math.max(0, totalEffort - (totalEffort / totalDays) * i);
      
      // Actual remaining
      // We look for tasks not completed yet, or completed AFTER this date
      const actualRemaining = tasks.filter(t => {
        if (t.status === TaskStatus.CANCELLED) return false;
        if (t.status !== TaskStatus.COMPLETED) return true;
        // If completed, was it completed after currentPoint?
        const compDate = t.actCompletionDate ? new Date(t.actCompletionDate) : new Date(t.updatedAt);
        return compDate > currentPoint;
      }).reduce((s, t) => s + (t.estHours || 0), 0);

      data.push({
        name: `Day ${i}`,
        date: currentPoint.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        ideal: Math.round(ideal),
        actual: Math.round(actualRemaining)
      });
    }

    return data;
  };

  // Calculate Cumulative Flow Data (Stacking statuses over time)
  const generateCFDData = () => {
    const last8Weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        last8Weeks.push({
            label: `W${getWeekNumber(d)}`,
            date: d
        });
    }

    const statuses = [TaskStatus.COMPLETED, TaskStatus.UNDER_REVIEW, TaskStatus.IN_PROGRESS, TaskStatus.ON_HOLD, TaskStatus.NOT_STARTED];
    
    return last8Weeks.map(w => {
        const point: any = { name: w.label };
        statuses.forEach(s => {
            point[s] = tasks.filter(t => {
                // Simplified logic: assume current status if no log history for this week
                // In real app, we'd traverse logs to find status at w.date
                const taskAtPoint = (new Date(t.createdAt) <= w.date);
                if (!taskAtPoint) return false;
                
                // Find latest status change before w.date
                const logs = log.filter(l => l.taskId === t.id && l.action === 'Status Changed' && new Date(l.ts) <= w.date);
                if (logs.length > 0) {
                    const latest = logs.sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0];
                    return latest.newVal === s;
                }
                
                return t.status === s;
            }).length;
        });
        return point;
      });
  };

  const burndownData = generateBurndownData();
  const cfdData = generateCFDData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card p-8">
        <div className="mb-6">
           <h3 className="text-lg font-bold">Remaining Effort Burndown</h3>
           <p className="text-xs text-[var(--color-text-faint)] uppercase font-bold tracking-widest mt-1">Ideal vs Actual (Effort Days)</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-text-faint)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-text-faint)' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  border: '1px solid var(--color-divider)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)'
                }} 
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="ideal" 
                stroke="var(--amber)" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                dot={false}
                name="Ideal Path"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Actual Effort"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-8">
        <div className="mb-6">
           <h3 className="text-lg font-bold">Cumulative Flow</h3>
           <p className="text-xs text-[var(--color-text-faint)] uppercase font-bold tracking-widest mt-1">Process Stability (Last 8 Weeks)</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cfdData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-text-faint)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-text-faint)' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  border: '1px solid var(--color-divider)',
                  borderRadius: '12px'
                }} 
              />
              <Area type="monotone" dataKey={TaskStatus.COMPLETED as string} stackId="1" stroke="var(--green)" fill="var(--green)" fillOpacity={0.6} name="Done" />
              <Area type="monotone" dataKey={TaskStatus.UNDER_REVIEW as string} stackId="1" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.4} name="Review" />
              <Area type="monotone" dataKey={TaskStatus.IN_PROGRESS as string} stackId="1" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} name="In Progress" />
              <Area type="monotone" dataKey={TaskStatus.ON_HOLD as string} stackId="1" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.2} name="Wait" />
              <Area type="monotone" dataKey={TaskStatus.NOT_STARTED as string} stackId="1" stroke="var(--color-text-faint)" fill="var(--color-text-faint)" fillOpacity={0.1} name="Todo" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;
