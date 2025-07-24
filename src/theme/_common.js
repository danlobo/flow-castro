import { deepMerge } from "../util/deepMerge";

export function build(theme) {
  const _common = {
    roundness: 0,
    nodes: {
      common: {
        padding: 2,
        borderRadius: 4,
        boxShadow: "0 0 8px rgba(0, 0, 0, 0.125)",
        title: {
          background: theme.colors.hover,
          color: theme.colors.text,
        },
        body: {
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.text,
        },
      },
    },
    ports: {},
    connections: {},
    buttons: {
      default: {
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.text,
      },
    },
    contextMenu: {
      background: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text,
    },
  };

  return deepMerge({}, _common, theme);
}
