import { deepMerge } from "../util/deepMerge";

export function build(theme) {
  const _common = {
    nodes: {
      common: {
        padding: 2,
        borderRadius: 4,
        boxShadow: '0 0 8px rgba(0, 0, 0, 0.125)',
        title: {
          background: theme.colors.hover,
          color: theme.colors.text
        },
        body: {
          background: theme.colors.background,
          border: `1px solid ${theme.colors.hover}`,
          color: theme.colors.text
        }
      }
    },
    ports: {
  
    },
    connections: {
      
    },
    buttons: {
      default: {
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.text}`,
        color: theme.colors.text,
        roundness: 0
      }
    }
  }

  return deepMerge({}, _common, theme)
}