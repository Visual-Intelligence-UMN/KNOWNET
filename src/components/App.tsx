'use Client'
import { ChatPanel } from './chat-panel.tsx';
import { useChat } from 'ai/react';
import { useLocalStorage } from '../lib/hooks/use-local-storage.ts';
import { toast } from 'react-hot-toast';
import { type Message } from 'ai/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EmptyScreen } from './empty-screen.tsx';
import { ChatList } from './chat-list.tsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { ViewModeProvider } from './ui/view-mode.tsx';
import { OnEdgesChange, ReactFlowProvider } from 'reactflow';
import { ChatScrollAnchor } from './chat-scroll-anchors.tsx';
import { CustomGraphNode, CustomGraphEdge, BackendData } from '../lib/types.ts';
import Slider from './chat-slider.tsx';
import {
  useNodesState,
  Position,
  ReactFlowInstance,
  useEdgesState,
  OnConnect,
  addEdge
} from 'reactflow';
import dagre from 'dagre';
import { useAtom } from 'jotai';
import { gptTriplesAtom, recommendationsAtom, backendDataAtom } from '../lib/state.ts';
import { fetchBackendData, highLevelNodes, colorForCategory, normalizeCategory } from '../lib/utils.tsx';

import FlowComponent from './vis-flow/index.tsx';
import { Button } from './ui/button.tsx';
import { IconRefresh, IconStop } from './ui/icons.tsx';
import 'reactflow/dist/style.css'

// Initialize dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 172;
const nodeHeight = 86;
// Map freeform predicates to KG canonical types
const normalizePredicate = (p: string): string => {
  const key = (p || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' '); // handle HELP_SLOW, help-slow → "help slow"

  const MAP: Record<string, string> = {
    // canonical, direct
    'interacts with': 'INTERACTS_WITH',
    'associated with': 'ASSOCIATED_WITH',
    'coexists with': 'COEXISTS_WITH',
    'prevents': 'PREVENTS',
    'treats': 'TREATS',
    'causes': 'CAUSES',
    'produces': 'PRODUCES',
    'inhibits': 'INHIBITS',
    'stimulates': 'STIMULATES',
    'augments': 'AUGMENTS',
    'affects': 'AFFECTS',

    // common paraphrases → canonical
    'prevent': 'PREVENTS',
    'treat': 'TREATS',
    'cause': 'CAUSES',
    'produce': 'PRODUCES',

    'support': 'AUGMENTS',
    'supports': 'AUGMENTS',

    'reduce': 'INHIBITS',
    'reduces': 'INHIBITS',
    'reduced': 'INHIBITS',
    'reducing': 'INHIBITS',

    'help slow': 'INHIBITS',
    'helps slow': 'INHIBITS',
    'slow': 'INHIBITS',
    'slows': 'INHIBITS',
    'slowing': 'INHIBITS',

    'benefit': 'AFFECTS',
    'benefits': 'AFFECTS',

    'improve': 'AFFECTS',
    'improves': 'AFFECTS',
    'improved': 'AFFECTS',
    'improving': 'AFFECTS',

    'leads to': 'CAUSES',
    'leading to': 'CAUSES',
  };

  return MAP[key] ?? p; // fall back to original if unknown
};

const getLayoutedElements = (
  nodes: CustomGraphNode[],
  edges: CustomGraphEdge[],
  direction = 'TB'
) => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  const { minX, minY, maxX, maxY } = nodes.reduce(
    (acc, node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const nodeMinX = nodeWithPosition.x - nodeWidth / 2;
      const nodeMinY = nodeWithPosition.y - nodeHeight / 2;
      const nodeMaxX = nodeWithPosition.x + nodeWidth / 2;
      const nodeMaxY = nodeWithPosition.y + nodeHeight / 2;
      return {
        minX: Math.min(acc.minX, nodeMinX),
        minY: Math.min(acc.minY, nodeMinY),
        maxX: Math.max(acc.maxX, nodeMaxX),
        maxY: Math.max(acc.maxY, nodeMaxY)
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const graphWidth = maxX - minX + nodeWidth;
  const graphHeight = maxY - minY + nodeHeight;
  const offsetX = (window.innerWidth - graphWidth) / 2;
  const offsetY = (window.innerHeight - graphHeight) / 2;

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2 - offsetX,
      y: nodeWithPosition.y - nodeHeight / 2 - offsetY
    };
  });

  return { nodes, edges };
};

const updateStyle = (nodes: any[], edges: any[], activeStep: number) => {
  nodes.forEach(node => {
    const currentOpacity = node.step === activeStep ? 1 : 0.6;
    node.style = { ...node.style, opacity: currentOpacity };
  });
  edges.forEach(edge => {
    edge.style = {
      ...edge.style,
      opacity: edge.step === activeStep ? 1 : 0.4
    };
  });
  return { nodes, edges };
};

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[];
  id?: string;
}

export function Chat({ id, initialMessages }: ChatProps) {
  const lastEntityCategoriesRef = useRef<Record<string, string>>({});
  const reloadFlag = useRef(false);
  const initialRender = useRef(true);
  const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';
  const sentForVerification = useRef<Set<string>>(new Set());

  const [previewToken, setPreviewToken] = useLocalStorage<string | null>('ai-token', null);
  const [previewTokenDialog, setPreviewTokenDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // (existing atoms / state)
  const [recommendations] = useAtom(recommendationsAtom);
  const recommendationMaxLen = useRef(0);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const [gptTriples, setGptTriples] = useAtom(gptTriplesAtom);
  const gptTriplesRef = useRef(gptTriples);
  const [backendData, setBackendData] = useAtom(backendDataAtom);
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(true);

  const entityPattern = /\[([^\]\|]+)(?:\|([^\]]+))?\]\(\$N(\d+)\)/g;
  const relationPattern = /\[([^\]]+)\]\((\$R\d+), (.+?)\)/g;

  const extractRelations = (text: string): {
    relations: Array<[string, string, string]>,
    entityCategories: Record<string, string>
  } => {
    let entityMatch: RegExpExecArray | null;
    const entitiesByCode: Record<string, { name: string, category?: string }> = {};
    const entityCategoriesByName: Record<string, string> = {};

    while ((entityMatch = entityPattern.exec(text)) !== null) {
      const [, name, category, code] = entityMatch;
      const ncode = `$N${code}`;
      entitiesByCode[ncode] = { name, category: category?.trim() };
      if (category) entityCategoriesByName[name] = category.trim();
    }

    let relationMatch: RegExpExecArray | null;
    const outputRelations: Array<[string, string, string]> = [];
    while ((relationMatch = relationPattern.exec(text)) !== null) {
      const [, relationName, _relationCode, relationDetails] = relationMatch;
      const details = relationDetails.split(';');
      details.forEach(detail => {
        const codes = detail.trim().split(', ').map(s => s.trim());
        if (codes.every(c => entitiesByCode[c]?.name)) {
          const e1 = entitiesByCode[codes[0]].name;
          const e2 = entitiesByCode[codes[1]].name;
          outputRelations.push([e1, relationName, e2]);
        }
      });
    }
    if (typeof window !== 'undefined') {
      (window as any).__kn_lastEntityCategories = entityCategoriesByName;
    }
    return { relations: outputRelations, entityCategories: entityCategoriesByName };
  };

  const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
    api: `${API_BASE}/api/chat`,
    initialMessages,
    id,
    body: { id },
    streamProtocol: 'text',
    headers: { 'x-openai-key': previewToken ?? '' },
    onResponse(response) {
      if (response.status === 401) {
        toast.error(response.statusText);
        return;
      }
      if (reloadFlag.current) {
        reloadFlag.current = false;
      } else if (messages.length !== 0) {
        setActiveStep((activeStep) => activeStep + 1);
      }
    },
    onFinish(message) {
      if (!location.pathname.includes('chat')) {
        navigate(`/chat/${id}`, { replace: true });
      }
      if (message.role === 'assistant' && !processedMessageIds.has(message.id)) {
        setProcessedMessageIds(new Set([...Array.from(processedMessageIds), message.id]));
      }
      const parts = message.content.split('||');
      const { relations: triples, entityCategories } = extractRelations(parts[0]);
      setGptTriples(triples);
      lastEntityCategoriesRef.current = entityCategories;
      if (recommendations.length === 0) {
        firstConversation(triples);
      }
    }
  });

  const withFetchBackendData = async (payload: any) => {
    setIsLoadingBackendData(true);
    const data = await fetchBackendData(payload, API_BASE);
    return data;
  };

  useEffect(() => {
    gptTriplesRef.current = gptTriples;
  }, [gptTriples]);

  useEffect(() => {
    if (initialRender.current) {
      const tokenSet = localStorage.getItem('has-token-been-set') === 'true';
      setPreviewTokenDialog(!tokenSet);
      initialRender.current = false;
    }
  }, []);

  const seenTriples = useRef<Set<string>>(new Set());
  useEffect(() => {
    const latestAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (!latestAssistantMsg) return;
    const parts = latestAssistantMsg.content.split('||');
    const { relations: triples, entityCategories } = extractRelations(parts[0]);

    const newTriples = triples.filter(triple => {
      const key = triple.join('|');
      return !seenTriples.current.has(key);
    });

    if (newTriples.length > 0) {
      lastEntityCategoriesRef.current = {
        ...lastEntityCategoriesRef.current,
        ...entityCategories
      };
      newTriples.forEach(t => seenTriples.current.add(t.join('|')));
      setGptTriples(prev => [...prev, ...newTriples]);
    }
  }, [messages, setGptTriples]);

  const convertBackendDataToFlowElements = (
    data: BackendData["data"],
    currentStep: number
  ) => {
    const nodes: CustomGraphNode[] = [];
    const edges: CustomGraphEdge[] = [];
    const nodeIds = new Set();
    const edgeIds = new Set();

    if (!data || !data.vis_res) return { nodes, edges };

    data.vis_res.nodes?.forEach(node => {
      if (!nodeIds.has(node.id)) {
        const normCat = normalizeCategory(node.name, node.category);
        const nodeColor = colorForCategory(normCat, node.name);
        nodes.push({
          id: node.id,
          data: {
            label: node.name,
            kgName: node.name,
            gptName: data.node_name_mapping?.[node.name],
            recommendations: data.recommendation,
            bgColor: nodeColor
          },
          position: { x: 0, y: 0 },
          type: 'custom',
          category: normCat,
          style: { opacity: 1, background: nodeColor, borderRadius: '5px' },
          step: currentStep
        });
        nodeIds.add(node.id);
      }
    });

    data.vis_res.edges?.forEach((edge: any) => {
      const edgeId = `e${edge.source}-${edge.target}`;
      const edgeRevId = `e${edge.target}-${edge.source}`;
      if (!edgeIds.has(edgeId) && !edgeIds.has(edgeRevId)) {
        edges.push({
          id: edgeId,
          source: edge.source,
          target: edge.target,
          label: edge.category,
          data: {
            papers: { [edge.category]: [edge.PubMed_ID] },
            sourceName: data.vis_res.nodes.find((n: any) => n.id === edge.source)?.name,
            targetName: data.vis_res.nodes.find((n: any) => n.id === edge.target)?.name
          },
          type: 'custom',
          step: currentStep,
          style: { opacity: 1 }
        });
        edgeIds.add(edgeId);
      } else {
        const existEdge = edges.find(e => e.id === edgeId);
        if (existEdge!['data']['papers'][edge.category]) {
          existEdge!['data']['papers'][edge.category].push(edge.PubMed_ID);
        } else {
          existEdge!['data']['papers'][edge.category] = [edge.PubMed_ID];
        }
      }
    });

    setIsLoadingBackendData(false);
    return { nodes, edges };
  };

  const convertGptDataToFlowElements = (
    data: string[][],
    currentStep: number,
    entityCategories: Record<string, string>
  ) => {
    const nodes: CustomGraphNode[] = [];
    const edges: CustomGraphEdge[] = [];
    const nodeIds = new Set();
    const edgeIds = new Set();

    if (!data) return { nodes, edges };

    data.forEach(([subject, predicate, object], index) => {
      const subjectId = `node-${subject}`;
      const objectId = `node-${object}`;

      if (!nodeIds.has(subjectId)) {
        const subjectCategoryRaw = entityCategories[subject] ?? "Objects";
        const normSubjectCat = normalizeCategory(subject, subjectCategoryRaw);
        const subjectBg = colorForCategory(normSubjectCat, subject);
        nodes.push({
          id: subjectId,
          data: { label: subject, animationOrder: index, bgColor: subjectBg },
          position: { x: 0, y: 0 },
          style: { opacity: 1, background: subjectBg, borderRadius: '5px' },
          type: 'custom',
          step: currentStep,
          category: normSubjectCat
        });
        nodeIds.add(subjectId);
      }

      if (!nodeIds.has(objectId)) {
        const objectCategoryRaw = entityCategories[object] ?? "Objects";
        const normObjectCat = normalizeCategory(object, objectCategoryRaw);
        const objectBg = colorForCategory(normObjectCat, object);
        nodes.push({
          id: objectId,
          data: { label: object, animationOrder: index + 0.5, bgColor: objectBg },
          position: { x: 0, y: 0 },
          style: { opacity: 1, background: objectBg, borderRadius: '5px' },
          type: 'custom',
          step: currentStep,
          category: normObjectCat
        });
        nodeIds.add(objectId);
      }

      const edgeId = `edge-${subject}-${object}`;
      if (!edgeIds.has(edgeId)) {
        edges.push({
          id: edgeId,
          source: subjectId,
          target: objectId,
          label: predicate,
          data: {relation:predicate},
          type: 'custom',
          style: { stroke: 'black', opacity: 1 },
          step: currentStep
        });
        edgeIds.add(edgeId);
      }
    });

    setIsLoadingBackendData(false);
    return { nodes, edges };
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = useState('TB');
  const [activeStep, setActiveStep] = useState(0);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

  const updateLayout = useCallback(
    (direction = layoutDirection) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes as CustomGraphNode[], edges as CustomGraphEdge[], direction);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
      }
    },
    [nodes, edges, setNodes, setEdges, layoutDirection, reactFlowInstance]
  );

  useEffect(() => { updateLayout(); }, [reactFlowInstance, nodes, edges]); // eslint-disable-line

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = updateStyle(nodes, edges, activeStep);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [activeStep]); // eslint-disable-line

  const appendDataToFlow1 = useCallback(
    (newData: string[][], currentStep: number, entityCategories: Record<string, string>) => {
      const { nodes: newNodes, edges: newEdges } =
        convertGptDataToFlowElements(newData, currentStep, entityCategories);

      const isUpgrade = (oldCat?: string, newCat?: string, oldBg?: string) => {
        const oldIsObjects = !oldCat || oldCat === 'Objects';
        const newIsObjects = !newCat || newCat === 'Objects';
        const oldIsGrayish = !oldBg || oldBg === '#e5e7eb' || oldBg === '#dddddd';
        return (oldIsObjects && !newIsObjects) || (!newIsObjects && newCat !== oldCat) || oldIsGrayish;
      };

      setNodes(currentNodes => {
        const byId = new Map<string, CustomGraphNode>(currentNodes.map(n => [n.id, n]));
        newNodes.forEach(nn => {
          const existing = byId.get(nn.id);
          if (!existing) {
            byId.set(nn.id, {
              ...nn,
              position: { x: Math.random() * 400, y: Math.random() * 400 },
              step: currentStep
            });
          } else {
            const oldCat = existing.category;
            const oldBg = existing.data?.bgColor as string | undefined;
            const newCat = nn.category;
            if (isUpgrade(oldCat, newCat, oldBg)) {
              const newBg = colorForCategory(newCat, nn.data?.label as string | undefined);
              byId.set(nn.id, {
                ...existing,
                category: newCat,
                data: { ...existing.data, bgColor: newBg, label: existing.data?.label ?? nn.data?.label },
                style: { ...existing.style, background: newBg }
              });
            } else {
              byId.set(nn.id, { ...existing, step: currentStep });
            }
          }
        });

        const filtered = Array.from(byId.values()).filter(node => {
          const label = (node.data?.label || '').toLowerCase();
          return !highLevelNodes.some(d => label.includes(d));
        });

        return filtered;
      });

      setEdges(currentEdges => {
        const updatedEdges = [...currentEdges];
        newEdges.forEach(newEdge => {
          const edgeS = newEdge.source.substring(5);
          const edgeT = newEdge.target.substring(5);
          const edgeId = `edge-${edgeS}-${edgeT}`;
          if (!updatedEdges.find(e => e.id === edgeId)) {
            updatedEdges.push({ ...newEdge, step: currentStep });
          }
        });
        return updatedEdges;
      });
    },
    [setNodes, setEdges]
  );

  const continueConversation = async (recommendId: number, triples: string[][]) => {
    const payload = {
      input_type: 'continue_conversation',
      userId: id,
      data: { recommendId, triples }
    };
    const data = await withFetchBackendData(payload);
    if (data) setBackendData(data);
  };

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  const proOptions = { hideAttribution: true };
  const onInit = setReactFlowInstance;
  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const firstConversation = async (triples: string[][]) => {
    const payload = {
      input_type: 'new_conversation',
      userId: id,
      data: { triples }
    };
    const data = await withFetchBackendData(payload);
    if (data) setBackendData(data);
  };

  useEffect(() => {
    if (gptTriples) {
      appendDataToFlow1(gptTriples, activeStep, lastEntityCategoriesRef.current);
    }
  }, [gptTriples, appendDataToFlow1, activeStep]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__kn_lastTriples = gptTriples ?? [];
    }
  }, [gptTriples]);

  useEffect(() => {
    const all = gptTriples ?? [];
    if (!sentForVerification.current) return;

    // find triples not attempted yet
    // figure out which triples we haven't successfully verified yet
    const unseen = all.filter(triple => {
      const key = triple.join('|');
      return !sentForVerification.current.has(key);
    });
    if (unseen.length === 0) return;

    // mark these as pending now
    const pendingKeys = unseen.map(t => t.join('|'));
    pendingKeys.forEach(k => sentForVerification.current.add(k));

    // NEW: normalize predicates we send to the server
    const normalizedTriples = unseen.map(([h, p, t]) => [h, normalizePredicate(p), t] as [string,string,string]);

    (async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (previewToken) {
          headers['x-openai-key'] = previewToken;
          // headers['Authorization'] = `Bearer ${previewToken}`; // optional fallback
        }

        const res = await fetch(`${API_BASE}/api/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ triples: normalizedTriples })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { results } = await res.json();
        const buildKey = (h: string, rel: string, t: string) =>
          `${(h || '').toLowerCase()}|${(rel || '').toLowerCase()}|${(t || '').toLowerCase()}`;

        const idx = new Map<string, any>();
        (results || []).forEach((r: any) => {
          // server echoes back `relation` as sent; keep that for exact match
          idx.set(buildKey(r.head, r.relation, r.tail), r);
        });

        const DRAW_MS = 400;
        setTimeout(() => {
          setEdges(prev =>
            prev.map(e => {
              const head = e.source.replace(/^node-/, '');
              const tail = e.target.replace(/^node-/, '');
              const baseRel =
                (e.data && (e.data as any).relation)
                  ? (e.data as any).relation
                  : (e.label as string);

              // Try normalized key first, then original label as fallback
              const normRel = normalizePredicate(baseRel);
              const vr =
                idx.get(buildKey(head, normRel, tail)) ||
                idx.get(buildKey(head, baseRel, tail));

              if (!vr) return e;

              const style = { ...e.style, strokeLinecap: 'butt' as const };
              if (vr.ui_hint === 'weak') {
                style.strokeDasharray = '6 4';
                style.strokeWidth = 2;
              } else if (vr.ui_hint === 'missing') {
                style.strokeDasharray = '2 4';
                style.strokeWidth = 2;
              } else {
                style.strokeDasharray = undefined;
                style.strokeWidth = 2.5;
              }

              const count = typeof vr.count === 'number' ? vr.count : 0;
              const papers: string[] = Array.isArray(vr.papers) ? vr.papers : [];

              return {
                ...e,
                // You can keep user-facing text OR switch to canonical; your call:
                // label: `${normRel} | ${count}`,
                label: `${baseRel} | ${count}`,
                data: {
                  ...(e.data || {}),
                  relation: baseRel,
                  verification: vr,
                  papers: { [normRel]: papers }, // store under canonical key
                  papersList: papers
                },
                style
              };
            })
          );
        }, DRAW_MS);
      } catch (err) {
        console.error('[verify] request failed:', err);
        pendingKeys.forEach(k => sentForVerification.current.delete(k));
      }
    })();

  }, [gptTriples, setEdges, API_BASE]);




  useEffect(() => {
    const handleResize = () => { updateLayout(); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, [updateLayout]);

  // ========= NEW: recs for clicked node =========
  type Suggestion = {
    text: string;
    head: { id: string; name: string; types: string[] };
    relation: { type: string; direction: string };
    tail: { id: string; name: string; types: string[] };
    count: number;
    source: string;
  };

  const [clickedNode, setClickedNode] = useState<any>(null);
  const [activeNodeRecs, setActiveNodeRecs] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!clickedNode) {
      setActiveNodeRecs([]);
      return;
    }
    const headName =
      clickedNode?.data?.label ||
      String(clickedNode?.id || '').replace(/^node-/, '');

    (async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (previewToken) headers['x-openai-key'] = previewToken;
        const res = await fetch(`${API_BASE}/api/recommend`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            head: headName,
            k: 5,
            whitelist: ["INTERACTS_WITH","TREATS","AFFECTS","PREVENTS","INHIBITS","STIMULATES","ASSOCIATED_WITH","CAUSES","AUGMENTS","PRODUCES","COEXISTS_WITH"],
            direction: "any",
            per_type_cap: 2,
            exclude: []
          })
        });
        const json = await res.json();
        setActiveNodeRecs(Array.isArray(json?.suggestions) ? json.suggestions : []);
      } catch (e) {
        console.error('[recommend] failed', e);
        setActiveNodeRecs([]);
      }
    })();
  }, [clickedNode, API_BASE]);

  // ========= UI =========
  const StopRegenerateButton = isLoading ? (
    <Button variant="outline" onClick={() => stop()} className="relative left-[60%]">
      <IconStop className="mr-2" /> Stop
    </Button>
  ) : (
    <Button
      variant="outline"
      onClick={() => {
        reloadFlag.current = true;
        reload();
      }}
      className="relative left-[60%]"
    >
      <IconRefresh className="mr-2" /> Regenerate
    </Button>
  );

  const r = 18,
    c = Math.PI * (r * 2),
    val = (recommendations.length - 1) / recommendationMaxLen.current,
    pct = val * c;

  const circleProgress =
    recommendationMaxLen.current > 0 && recommendations.length >= 0 ? (
      <svg id="svg" width="40" height="40">
        <g transform={`rotate(-90 20 20)`}>
          <circle r={r} cx="20" cy="20" fill="transparent" strokeDasharray={c} strokeDashoffset="0" stroke="#aaa" strokeWidth="5px"></circle>
          <circle id="bar" r={r} cx="20" cy="20" fill="transparent" strokeDasharray={c} strokeDashoffset={pct} stroke="#111" strokeWidth="5px"></circle>
        </g>
        <text x="50%" y="50%" textAnchor="middle" fontSize="12px" dy=".3em">
          {recommendationMaxLen.current - recommendations.length + 1}/{recommendationMaxLen.current}
        </text>
      </svg>
    ) : null;

  return (
    <div className="max-w-[100vw] rounded-lg border bg-background p-4">
      {messages.length ? (
        <>
          {/* GRID: [chat | graph] (sidebar removed) */}
          <div className="pt-4 md:pt-10 md:grid md:grid-cols-[2fr_3fr] gap-4">
            {/* LEFT: chat list */}
            <div className="overflow-auto min-w-0">
              <ViewModeProvider>
                <ChatList
                  messages={messages}
                  activeStep={activeStep}
                  nodes={nodes}
                  edges={edges}
                  clickedNode={clickedNode}
                />
              </ViewModeProvider>
              {activeStep == messages.length / 2 - 1 && StopRegenerateButton}
              <ChatScrollAnchor trackVisibility={isLoading} />
            </div>

            {/* MIDDLE: graph */}
            <div className="min-w-0">
              <ReactFlowProvider>
                <FlowComponent
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  proOptions={proOptions}
                  onConnect={onConnect}
                  onInit={onInit}
                  setClickedNode={setClickedNode}
                  updateLayout={updateLayout}
                  setLayoutDirection={setLayoutDirection}
                  isLoading={isLoading}
                  isLoadingBackendData={isLoadingBackendData}
                  id={id}
                  append={append}
                  activeStep={activeStep}
                />
              </ReactFlowProvider>
            </div>
          </div>

          <div className="flex justify-center items-center pt-3">
            <Slider
              messages={messages}
              steps={messages.length / 2}
              activeStep={activeStep}
              handleNext={() => handleStepChange(Math.min(activeStep + 1, nodes.length - 1))}
              handleBack={() => handleStepChange(Math.max(activeStep - 1, 0))}
              jumpToStep={handleStepChange}
            />
            {circleProgress}
          </div>
        </>
      ) : (
        <EmptyScreen
          setInput={setInput}
          id={id!}
          append={append}
          setApiKey={(k: string) => {
            setPreviewToken(k);
            localStorage.setItem('has-token-been-set', 'true');
          }}
          initialOpen={!previewToken}
        />
      )}

      {/* Bottom Chat Panel now also receives recs + clicked label */}
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        recommendations={activeNodeRecs}
        clickedLabel={
          clickedNode?.data?.label ||
          String(clickedNode?.id || '').replace(/^node-/, '') ||
          ''
        }
      />
    </div>
  );
}
