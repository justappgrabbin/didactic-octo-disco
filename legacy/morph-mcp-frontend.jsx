// ═══════════════════════════════════════════════════════════════════════════════
//  MORPH MCP COMMAND INTERFACE — React Component for Morph OS v1.4
//  Phone-first, touch-friendly, resonance-aware command execution
//  Integrates with Synthia Server /api/mcp/* endpoints
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, 
  Database, 
  GitBranch, 
  Server, 
  Shield, 
  Activity,
  Zap,
  Hexagon,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Globe
} from 'lucide-react';

// ───────────────────────────────────────────────────────────────────────────────
// STYLES — Embedded for single-file portability (your preferred pattern)
// ───────────────────────────────────────────────────────────────────────────────
const MCPStyles = () => (
  <style>{`
    .mcp-panel {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 92vw;
      max-width: 600px;
      background: linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2), 0 0 100px rgba(6, 182, 212, 0.1);
      overflow: hidden;
      z-index: 1000;
      font-family: 'SF Mono', 'Fira Code', monospace;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .mcp-panel.minimized {
      height: 60px;
      overflow: hidden;
    }

    .mcp-panel.expanded {
      height: 70vh;
      max-height: 600px;
    }

    .mcp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    }

    .mcp-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #e9d5ff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .mcp-header-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #a78bfa;
    }

    .mcp-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }

    .mcp-status-dot.disconnected {
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .mcp-body {
      padding: 16px;
      overflow-y: auto;
      height: calc(100% - 120px);
      scrollbar-width: thin;
      scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
    }

    .mcp-body::-webkit-scrollbar {
      width: 4px;
    }

    .mcp-body::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 4px;
    }

    .mcp-resonance-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .mcp-hexagram-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
    }

    .mcp-hexagram-number {
      font-size: 20px;
      font-weight: 700;
      color: #c084fc;
      line-height: 1;
    }

    .mcp-hexagram-label {
      font-size: 9px;
      color: #a78bfa;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .mcp-dimension-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mcp-dimension-name {
      font-size: 12px;
      color: #e9d5ff;
      font-weight: 600;
    }

    .mcp-dimension-meta {
      font-size: 10px;
      color: #a78bfa;
    }

    .mcp-permission-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mcp-permission-badge.full {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .mcp-permission-badge.limited {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .mcp-permission-badge.blocked {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .mcp-command-area {
      position: relative;
      margin-bottom: 16px;
    }

    .mcp-command-input {
      width: 100%;
      padding: 14px 48px 14px 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 14px;
      color: #e9d5ff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: all 0.3s ease;
    }

    .mcp-command-input::placeholder {
      color: rgba(167, 139, 250, 0.5);
    }

    .mcp-command-input:focus {
      border-color: rgba(139, 92, 246, 0.6);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
    }

    .mcp-send-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #8b5cf6, #06b6d4);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mcp-send-btn:hover {
      transform: translateY(-50%) scale(1.05);
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
    }

    .mcp-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mcp-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .mcp-suggestion-chip {
      padding: 6px 12px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 20px;
      color: #c084fc;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .mcp-suggestion-chip:hover {
      background: rgba(139, 92, 246, 0.2);
      border-color: rgba(139, 92, 246, 0.4);
    }

    .mcp-execution-log {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .mcp-log-entry {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .mcp-log-entry.user {
      background: rgba(139, 92, 246, 0.1);
      border-color: rgba(139, 92, 246, 0.2);
      margin-left: 20px;
    }

    .mcp-log-entry.system {
      background: rgba(6, 182, 212, 0.05);
      border-color: rgba(6, 182, 212, 0.2);
      margin-right: 20px;
    }

    .mcp-log-entry.error {
      background: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .mcp-log-entry.success {
      background: rgba(16, 185, 129, 0.05);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .mcp-log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .mcp-log-icon {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mcp-log-icon.purple { background: rgba(139, 92, 246, 0.2); color: #c084fc; }
    .mcp-log-icon.cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }
    .mcp-log-icon.red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .mcp-log-icon.green { background: rgba(16, 185, 129, 0.2); color: #34d399; }

    .mcp-log-title {
      font-size: 12px;
      font-weight: 600;
      color: #e9d5ff;
    }

    .mcp-log-time {
      font-size: 10px;
      color: #a78bfa;
      margin-left: auto;
    }

    .mcp-log-content {
      font-size: 13px;
      color: #ddd6fe;
      line-height: 1.5;
      word-break: break-word;
    }

    .mcp-log-meta {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .mcp-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #a78bfa;
    }

    .mcp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(139, 92, 246, 0.2);
    }

    .mcp-server-indicators {
      display: flex;
      gap: 8px;
    }

    .mcp-server-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 10px;
      color: #a78bfa;
      background: rgba(139, 92, 246, 0.1);
    }

    .mcp-server-badge.active {
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
    }

    .mcp-toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #c084fc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mcp-toggle-btn:hover {
      background: rgba(139, 92, 246, 0.2);
    }

    /* Mobile optimizations */
    @media (max-width: 480px) {
      .mcp-panel {
        width: 96vw;
        bottom: 70px;
        border-radius: 16px;
      }

      .mcp-panel.expanded {
        height: 80vh;
        max-height: none;
      }

      .mcp-resonance-bar {
        flex-wrap: wrap;
        gap: 8px;
      }

      .mcp-suggestions {
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
      }
    }
  `}</style>
);

// ───────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: MorphMCPInterface
// ───────────────────────────────────────────────────────────────────────────────
const MorphMCPInterface = ({ 
  agentId = 'agent-18',
  currentHexagram = 47,
  userDimensions = { body: 3, mind: 5, heart: 2 },
  synthiaEndpoint = 'https://synthia-server.onrender.com',
  onClose 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [serverStatus, setServerStatus] = useState({ dbmaestro: false, github: false });
  const [capabilities, setCapabilities] = useState(null);
  const [suggestions, setSuggestions] = useState([
    'Create SQL Server pipeline with Dev/QA/Prod',
    'Compare dev and production schemas',
    'Provision a test database instance',
    'Deploy latest schema to QA',
    'Get audit trail for last 24h',
    'Validate SQL syntax for new migration'
  ]);

  const logEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check server health on mount
  useEffect(() => {
    checkHealth();
    fetchCapabilities();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${synthiaEndpoint}/api/mcp/health`);
      const data = await res.json();

      const status = {};
      data.connections?.forEach(conn => {
        status[conn.server] = conn.connected;
      });
      setServerStatus(status);
    } catch (e) {
      setServerStatus({ dbmaestro: false, github: false });
    }
  };

  const fetchCapabilities = async () => {
    try {
      const res = await fetch(`${synthiaEndpoint}/api/mcp/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentContext: { agentId, currentHexagram, userDimensions }
        })
      });
      const data = await res.json();
      setCapabilities(data);
    } catch (e) {
      console.warn('Failed to fetch capabilities:', e);
    }
  };

  const addLog = (entry) => {
    setLogs(prev => [...prev, { ...entry, id: Date.now(), timestamp: new Date() }]);
  };

  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return;

    setIsExecuting(true);
    const userCommand = command.trim();
    setCommand('');

    // Add user message to log
    addLog({
      type: 'user',
      icon: 'user',
      title: 'You',
      content: userCommand,
      meta: { hexagram: currentHexagram }
    });

    try {
      const res = await fetch(`${synthiaEndpoint}/api/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalLanguage: userCommand,
          agentContext: {
            agentId,
            currentHexagram,
            userDimensions
          }
        })
      });

      const result = await res.json();

      // Format result for display
      if (result.status === 'SUCCESS') {
        addLog({
          type: 'success',
          icon: 'success',
          title: `${result.server} → ${result.action}`,
          content: formatResult(result.result),
          meta: {
            executionTime: result.executionTimeMs,
            dimension: result.resonanceState?.dimension,
            riskLevel: result.resonanceState?.riskLevel
          }
        });
      } else if (result.status === 'PERMISSION_DENIED') {
        addLog({
          type: 'error',
          icon: 'lock',
          title: 'Permission Denied',
          content: result.message,
          meta: {
            dimension: result.currentDimension,
            requiresApproval: result.requiresHumanApproval,
            escalationTarget: result.escalationTarget
          }
        });
      } else if (result.status === 'CLARIFICATION_NEEDED') {
        addLog({
          type: 'system',
          icon: 'help',
          title: 'Clarification Needed',
          content: result.message,
          meta: {
            suggestedActions: result.suggestedActions?.join(', ')
          }
        });
      } else {
        addLog({
          type: 'error',
          icon: 'error',
          title: 'Execution Failed',
          content: result.message || 'Unknown error',
          meta: { status: result.status }
        });
      }
    } catch (error) {
      addLog({
        type: 'error',
        icon: 'error',
        title: 'Network Error',
        content: `Cannot reach Synthia MCP Gateway: ${error.message}`,
        meta: { endpoint: synthiaEndpoint }
      });
    }

    setIsExecuting(false);
    inputRef.current?.focus();
  };

  const formatResult = (result) => {
    if (typeof result === 'string') return result;
    if (result.content) {
      // MCP tool result format
      return result.content.map(c => c.text || JSON.stringify(c)).join('\n');
    }
    return JSON.stringify(result, null, 2);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  const getDimensionName = (dim) => {
    const names = {
      1: 'Movement (Energy)',
      2: 'Evolution (Gravity)',
      3: 'Being (Matter)',
      4: 'Design (Structure)',
      5: 'Space (Form)'
    };
    return names[dim] || 'Unknown';
  };

  const getPermissionBadge = () => {
    if (!capabilities) return null;
    const maxRisk = capabilities.maxRiskLevel;
    if (maxRisk >= 5) return { class: 'full', text: 'Full Access' };
    if (maxRisk >= 3) return { class: 'limited', text: 'Limited' };
    return { class: 'blocked', text: 'Read Only' };
  };

  const badge = getPermissionBadge();

  return (
    <>
      <MCPStyles />
      <div className={`mcp-panel ${isExpanded ? 'expanded' : 'minimized'}`}>
        {/* Header */}
        <div className="mcp-header">
          <div className="mcp-header-title">
            <Hexagon size={16} color="#c084fc" />
            MORPH MCP
            <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'normal' }}>
              v1.4
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="mcp-header-status">
              <div className={`mcp-status-dot ${serverStatus.dbmaestro ? '' : 'disconnected'}`} />
              <span>DBmaestro</span>
            </div>
            <div className="mcp-header-status">
              <div className={`mcp-status-dot ${serverStatus.github ? '' : 'disconnected'}`} />
              <span>GitHub</span>
            </div>
            <button 
              className="mcp-toggle-btn" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {onClose && (
              <button className="mcp-toggle-btn" onClick={onClose}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Resonance State Bar */}
            <div className="mcp-body">
              <div className="mcp-resonance-bar">
                <div className="mcp-hexagram-display">
                  <div className="mcp-hexagram-number">{currentHexagram}</div>
                  <div className="mcp-hexagram-label">Hex</div>
                </div>
                <div className="mcp-dimension-info">
                  <div className="mcp-dimension-name">
                    {getDimensionName(capabilities?.dimension || Math.floor((currentHexagram - 1) / 13) + 1)}
                  </div>
                  <div className="mcp-dimension-meta">
                    Planet {(currentHexagram - 1) % 13 + 1} • 
                    Risk Level {capabilities?.maxRiskLevel || 1}/5 • 
                    {capabilities?.totalToolsAvailable || 0} tools available
                  </div>
                </div>
                {badge && (
                  <div className={`mcp-permission-badge ${badge.class}`}>
                    {badge.text}
                  </div>
                )}
              </div>

              {/* Command Input */}
              <div className="mcp-command-area">
                <input
                  ref={inputRef}
                  className="mcp-command-input"
                  placeholder="Tell the system what to do... (e.g., 'Deploy schema to QA')"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExecuting}
                />
                <button 
                  className="mcp-send-btn"
                  onClick={executeCommand}
                  disabled={isExecuting || !command.trim()}
                >
                  {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="mcp-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="mcp-suggestion-chip"
                    onClick={() => {
                      setCommand(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Execution Log */}
              <div className="mcp-execution-log">
                {logs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a78bfa', fontSize: '13px' }}>
                    <Zap size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>Natural language database DevOps</p>
                    <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                      Type a command or tap a suggestion above
                    </p>
                  </div>
                )}

                {logs.map((log) => (
                  <div key={log.id} className={`mcp-log-entry ${log.type}`}>
                    <div className="mcp-log-header">
                      <div className={`mcp-log-icon ${
                        log.icon === 'user' ? 'purple' :
                        log.icon === 'success' ? 'green' :
                        log.icon === 'error' ? 'red' : 'cyan'
                      }`}>
                        {log.icon === 'user' && <Terminal size={12} />}
                        {log.icon === 'success' && <CheckCircle2 size={12} />}
                        {log.icon === 'error' && <AlertTriangle size={12} />}
                        {log.icon === 'lock' && <Lock size={12} />}
                        {log.icon === 'help' && <Activity size={12} />}
                      </div>
                      <span className="mcp-log-title">{log.title}</span>
                      <span className="mcp-log-time">
                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="mcp-log-content">{log.content}</div>
                    {log.meta && (
                      <div className="mcp-log-meta">
                        {log.meta.executionTime && (
                          <span className="mcp-meta-item">
                            <Clock size={10} /> {log.meta.executionTime}ms
                          </span>
                        )}
                        {log.meta.dimension && (
                          <span className="mcp-meta-item">
                            <Layers size={10} /> Dim-{log.meta.dimension}
                          </span>
                        )}
                        {log.meta.riskLevel && (
                          <span className="mcp-meta-item">
                            <Shield size={10} /> Risk-{log.meta.riskLevel}
                          </span>
                        )}
                        {log.meta.hexagram && (
                          <span className="mcp-meta-item">
                            <Hexagon size={10} /> H{log.meta.hexagram}
                          </span>
                        )}
                        {log.meta.requiresApproval && (
                          <span className="mcp-meta-item" style={{ color: '#fbbf24' }}>
                            <Lock size={10} /> Needs Approval
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Footer */}
            <div className="mcp-footer">
              <div className="mcp-server-indicators">
                <div className={`mcp-server-badge ${serverStatus.dbmaestro ? 'active' : ''}`}>
                  <Database size={10} />
                  DBmaestro
                </div>
                <div className={`mcp-server-badge ${serverStatus.github ? 'active' : ''}`}>
                  <GitBranch size={10} />
                  GitHub
                </div>
                <div className="mcp-server-badge active">
                  <Server size={10} />
                  Synthia
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#a78bfa' }}>
                MCP Protocol 2025.03.26
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// INTEGRATION: Morph OS App Tray Registration
// Drop this into your existing OS to add MCP as a system app
// ───────────────────────────────────────────────────────────────────────────────
const MCPAppRegistration = {
  id: 'mcp-gateway',
  name: 'MCP Gateway',
  icon: 'Hexagon',
  color: '#8b5cf6',
  component: MorphMCPInterface,
  category: 'system',
  description: 'Natural language database DevOps via Model Context Protocol',
  permissions: ['network', 'synthia-api'],
  defaultHexagram: 47 // Agent 18's default state
};

// Export for use in Morph OS
export { MorphMCPInterface, MCPAppRegistration };
export default MorphMCPInterface;
