import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Member } from '../../types';
import { 
  Building, 
  Maximize2, 
  RotateCcw,
  ZoomIn, 
  ZoomOut, 
  Users,
  Search,
  ArrowDown,
  ArrowRight,
  Eye,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  UserCheck,
  Mail,
  X,
  Compass
} from 'lucide-react';
import Button from '../shared/Button';
import SectionHelpButton from '../shared/SectionHelpButton';
import clsx from 'clsx';

export interface MemberHierarchyProps {
  onSelectMember?: (memberId: string) => void;
  className?: string;
}

interface TreeNode {
  member: Member;
  id: string;
  name: string;
  role: string;
  reportsTo?: string;
  children: TreeNode[];
  parent?: TreeNode;
  depth: number;
  x: number;
  y: number;
  subtreeWidth: number;
  subtreeHeight: number;
}

type Orientation = 'vertical' | 'horizontal';

// Discipline / Department taxonomy classifier for executive team visualization
export function getMemberDepartment(role: string): { 
  name: string; 
  color: string; 
  bg: string; 
  border: string; 
  badgeBg: string;
} {
  const r = (role || '').toLowerCase();
  if (r.includes('architect') || r.includes('staff')) {
    return { 
      name: 'Architecture', 
      color: 'text-cyan-600 dark:text-cyan-400', 
      bg: 'bg-cyan-500/10', 
      border: 'border-cyan-500/30',
      badgeBg: 'bg-cyan-500'
    };
  }
  if (r.includes('frontend') || r.includes('ui') || r.includes('design')) {
    return { 
      name: 'Design & UI', 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/30',
      badgeBg: 'bg-purple-500'
    };
  }
  if (r.includes('devops') || r.includes('infra') || r.includes('cloud') || r.includes('sre')) {
    return { 
      name: 'DevOps & Infra', 
      color: 'text-sky-600 dark:text-sky-400', 
      bg: 'bg-sky-500/10', 
      border: 'border-sky-500/30',
      badgeBg: 'bg-sky-500'
    };
  }
  if (r.includes('security') || r.includes('secops') || r.includes('compliance')) {
    return { 
      name: 'Security', 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500'
    };
  }
  if (r.includes('qa') || r.includes('test') || r.includes('quality') || r.includes('sdet')) {
    return { 
      name: 'QA & Testing', 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30',
      badgeBg: 'bg-amber-500'
    };
  }
  if (r.includes('manager') || r.includes('product') || r.includes('lead') || r.includes('director') || r.includes('head') || r.includes('vp')) {
    return { 
      name: 'Leadership & PM', 
      color: 'text-rose-600 dark:text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/30',
      badgeBg: 'bg-rose-500'
    };
  }
  return { 
    name: 'Engineering', 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bg: 'bg-indigo-500/10', 
    border: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500'
  };
}

const MemberHierarchy: React.FC<MemberHierarchyProps> = ({ onSelectMember, className }) => {
  const { state } = useProject();
  const members = state.members || [];

  const containerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport camera transform
  const [view, setView] = useState({ panX: 40, panY: 60, zoom: 0.85 });
  const [drag, setDrag] = useState({ active: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });

  // Organization interactive states
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [showMinimap, setShowMinimap] = useState<boolean>(true);

  // Card dimensions
  const isVert = orientation === 'vertical';
  const CARD_W = isVert ? 250 : 250;
  const CARD_H = isVert ? 96 : 88;
  const GAP_SIBLING = isVert ? 36 : 24;
  const GAP_LEVEL = isVert ? 72 : 72;

  // ─────────────────────────────────────────────────────────────
  // 1. EXTRACT DEPARTMENTS & SEARCH MATCHES
  // ─────────────────────────────────────────────────────────────
  const departments = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => set.add(getMemberDepartment(m.role).name));
    return ['All', ...Array.from(set).sort()];
  }, [members]);

  const searchMatchingIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const set = new Set<string>();
    members.forEach(m => {
      const dept = getMemberDepartment(m.role).name.toLowerCase();
      if (
        m.name.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        dept.includes(q)
      ) {
        set.add(m.id);
      }
    });
    return set;
  }, [members, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // 2. BUILD HIERARCHICAL TREE MODEL & DETECT CYCLES
  // ─────────────────────────────────────────────────────────────
  const treeRoots = useMemo(() => {
    if (!members.length) return [];

    const nodeMap = new Map<string, TreeNode>();
    const nameMap = new Map<string, TreeNode>();

    // Pass 1: Instantiate all tree nodes
    members.forEach(m => {
      const node: TreeNode = {
        member: m,
        id: m.id,
        name: m.name,
        role: m.role || 'Software Engineer',
        reportsTo: m.reportsTo?.trim(),
        children: [],
        depth: 0,
        x: 0,
        y: 0,
        subtreeWidth: CARD_W,
        subtreeHeight: CARD_H
      };
      nodeMap.set(m.id, node);
      nameMap.set(m.name.toLowerCase(), node);
    });

    const roots: TreeNode[] = [];
    const visited = new Set<string>();

    // Pass 2: Connect parent-child links with cycle safety
    members.forEach(m => {
      const node = nodeMap.get(m.id);
      if (!node) return;

      const mgrQuery = (m.reportsTo || '').trim().toLowerCase();
      const parentNode = mgrQuery ? (nodeMap.get(mgrQuery) || nameMap.get(mgrQuery)) : undefined;

      // Ensure no self-parenting or direct cycle
      if (parentNode && parentNode.id !== node.id) {
        parentNode.children.push(node);
        node.parent = parentNode;
      } else {
        roots.push(node);
      }
    });

    // Cycle detection & depth setting
    const assignDepth = (n: TreeNode, d: number) => {
      if (visited.has(n.id)) return;
      visited.add(n.id);
      n.depth = d;
      n.children.forEach(c => assignDepth(c, d + 1));
    };

    roots.forEach(r => assignDepth(r, 0));

    return roots;
  }, [members, CARD_W, CARD_H]);

  // ─────────────────────────────────────────────────────────────
  // 3. TREE LAYOUT ALGORITHM (BUCHHEIM/WALKER-INSPIRED NON-OVERLAPPING)
  // ─────────────────────────────────────────────────────────────
  const { laidOutNodes, connectors, bounds } = useMemo(() => {
    if (!treeRoots.length) {
      return { 
        laidOutNodes: [] as TreeNode[], 
        connectors: [] as Array<{ id: string; d: string; fromId: string; toId: string; isHighlighted: boolean }>,
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
      };
    }

    // Helper: is this node expanded?
    const isExpanded = (node: TreeNode) => !collapsedIds.has(node.id);

    // Pass 1: Bottom-up measurement of subtree bounding box
    const measureSubtree = (node: TreeNode): void => {
      const visibleChildren = isExpanded(node) ? node.children : [];
      
      if (!visibleChildren.length) {
        node.subtreeWidth = CARD_W;
        node.subtreeHeight = CARD_H;
        return;
      }

      visibleChildren.forEach(measureSubtree);

      if (isVert) {
        const totalChildrenWidth = visibleChildren.reduce((sum, c) => sum + c.subtreeWidth, 0) + (visibleChildren.length - 1) * GAP_SIBLING;
        node.subtreeWidth = Math.max(CARD_W, totalChildrenWidth);
        node.subtreeHeight = CARD_H + GAP_LEVEL + Math.max(...visibleChildren.map(c => c.subtreeHeight));
      } else {
        const totalChildrenHeight = visibleChildren.reduce((sum, c) => sum + c.subtreeHeight, 0) + (visibleChildren.length - 1) * GAP_SIBLING;
        node.subtreeHeight = Math.max(CARD_H, totalChildrenHeight);
        node.subtreeWidth = CARD_W + GAP_LEVEL + Math.max(...visibleChildren.map(c => c.subtreeWidth));
      }
    };

    treeRoots.forEach(measureSubtree);

    // Pass 2: Top-down placement of coordinates
    const allPlacedNodes: TreeNode[] = [];

    const placeSubtree = (node: TreeNode, left: number, top: number): void => {
      const visibleChildren = isExpanded(node) ? node.children : [];
      allPlacedNodes.push(node);

      if (isVert) {
        node.y = top;
        if (!visibleChildren.length) {
          node.x = left + (node.subtreeWidth - CARD_W) / 2;
        } else {
          let currentLeft = left;
          visibleChildren.forEach(child => {
            placeSubtree(child, currentLeft, top + CARD_H + GAP_LEVEL);
            currentLeft += child.subtreeWidth + GAP_SIBLING;
          });
          const firstChild = visibleChildren[0];
          const lastChild = visibleChildren[visibleChildren.length - 1];
          node.x = (firstChild.x + lastChild.x) / 2;
        }
      } else {
        node.x = left;
        if (!visibleChildren.length) {
          node.y = top + (node.subtreeHeight - CARD_H) / 2;
        } else {
          let currentTop = top;
          visibleChildren.forEach(child => {
            placeSubtree(child, left + CARD_W + GAP_LEVEL, currentTop);
            currentTop += child.subtreeHeight + GAP_SIBLING;
          });
          const firstChild = visibleChildren[0];
          const lastChild = visibleChildren[visibleChildren.length - 1];
          node.y = (firstChild.y + lastChild.y) / 2;
        }
      }
    };

    // Position multiple roots side-by-side or stacked
    let rootOffset = 40;
    treeRoots.forEach(root => {
      if (isVert) {
        placeSubtree(root, rootOffset, 40);
        rootOffset += root.subtreeWidth + GAP_SIBLING * 2;
      } else {
        placeSubtree(root, 40, rootOffset);
        rootOffset += root.subtreeHeight + GAP_SIBLING * 2;
      }
    });

    // Compute active reporting path for hover/selection highlight
    const highlightedMemberIds = new Set<string>();
    const targetId = hoveredMemberId || selectedMemberId;
    if (targetId) {
      let curr = allPlacedNodes.find(n => n.id === targetId);
      while (curr) {
        highlightedMemberIds.add(curr.id);
        curr = curr.parent;
      }
    }

    // Pass 3: Build smooth bezier connection paths
    const connectorsList: Array<{ id: string; d: string; fromId: string; toId: string; isHighlighted: boolean }> = [];

    allPlacedNodes.forEach(parent => {
      if (!isExpanded(parent)) return;

      parent.children.forEach(child => {
        // Child must be present in placed nodes
        if (!allPlacedNodes.some(n => n.id === child.id)) return;

        let d = '';
        if (isVert) {
          const fromX = parent.x + CARD_W / 2;
          const fromY = parent.y + CARD_H;
          const toX = child.x + CARD_W / 2;
          const toY = child.y;
          const cpY1 = fromY + GAP_LEVEL * 0.45;
          const cpY2 = toY - GAP_LEVEL * 0.45;
          d = `M ${fromX} ${fromY} C ${fromX} ${cpY1}, ${toX} ${cpY2}, ${toX} ${toY}`;
        } else {
          const fromX = parent.x + CARD_W;
          const fromY = parent.y + CARD_H / 2;
          const toX = child.x;
          const toY = child.y + CARD_H / 2;
          const cpX1 = fromX + GAP_LEVEL * 0.45;
          const cpX2 = toX - GAP_LEVEL * 0.45;
          d = `M ${fromX} ${fromY} C ${cpX1} ${fromY}, ${cpX2} ${toY}, ${toX} ${toY}`;
        }

        const isHighlighted = highlightedMemberIds.has(parent.id) && highlightedMemberIds.has(child.id);
        connectorsList.push({
          id: `${parent.id}->${child.id}`,
          d,
          fromId: parent.id,
          toId: child.id,
          isHighlighted
        });
      });
    });

    // Compute bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPlacedNodes.forEach(n => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + CARD_W);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + CARD_H);
    });

    if (allPlacedNodes.length === 0) {
      minX = 0; maxX = 600; minY = 0; maxY = 400;
    }

    const b = {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(100, maxX - minX),
      height: Math.max(100, maxY - minY)
    };

    return { laidOutNodes: allPlacedNodes, connectors: connectorsList, bounds: b };
  }, [treeRoots, collapsedIds, isVert, CARD_W, CARD_H, GAP_SIBLING, GAP_LEVEL, hoveredMemberId, selectedMemberId]);

  // ─────────────────────────────────────────────────────────────
  // 4. CAMERA CONTROLS: FIT TO VIEW, ZOOM, PAN & JUMP
  // ─────────────────────────────────────────────────────────────
  const fitToView = useCallback(() => {
    if (!containerRef.current || bounds.width <= 0 || bounds.height <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = 60;
    const scaleX = (rect.width - pad * 2) / bounds.width;
    const scaleY = (rect.height - pad * 2) / bounds.height;
    const targetZoom = Math.max(0.25, Math.min(1.1, Math.min(scaleX, scaleY)));

    const targetPanX = (rect.width - bounds.width * targetZoom) / 2 - bounds.minX * targetZoom;
    const targetPanY = (rect.height - bounds.height * targetZoom) / 2 - bounds.minY * targetZoom;

    setView({
      panX: Math.round(targetPanX),
      panY: Math.round(targetPanY),
      zoom: Number(targetZoom.toFixed(2))
    });
  }, [bounds]);

  // Initial auto-fit on mount or orientation toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView();
    }, 80);
    return () => clearTimeout(timer);
  }, [orientation]);

  const zoom = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setView(prev => {
      const nextZoom = Math.max(0.2, Math.min(2.5, prev.zoom * factor));
      // Zoom toward center
      const panX = centerX - (centerX - prev.panX) * (nextZoom / prev.zoom);
      const panY = centerY - (centerY - prev.panY) * (nextZoom / prev.zoom);
      return { panX, panY, zoom: Number(nextZoom.toFixed(2)) };
    });
  };

  const jumpToNode = (nodeId: string) => {
    const node = laidOutNodes.find(n => n.id === nodeId);
    if (!node || !containerRef.current) return;

    // Ensure parents are expanded so node is visible
    setCollapsedIds(prev => {
      const next = new Set(prev);
      let curr = node.parent;
      while (curr) {
        next.delete(curr.id);
        curr = curr.parent;
      }
      return next;
    });

    const rect = containerRef.current.getBoundingClientRect();
    const targetZoom = Math.max(0.7, Math.min(1.0, view.zoom));
    const targetPanX = rect.width / 2 - (node.x + CARD_W / 2) * targetZoom;
    const targetPanY = rect.height / 2 - (node.y + CARD_H / 2) * targetZoom;

    setView({ panX: targetPanX, panY: targetPanY, zoom: targetZoom });
    setSelectedMemberId(node.id);
  };

  // ─────────────────────────────────────────────────────────────
  // 5. MOUSE & TOUCH EVENT HANDLERS (PAN, ZOOM, DRAG)
  // ─────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary left click only
    setDrag({
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: view.panX,
      initialPanY: view.panY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setView(prev => ({
      ...prev,
      panX: drag.initialPanX + dx,
      panY: drag.initialPanY + dy
    }));
  };

  const handleMouseUp = () => {
    if (drag.active) {
      setDrag(prev => ({ ...prev, active: false }));
    }
  };

  // Wheel zoom with trackpad pinch support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    if (e.ctrlKey || e.metaKey) {
      // Pinch to zoom
      const factor = e.deltaY < 0 ? 1.05 : 0.95;
      zoom(factor);
    } else {
      // Pan
      setView(prev => ({
        ...prev,
        panX: prev.panX - e.deltaX * 0.8,
        panY: prev.panY - e.deltaY * 0.8
      }));
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setDrag({
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        initialPanX: view.panX,
        initialPanY: view.panY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drag.active || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - drag.startX;
    const dy = t.clientY - drag.startY;
    setView(prev => ({
      ...prev,
      panX: drag.initialPanX + dx,
      panY: drag.initialPanY + dy
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // 6. SUBTREE EXPAND / COLLAPSE ACTIONS
  // ─────────────────────────────────────────────────────────────
  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const collapseToLeads = () => {
    const leadsToCollapse = new Set<string>();
    laidOutNodes.forEach(n => {
      if (n.depth >= 1 && n.children.length > 0) {
        leadsToCollapse.add(n.id);
      }
    });
    setCollapsedIds(leadsToCollapse);
  };

  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  // ─────────────────────────────────────────────────────────────
  // 7. MINIMAP RADAR CANVAS RENDERING
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMinimap || !minimapCanvasRef.current || !containerRef.current) return;
    const canvas = minimapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CW = canvas.width;
    const CH = canvas.height;
    ctx.clearRect(0, 0, CW, CH);

    const pad = 12;
    const scale = Math.min((CW - pad * 2) / bounds.width, (CH - pad * 2) / bounds.height);
    const offsetX = (CW - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (CH - bounds.height * scale) / 2 - bounds.minY * scale;

    // Draw nodes on minimap
    laidOutNodes.forEach(n => {
      const nx = n.x * scale + offsetX;
      const ny = n.y * scale + offsetY;
      const nw = Math.max(4, CARD_W * scale);
      const nh = Math.max(3, CARD_H * scale);

      ctx.fillStyle = n.id === selectedMemberId ? '#6366f1' : '#94a3b8';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(nx, ny, nw, nh, 2);
      else ctx.rect(nx, ny, nw, nh);
      ctx.fill();
    });

    // Draw active viewport rectangle
    const rect = containerRef.current.getBoundingClientRect();
    const vpLeft = (-view.panX / view.zoom) * scale + offsetX;
    const vpTop = (-view.panY / view.zoom) * scale + offsetY;
    const vpWidth = (rect.width / view.zoom) * scale;
    const vpHeight = (rect.height / view.zoom) * scale;

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
    ctx.beginPath();
    ctx.rect(vpLeft, vpTop, vpWidth, vpHeight);
    ctx.fill();
    ctx.stroke();
  }, [laidOutNodes, bounds, view, selectedMemberId, showMinimap, CARD_W, CARD_H]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!minimapCanvasRef.current || !containerRef.current) return;
    const canvas = minimapCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pad = 12;
    const scale = Math.min((canvas.width - pad * 2) / bounds.width, (canvas.height - pad * 2) / bounds.height);
    const offsetX = (canvas.width - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (canvas.height - bounds.height * scale) / 2 - bounds.minY * scale;

    const targetWorldX = (clickX - offsetX) / scale;
    const targetWorldY = (clickY - offsetY) / scale;

    const cRect = containerRef.current.getBoundingClientRect();
    const targetPanX = cRect.width / 2 - targetWorldX * view.zoom;
    const targetPanY = cRect.height / 2 - targetWorldY * view.zoom;

    setView(prev => ({ ...prev, panX: targetPanX, panY: targetPanY }));
  };

  return (
    <div className={clsx("space-y-4 select-none", className)}>
      {/* ── Executive Header & Organization Control Strip ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Help */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center shadow-2xs">
            <Building size={17} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text)]">Organization Map</h2>
              <SectionHelpButton view="team" section="Dynamic Org Chart Tree" label="Organization Map guide" size={13} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">
              {members.length} team members • {treeRoots.length} reporting {treeRoots.length === 1 ? 'root' : 'divisions'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search member, role..."
              className="h-8 pl-8 pr-7 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] w-40 sm:w-48 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs">
            <Layers size={13} className="text-[var(--color-text-faint)]" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="bg-transparent font-semibold text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Orientation Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)]">
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={clsx(
                "px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                isVert ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)]"
              )}
              title="Top-to-Bottom Vertical Executive Tree"
            >
              <ArrowDown size={13} />
              <span className="hidden sm:inline">Top-Down</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={clsx(
                "px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                !isVert ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)]"
              )}
              title="Left-to-Right Horizontal Mindmap Flow"
            >
              <ArrowRight size={13} />
              <span className="hidden sm:inline">Left-Right</span>
            </button>
          </div>

          {/* Collapse/Expand Bulk Presets */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1 rounded-lg font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              title="Expand all subordinate branches"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseToLeads}
              className="px-2 py-1 rounded-lg font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              title="Collapse individual contributor leaves"
            >
              Leads Only
            </button>
          </div>

          {/* Camera View Controls */}
          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-divider)] p-1 rounded-xl shadow-xs">
            <Button variant="ghost" size="icon" onClick={() => zoom(1.15)} className="h-7 w-7 rounded-lg" title="Zoom in (+)">
              <ZoomIn size={13}/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => zoom(0.85)} className="h-7 w-7 rounded-lg" title="Zoom out (-)">
              <ZoomOut size={13}/>
            </Button>
            <Button variant="ghost" size="icon" onClick={fitToView} className="h-7 w-7 rounded-lg" title="Fit to view (center all members)">
              <Maximize2 size={13}/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setView({ panX: 40, panY: 60, zoom: 0.85 })} className="h-7 w-7 rounded-lg" title="Reset camera (1:1)">
              <RotateCcw size={13}/>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Infinite Graph Canvas Container ── */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={clsx(
          "h-[480px] sm:h-[620px] w-full bg-[var(--color-surface-2)]/80 rounded-3xl border border-[var(--color-divider)] relative overflow-hidden shadow-inner select-none",
          drag.active ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ touchAction: 'none' }}
      >
        {/* Subtle dot-grid blueprint background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" aria-hidden="true">
          <defs>
            <pattern id="org-blueprint-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="currentColor" className="text-[var(--color-divider)]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-blueprint-dots)" />
        </svg>

        {/* ── Transformed World Space (Camera Scale & Pan) ── */}
        <div 
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate3d(${view.panX}px, ${view.panY}px, 0) scale(${view.zoom})`,
            transition: drag.active ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Connectors SVG Layer */}
          <svg 
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ width: bounds.maxX + 400, height: bounds.maxY + 400 }}
          >
            <defs>
              <linearGradient id="org-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary-hex)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--color-primary-hex)" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {connectors.map(c => (
              <path
                key={c.id}
                d={c.d}
                fill="none"
                className={clsx(
                  "transition-all duration-200",
                  c.isHighlighted
                    ? "stroke-[var(--color-primary-hex)] stroke-[2.5px] drop-shadow-xs"
                    : "stroke-[var(--color-divider)] stroke-[1.8px] opacity-75"
                )}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Interactive Cards Layer */}
          <div className="relative pointer-events-auto">
            {laidOutNodes.map(node => {
              const m = node.member;
              const dept = getMemberDepartment(node.role);
              const isSelected = selectedMemberId === node.id;
              const isHovered = hoveredMemberId === node.id;
              const isSearchMatch = searchMatchingIds.has(node.id);
              const matchesDept = selectedDepartment === 'All' || dept.name === selectedDepartment;
              const hasChildren = node.children.length > 0;
              const isBranchCollapsed = collapsedIds.has(node.id);

              const initials = node.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedMemberId(node.id);
                    if (onSelectMember) onSelectMember(node.id);
                  }}
                  onMouseEnter={() => setHoveredMemberId(node.id)}
                  onMouseLeave={() => setHoveredMemberId(null)}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: CARD_W,
                    height: CARD_H
                  }}
                  className={clsx(
                    "group rounded-2xl p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between",
                    "bg-[var(--color-surface)] backdrop-blur-md shadow-xs hover:shadow-xl",
                    isSelected 
                      ? "ring-2 ring-[var(--color-primary-hex)] border-transparent shadow-lg bg-[var(--color-surface)]" 
                      : isHovered
                      ? "border-[var(--color-primary-hex)]/70 shadow-md"
                      : "border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40",
                    isSearchMatch && "ring-2 ring-amber-500 shadow-md",
                    !matchesDept && "opacity-35 hover:opacity-100"
                  )}
                >
                  {/* Top Row: Avatar + Name + Discipline Badge */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Gradient Avatar */}
                    <div className={clsx(
                      "w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border",
                      dept.bg, dept.color, dept.border
                    )}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[var(--color-text)] truncate leading-tight group-hover:text-[var(--color-primary-hex)] transition-colors" title={node.name}>
                          {node.name}
                        </span>
                        {/* Quick View Profile Pill */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectMember) onSelectMember(node.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-opacity"
                          title="Open detailed profile drawer"
                        >
                          <Eye size={12} />
                        </button>
                      </div>

                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] truncate mt-0.5" title={node.role}>
                        {node.role}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Department Pill + Subordinates Count Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--color-divider)]/40 text-[10px]">
                    <span className={clsx("px-1.5 py-0.2 rounded font-semibold truncate max-w-[125px]", dept.bg, dept.color)}>
                      {dept.name}
                    </span>

                    {/* Collapsible Children Toggle Pill */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => toggleCollapse(node.id, e)}
                        className={clsx(
                          "px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs",
                          isBranchCollapsed
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-divider)]"
                        )}
                        title={isBranchCollapsed ? `Expand ${node.children.length} direct report(s)` : `Collapse direct reports`}
                      >
                        <Users size={10} />
                        <span>{node.children.length}</span>
                        {isBranchCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Picture-in-Picture Radar Minimap ── */}
        {showMinimap && bounds.width > 0 && (
          <div className="absolute right-3 bottom-3 p-1 rounded-2xl bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-divider)] shadow-lg hidden sm:block">
            <div className="px-2 py-0.5 flex items-center justify-between text-[9px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-divider)]/50 mb-1">
              <span className="flex items-center gap-1">
                <Compass size={10} /> Radar
              </span>
              <button
                type="button"
                onClick={() => setShowMinimap(false)}
                className="hover:text-[var(--color-text)]"
                title="Hide minimap"
              >
                <X size={10} />
              </button>
            </div>
            <canvas
              ref={minimapCanvasRef}
              width={150}
              height={95}
              onClick={handleMinimapClick}
              className="rounded-lg cursor-crosshair block bg-[var(--color-surface-2)]"
              title="Click anywhere on radar to pan view"
            />
          </div>
        )}

        {/* ── Search Match Quick Jump Banner ── */}
        {searchQuery && searchMatchingIds.size > 0 && (
          <div className="absolute left-4 top-4 z-20 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-lg flex items-center gap-2 text-xs">
            <Sparkles size={13} className="text-amber-500" />
            <span className="font-semibold text-[var(--color-text)]">
              {searchMatchingIds.size} match{searchMatchingIds.size !== 1 ? 'es' : ''} found
            </span>
            <div className="flex items-center gap-1 ml-1">
              {Array.from(searchMatchingIds).slice(0, 3).map(id => {
                const m = members.find(mem => mem.id === id);
                if (!m) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => jumpToNode(id)}
                    className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-primary-highlight-hex)] hover:text-[var(--color-primary-hex)] text-[10px] font-semibold text-[var(--color-text-muted)] transition-colors cursor-pointer"
                  >
                    {m.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {members.length < 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-faint)] pointer-events-none p-12 text-center">
            <Users size={38} className="mb-3 opacity-30 text-[var(--color-primary-hex)]" aria-hidden="true" />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Build Your Team Reporting Structure</h4>
            <p className="max-w-xs text-xs font-medium text-[var(--color-text-muted)] mt-1">
              Add members and set their &ldquo;Reports To&rdquo; field in the Team Hub to automatically compile this dynamic interactive hierarchy tree.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberHierarchy;