'use strict';

var deepMerge = require('../util/deepMerge.js');

function build(theme) {
  var _common = {
    roundness: 0,
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
          border: "1px solid ".concat(theme.colors.border),
          color: theme.colors.text
        }
      }
    },
    ports: {},
    connections: {},
    buttons: {
      default: {
        backgroundColor: theme.colors.background,
        border: "1px solid ".concat(theme.colors.border),
        color: theme.colors.text
      }
    },
    contextMenu: {
      background: theme.colors.background,
      border: "1px solid ".concat(theme.colors.border),
      color: theme.colors.text
    }
  };
  return deepMerge.deepMerge({}, _common, theme);
}

exports.build = build;
//# sourceMappingURL=_common.js.map
