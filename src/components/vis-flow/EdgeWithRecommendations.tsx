import * as React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

type RecItem = {
  head: string;
  relation: string;
  tail: string;
  count: number;
  papers?: string[];
  text?: string;
};

const relationToPhrase = (rel: string) => {
  if (!rel) return '';
  const R = rel.toUpperCase().trim();
  const map: Record<string, string> = {
    ASSOCIATED_WITH: 'is associated with',
    TREATS: 'treats',
    CAUSES: 'causes',
    INHIBITS: 'inhibits',
    ACTIVATES: 'activates',
    INTERACTS_WITH: 'interacts with',
    AFFECTS: 'affects',
    PART_OF: 'is part of',
    LOCATED_IN: 'is located in',
    UPREGULATES: 'upregulates',
    DOWNREGULATES: 'downregulates',
    RELATED_TO: 'is related to',
    EXPRESSES: 'expresses',
  };
  return map[R] ?? rel.toLowerCase().replace(/_/g, ' ');
};

export default function EdgeWithRecommendations(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX, sourceY, targetX, targetY,
    markerEnd,
    style,
    label,
    data
  } = props;

  const [isHover, setIsHover] = React.useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const head = String(source || '').replace(/^node-/, '');
  const tail = String(target || '').replace(/^node-/, '');

  const baseRel = React.useMemo(() => {
    const fromData = typeof data?.relation === 'string' ? data.relation : null;
    if (fromData) return fromData;
    const asString = typeof label === 'string' ? label : '';
    return asString.split('|')[0]?.trim() || '';
  }, [data?.relation, label]);

  const allRecs: RecItem[] = Array.isArray(data?.allRecs) ? data.allRecs : [];
  const onPick: ((item: RecItem) => void) | undefined = data?.onPick;

  const items = React.useMemo(() => {
    const hL = head.toLowerCase();
    const tL = tail.toLowerCase();
    const rL = baseRel.toLowerCase();
    return allRecs
      .filter((r) => {
        const rh = (r.head || '').toLowerCase();
        const rt = (r.tail || '').toLowerCase();
        const rr = (r.relation || '').toLowerCase();
        const pairMatch = (rh === hL && rt === tL) || (rh === tL && rt === hL);
        const oneSide = rh === hL || rt === tL || rh === tL || rt === hL;
        const relMatch = rL && rr === rL;
        return pairMatch || (relMatch && oneSide);
      })
      .slice(0, 5);
  }, [allRecs, head, tail, baseRel]);

  const sentence = (it: RecItem) =>
    `${it.head} ${relationToPhrase(it.relation)} ${it.tail}${it.count ? ` (${it.count} ${it.count === 1 ? 'paper' : 'papers'})` : ''}`;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style as React.CSSProperties}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      />

      <EdgeLabelRenderer>
        {isHover && items.length > 0 && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 50
            }}
          >
            <div className="rounded-xl border bg-white shadow-lg p-2 max-w-[320px]">
              <div className="px-1 pb-1 text-xs font-medium text-gray-500">Suggestions</div>
              <ul className="space-y-1">
                {items.map((it, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <button
                      onClick={() => onPick?.(it)}
                      className="text-left text-sm hover:bg-gray-100 rounded-md px-2 py-1 w-full"
                    >
                      {sentence(it)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
