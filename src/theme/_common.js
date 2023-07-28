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
      primary: {
        color: 'white',
        bg: 'primary'
      }
    }
  }

  return deepMerge({}, _common, theme)
}