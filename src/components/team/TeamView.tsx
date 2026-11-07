import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Cake, 
  MapPin, 
  TrendingUp, 
  Trophy, 
  Award, 
  Zap,
  Activity
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import MemberHierarchy from './MemberHierarchy';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import PageHeader from '../shared/PageHeader';

const TeamView: React.FC = () => {
  const { state, saveMember, setView } = useProject();
  const { members, tasks, log } = state;

  const handleAddMember = () => {
    const name = prompt('Enter new team member name:');
    if (name) saveMember({ name });
  };

  const CC = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500'];

  // Calculate 30d Velocity for Leaderboard
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const leaders = members.map(m => {
    const count = tasks.filter(t => 
      t.assignee === m.name && 
      t.status === 'Completed' && 
      t.updatedAt && new Date(t.updatedAt) > thirtyDaysAgo
    ).length;
    return { name: m.name, count };
  }).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Users}
        title="Team Hub"
        subtitle={`${members.length} Active Engineers • Strategic Capacity & Skills Matrix`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAddMember} className="h-9 px-4">
            <UserPlus size={16} className="mr-1.5" /> Add Member
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-12">
        {/* Motivation / Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Velocity Leaderboard */}
           <div className="card p-8 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3 mb-6">
                 <Trophy size={18} className="text-amber-500" />
                 <h3 className="font-bold text-sm text-[var(--color-text)]">Velocity Leaders</h3>
              </div>
              <div className="space-y-4">
                 {leaders.map((l, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-[var(--color-text-faint)] w-4">{i+1}</span>
                         <span className="text-sm font-semibold truncate max-w-[120px]">{l.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-mono font-semibold text-amber-500">{l.count} Done</span>
                         {i === 0 && <Award size={14} className="text-amber-500" aria-label="Top performer" />}
                      </div>
                   </div>
                 ))}
                 {!leaders.length && <p className="text-xs text-[var(--color-text-faint)] italic">Waiting for completions...</p>}
              </div>
           </div>

           {/* Pulse Activity */}
           <div className="card p-8 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3 mb-6">
                 <Activity size={18} className="text-indigo-500" />
                 <h3 className="font-bold text-sm text-[var(--color-text-faint)]">7D Team Pulse</h3>
              </div>
              <div className="h-20 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[2,4,3,8,5,10,6].map((v, i) => ({ v, i }))}>
                       <Area type="monotone" dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary-highlight)" fillOpacity={0.4} strokeWidth={2} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Quality Champions */}
           <div className="card p-8 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3 mb-6">
                 <Award size={18} className="text-emerald-500" />
                 <h3 className="font-bold text-sm text-[var(--color-text-faint)]">Quality Highs</h3>
              </div>
              <div className="flex items-center justify-between">
                 <div>
                    <div className="text-2xl font-black text-emerald-600">92%</div>
                    <p className="text-xs text-[var(--color-text-faint)] font-medium mt-1 italic">Avg quality score</p>
                 </div>
                 <Zap size={32} className="text-emerald-100 fill-emerald-100" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {members.map((member, i) => {
            const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const memberTasks = tasks.filter(t => t.assignee === member.name && t.status !== 'Cancelled');
            const doneCount = memberTasks.filter(t => t.status === 'Completed').length;
            const progress = memberTasks.length ? Math.round((doneCount / memberTasks.length) * 100) : 0;
            
            return (
              <div key={member.id} className="card p-8 flex flex-col group relative overflow-hidden transition-colors duration-150 motion-safe:hover:scale-[1.01] shadow-lg shadow-black/5 ring-1 ring-black/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-black text-xl shadow-xl transform group-hover:rotate-6 transition-transform",
                    CC[i % CC.length]
                  )}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight text-[var(--color-text)]">{member.name}</h3>
                    <p className="text-xs font-semibold text-indigo-500 mt-1">
                      {member.role || 'Member'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-muted)]">
                    <Mail size={14} className="shrink-0 opacity-40" />
                    <span className="truncate">{member.email || 'no-email@projectpulse.io'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-muted)]">
                    <Phone size={14} className="shrink-0 opacity-40" />
                    <span>{member.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-muted)]">
                    <Cake size={14} className="shrink-0 opacity-40" />
                    <span>{member.birthday || '—'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--color-divider)]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-[var(--color-text-faint)]">Execution maturity</span>
                    <span className="text-xs font-black text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Button variant="ghost" size="sm" className="text-[11px] font-bold py-2.5 h-10 border-[var(--color-divider)] bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]">Tasks</Button>
                  <Button variant="outline" size="sm" className="text-[11px] font-bold py-2.5 h-10 border-[var(--color-divider)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]">Profile</Button>
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center text-[var(--color-text-faint)] bg-[var(--color-surface-offset)]/30 rounded-3xl border-2 border-dashed border-[var(--color-divider)]">
                <Users size={64} strokeWidth={1} className="mb-6 opacity-20" />
                <h3 className="text-xl font-bold">Your team is empty</h3>
                <p className="text-sm max-w-xs text-center mt-2 leading-relaxed">Start adding members to manage project capacity and individual technical performance.</p>
                <Button variant="primary" className="mt-8 rounded-2xl font-black px-10" onClick={handleAddMember}>Add First Member</Button>
             </div>
          )}
        </div>

        <MemberHierarchy />

        {/* Skills Coverage Matrix & Leaves / Birthdays Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16">
          {/* Skills Coverage Matrix */}
          <div className="lg:col-span-7 card p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Skills Coverage Matrix</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1">Core architectural and framework competencies</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-divider)] text-xs font-semibold text-[var(--color-text-muted)]">
                    <th className="py-3">Resource</th>
                    <th className="py-3">TypeScript</th>
                    <th className="py-3">React / Tailwind</th>
                    <th className="py-3">API/Backend</th>
                    <th className="py-3">Database/SQL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)] text-xs font-semibold text-[var(--color-text)]">
                  {members.map((m, idx) => {
                    // Generate pseudo skills based on index for variety
                    const s1 = (idx * 2 + 3) % 6;
                    const s2 = (idx * 3 + 1) % 6;
                    const s3 = (idx + 4) % 6;
                    const s4 = (idx * 2 + 1) % 6;
                    return (
                      <tr key={m.id} className="hover:bg-[var(--color-surface-offset)]/50 transition-colors">
                        <td className="py-3 font-bold text-[var(--color-text)]">{m.name}</td>
                        <td className="py-3">
                          <span className="font-mono text-indigo-600 font-bold">{"★".repeat(s1)}{"☆".repeat(5-s1)}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-emerald-600 font-bold">{"★".repeat(s2)}{"☆".repeat(5-s2)}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-blue-600 font-bold">{"★".repeat(s3)}{"☆".repeat(5-s3)}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-amber-600 font-bold">{"★".repeat(s4)}{"☆".repeat(5-s4)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaves & Celebrations */}
          <div className="lg:col-span-5 card p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text)]">Capacity & Team Events</h3>
                <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1">Planned leaves and birth dates</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                  <h4 className="text-xs font-bold text-indigo-500 mb-2 flex items-center gap-1.5">
                    <Cake size={14} /> Upcoming Birthday Celebrations
                  </h4>
                  <div className="space-y-2">
                    {members.slice(0, 3).map(m => (
                      <div key={m.id} className="text-xs font-bold text-[var(--color-text)] flex justify-between">
                        <span>{m.name}</span>
                        <span className="text-[var(--color-text-faint)] text-[10px]">{m.birthday || '12 Oct'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                  <h4 className="text-xs font-bold text-rose-500 mb-2 flex items-center gap-1.5">
                    <Users size={14} className="text-rose-500" /> Planned Time Off (Leaves)
                  </h4>
                  <div className="space-y-2 text-xs">
                    {members.filter(m => m.plannedLeaves && m.plannedLeaves.length > 0).map(m => (
                      m.plannedLeaves.map((l, i) => (
                        <div key={`${m.id}-${i}`} className="font-bold text-[var(--color-text)] flex justify-between">
                          <span>{m.name} <span className="text-[10px] text-[var(--color-text-faint)] font-medium">({l.reason})</span></span>
                          <span className="text-rose-550 font-mono text-[10px]">{l.from} to {l.to}</span>
                        </div>
                      ))
                    ))}
                    {members.filter(m => m.plannedLeaves && m.plannedLeaves.length > 0).length === 0 && (
                      <div className="text-[var(--color-text-faint)] italic text-[11px]">No planned team leaves registered. All staff active.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamView;
