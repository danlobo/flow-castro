import { useEffect, useRef, useState } from "react";

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

  return (
    <ul className="context-menu" style={style}>
      {options?.filter(isFiltered)?.map((option) => {
        if (option.separator === true)
          return <li key={option.id} ><hr /></li>

        return <li
          key={option.label}
          onClick={() => onSelectOption(option)}
          onMouseEnter={(e) => handleMenuItemMouseEnter(e, option.label)}
          onMouseLeave={() => handleMenuItemMouseLeave()}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
              <div style={option.style}>{option.label}</div>
              {option.description && <div style={{ color: 'gray', fontSize: '.8rem', fontStyle: 'italic' }}>{option.description}</div>}
            </div>
            {option.children && <div style={{ flex: '0 0 auto', fontSize: '.8rem', color: 'gray' }}>▶</div>}
          </div>

          {option.children && option.label === activeSubmenu && (
              <ContextMenuList
                isFiltered={isFiltered}
                options={option.children.map((o) => ({ ...o, _parent: option }))}
                onSelectOption={onSelectOption}
                style={{
                  position: 'absolute', 
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


export const ContextMenu = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [options, setOptions] = useState(null);
  const [search, setSearch] = useState('')

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => searchRef.current?.focus(), 0)
    
    setOptions(options);
    setPosition({ x: e.clientX, y: e.clientY });
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

    return false
  }

  return (
    <>
      {children({ handleContextMenu })}
      <div ref={menuRef} className="context-menu" style={{ left: position.x, top: position.y, visibility: options ? 'visible' : 'hidden' }}>
        <input ref={searchRef} type="text" placeholder="Buscar..." autoFocus value={search ?? ''} onChange={(e) => setSearch(e.target.value)} />
        <ContextMenuList isFiltered={isFiltered} options={options} onSelectOption={handleMenuItemClick} style={{position: 'relative'}}/>
      </div>
    </>
  )
};