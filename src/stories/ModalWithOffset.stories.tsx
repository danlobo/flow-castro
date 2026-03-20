import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import NodeContainer from '../NodeContainer';
import { ThemeProvider } from '../ThemeProvider';

const meta: Meta = {
  title: 'Example/ModalWithOffset',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Reproduz o cenário onde o NodeContainer está dentro de um modal com conteúdo acima (offset vertical). ' +
          'Valida que os conectores são renderizados nas posições corretas independente do offset do componente pai.',
      },
    },
  },
};

export default meta;

// ─── shared node / port types ────────────────────────────────────────────────

const nodeTypes = {
  string: {
    type: 'string',
    label: 'String',
    description: 'String node',
    category: 'Text',
    inputs() {
      return [{ name: 'string', type: 'string', label: 'String' }];
    },
    outputs() {
      return [{ name: 'string', type: 'string', label: 'String' }];
    },
    resolveOutputs: async (inputValues: Record<string, unknown>) => ({
      string: inputValues.string ?? '',
    }),
  },
};

const portTypes = {
  string: {
    type: 'string',
    label: 'String',
    shape: 'circle',
    color: '#FFD700',
    render({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
      return (
        <input
          type="text"
          style={{ width: '100%' }}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  },
};

// Two connected nodes so connectors are visible
const connectedState = {
  nodes: {
    node_a: {
      id: 'node_a',
      name: 'String',
      type: 'string',
      position: { x: 60, y: 120 },
      values: { string: 'Hello' },
      size: { width: 320, height: 120 },
      connections: {
        outputs: [
          {
            name: 'string',
            node: 'node_b',
            port: 'string',
            type: 'string',
          },
        ],
        inputs: [],
      },
    },
    node_b: {
      id: 'node_b',
      name: 'String',
      type: 'string',
      position: { x: 500, y: 120 },
      values: { string: null },
      size: { width: 320, height: 120 },
      connections: {
        outputs: [],
        inputs: [
          {
            name: 'string',
            node: 'node_a',
            port: 'string',
            type: 'string',
          },
        ],
      },
    },
  },
};

// ─── Modal styles (plain CSS-in-JS, no extra deps) ───────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
  width: '80vw',
  maxWidth: 960,
  height: '75vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '16px 20px 12px',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flexShrink: 0,
};

const modalBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'sans-serif',
  background: '#f5f5f5',
  minHeight: '100vh',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 15,
};

const closeBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#e53935',
  marginTop: 0,
};

// ─── Story component ──────────────────────────────────────────────────────────

function ModalWithOffsetDemo({ theme }: { theme?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Novo Sub-fluxo');
  const [outerState, setOuterState] = useState(connectedState);
  const [modalState, setModalState] = useState(connectedState);

  return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ marginTop: 0 }}>Container externo</h2>
      <p style={{ color: '#555', margin: 0 }}>
        Canvas abaixo representa o container pai. Clique no botão para abrir o
        modal com um segundo canvas deslocado verticalmente pelo cabeçalho.
      </p>

      {/* ── NodeContainer externo (sem offset) ── */}
      <div style={{ height: 320, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden' }}>
        <ThemeProvider theme={theme} themes={null}>
          <NodeContainer
            theme={theme}
            themes={null}
            state={null}
            highlightedNodes={null}
            highlightedConnections={null}
            onNodeClick={null}
            centerOnNode={null}
            nodeTypes={nodeTypes}
            portTypes={portTypes}
            initialState={outerState}
            onChangeState={setOuterState}
          />
        </ThemeProvider>
      </div>

      <button style={btnStyle} onClick={() => setOpen(true)}>
        Abrir modal com canvas
      </button>

      {open && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div style={modalStyle}>
            {/* ── Cabeçalho — gera o offset vertical ── */}
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 18 }}>Editar Sub-fluxo</strong>
                <button style={closeBtnStyle} onClick={() => setOpen(false)}>
                  Fechar
                </button>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                Título:
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #bbb',
                    borderRadius: 4,
                    fontSize: 14,
                    width: 320,
                  }}
                />
              </label>

              <p style={{ margin: 0, fontSize: 13, color: '#777' }}>
                O canvas abaixo está deslocado verticalmente pelo cabeçalho acima.
                Os conectores devem aparecer nas posições corretas.
              </p>
            </div>

            {/* ── Canvas (NodeContainer) com offset ── */}
            <div style={modalBodyStyle}>
              <ThemeProvider theme={theme} themes={null}>
                <NodeContainer
                  theme={theme}
                  themes={null}
                  state={null}
                  highlightedNodes={null}
                  highlightedConnections={null}
                  onNodeClick={null}
                  centerOnNode={null}
                  nodeTypes={nodeTypes}
                  portTypes={portTypes}
                  initialState={modalState}
                  onChangeState={setModalState}
                />
              </ThemeProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const Light: StoryObj = {
  render: () => <ModalWithOffsetDemo />,
  name: 'Modal com offset (tema claro)',
};

export const Dark: StoryObj = {
  render: () => <ModalWithOffsetDemo theme="dark" />,
  name: 'Modal com offset (tema escuro)',
};
