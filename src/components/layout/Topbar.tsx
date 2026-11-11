import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore, isRaidActive } from '../../utils/projectUtils';
import { NAV_HUBS, QUICK_SUBMODE_TARGETS, getAllNavItems } from '../../config/navigation';
import { useClickOutside } from '../../hooks/useClickOutside';
import Button from '../shared/Button';
import HelpModal from '../shared/HelpModal';
import {
  Bell,
  Palette,
  Search,
  HelpCircle,
  Menu,
  X,
  ArrowRight,
  Compass,
  ClipboardList,
  Bug,
  Package,
  ShieldAlert,
  Layers,
  Users,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import ThemeFlyout from './ThemeFlyout';
import SmartAlertsCenter, { computeAlerts } from './SmartAlertsCenter';
import UserProfileFlyout from './UserProfileFlyout';
import AccessManagerModal from '../auth/AccessManagerModal';
import { useAuth } from '../../store/AuthContext';
import { THEMES } from '../shared/ThemeGrid';
import { runCircularThemeTransition, castOriginConfetti } from '../../utils/designSpells';

interface TopbarProps {
  toggleSidebar: () => void;
}

interface SearchResultItem {
  id: string;
  kind: 'screen' | 'submode' | 'task' | 'defect' | 'delivery' | 'raid' | 'feature' | 'member' | 'spell';
  title: string;
  subtitle: string;
  badge: string;
  shortcut?: string;
  onSelect: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { state, setView, setTheme, searchTerm, setSearchTerm } = useProject();
  const { currentUser, hasViewAccess } = useAuth();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccessManagerOpen, setIsAccessManagerOpen] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useClickOutside(searchContainerRef, () => setIsSearchOpen(false), isSearchOpen);

  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const updateNetworkStatus = () => {
        if (['slow-2g', '2g', '3g'].includes(conn.effectiveType) || conn.saveData) {
          setIsSlowNetwork(true);
        } else {
          setIsSlowNetwork(false);
        }
      };
      updateNetworkStatus();
      conn.addEventListener?.('change', updateNetworkStatus);
      return () => conn.removeEventListener?.('change', updateNetworkStatus);
    }
  }, []);

  const smartAlerts = useMemo(() => {
    return computeAlerts(state).filter(a => !a.targetView || hasViewAccess(a.targetView));
  }, [state.tasks, state.members, state.defects, state.raids, hasViewAccess]);

  // Global Topbar shortcuts: `/` or `Cmd/Ctrl+K` to focus search, `F1`/`?` for screen help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        !target ||
        target.matches('input, textarea, select, [contenteditable="true"]') ||
        target.isContentEditable;
      const insideModal = !!target?.closest('[role="dialog"], [aria-modal="true"]');

      // Cmd+K or Ctrl+K -> Focus Global Search / Quick-Jump
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
        } else {
          searchInputRef.current?.focus();
          setIsSearchOpen(true);
        }
        return;
      }

      if (isInput || insideModal) return;

      // Shortcut: `/` to focus search
      if (e.key === '/') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
        } else {
          searchInputRef.current?.focus();
          setIsSearchOpen(true);
        }
      }

      // F1 or ? -> Open Screen Help Guide
      if (e.key === 'F1' || e.key === '?') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener('open-view-help', handleOpenHelp);
    return () => window.removeEventListener('open-view-help', handleOpenHelp);
  }, []);

  // Build unified RBAC-filtered Command + Entity search results
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchTerm.trim().toLowerCase();
    const hasTaskAccess = hasViewAccess('tasks');
    const results: SearchResultItem[] = [];

    // 1. Sub-mode deep links (CXO Email, Timeline, Scheduler, EVM, Theme Studio, etc.)
    const allowedSubModes = QUICK_SUBMODE_TARGETS.filter(m => hasViewAccess(m.viewId));

    // 2. Top-level screens from NAV_HUBS (excluding redundant timeline if tasks is allowed)
    const allowedScreens = getAllNavItems().filter(item => {
      if (item.id === 'timeline' && hasTaskAccess) return false;
      return hasViewAccess(item.id);
    });

    if (!q) {
      // Empty query: curated Quick Jumps matching active persona
      const featuredIds = ['overview', 'dash', 'reports', 'tasks', 'capacity', 'settings'];
      featuredIds.forEach(fid => {
        const scr = allowedScreens.find(s => s.id === fid);
        if (scr) {
          const hubLabel = NAV_HUBS.find(h => h.items.some(i => i.id === scr.id))?.label || 'Workspace';
          results.push({
            id: `screen-${scr.id}`,
            kind: 'screen',
            title: scr.label,
            subtitle: `${hubLabel} — ${scr.description}`,
            badge: 'Screen',
            shortcut: scr.shortcut,
            onSelect: () => setView(scr.id)
          });
        }
      });

      const featuredSubIds = ['reports:cxo', 'tasks:timeline', 'capacity:schedule', 'settings:theme'];
      featuredSubIds.forEach(sid => {
        const sub = allowedSubModes.find(s => s.id === sid);
        if (sub) {
          results.push({
            id: `sub-${sub.id}`,
            kind: 'submode',
            title: sub.label,
            subtitle: `${sub.parentLabel} — ${sub.description}`,
            badge: 'Quick Jump',
            onSelect: () => setView(sub.viewId, false, sub.subTab)
          });
        }
      });
      return results.slice(0, 8);
    }

    // Ranked query matching across Screens
    allowedScreens.forEach(scr => {
      const hay = `${scr.label} ${scr.shortLabel || ''} ${scr.description} ${(scr.keywords || []).join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        const hubLabel = NAV_HUBS.find(h => h.items.some(i => i.id === scr.id))?.label || 'Workspace';
        results.push({
          id: `screen-${scr.id}`,
          kind: 'screen',
          title: scr.label,
          subtitle: `${hubLabel} — ${scr.description}`,
          badge: 'Screen',
          shortcut: scr.shortcut,
          onSelect: () => {
            setSearchTerm('');
            setView(scr.id);
          }
        });
      }
    });

    // Sub-modes matching query
    allowedSubModes.forEach(sub => {
      const hay = `${sub.label} ${sub.parentLabel} ${sub.description} ${sub.keywords.join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        results.push({
          id: `sub-${sub.id}`,
          kind: 'submode',
          title: sub.label,
          subtitle: `${sub.parentLabel} — ${sub.description}`,
          badge: 'Mode',
          onSelect: () => {
            setSearchTerm('');
            setView(sub.viewId, false, sub.subTab);
          }
        });
      }
    });

    // Live Entity Matches (RBAC-gated)
    if (hasTaskAccess) {
      state.tasks
        .filter(t => `${t.id} ${t.name} ${t.module} ${t.assignee}`.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach(t => {
          results.push({
            id: `task-${t.id}`,
            kind: 'task',
            title: `${t.id}: ${t.name || 'Untitled Task'}`,
            subtitle: `${t.module || 'General'} • ${t.status}${t.assignee ? ` • ${t.assignee}` : ''}`,
            badge: 'Task',
            onSelect: () => {
              setSearchTerm(t.id);
              setView('tasks', false, 'grid');
            }
          });
        });
    }

    if (hasViewAccess('defects')) {
      (state.defects || [])
        .filter(d => `${d.id} ${d.title} ${d.severity} ${d.status}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(d => {
          results.push({
            id: `defect-${d.id}`,
            kind: 'defect',
            title: `${d.id}: ${d.title}`,
            subtitle: `${d.severity} • ${d.status}`,
            badge: 'Defect',
            onSelect: () => {
              setSearchTerm('');
              setView('defects');
            }
          });
        });
    }

    if (hasViewAccess('deliveries')) {
      (state.deliveries || [])
        .filter(del => `${del.id} ${del.almId || ''} ${del.name} ${del.releaseVersion || ''}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(del => {
          results.push({
            id: `delivery-${del.id}`,
            kind: 'delivery',
            title: `${del.almId || del.id}: ${del.name}`,
            subtitle: `${del.status}${del.releaseVersion ? ` • ${del.releaseVersion}` : ''}`,
            badge: 'Delivery',
            onSelect: () => {
              setSearchTerm('');
              setView('deliveries');
            }
          });
        });
    }

    if (hasViewAccess('risks')) {
      (state.raids || [])
        .filter(r => `${r.id} ${r.title} ${r.type}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(r => {
          results.push({
            id: `raid-${r.id}`,
            kind: 'raid',
            title: `${r.id}: ${r.title}`,
            subtitle: `${r.type} • ${isRaidActive(r.status) ? 'Active' : r.status}`,
            badge: 'RAID',
            onSelect: () => {
              setSearchTerm('');
              setView('risks');
            }
          });
        });
    }

    if (hasViewAccess('features')) {
      (state.features || [])
        .filter(f => `${f.id || ''} ${f.name} ${f.category || ''}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((f, idx) => {
          results.push({
            id: `feat-${f.id || idx}`,
            kind: 'feature',
            title: `${f.id ? `${f.id}: ` : ''}${f.name}`,
            subtitle: `${f.category || 'Capability'} • ${(f.screens || []).length} screens`,
            badge: 'Feature',
            onSelect: () => {
              setSearchTerm('');
              setView('features');
            }
          });
        });
    }

    if (hasViewAccess('team')) {
      (state.members || [])
        .filter(m => `${m.name} ${m.role}`.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(m => {
          results.push({
            id: `member-${m.id}`,
            kind: 'member',
            title: m.name,
            subtitle: `${m.role || 'Engineer'} • ${m.status}`,
            badge: 'Member',
            onSelect: () => {
              setSearchTerm('');
              setView('team');
            }
          });
        });
    }

    const magicQuery = searchTerm.trim().toLowerCase();
    if (
      magicQuery === 'magic' ||
      magicQuery === 'surprise' ||
      magicQuery === 'random' ||
      magicQuery === 'confetti' ||
      magicQuery === 'party' ||
      magicQuery === 'spell' ||
      magicQuery === 'shuffle'
    ) {
      results.unshift(
        {
          id: 'spell-surprise-theme',
          kind: 'spell',
          title: 'Surprise Me: Shuffle Theme Palette',
          subtitle: 'Apply a random curated workspace theme with an iris transition',
          badge: 'Spell',
          onSelect: () => {
            const candidates = THEMES.filter(t => t.id !== state.theme);
            const nextTheme = candidates[Math.floor(Math.random() * candidates.length)] || THEMES[0];
            runCircularThemeTransition(() => setTheme(nextTheme.id), {
              clientX: window.innerWidth * 0.5,
              clientY: 28,
            });
            setSearchTerm('');
          },
        },
        {
          id: 'spell-pulse-celebration',
          kind: 'spell',
          title: 'Cast Pulse Celebration',
          subtitle: 'Celebrate delivery momentum from the workspace command bar',
          badge: 'Spell',
          onSelect: () => {
            castOriginConfetti(searchContainerRef.current, { particleCount: 28, spread: 64 });
            setSearchTerm('');
          },
        }
      );
    }

    return results.slice(0, 12);
  }, [searchTerm, hasViewAccess, state.tasks, state.defects, state.deliveries, state.raids, state.features, state.members, state.theme, setTheme, setView, setSearchTerm]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [searchTerm, isSearchOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsSearchOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
      (e.currentTarget as HTMLInputElement).blur();
      return;
    }
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      const active = searchResults[highlightedIdx];
      if (active) {
        e.preventDefault();
        active.onSelect();
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
      }
    }
  };

  const renderKindIcon = (kind: SearchResultItem['kind']) => {
    switch (kind) {
      case 'task': return <ClipboardList size={13} className="text-sky-500 shrink-0" aria-hidden="true" />;
      case 'defect': return <Bug size={13} className="text-rose-500 shrink-0" aria-hidden="true" />;
      case 'delivery': return <Package size={13} className="text-emerald-500 shrink-0" aria-hidden="true" />;
      case 'raid': return <ShieldAlert size={13} className="text-amber-500 shrink-0" aria-hidden="true" />;
      case 'feature': return <Layers size={13} className="text-violet-500 shrink-0" aria-hidden="true" />;
      case 'member': return <Users size={13} className="text-cyan-500 shrink-0" aria-hidden="true" />;
      case 'spell': return <Sparkles size={13} className="text-[var(--color-primary-hex)] shrink-0" aria-hidden="true" />;
      default: return <Compass size={13} className="text-[var(--color-primary-hex)] shrink-0" aria-hidden="true" />;
    }
  };

  const health = getHealthScore(state.tasks);

  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score > 80) return 'On Track';
    if (score > 50) return 'At Risk';
    return 'Critical';
  };

  const renderSearchResultsDropdown = () => {
    if (!isSearchOpen) return null;
    return (
      <div
        id="global-search-listbox"
        role="listbox"
        aria-label="Quick navigation and search results"
        className="absolute right-0 left-0 sm:left-auto sm:w-[400px] lg:w-[430px] top-full mt-2 bg-[var(--color-surface)]/98 backdrop-blur-2xl border border-[var(--color-divider)] rounded-2xl shadow-2xl z-[80] overflow-hidden"
      >
        <div className="px-3.5 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
          <span>{searchTerm.trim() ? `Results for "${searchTerm.trim()}"` : 'Quick Jump Destinations'}</span>
          <span className="font-mono">Enter ↵ · Esc</span>
        </div>
        <div className="max-h-[340px] overflow-y-auto custom-scroll p-1.5 space-y-0.5">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => {
              const isSelected = idx === highlightedIdx;
              return (
                <button
                  key={item.id}
                  id={`global-search-opt-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  onClick={() => {
                    item.onSelect();
                    setIsSearchOpen(false);
                    setIsMobileSearchOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[var(--color-primary-highlight-hex)] text-[var(--color-text)]'
                      : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text)]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-center shrink-0">
                      {renderKindIcon(item.kind)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)] truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.shortcut && (
                      <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-faint)]">
                        {item.shortcut}
                      </kbd>
                    )}
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border border-[var(--color-divider)]">
                      {item.badge}
                    </span>
                    <ArrowRight size={12} className="text-[var(--color-text-faint)]" aria-hidden="true" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
              No permitted screens or records matched <span className="font-semibold text-[var(--color-text)]">"{searchTerm.trim()}"</span>.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="h-[calc(54px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 border-b border-[var(--color-divider)] flex items-center px-2.5 sm:px-4 gap-2 sm:gap-3 md:gap-4 shrink-0 z-40 shadow-2xs sticky top-0">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 shrink">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            className="min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] -ml-1 lg:ml-0 flex items-center justify-center hover:bg-[var(--color-surface-2)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors active:scale-95 cursor-pointer shrink-0"
          >
            <Menu size={18} />
          </button>

          <button
            type="button"
            onClick={() => hasViewAccess('overview') && setView('overview')}
            className="touch-hit-expand min-h-[34px] flex items-center min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer"
            title={`${state.name} — Jump to Executive Overview`}
          >
            <span className="font-semibold text-xs md:text-sm text-[var(--color-text)] tracking-tight truncate max-w-[96px] sm:max-w-[150px] md:max-w-[200px]">
              {state.name}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            if (e.shiftKey) {
              castOriginConfetti(e.currentTarget, { particleCount: 16, spread: 42 });
              return;
            }
            if (hasViewAccess('overview')) setView('overview');
          }}
          className="touch-hit-expand min-h-[34px] flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] shadow-2xs backdrop-blur-sm cursor-pointer hover:border-[var(--color-primary-hex)]/40 transition-[border-color,transform,background-color] active:scale-95 select-none whitespace-nowrap shrink-0"
          title={`Project Health: ${health}% (${getHealthLabel(health)}) — Click to view Executive Overview`}
        >
          <div className={clsx('w-2 h-2 rounded-full motion-safe:animate-pulse bg-current shrink-0', getHealthColor(health))} />
          <span className={clsx('text-[11px] sm:text-xs font-semibold tracking-tight whitespace-nowrap', getHealthColor(health))}>
            <span className="hidden sm:inline">{getHealthLabel(health)} </span>{health}%
          </span>
        </button>

        {isSlowNetwork && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium" title="Connection latency detected. Local offline-first caching active.">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>Slow Link Active</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-1.5" ref={searchContainerRef}>
          {/* Desktop Command & Global Search */}
          <div className="relative group hidden lg:block">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-0.5 rounded cursor-pointer z-10"
              >
                <X size={13} />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--color-text-faint)] pointer-events-none border border-[var(--color-divider)] px-1.5 py-0.5 rounded-md bg-[var(--color-surface)]/80 shadow-2xs">
                /
              </kbd>
            )}
            <input
              ref={searchInputRef}
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-controls="global-search-listbox"
              aria-activedescendant={isSearchOpen && searchResults[highlightedIdx] ? `global-search-opt-${highlightedIdx}` : undefined}
              aria-label="Search screens, tasks, defects, and RAID items"
              className="w-[220px] xl:w-[300px] h-9 pl-9 pr-8 bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)]/40 focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-primary-hex)]/15 transition-all duration-150"
              placeholder="Jump to screen, task, defect, RAID..."
              value={searchTerm}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
            {renderSearchResultsDropdown()}
          </div>

          {/* Compact Search Trigger on < lg screens */}
          <Button
            variant="ghost"
            size="icon"
            title="Search & Quick Jump (/)"
            aria-label="Search and Quick Jump"
            className="lg:hidden rounded-xl min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px]"
            onClick={() => {
              setIsMobileSearchOpen(prev => !prev);
              setIsSearchOpen(true);
              setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
            }}
          >
            <Search size={18} />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              title="Smart Alerts Center"
              aria-label="Smart Alerts Center"
              className={clsx('rounded-xl min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px] relative', isNotifOpen && 'bg-[var(--color-surface-2)]')}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell size={18} />
              {smartAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[var(--color-surface)] shadow-2xs">
                  {smartAlerts.length > 9 ? '9+' : smartAlerts.length}
                </span>
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            title="Appearance Settings"
            aria-label="Appearance and Theme Settings"
            className="rounded-xl min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px]"
            onClick={() => setIsThemeOpen(true)}
          >
            <Palette size={18} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Help & Screen Guide (F1 or ?)"
            aria-label="Help and Screen Guide"
            className="rounded-xl min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px] hidden sm:flex"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={18} />
          </Button>

          <div className="w-[1px] h-5 bg-[var(--color-divider)] mx-0.5 md:mx-1 hidden sm:block" />

          {/* User Profile & Role Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-[var(--color-surface-2)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-divider)] active:scale-95"
                title={`${currentUser.name} (${currentUser.role}) - Account & Access`}
                aria-label="User Account and Access Controls"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/20 shadow-2xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="text-xs font-bold text-[var(--color-text)] truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-[var(--color-text-faint)] font-medium mt-0.5">{currentUser.role}</span>
                </div>
              </button>

              <UserProfileFlyout
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onOpenAccessManager={() => setIsAccessManagerOpen(true)}
              />
            </div>
          )}
        </div>
      </header>

      {/* Expandable Mobile / Tablet Quick-Jump Bar */}
      {isMobileSearchOpen && (
        <div className="lg:hidden px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-divider)] relative z-40">
          <div className="relative">
            <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input
              ref={mobileSearchInputRef}
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-controls="global-search-listbox"
              aria-label="Search screens, tasks, defects, and RAID items"
              className="w-full h-9 pl-9 pr-9 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)]"
              placeholder="Jump to screen, task, defect, RAID..."
              value={searchTerm}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsSearchOpen(false);
              }}
              aria-label="Close mobile search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer"
            >
              <X size={14} />
            </button>
            {renderSearchResultsDropdown()}
          </div>
        </div>
      )}

      <SmartAlertsCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ThemeFlyout isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AccessManagerModal isOpen={isAccessManagerOpen} onClose={() => setIsAccessManagerOpen(false)} />
    </>
  );
};

export default Topbar;
