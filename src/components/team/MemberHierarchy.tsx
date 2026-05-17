import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Member } from '../../types';
import { 
  Building, 
  Maximize, 
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import Button from '../shared/Button';

interface Node {
  member: Member;
  x: number;
  y: number;
  width: number;
  height: number;
  children: Node[];
  parent?: Node;
  depth: number;
  prelim: number;
  mod: number;
  ancestor: Node;
  change: number;
  shift: number;
  number: number;
  thread?: Node;
}

const MemberHierarchy: React.FC = () => {
  const { state } = useProject();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ panX: 0, panY: 40, zoom: 0.8 });
  const [drag, setDrag] = useState({ active: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 600 * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, 600);
      
      const roots = buildTree(state.members);
      if (!roots.length) return;

      ctx.save();
      ctx.translate(view.panX, view.panY);
      ctx.scale(view.zoom, view.zoom);

      // Recursive drawing
      const NODE_W = 200, NODE_H = 70, GAP_X = 260, GAP_Y = 120;
      
      const drawNode = (n: Node) => {
        const px = n.depth * GAP_X;
        const py = n.number * GAP_Y; // Simple positioning for now
        
        // Lines to children
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        n.children.forEach((c, ci) => {
          const cx = (n.depth + 1) * GAP_X;
          const cy = (n.number + ci) * GAP_Y; // Needs real tree layout logic
          
          ctx.beginPath();
          ctx.moveTo(px + NODE_W, py + NODE_H / 2);
          const midX = px + NODE_W + (cx - (px + NODE_W)) / 2;
          ctx.lineTo(midX, py + NODE_H / 2);
          ctx.lineTo(midX, cy + NODE_H / 2);
          ctx.lineTo(cx, cy + NODE_H / 2);
          ctx.stroke();
          
          drawNode({...c, number: n.number + ci, depth: n.depth + 1});
        });

        // Node card
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px, py, NODE_W, NODE_H, 12);
        else ctx.rect(px, py, NODE_W, NODE_H);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(n.member.name, px + 20, py + 30);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10px sans-serif';
        ctx.fillText((n.member.role || 'Member').toUpperCase(), px + 20, py + 48);
      };

      roots.forEach((r, i) => drawNode({...r, number: i, depth: 0}));
      ctx.restore();
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [state.members, view]);

  const buildTree = (members: Member[]): Node[] => {
    const nodes: Record<string, Node> = {};
    const roots: Node[] = [];

    if (!members || !members.length) return [];

    // First pass: create all nodes
    members.forEach(m => {
      nodes[m.name] = {
        member: m, x: 0, y: 0, width: 0, height: 0, children: [], depth: 0,
        prelim: 0, mod: 0, ancestor: null!, change: 0, shift: 0, number: 0
      };
      nodes[m.name].ancestor = nodes[m.name];
    });

    // Second pass: link parents and children
    members.forEach(m => {
      if (m.reportsTo && nodes[m.reportsTo]) {
        nodes[m.reportsTo].children.push(nodes[m.name]);
        nodes[m.name].parent = nodes[m.reportsTo];
      } else {
        roots.push(nodes[m.name]);
      }
    });

    return roots;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrag({ active: true, lastX: e.clientX, lastY: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    setView({ ...view, panX: view.panX + dx, panY: view.panY + dy });
    setDrag({ ...drag, lastX: e.clientX, lastY: e.clientY });
  };

  const handleMouseUp = () => setDrag({ ...drag, active: false });

  const zoom = (factor: number) => {
    setView({ ...view, zoom: Math.max(0.2, Math.min(3, view.zoom * factor)) });
  };

  const reset = () => setView({ panX: 0, panY: 40, zoom: 0.8 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDrag({ active: true, lastX: touch.clientX, lastY: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drag.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - drag.lastX;
    const dy = touch.clientY - drag.lastY;
    setView({ ...view, panX: view.panX + dx, panY: view.panY + dy });
    setDrag({ ...drag, lastX: touch.clientX, lastY: touch.clientY });
  };

  return (
    <div className="space-y-6 mt-16 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building size={16} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Organization Map</h2>
        </div>
        <div className="flex gap-2 bg-[var(--color-surface)] border border-[var(--color-divider)] p-1 rounded-xl shadow-sm">
           <Button variant="ghost" size="icon" onClick={() => zoom(1.1)} className="h-8 w-8"><ZoomIn size={14}/></Button>
           <Button variant="ghost" size="icon" onClick={() => zoom(0.9)} className="h-8 w-8"><ZoomOut size={14}/></Button>
           <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8"><RotateCcw size={14}/></Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="h-[400px] md:h-[600px] w-full bg-[var(--color-surface-2)] rounded-2xl md:rounded-3xl border border-[var(--color-divider)] relative overflow-hidden cursor-grab active:cursor-grabbing shadow-inner touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {state.members.length < 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-faint)] pointer-events-none p-12 text-center">
             <div className="text-4xl mb-4 opacity-20">🌳</div>
             <p className="max-w-xs text-sm font-medium">Add members and set the "Reports To" field to visualize your team's structure here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberHierarchy;
