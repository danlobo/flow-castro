'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var React = require('react');
var ContextMenu_module = require('./ContextMenu.module.css.js');
var ThemeProvider = require('./ThemeProvider.js');
var jsxRuntime = require('react/jsx-runtime');

var ContextMenuList = _ref => {
  var _options$filter;
  var {
    isFiltered,
    options,
    onSelectOption,
    style
  } = _ref;
  var [activeSubmenu, setActiveSubmenu] = React.useState(null);
  var [activeSubmenuPosition, setActiveSubmenuPosition] = React.useState(null);
  var [submenuDirection, setSubmenuDirection] = React.useState('left');
  var [submenuDirectionVertical, setSubmenuDirectionVertical] = React.useState('top');
  var handleMenuItemMouseEnter = (e, parentId) => {
    setActiveSubmenu(parentId);
    var pos = e.currentTarget.getBoundingClientRect().top - e.currentTarget.parentNode.getBoundingClientRect().top;
    setActiveSubmenuPosition(pos);
    var viewportWidth = window.innerWidth;
    var submenuWidth = e.target.getBoundingClientRect().width;
    var viewportHeight = window.innerHeight;
    var submenuHeight = e.target.getBoundingClientRect().height;
    var rightEdge = e.currentTarget.getBoundingClientRect().right;
    if (rightEdge + submenuWidth > viewportWidth) {
      setSubmenuDirection("right");
    } else {
      setSubmenuDirection("left");
    }
    var bottomEdge = e.currentTarget.getBoundingClientRect().bottom;
    if (bottomEdge + submenuHeight > viewportHeight) {
      setSubmenuDirectionVertical("bottom");
    } else {
      setSubmenuDirectionVertical("top");
    }
  };
  var handleMenuItemMouseLeave = () => {
    setActiveSubmenu(null);
  };
  return /*#__PURE__*/jsxRuntime.jsx("ul", {
    className: ContextMenu_module.contextMenu,
    style: style,
    children: options === null || options === void 0 || (_options$filter = options.filter(isFiltered)) === null || _options$filter === void 0 ? void 0 : _options$filter.map((option, index) => {
      if (option.separator === true) return /*#__PURE__*/jsxRuntime.jsx("li", {
        children: /*#__PURE__*/jsxRuntime.jsx("hr", {})
      }, "".concat(option.id, "-").concat(index));
      return /*#__PURE__*/jsxRuntime.jsxs("li", {
        onClick: () => onSelectOption(option),
        onMouseEnter: e => handleMenuItemMouseEnter(e, option.label),
        onMouseLeave: () => handleMenuItemMouseLeave(),
        children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
          className: ContextMenu_module.contextMenuItemContainer,
          children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
            className: ContextMenu_module.contextMenuItemLabelContainer,
            children: [/*#__PURE__*/jsxRuntime.jsx("div", {
              className: ContextMenu_module.contextMenuItemLabel,
              style: option.style,
              children: option.label
            }), option.description && /*#__PURE__*/jsxRuntime.jsx("div", {
              className: ContextMenu_module.contextMenuItemDescription,
              children: option.description
            })]
          }), option.children && /*#__PURE__*/jsxRuntime.jsx("div", {
            className: ContextMenu_module.contextMenuItemSubMenu,
            children: "\u25B6"
          })]
        }), option.children && option.label === activeSubmenu && /*#__PURE__*/jsxRuntime.jsx(ContextMenuList, {
          isFiltered: isFiltered,
          options: option.children.map(o => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, o), {}, {
            _parent: option
          })),
          onSelectOption: onSelectOption,
          className: ContextMenu_module.submenu,
          style: {
            [submenuDirection]: '100%',
            top: submenuDirectionVertical === 'top' ? activeSubmenuPosition : null,
            bottom: submenuDirectionVertical === 'bottom' ? 0 : null
          }
        })]
      }, "".concat(option.label, "-").concat(index));
    })
  });
};
var ContextMenu = _ref2 => {
  var {
    children
  } = _ref2;
  ThemeProvider.useTheme();
  var [position, setPosition] = React.useState({
    x: 0,
    y: 0
  });
  var [options, setOptions] = React.useState(null);
  var [search, setSearch] = React.useState('');
  var menuRef = React.useRef(null);
  var searchRef = React.useRef(null);
  var handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
      var _searchRef$current;
      return (_searchRef$current = searchRef.current) === null || _searchRef$current === void 0 ? void 0 : _searchRef$current.focus();
    }, 0);
    setOptions(options);
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
  };
  var handleMenuItemClick = option => {
    var _option$onClick;
    (_option$onClick = option.onClick) === null || _option$onClick === void 0 ? void 0 : _option$onClick.call(option, option);
    setSearch('');
    setOptions(null);
  };
  var handleOutsideClick = e => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setSearch('');
      setOptions(null);
    }
  };
  React.useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  var isFiltered = option => {
    var _option$label$toLower, _option$label, _option$description$t, _option$description;
    if (!(search !== null && search !== void 0 && search.length)) return true;
    var _search = search.toLocaleLowerCase();
    if (((_option$label$toLower = (_option$label = option.label) === null || _option$label === void 0 || (_option$label = _option$label.toLowerCase()) === null || _option$label === void 0 ? void 0 : _option$label.indexOf(_search)) !== null && _option$label$toLower !== void 0 ? _option$label$toLower : -1) > -1) return true;
    if (((_option$description$t = (_option$description = option.description) === null || _option$description === void 0 || (_option$description = _option$description.toLowerCase()) === null || _option$description === void 0 ? void 0 : _option$description.indexOf(_search)) !== null && _option$description$t !== void 0 ? _option$description$t : -1) > -1) return true;
    return false;
  };
  return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [children({
      handleContextMenu
    }), options !== null && options !== void 0 && options.length ? /*#__PURE__*/jsxRuntime.jsxs("div", {
      ref: menuRef,
      className: ContextMenu_module.container,
      style: {
        left: position.x,
        top: position.y,
        visibility: options ? 'visible' : 'hidden'
      },
      children: [/*#__PURE__*/jsxRuntime.jsx("input", {
        ref: searchRef,
        type: "text",
        placeholder: "Buscar...",
        autoFocus: true,
        value: search !== null && search !== void 0 ? search : '',
        onChange: e => setSearch(e.target.value)
      }), /*#__PURE__*/jsxRuntime.jsx(ContextMenuList, {
        isFiltered: isFiltered,
        options: options,
        onSelectOption: handleMenuItemClick,
        style: {
          position: 'relative'
        }
      })]
    }) : null]
  });
};

exports.ContextMenu = ContextMenu;
//# sourceMappingURL=ContextMenu.js.map
