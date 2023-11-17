import { useEffect, useRef, useState } from "react";
import css from './ContextMenu.module.css'
import { useTheme } from "./ThemeProvider";
import { i } from "./util/i18n.js";

const ContextMenuList = ({ isFiltered, options, onSelectOption, style }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [activeSubmenuPosition, setActiveSubmenuPosition] = useState(null)
  const [submenuDirection, setSubmenuDirection] = useState('left')
  const [submenuDirectionVertical, setSubmenuDirectionVertical] = useState('top')

  const handleMenuItemMouseEnter = (e, parentId) => {
    setActiveSubmenu(parentId);
    const pos = e.currentTarget.getBoundingClientRect().top - e.currentTarget.parentNode.getBoundingClientRect().top
    setActiveSubmenuPosition(pos);

    const viewportWidth = window.innerWidth;
    const submenuWidth = e.target.getBoundingClientRect().width;

    const viewportHeight = window.innerHeight;
    const submenuHeight = e.target.getBoundingClientRect().height;

    const rightEdge = e.currentTarget.getBoundingClientRect().right;
    if (rightEdge + submenuWidth > viewportWidth) {
      setSubmenuDirection("right");
    } else {
      setSubmenuDirection("left");
    }

    const bottomEdge = e.currentTarget.getBoundingClientRect().bottom;
    if (bottomEdge + submenuHeight > viewportHeight) {
      setSubmenuDirectionVertical("bottom");
    } else {
      setSubmenuDirectionVertical("top");
    }
  };

  const handleMenuItemMouseLeave = () => {
    setActiveSubmenu(null);
  };

  if (!options?.length) return null

  return (
    <ul className={css.contextMenu} style={style}>
      {options?.filter(isFiltered)?.sort((a,b) => a.label.localeCompare(b.label))?.map((option, index) => {
        if (option.separator === true)
          return <li key={`${option.id}-${index}`} ><hr /></li>

        return <li
          key={`${option.label}-${index}`}
          onClick={() => onSelectOption(option)}
          onMouseEnter={(e) => handleMenuItemMouseEnter(e, option.label)}
          onMouseLeave={() => handleMenuItemMouseLeave()}
        >
          <div className={css.contextMenuItemContainer}>
            <div className={css.contextMenuItemLabelContainer}>
              <div className={css.contextMenuItemLabel} style={option.style}>{option.label}</div>
              {option.description && <div className={css.contextMenuItemDescription}>{option.description}</div>}
            </div>
            {option.children && <div className={css.contextMenuItemSubMenu}>▶</div>}
          </div>

          {option.children && option.label === activeSubmenu && (
              <ContextMenuList
                isFiltered={isFiltered}
                options={option.children.map((o) => ({ ...o, _parent: option }))}
                onSelectOption={onSelectOption}
                className={css.submenu}
                style={{
                  [submenuDirection]: '100%', 
                  top: submenuDirectionVertical === 'top' ? activeSubmenuPosition : null, 
                  bottom: submenuDirectionVertical === 'bottom' ? 0 : null 
                }}/>
            )}
        </li>
      })}
    </ul>
  )
}


export const ContextMenu = ({ containerRef, i18n, children }) => {
  const { currentTheme } = useTheme()

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [options, setOptions] = useState(null);
  const [search, setSearch] = useState('')

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => searchRef.current?.focus(), 0)

    const containerRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    setOptions(options);
    setPosition({ x, y });
  };

  const handleMenuItemClick = (option) => {
    option.onClick?.(option)
    setSearch('')
    setOptions(null)
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setSearch('')
      setOptions(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const isFiltered = (option) => {
    if (!search?.length)
      return true

    const _search = search.toLocaleLowerCase()

    if ((option.label?.toLowerCase()?.indexOf(_search) ?? -1) > -1)
      return true

    if ((option.description?.toLowerCase()?.indexOf(_search) ?? -1) > -1)
      return true

    // TODO isso não é muito eficiente.
    if (option.children?.length && option.children?.some(it => isFiltered(it)))
      return true

    return false
  }

  const nonNullOptions = options?.filter(it => Boolean(it))
  return (
    <>
      {children({ handleContextMenu })}
      {nonNullOptions?.length ? <div ref={menuRef} className={css.container} style={{ left: position.x, top: position.y, visibility: nonNullOptions ? 'visible' : 'hidden' }}>
        <input ref={searchRef} type="text" placeholder={i(i18n, 'contextMenu.search', {}, 'Search')} autoFocus value={search ?? ''} onChange={(e) => setSearch(e.target.value)} />
        <ContextMenuList isFiltered={isFiltered} options={nonNullOptions} onSelectOption={handleMenuItemClick} style={{position: 'relative'}}/>
      </div> : null}
    </>
  )
};