"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3006";

const emptyGame24 = () => ["", "", "", ""];
const emptySentences = () => ["", "", "", ""];

function TreeNode({ node, nodesById, depth }) {
  const children = Object.values(nodesById).filter(
    (n) => n.parentId === node.id
  );
  const hasChildren = children.length > 0;

  return (
    <div className="tree-node-wrap">
      <div
        className={`node-circle ${depth === 0 ? "root" : ""} ${
          node.verdict ? node.verdict : ""
        } ${node.pruned ? "pruned" : ""}`}
      >
        <span className="node-label">{node.label}</span>
        {node.verdict && (
          <span className={`verdict-badge ${node.verdict}`}>
            {node.verdict}
          </span>
        )}
      </div>
      {hasChildren && (
        <>
          <div className="tree-connector-vertical" />
          <div className="tree-children-row">
            {children.map((child, i) => (
              <div key={child.id} className="tree-branch">
                <div className="tree-connector-vertical tree-connector-to-child" />
                <TreeNode
                  node={child}
                  nodesById={nodesById}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [nodesById, setNodesById] = useState({});
  const [solution, setSolution] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const wsRef = useRef(null);

  const [game24Numbers, setGame24Numbers] = useState(emptyGame24());
  const [creativeWritingSentences, setCreativeWritingSentences] = useState(emptySentences());
  const [validationError, setValidationError] = useState(null);

  const reset = useCallback(() => {
    setNodesById({});
    setSolution(null);
    setError(null);
    setValidationError(null);
    setRound(0);
  }, []);

  const run = useCallback(
    (payload) => {
      reset();
      setRunning(true);
      setStatus("Connecting…");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Running…");
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "init":
              setStatus(`Running ${data.task}…`);
              break;
            case "round":
              setRound(data.round ?? 0);
              break;
            case "node":
              setNodesById((prev) => ({
                ...prev,
                [data.id]: {
                  id: data.id,
                  parentId: data.parentId,
                  label: data.label,
                  depth: data.depth ?? 0,
                  verdict: null,
                  pruned: false,
                },
              }));
              break;
            case "evaluate":
              setNodesById((prev) => {
                const next = { ...prev };
                if (next[data.nodeId]) {
                  next[data.nodeId] = {
                    ...next[data.nodeId],
                    verdict: data.verdict,
                  };
                }
                return next;
              });
              break;
            case "prune":
              setNodesById((prev) => {
                const next = { ...prev };
                if (next[data.nodeId]) {
                  next[data.nodeId] = {
                    ...next[data.nodeId],
                    pruned: true,
                    verdict: "impossible",
                  };
                }
                return next;
              });
              break;
            case "solution":
              setSolution(data.result);
              setStatus("Done");
              setRunning(false);
              if (ws.readyState === WebSocket.OPEN) ws.close();
              break;
            case "error":
              setError(data.message ?? "Unknown error");
              setStatus("Error");
              setRunning(false);
              if (ws.readyState === WebSocket.OPEN) ws.close();
              break;
            default:
              break;
          }
        } catch (e) {
          setError("Invalid message from server");
        }
      };

      ws.onerror = () => {
        setError("WebSocket error. Is the WS server running on " + WS_URL + "?");
        setStatus("Error");
        setRunning(false);
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (running) setStatus("Done");
      };
    },
    [reset, running]
  );

  const runGame24 = useCallback(() => {
    setValidationError(null);
    const raw = game24Numbers.map((s) => String(s).trim());
    if (raw.some((s) => s === "")) {
      setValidationError("Please enter all 4 numbers for Game of 24.");
      return;
    }
    const numbers = raw.map((s) => Number(s));
    if (numbers.some((n) => Number.isNaN(n))) {
      setValidationError("All 4 values must be numbers.");
      return;
    }
    run({
      type: "run",
      task: "game24",
      payload: { numbers },
    });
  }, [game24Numbers, run]);

  const runCreativeWriting = useCallback(() => {
    setValidationError(null);
    const sentences = creativeWritingSentences.map((s) => String(s).trim());
    if (sentences.some((s) => s === "")) {
      setValidationError("Please enter all 4 sentences for Creative Writing.");
      return;
    }
    run({
      type: "run",
      task: "creativeWriting",
      payload: { sentences },
    });
  }, [creativeWritingSentences, run]);

  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const root = Object.values(nodesById).find((n) => n.parentId === null);

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 1.5rem",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>
        Tree of Thoughts
      </h1>
      <p style={{ color: "#a1a1aa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Enter input for either task, then click Run. The tree updates in real time.
      </p>

      <div className="payload-forms">
        <section className="payload-section">
          <h2 className="payload-heading">Game of 24</h2>
          <p className="payload-hint">Enter 4 numbers (e.g. 4, 9, 10, 13)</p>
          <div className="payload-inputs">
            {game24Numbers.map((val, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                placeholder={`Number ${i + 1}`}
                value={val}
                onChange={(e) => {
                  setGame24Numbers((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  });
                }}
                disabled={running}
                className="payload-input"
              />
            ))}
          </div>
          <button
            type="button"
            className="primary run-btn"
            disabled={running}
            onClick={runGame24}
          >
            Run Game of 24
          </button>
        </section>

        <section className="payload-section">
          <h2 className="payload-heading">Creative Writing</h2>
          <p className="payload-hint">Enter 4 seed sentences</p>
          <div className="payload-sentences">
            {creativeWritingSentences.map((val, i) => (
              <textarea
                key={i}
                placeholder={`Sentence ${i + 1}`}
                value={val}
                onChange={(e) => {
                  setCreativeWritingSentences((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  });
                }}
                disabled={running}
                className="payload-textarea"
                rows={2}
              />
            ))}
          </div>
          <button
            type="button"
            className="primary run-btn"
            disabled={running}
            onClick={runCreativeWriting}
          >
            Run Creative Writing
          </button>
        </section>
      </div>

      {validationError && (
        <div className="error-msg" style={{ marginBottom: "0.5rem" }}>
          {validationError}
        </div>
      )}

      <div className="status-bar">
        {status}
        {round > 0 && ` · Round ${round}`}
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="tree-container">
        {root && (
          <div className="tree-root">
            <TreeNode
              node={root}
              nodesById={nodesById}
              depth={0}
            />
          </div>
        )}
        {!root && !solution && !running && (
          <p style={{ color: "#71717a" }}>Enter input above and click Run to start.</p>
        )}
      </div>

      {solution && (
        <div
          className={`solution-panel ${
            solution.success ? "success" : solution.partial ? "partial" : "fail"
          }`}
        >
          <strong>
            {solution.success
              ? "Solution"
              : solution.partial
                ? "Best partial"
                : "No solution"}
          </strong>
          <pre style={{ marginTop: "0.5rem" }}>{solution.solution}</pre>
          <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            Steps: {solution.steps}
          </p>
        </div>
      )}
    </main>
  );
}
