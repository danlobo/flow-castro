import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { useState, useRef, useEffect } from 'react';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';

var ContextMenuList = _ref => {
  var _options$filter;
  var {
    isFiltered,
    options,
    onSelectOption,
    style
  } = _ref;
  var [activeSubmenu, setActiveSubmenu] = useState(null);
  var [activeSubmenuPosition, setActiveSubmenuPosition] = useState(null);
  var [submenuDirection, setSubmenuDirection] = useState('left');
  var [submenuDirectionVertical, setSubmenuDirectionVertical] = useState('top');
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
  return /*#__PURE__*/jsx("ul", {
    className: "context-menu",
    style: style,
    children: options === null || options === void 0 ? void 0 : (_options$filter = options.filter(isFiltered)) === null || _options$filter === void 0 ? void 0 : _options$filter.map(option => {
      if (option.separator === true) return /*#__PURE__*/jsx("li", {
        children: /*#__PURE__*/jsx("hr", {})
      }, option.id);
      return /*#__PURE__*/jsxs("li", {
        onClick: () => onSelectOption(option),
        onMouseEnter: e => handleMenuItemMouseEnter(e, option.label),
        onMouseLeave: () => handleMenuItemMouseLeave(),
        children: [/*#__PURE__*/jsxs("div", {
          style: {
            display: 'flex',
            alignItems: 'center'
          },
          children: [/*#__PURE__*/jsxs("div", {
            style: {
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column'
            },
            children: [/*#__PURE__*/jsx("div", {
              style: option.style,
              children: option.label
            }), option.description && /*#__PURE__*/jsx("div", {
              style: {
                color: 'gray',
                fontSize: '.8rem',
                fontStyle: 'italic'
              },
              children: option.description
            })]
          }), option.children && /*#__PURE__*/jsx("div", {
            style: {
              flex: '0 0 auto',
              fontSize: '.8rem',
              color: 'gray'
            },
            children: "\u25B6"
          })]
        }), option.children && option.label === activeSubmenu && /*#__PURE__*/jsx(ContextMenuList, {
          isFiltered: isFiltered,
          options: option.children.map(o => _objectSpread2(_objectSpread2({}, o), {}, {
            _parent: option
          })),
          onSelectOption: onSelectOption,
          style: {
            position: 'absolute',
            [submenuDirection]: '100%',
            top: submenuDirectionVertical === 'top' ? activeSubmenuPosition : null,
            bottom: submenuDirectionVertical === 'bottom' ? 0 : null
          }
        })]
      }, option.label);
    })
  });
};
var ContextMenu = _ref2 => {
  var {
    children
  } = _ref2;
  var [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  var [options, setOptions] = useState(null);
  var [search, setSearch] = useState('');
  var menuRef = useRef(null);
  var searchRef = useRef(null);
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
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  var isFiltered = option => {
    var _option$label$toLower, _option$label, _option$label$toLower2, _option$description$t, _option$description, _option$description$t2;
    if (!(search !== null && search !== void 0 && search.length)) return true;
    var _search = search.toLocaleLowerCase();
    if (((_option$label$toLower = (_option$label = option.label) === null || _option$label === void 0 ? void 0 : (_option$label$toLower2 = _option$label.toLowerCase()) === null || _option$label$toLower2 === void 0 ? void 0 : _option$label$toLower2.indexOf(_search)) !== null && _option$label$toLower !== void 0 ? _option$label$toLower : -1) > -1) return true;
    if (((_option$description$t = (_option$description = option.description) === null || _option$description === void 0 ? void 0 : (_option$description$t2 = _option$description.toLowerCase()) === null || _option$description$t2 === void 0 ? void 0 : _option$description$t2.indexOf(_search)) !== null && _option$description$t !== void 0 ? _option$description$t : -1) > -1) return true;
    return false;
  };
  return /*#__PURE__*/jsxs(Fragment, {
    children: [children({
      handleContextMenu
    }), /*#__PURE__*/jsxs("div", {
      ref: menuRef,
      className: "context-menu",
      style: {
        left: position.x,
        top: position.y,
        visibility: options ? 'visible' : 'hidden'
      },
      children: [/*#__PURE__*/jsx("input", {
        ref: searchRef,
        type: "text",
        placeholder: "Buscar...",
        autoFocus: true,
        value: search !== null && search !== void 0 ? search : '',
        onChange: e => setSearch(e.target.value)
      }), /*#__PURE__*/jsx(ContextMenuList, {
        isFiltered: isFiltered,
        options: options,
        onSelectOption: handleMenuItemClick,
        style: {
          position: 'relative'
        }
      })]
    })]
  });
};

export { ContextMenu };
//# sourceMappingURL=ContextMenu.js.map
