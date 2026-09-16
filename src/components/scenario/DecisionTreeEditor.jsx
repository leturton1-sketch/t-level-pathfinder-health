import { useMemo, useState } from "react";
import {
  GitBranch, Plus, Trash2, ChevronRight, ChevronDown, CornerDownRight,
  Flag, CircleDot, ArrowRight, GripVertical, AlertCircle,
} from "lucide-react";

/**
 * Branching pathway builder for simulation scenarios.
 *
 * Decision tree shape (stored as a JSON string in scenario.decision_tree):
 * {
 *   entry: "n1",
 *   nodes: {
 *     n1: { id: "n1", prompt: "...", options: [
 *       { id: "o1", label: "...", correct: true, feedback: "...", next: "n2" },
 *       { id: "o2", label: "...", correct: false, feedback: "...", next: null }  // null = end scenario
 *     ] }
 *   }
 * }
 *
 * Props: value (string|null), onChange(parsedJsonString)
 */

const END = "__end__";

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyTree() {
  const entry = newId("n");
  return {
    entry,
    nodes: {
      [entry]: { id: entry, prompt: "", options: [{ id: newId("o"), label: "", correct: true, feedback: "", next: null }] },
    },
  };
}

function parseTree(value) {
  if (!value) return emptyTree();
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || !parsed.nodes) return emptyTree();
    // normalise option shape + ids
    const nodes = {};
    Object.values(parsed.nodes).forEach((n) => {
      nodes[n.id] = {
        id: n.id,
        prompt: n.prompt || "",
        options: (n.options || []).map((o) => ({
          id: o.id || newId("o"),
          label: o.label || "",
          correct: !!o.correct,
          feedback: o.feedback || "",
          next: o.next ?? null,
        })),
      };
    });
    return { entry: parsed.entry || Object.keys(nodes)[0], nodes };
  } catch {
    return emptyTree();
  }
}

export default function DecisionTreeEditor({ value, onChange }) {
  const [tree, setTree] = useState(() => parseTree(value));
  const [collapsed, setCollapsed] = useState({});

  const nodeOrder = useMemo(() => {
    const order = [];
    const seen = new Set();
    const walk = (id) => {
      if (!id || seen.has(id) || !tree.nodes[id]) return;
      seen.add(id);
      order.push(id);
      tree.nodes[id].options.forEach((o) => walk(o.next || null));
    };
    walk(tree.entry);
    // append any orphaned nodes
    Object.keys(tree.nodes).forEach((id) => { if (!seen.has(id)) order.push(id); });
    return order;
  }, [tree]);

  const commit = (next) => {
    setTree(next);
    onChange(JSON.stringify(next));
  };

  const updateNode = (nodeId, patch) => {
    commit({ ...tree, nodes: { ...tree.nodes, [nodeId]: { ...tree.nodes[nodeId], ...patch } } });
  };

  const updateOption = (nodeId, optId, patch) => {
    const node = tree.nodes[nodeId];
    const options = node.options.map((o) => (o.id === optId ? { ...o, ...patch } : o));
    updateNode(nodeId, { options });
  };

  const addNode = () => {
    const id = newId("n");
    const node = { id, prompt: "", options: [{ id: newId("o"), label: "", correct: true, feedback: "", next: null }] };
    commit({ ...tree, nodes: { ...tree.nodes, [id]: node } });
    setCollapsed((c) => ({ ...c, [id]: false }));
    return id;
  };

  const removeNode = (nodeId) => {
    if (Object.keys(tree.nodes).length <= 1) return; // keep at least one node
    const nodes = { ...tree.nodes };
    delete nodes[nodeId];
    // clear references to the removed node
    Object.values(nodes).forEach((n) => {
      n.options = n.options.map((o) => (o.next === nodeId ? { ...o, next: null } : o));
    });
    let entry = tree.entry;
    if (entry === nodeId) entry = Object.keys(nodes)[0];
    commit({ entry, nodes });
  };

  const addOption = (nodeId) => {
    const node = tree.nodes[nodeId];
    updateNode(nodeId, { options: [...node.options, { id: newId("o"), label: "", correct: false, feedback: "", next: null }] });
  };

  const removeOption = (nodeId, optId) => {
    const node = tree.nodes[nodeId];
    if (node.options.length <= 1) return;
    updateNode(nodeId, { options: node.options.filter((o) => o.id !== optId) });
  };

  const setEntry = (nodeId) => commit({ ...tree, entry: nodeId });

  const totalOptions = Object.values(tree.nodes).reduce((sum, n) => sum + n.options.length, 0);
  const reachable = nodeOrder.length;
  const orphaned = Object.keys(tree.nodes).length - reachable;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-heading font-bold text-blue-900">Branching Pathways</span>
          <span className="text-[10px] text-slate-500">{Object.keys(tree.nodes).length} nodes · {totalOptions} choices</span>
        </div>
        <button onClick={addNode} className="flex items-center gap-1 rounded-md bg-blue-600 text-white px-2 py-1 text-[10px] font-heading font-semibold hover:opacity-90">
          <Plus className="w-3 h-3" /> Add Node
        </button>
      </div>

      {orphaned > 0 && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300 px-2 py-1 text-[10px] text-amber-800">
          <AlertCircle className="w-3 h-3 shrink-0" /> {orphaned} node(s) are unreachable from the entry node. Link an option to them or delete them.
        </div>
      )}

      <div className="space-y-2">
        {nodeOrder.map((nodeId, idx) => {
          const node = tree.nodes[nodeId];
          const isEntry = tree.entry === nodeId;
          const isCollapsed = collapsed[nodeId];
          return (
            <div key={nodeId} className={`rounded-xl border bg-white ${isEntry ? "border-blue-400 ring-1 ring-blue-300" : "border-slate-200"}`}>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100">
                <GripVertical className="w-3 h-3 text-slate-300" />
                <span className={`grid h-5 w-5 place-items-center rounded-md text-[10px] font-black ${isEntry ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>{idx + 1}</span>
                {isEntry ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700"><Flag className="w-3 h-3" /> Entry node</span>
                ) : (
                  <button onClick={() => setEntry(nodeId)} className="text-[10px] font-semibold text-slate-400 hover:text-blue-600">Set as entry</button>
                )}
                <button onClick={() => setCollapsed((c) => ({ ...c, [nodeId]: !c[nodeId] }))} className="ml-auto p-0.5 rounded hover:bg-slate-100">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button onClick={() => removeNode(nodeId)} className="p-0.5 rounded hover:bg-clinical-red/10 text-clinical-red/70 hover:text-clinical-red" title="Remove node">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isCollapsed && (
                <div className="p-2.5 space-y-2">
                  <textarea value={node.prompt} onChange={(e) => updateNode(nodeId, { prompt: e.target.value })}
                    placeholder={`Decision ${idx + 1} prompt — e.g. "${isEntry ? "Patient is in Bed 1 and looks pale. What is your first action?" : "NEWS2 is 6. What do you do?"}"`}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 resize-y" />

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-wide">Options / branches</p>
                    {node.options.map((opt, oIdx) => (
                      <div key={opt.id} className={`rounded-lg border p-2 space-y-1.5 ${opt.correct ? "border-clinical-green/40 bg-clinical-green/5" : "border-slate-200 bg-slate-50/60"}`}>
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <input value={opt.label} onChange={(e) => updateOption(nodeId, opt.id, { label: e.target.value })}
                            placeholder={`Option ${oIdx + 1} — e.g. "Perform full ABCDE assessment"`}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" />
                          <button onClick={() => updateOption(nodeId, opt.id, { correct: !opt.correct })}
                            className={`shrink-0 rounded-md px-1.5 py-1 text-[9px] font-bold border transition ${opt.correct ? "bg-clinical-green text-white border-clinical-green" : "bg-white text-slate-400 border-slate-200 hover:border-clinical-green/50"}`}
                            title="Mark as correct response">
                            ✓ Correct
                          </button>
                          <button onClick={() => removeOption(nodeId, opt.id)} className="shrink-0 p-0.5 rounded hover:bg-clinical-red/10 text-clinical-red/70 hover:text-clinical-red" title="Remove option">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <input value={opt.feedback} onChange={(e) => updateOption(nodeId, opt.id, { feedback: e.target.value })}
                          placeholder="Feedback shown after this choice (clinical rationale)…"
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:outline-none focus:border-blue-400" />
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">Leads to:</span>
                          <select value={opt.next ?? END} onChange={(e) => updateOption(nodeId, opt.id, { next: e.target.value === END ? null : e.target.value })}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-400">
                            <option value={END}>— End scenario (debrief) —</option>
                            {nodeOrder.map((id) => (
                              <option key={id} value={id} disabled={id === nodeId}>
                                Node {nodeOrder.indexOf(id) + 1}{id === tree.entry ? " · entry" : ""}{tree.nodes[id]?.prompt ? ` · ${tree.nodes[id].prompt.slice(0, 36)}${tree.nodes[id].prompt.length > 36 ? "…" : ""}` : ""}
                              </option>
                            ))}
                          </select>
                          {opt.next && tree.nodes[opt.next] && (
                            <button onClick={() => setCollapsed((c) => ({ ...c, [opt.next]: false }))}
                              className="shrink-0 flex items-center gap-0.5 rounded-md bg-blue-100 text-blue-700 px-1.5 py-1 text-[9px] font-bold hover:bg-blue-200">
                              <CircleDot className="w-3 h-3" /> Jump
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addOption(nodeId)} className="flex items-center gap-1 rounded-md border border-dashed border-blue-300 text-blue-600 px-2 py-1 text-[10px] font-heading font-semibold hover:bg-blue-50">
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nodeOrder.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">No decision nodes yet. Add a node to start building the pathway.</p>
          <button onClick={addNode} className="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-heading font-semibold hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add First Node
          </button>
        </div>
      )}
    </div>
  );
}