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
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll pb-20">
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 md:mb-12 border-b border-[var(--color-divider)] pb-8 md:pb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h1 className="font-display text-4xl font-black tracking-tight text-[var(--color-text)]">Team Hub</h1>
              <p className="text-sm text-[var(--color-text-muted)] font-medium">Strategic resource allocation and organizational intelligence.</p>
            </div>
          </div>
          
          <Button variant="primary" size="md" onClick={handleAddMember} className="h-12 px-8 rounded-2xl font-black shadow-xl shadow-indigo-100">
            <UserPlus size={18} className="mr-2" /> Add Member
          </Button>
        </div>

        {/* Motivation / Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           {/* Velocity Leaderboard */}
           <div className="card p-8 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3 mb-6">
                 <Trophy size={18} className="text-amber-500" />
                 <h3 className="font-bold text-sm uppercase tracking-widest text-[var(--color-text-faint)]">Velocity Kings</h3>
              </div>
              <div className="space-y-4">
                 {leaders.map((l, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-[var(--color-text-faint)] w-4">{i+1}</span>
                         <span className="text-sm font-bold truncate max-w-[120px]">{l.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-black text-amber-600">{l.count} Done</span>
                         {i === 0 && <span className="text-xs">🥇</span>}
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
                 <h3 className="font-bold text-sm uppercase tracking-widest text-[var(--color-text-faint)]">7D Team Pulse</h3>
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
                 <h3 className="font-bold text-sm uppercase tracking-widest text-[var(--color-text-faint)]">Quality Highs</h3>
              </div>
              <div className="flex items-center justify-between">
                 <div>
                    <div className="text-2xl font-black text-emerald-600">92%</div>
                    <p className="text-[10px] text-[var(--color-text-faint)] font-bold uppercase mt-1 italic">Avg Quality Score</p>
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
              <div key={member.id} className="card p-8 flex flex-col group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-black/5 ring-1 ring-black/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-black text-xl shadow-xl transform group-hover:rotate-6 transition-transform",
                    CC[i % CC.length]
                  )}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight text-[var(--color-text)]">{member.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)]">Execution Maturity</span>
                    <span className="text-xs font-black text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 opacity-0 group-hover:opacity-100 transition-all transform translateY-4 group-hover:translate-Y-0">
                  <Button variant="ghost" size="sm" className="text-[11px] font-black py-2.5 h-10 border-[var(--color-divider)] bg-[var(--color-surface-2)]">Tasks</Button>
                  <Button variant="outline" size="sm" className="text-[11px] font-black py-2.5 h-10 border-[var(--color-divider)]">Profile</Button>
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
      </div>
    </div>
  );
};

export default TeamView;
