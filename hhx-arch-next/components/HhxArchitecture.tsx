'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window { mermaid?: any; CSS?: any; }
}

const mermaidCdn = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';

const HhxArchitecture: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [mermaidReady, setMermaidReady] = useState(false);
  const [graphDef, setGraphDef] = useState<string>(() => `
graph TB
  classDef userClass fill:#E1BEE7,stroke:#8E24AA,stroke-width:2px
  classDef apiClass fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
  classDef dbClass fill:#C8E6C9,stroke:#388E3C,stroke-width:2px
  classDef kafkaClass fill:#F8BBD0,stroke:#C2185B,stroke-width:2px
  classDef osClass fill:#B2DFDB,stroke:#00796B,stroke-width:2px
  classDef mlClass fill:#FFCCBC,stroke:#E64A19,stroke-width:2px
  classDef monitorClass fill:#FFCDD2,stroke:#C62828,stroke-width:2px
  classDef thirdPartyClass fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
  classDef constraintClass fill:#FFEBEE,stroke:#D32F2F,stroke-width:1px,stroke-dasharray:5 5

  WebUsers["🌐 Web Users"]
  MobileUsers["📱 Mobile Users"]
  AdminUsers["👤 Admin/Agents"]

  LB["⚖️ Load Balancer / API Gateway"]

  API1["🔷 API Server 1"]
  API2["🔷 API Server 2"]
  API3["🔷 API Server 3"]

  Postgres[("🐘 AWS RDS PostgreSQL<br/>Primary (Multi-AZ)")]
  PGConstraint["✓ ACID Compliant<br/>SLA: &lt;50ms writes (P95)"]
  WAL["🧾 WAL (Write-Ahead Log)"]

  Debezium["🔄 Debezium Connector<br/>PostgreSQL (pgoutput)"]
  DebeziumConstraint["⚡ Real-time Capture<br/>Lag: &lt;2s"]
  Kafka["📨 Kafka Topics<br/>- properties<br/>- users<br/>- inquiries"]
  KafkaConstraint["🔒 Buffer &amp; Replay<br/>At-least-once delivery"]

  MLEnrich["🤖 ML Enrichment<br/>- BERT embeddings<br/>- ResNet images<br/>- Feature extraction"]
  MLConstraint["🎯 768-dim text vectors<br/>2048-dim image vectors<br/>Real-time scoring"]

  Master1["⚙️ Master Node 1"]
  Master2["⚙️ Master Node 2"]
  Master3["⚙️ Master Node 3"]
  MasterConstraint["🎛️ Cluster Management<br/>Quorum: 3 nodes"]

  Coord1["🔀 Coordinating Node 1"]
  Coord2["🔀 Coordinating Node 2"]
  CoordConstraint["🎯 Route Requests<br/>Merge Results"]

  Data1["💾 Data Node 1"]
  Data2["💾 Data Node 2"]
  Data3["💾 Data Node 3"]
  Data4["💾 Data Node 4"]

  Indexes["📊 OpenSearch Indexes<br/>- properties: 6 shards<br/>- user_profiles: 3 shards<br/>- search_history"]
  IndexConstraint["⚡ Replication: 1<br/>HNSW: ef_c=512, m=32<br/>Refresh: 5s"]

  VectorSearch["🔍 k-NN Vector Search"]
  VectorConstraint["⏱️ 120-200ms<br/>Recall@10: 98.5%"]
  FullText["📝 Full-Text BM25"]
  FullTextConstraint["⚡ 50-200ms<br/>Fuzzy matching"]
  Aggregations["📈 Aggregations &amp; Facets"]
  AggConstraint["📊 100-300ms<br/>15+ facets"]

  GreatSchools["🏫 GreatSchools API"]
  WalkScore["🚶 Walk Score API"]
  CrimeData["🛡️ Crime Data API"]
  APIConstraint["🔄 Enrich properties<br/>Cache: 24hrs"]

  Prometheus["📊 Prometheus"]
  Grafana["📈 Grafana Dashboards"]
  MonitorConstraint["🔔 Metrics &amp; Alerting<br/>P95: &lt;200ms<br/>P99: &lt;300ms"]
  S3["☁️ S3 Backups/Exports"]
  BackupConstraint["💾 Automated snapshots<br/>Retention: 7 days"]

  WebUsers -->|HTTP/S| LB
  MobileUsers -->|HTTP/S| LB
  AdminUsers -->|HTTP/S| LB
  LB --> API1
  LB --> API2
  LB --> API3

  API1 -.->|Writes| Postgres
  API2 -.->|Writes| Postgres
  API3 -.->|Writes| Postgres
  Postgres --- PGConstraint
  Postgres -->|WAL| WAL
  WAL -->|Logical decoding / pgoutput| Debezium
  Debezium --- DebeziumConstraint
  Debezium -->|Events| Kafka
  Kafka --- KafkaConstraint
  Kafka -->|Consume| MLEnrich
  MLEnrich --- MLConstraint

  MLEnrich -.->|API Call| GreatSchools
  MLEnrich -.->|API Call| WalkScore
  MLEnrich -.->|API Call| CrimeData
  GreatSchools --- APIConstraint
  WalkScore --- APIConstraint
  CrimeData --- APIConstraint

  MLEnrich -->|Index| Data1
  MLEnrich -->|Index| Data2

  API1 -->|Search| Coord1
  API2 -->|Search| Coord1
  API3 -->|Search| Coord2

  Coord1 --- CoordConstraint
  Coord2 --- CoordConstraint

  Coord1 --> Data1
  Coord1 --> Data2
  Coord2 --> Data3
  Coord2 --> Data4

  Data1 --> Indexes
  Data2 --> Indexes
  Data3 --> Indexes
  Data4 --> Indexes
  Indexes --- IndexConstraint

  Indexes -.-> VectorSearch
  Indexes -.-> FullText
  Indexes -.-> Aggregations
  VectorSearch --- VectorConstraint
  FullText --- FullTextConstraint
  Aggregations --- AggConstraint

  Master1 -.->|Manage| Data1
  Master2 -.->|Manage| Data2
  Master3 -.->|Manage| Data3
  Master1 --- MasterConstraint
  Master2 --- MasterConstraint
  Master3 --- MasterConstraint

  Postgres -.->|Metrics| Prometheus
  Kafka -.->|Metrics| Prometheus
  Data1 -.->|Metrics| Prometheus
  Data2 -.->|Metrics| Prometheus
  Prometheus --> Grafana
  Grafana --- MonitorConstraint

  Postgres -.->|Snapshot/Export| S3
  Data3 -.->|Snapshot| S3
  S3 --- BackupConstraint

  class WebUsers,MobileUsers,AdminUsers userClass
  class LB,API1,API2,API3 apiClass
  class Postgres dbClass
  class WAL,Debezium,Kafka kafkaClass
  class MLEnrich mlClass
  class Master1,Master2,Master3,Coord1,Coord2,Data1,Data2,Data3,Data4,Indexes,VectorSearch,FullText,Aggregations osClass
  class GreatSchools,WalkScore,CrimeData thirdPartyClass
  class Prometheus,Grafana,S3 monitorClass
  class PGConstraint,DebeziumConstraint,KafkaConstraint,MLConstraint,MasterConstraint,CoordConstraint,IndexConstraint,VectorConstraint,FullTextConstraint,AggConstraint,APIConstraint,MonitorConstraint,BackupConstraint constraintClass
`.trim());

  const [zoom, setZoom] = useState(2);
  const [sidebarData, setSidebarData] = useState<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Minimal metadata (extend as needed)
  const componentData = useRef<Record<string, any>>({
    WebUsers: { title: 'Web Users', type: 'UI', description: 'Desktop browser users.', metrics: {'Typical Session':'10–15m'} },
    MobileUsers: { title: 'Mobile Users', type: 'UI', description: 'iOS/Android app users.', metrics: {'Session':'6–8m'} },
    AdminUsers: { title: 'Admin/Agents', type: 'UI', description: 'Agent dashboard.', metrics: {'Users':'~500'} },
    LB: { title: 'API Gateway', type: 'Infra', description: 'LB + WAF + rate limiting.', metrics: {'TLS':'1.3'} },
    API1: { title: 'API Server', type: 'App', description: 'Node/Express business logic.', metrics:{'p95':'<100ms'} },
    API2: { title: 'API Server', type: 'App', description: 'Same as API1.' },
    API3: { title: 'API Server', type: 'App', description: 'Same as API1.' },
    Postgres: { title: 'AWS RDS PostgreSQL', type: 'DB', description: 'Primary (Multi-AZ).', metrics:{'Write p95':'<50ms'} },
    WAL: { title: 'WAL (logical)', type: 'CDC', description: 'Logical decoding source.' },
    Debezium: { title: 'Debezium (pgoutput)', type: 'CDC', description: 'Streams changes to Kafka.', metrics:{'Lag':'<2s'} },
    Kafka: { title: 'Kafka', type: 'MQ', description: 'Buffer + replay.', metrics:{'Retention':'7d'} },
    MLEnrich: { title: 'ML Enrichment', type: 'ML', description: 'Embeddings + 3rd-party enrich.' },
    Coord1: { title: 'Coord Node', type: 'OpenSearch', description: 'Routes + merges.' },
    Coord2: { title: 'Coord Node', type: 'OpenSearch', description: 'Routes + merges.' },
    Data1: { title: 'Data Node', type: 'OpenSearch', description: 'Executes queries, stores shards.' },
    Data2: { title: 'Data Node', type: 'OpenSearch', description: 'Same as Data1.' },
    Data3: { title: 'Data Node', type: 'OpenSearch', description: 'Same as Data1.' },
    Data4: { title: 'Data Node', type: 'OpenSearch', description: 'Same as Data1.' },
    Indexes: { title: 'OpenSearch Indexes', type: 'Storage', description: 'Properties, users, history.' },
    VectorSearch: { title: 'k-NN Vector Search', type: 'Search', description: 'HNSW ANN for recs.', metrics:{'p95':'120–200ms'} },
    FullText: { title: 'BM25 Search', type: 'Search', description: 'Keyword relevance.', metrics:{'p95':'50–200ms'} },
    Aggregations: { title: 'Aggregations/Facets', type: 'Search', description: 'Real-time counts.' },
    Prometheus: { title: 'Prometheus', type: 'Monitoring', description: 'Metrics + alerts.' },
    Grafana: { title: 'Grafana', type: 'Monitoring', description: 'Dashboards.' },
    S3: { title: 'S3 Backups/Exports', type: 'Backup', description: 'RDS snapshots & exports.' },
  });

  // Load Mermaid at runtime
  useEffect(() => {
    if (window.mermaid) { setMermaidReady(true); return; }
    const s = document.createElement('script');
    s.src = mermaidCdn;
    s.async = true;
    s.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: { fontSize: '14px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto' }
      });
      setMermaidReady(true);
    };
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // Render Mermaid
  const renderGraph = async () => {
    if (!window.mermaid || !mountRef.current) return;
    try {
      const { svg, bindFunctions } = await window.mermaid.render('hhxGraph', graphDef);
      mountRef.current.innerHTML = svg;
      if (typeof bindFunctions === 'function') bindFunctions(mountRef.current);
      bindInteractions();
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  };

  useEffect(() => {
    if (mermaidReady) renderGraph();
  }, [mermaidReady, graphDef]);

  // Interactions
  const bindInteractions = () => {
    const svg = mountRef.current?.querySelector('svg');
    if (!svg) return;

    const tooltip = tooltipRef.current!;
    const onEnter = (node: SVGGElement) => (e: MouseEvent) => {
      const id = resolveNodeId(node);
      const data = componentData.current[id];
      if (!data) return;
      tooltip.innerHTML = `
        <h3>${data.title || id}</h3>
        <p style="font-size:.85em;opacity:.9;">${data.description || ''}</p>
        ${data.metrics ? Object.entries(data.metrics).map(
          ([k,v]) => `<div class="metric"><span>${k}:</span><span class="metric-value">${v}</span></div>`
        ).join('') : ''}
      `;
      tooltip.style.left = `${e.clientX + 16}px`;
      tooltip.style.top = `${e.clientY + 16}px`;
      tooltip.classList.add('show');
    };

    const onMove = (_node: SVGGElement) => (e: MouseEvent) => {
      tooltip.style.left = `${e.clientX + 16}px`;
      tooltip.style.top = `${e.clientY + 16}px`;
    };

    const onLeave = () => tooltip.classList.remove('show');

    const onClick = (node: SVGGElement) => (e: MouseEvent) => {
      e.stopPropagation();
      const id = resolveNodeId(node);
      focusNode(node, id);
      setSidebarData(componentData.current[id] ?? { title: id, type: 'Component' });
      document.getElementById('detailsSidebar')?.classList.remove('hidden');
    };

    svg.querySelectorAll<SVGGElement>('.node').forEach((node) => {
      node.addEventListener('mouseenter', onEnter(node));
      node.addEventListener('mousemove', onMove(node));
      node.addEventListener('mouseleave', onLeave);
      node.addEventListener('click', onClick(node));
    });

    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.node') &&
          !(e.target as HTMLElement).closest('.details-sidebar') &&
          !(e.target as HTMLElement).closest('#graphEditor')) {
        resetView();
      }
    }, { once: true });
  };

  const resolveNodeId = (nodeG: SVGGElement) => {
    const rawId = nodeG.id || '';
    const m = rawId.match(/flowchart-([^-]+)-/);
    if (m) return m[1];
    const t = nodeG.querySelector('title');
    return t ? t.textContent?.replace(/\s+/g,'').replace(/[^\w]/g,'') ?? '' : '';
  };

  const focusNode = (node: SVGGElement, nodeId: string) => {
    const svg = mountRef.current?.querySelector('svg');
    if (!svg) return;

    clearFocus();

    svg.querySelectorAll<SVGElement>('.node,.edgePath').forEach(el => el.classList.add('dim'));
    node.classList.remove('dim');
    node.classList.add('focus');

    // highlight outgoing edges
    const outEdges = svg.querySelectorAll<SVGGElement>(`.edgePath.LS-${cssEscape(nodeId)}`);
    outEdges.forEach(edge => {
      edge.classList.remove('dim');
      edge.classList.add('edge-highlight','edge-animate');
      const le = [...edge.classList].find(c => c.startsWith('LE-'));
      if (le) {
        const toId = le.slice(3);
        const target = svg.querySelector<SVGGElement>(`[id^="flowchart-${cssEscape(toId)}-"]`);
        if (target) target.classList.remove('dim');
      }
    });
  };

  const clearFocus = () => {
    const svg = mountRef.current?.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('.dim').forEach(el => el.classList.remove('dim'));
    svg.querySelectorAll('.focus').forEach(el => el.classList.remove('focus'));
    svg.querySelectorAll('.edge-highlight').forEach(el => el.classList.remove('edge-highlight'));
    svg.querySelectorAll('.edge-animate').forEach(el => el.classList.remove('edge-animate'));
  };

  const resetView = () => {
    clearFocus();
    tooltipRef.current?.classList.remove('show');
  };

  // Live editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [parseMsg, setParseMsg] = useState<string | null>(null);

  const applyGraphSafely = async () => {
    const txt = (document.getElementById('graphText') as HTMLTextAreaElement)?.value || '';
    if (!txt.trim().startsWith('graph ')) { setParseMsg('Your Mermaid must start with "graph TB" (or LR/BT/RL).'); return; }
    if (/<script/i.test(txt)) { setParseMsg('Script tags are not allowed.'); return; }
    setGraphDef(txt);
    setEditorOpen(false);
    setParseMsg(null);
  };

  const validateLive = async (value: string) => {
    if (!window.mermaid) return;
    try {
      await window.mermaid.render('validate_only', value);
      setParseMsg('Looks good ✓');
    } catch {
      setParseMsg('Parse error — fix graph');
    }
  };

  // CSS.escape fallback
  const cssEscape = (v: string) => {
    if (typeof window.CSS?.escape === 'function') return window.CSS.escape(v);
    return String(v).replace(/[^a-zA-Z0-9_\\-]/g, '\\\\$&');
  };

  return (
    <>
      <header className="hdr">
        <h1>HelloHomeX System Architecture</h1>
        <p className="subtitle">Next.js component • RDS PostgreSQL • 2× focus zoom • Live editor</p>
      </header>

      <div className="controls">
        <button className="control-btn" onClick={resetView} title="Reset View">⟲</button>
        <button className="control-btn" onClick={() => {
          const el = document.getElementById('detailsSidebar');
          el?.classList.toggle('hidden');
        }} title="Toggle Details">📋</button>

        <div className="live-card" aria-label="Live Controls">
          <div className="live-title">Live Controls</div>
          <label>Focus Zoom: <span id="zoomVal">{zoom}</span>x</label>
          <input
            id="zoomRange"
            type="range" min={1} max={4} step={0.1}
            value={zoom}
            onChange={(e)=> {
              const v = Number(e.target.value);
              setZoom(v);
              (document.documentElement as any).style.setProperty('--focus-scale', String(v));
            }}
            style={{width:'100%', marginBottom:10}}
          />
          <button id="toggleEditor" className="control-btn wide" onClick={() => {
            (document.getElementById('graphText') as HTMLTextAreaElement).value = graphDef;
            setEditorOpen(true);
            setParseMsg(null);
          }}>✏️ Edit Graph</button>
        </div>
      </div>

      <div className="container">
        <div className="main-content">
          <div className="diagram-container" id="scrollHost">
            <div className="diagram-wrapper" id="diagramWrapper">
              <div ref={mountRef} className="mermaid" aria-hidden={!mermaidReady} />
            </div>
          </div>

          <aside className="details-sidebar hidden" id="detailsSidebar">
            <button className="close-sidebar" onClick={()=>{
              document.getElementById('detailsSidebar')?.classList.add('hidden');
              resetView();
            }}>×</button>
            <div id="sidebarContent">
              {!sidebarData ? (
                <div className="sidebar-header">
                  <h2>Select a Component</h2>
                  <p style={{color:'#666', fontSize:'.9em', marginTop:10}}>
                    Click any component in the diagram to view detailed information
                  </p>
                </div>
              ) : (
                <>
                  <div className="sidebar-header">
                    <h2>{sidebarData.title}</h2>
                    <span className="component-type">{sidebarData.type}</span>
                    {sidebarData.description && (
                      <p style={{color:'#666', fontSize:'.9em', marginTop:12, lineHeight:1.5}}>{sidebarData.description}</p>
                    )}
                  </div>
                  {sidebarData.metrics && (
                    <div className="sidebar-section">
                      <h3>Key Metrics</h3>
                      {Object.entries(sidebarData.metrics).map(([k,v]: any) => (
                        <div className="metric-row" key={k}>
                          <span className="metric-label">{k}</span>
                          <span className="metric-value">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="flow-legend">
        <h4>Data Flow Legend</h4>
        <div className="legend-items">
          <div className="legend-item"><div className="legend-line legend-write" /> <span>Write Path (RDS PostgreSQL → OpenSearch)</span></div>
          <div className="legend-item"><div className="legend-line legend-search" /> <span>Search Path (API → OpenSearch)</span></div>
          <div className="legend-item"><div className="legend-line legend-enrich" /> <span>Enrichment (ML → APIs)</span></div>
          <div className="legend-item"><div className="legend-line legend-monitor" /> <span>Monitoring (Dashed)</span></div>
        </div>
      </div>

      <div className="instruction"><strong>💡 Tip:</strong> Hover for tooltip. Click to zoom (2×), blur others, and see outgoing flow.</div>
      <div className="tooltip" ref={tooltipRef} />

      {/* Live Editor Drawer */}
      <div id="graphEditor" className={editorOpen ? 'open' : ''} role="dialog" aria-label="Mermaid Graph Live Editor">
        <div className="bar">
          <strong style={{color:'#8ab4f8'}}>Mermaid Graph (live)</strong>
          <div id="parseStatus" style={{fontSize:12, color:'#b8f', marginLeft:10}}>{parseMsg || ''}</div>
          <button id="applyGraph" onClick={applyGraphSafely}>Apply</button>
          <button id="closeEditor" onClick={()=>setEditorOpen(false)}>Close</button>
        </div>
        <textarea
          id="graphText"
          spellCheck={false}
          onChange={(e)=> validateLive(e.target.value)}
        />
      </div>

      {/* Styles */}
      <style jsx>{`
        :root { --focus-scale: 2; }

        .hdr { position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 20px 30px; text-align: center; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,.2); }
        .subtitle { opacity: .9; }

        .container { display: flex; height: 100vh; }
        .main-content { display: flex; width: 100%; margin-top: 100px; background: #fff; }
        .diagram-container { flex: 1; overflow: auto; padding: 30px; position: relative; background: #f8f9fa; }
        .diagram-wrapper { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,.1); position: relative; }

        .details-sidebar { width: 450px; background: #fff; border-left: 3px solid #667eea; overflow-y: auto; padding: 30px; box-shadow: -5px 0 20px rgba(0,0,0,.1); transition: transform .3s ease; }
        .details-sidebar.hidden { transform: translateX(100%); }
        .sidebar-header { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #667eea; }
        .component-type { display: inline-block; padding: 4px 12px; background: #667eea; color: #fff; border-radius: 12px; font-size: .75em; font-weight: 600; text-transform: uppercase; }
        .sidebar-section { background: #f8f9fa; border-radius: 8px; padding: 18px; margin-bottom: 18px; border-left: 4px solid #667eea; }
        .metric-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .metric-label { color: #666; font-size: .9em; font-weight: 500; }
        .metric-value { color: #667eea; font-weight: 700; font-size: .9em; }

        .controls { position: fixed; top: 120px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100; }
        .control-btn { background: #fff; border: 2px solid #667eea; min-width: 45px; height: 45px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #667eea; transition: all .2s; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .control-btn:hover { background: #667eea; color: #fff; transform: scale(1.05); }
        .control-btn.wide { width: 100%; border-radius: 10px; font-size: 16px; height: 40px; }

        .flow-legend { position: fixed; bottom: 20px; left: 30px; background: #fff; padding: 15px 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,.2); z-index: 100; }
        .legend-items { display: flex; flex-direction: column; gap: 8px; }
        .legend-item { display: flex; align-items: center; gap: 10px; font-size: .85em; }
        .legend-line { width: 40px; height: 3px; border-radius: 2px; }
        .legend-write { background: #ff6b6b; }
        .legend-search { background: #4dabf7; }
        .legend-enrich { background: #ff922b; }
        .legend-monitor { background: #9775fa; background-image: repeating-linear-gradient(90deg, #9775fa, #9775fa 5px, transparent 5px, transparent 10px); }

        .instruction { position: fixed; bottom: 20px; right: 20px; background: #fff; padding: 12px 18px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,.2); font-size: .85em; color: #666; }
        .instruction strong { color: #667eea; }

        .tooltip { position: fixed; background: rgba(0,0,0,.95); color: #fff; padding: 12px 16px; border-radius: 8px; max-width: 320px; z-index: 2000; pointer-events: none; opacity: 0; transition: opacity .2s; font-size: .85em; box-shadow: 0 8px 25px rgba(0,0,0,.3); }
        .tooltip.show { opacity: 1; }
        .tooltip h3 { margin-bottom: 8px; color: #67e; font-size: 1.1em; }
        .tooltip .metric { display: flex; justify-content: space-between; margin: 6px 0; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,.15); }
        .tooltip .metric:last-child { border-bottom: none; }
        .tooltip .metric-value { color: #4CAF50; font-weight: 600; }

        /* SVG focus/dim & edge animation */
        .mermaid svg { overflow: visible; }
        .node, .edgePath { transition: filter .2s, opacity .2s, transform .2s; }
        .dim { filter: blur(2px) opacity(.25); }
        .focus { transform-box: fill-box; transform-origin: center center; transform: scale(var(--focus-scale)); }
        .edge-highlight path { stroke: #4dabf7 !important; stroke-width: 4px !important; filter: drop-shadow(0 0 6px rgba(77,171,247,.7)); }
        .edge-highlight marker path { fill: #4dabf7 !important; }
        .edge-animate path { stroke-dasharray: 8 6; animation: dash 1.2s linear infinite; }
        @keyframes dash { to { stroke-dashoffset: -56; } }

        /* Live Editor Drawer */
        #graphEditor { position: fixed; bottom: 0; left: 0; right: 0; height: 0; overflow: hidden; background: #111; color: #eee; box-shadow: 0 -6px 24px rgba(0,0,0,.3); transition: height .25s ease; z-index: 1999; }
        #graphEditor.open { height: 320px; }
        #graphEditor .bar { display: flex; gap: 12px; align-items: center; padding: 8px 12px; background: #222; }
        #graphEditor textarea { width: 100%; height: 260px; border: none; outline: none; background: #0b0b0b; color: #eaeaea; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 13px; padding: 12px; }

        /* Controls card */
        .live-card { background: #fff; border: 2px solid #667eea; border-radius: 12px; padding: 10px; width: 280px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .live-title { font-size: 12px; color: #667eea; font-weight: 700; margin-bottom: 8px; }
      `}</style>
    </>
  );
};

export default HhxArchitecture;
