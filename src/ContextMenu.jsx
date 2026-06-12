import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import css from "./ContextMenu.module.css";
import { useTheme } from "./ThemeProvider.jsx";
import { i } from "./util/i18n.js";

const ContextMenuList = forwardRef(
  ({ isFiltered, options, onSelectOption, style, containerRef }, ref) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeSubmenuPosition, setActiveSubmenuPosition] = useState(null);
  const [submenuDirection, setSubmenuDirection] = useState("left");
  const submenuRef = useRef(null);

  const activeOption = options?.find((it) => it.label === activeSubmenu);

  const getBoundary = () =>
    containerRef?.current?.getBoundingClientRect() ?? {
      right: window.innerWidth,
      bottom: window.innerHeight,
    };

  const handleMenuItemMouseEnter = (e, parentId) => {
    setActiveSubmenu(parentId);
    const pos =
      e.currentTarget.getBoundingClientRect().top -
      e.currentTarget.parentNode.getBoundingClientRect().top;
    setActiveSubmenuPosition(pos);

    const estimatedSubmenuWidth =
      e.currentTarget.parentNode.getBoundingClientRect().width;
    const rightEdge = e.currentTarget.getBoundingClientRect().right;

    setSubmenuDirection(
      rightEdge + estimatedSubmenuWidth > getBoundary().right ? "right" : "left"
    );
  };

  const handleMenuItemMouseLeave = () => {
    setActiveSubmenu(null);
  };

  useLayoutEffect(() => {
    if (!submenuRef.current || !activeSubmenu) return;

    const submenuRect = submenuRef.current.getBoundingClientRect();
    const boundaryBottom = getBoundary().bottom;

    if (submenuRect.bottom > boundaryBottom) {
      const overflow = submenuRect.bottom - boundaryBottom;
      setActiveSubmenuPosition((prev) => Math.max(0, (prev ?? 0) - overflow));
    }
  }, [activeSubmenu, activeSubmenuPosition]);

  if (!options?.length) return null;

  return (
    <ul className={css.contextMenu} style={style} ref={ref}>
      {options
        ?.filter(isFiltered)
        ?.sort((a, b) => a.label.localeCompare(b.label))
        ?.map((option, index) => {
          if (option.separator === true)
            return (
              <li key={`${option.id}-${index}`}>
                <hr />
              </li>
            );

          return (
            <li
              key={`${option.label}-${index}`}
              onClick={(e) => onSelectOption(option, e)}
              onMouseEnter={(e) => handleMenuItemMouseEnter(e, option.label)}
              onMouseLeave={() => handleMenuItemMouseLeave()}
            >
              <div className={css.contextMenuItemContainer}>
                <div className={css.contextMenuItemLabelContainer}>
                  <div
                    className={css.contextMenuItemLabel}
                    style={option.style}
                  >
                    {option.label}
                  </div>
                </div>
                {option.children && (
                  <div className={css.contextMenuItemSubMenu}>▶</div>
                )}
              </div>

              {option.children && option.label === activeSubmenu && (
                <ContextMenuList
                  ref={submenuRef}
                  containerRef={containerRef}
                  isFiltered={isFiltered}
                  options={option.children.map((o) => ({
                    ...o,
                    _parent: option,
                  }))}
                  onSelectOption={onSelectOption}
                  style={{
                    [submenuDirection]: "100%",
                    top: activeSubmenuPosition,
                  }}
                />
              )}
            </li>
          );
        })}
      {activeOption?.description && (
        <li>
          <div className={css.contextMenuItemDescription}>
            <pre>{activeOption.description}</pre>
          </div>
        </li>
      )}
    </ul>
  );
  }
);

export const ContextMenu = ({ containerRef, i18n, children }) => {
  const { currentTheme } = useTheme();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [options, setOptions] = useState(null);
  const [search, setSearch] = useState("");

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => searchRef.current?.focus(), 0);

    const containerRect = containerRef.current?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
    };
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setOptions(options);
    setPosition({ x, y });
  };

  const handleMenuItemClick = (option, e) => {
    if (e) {
      e.stopPropagation();
    }

    option.onClick?.(option);
    setSearch("");
    setOptions(null);
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setSearch("");
      setOptions(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const isFiltered = (option) => {
    if (!search?.length) return true;

    const _search = search.toLocaleLowerCase();

    if ((option.label?.toLowerCase()?.indexOf(_search) ?? -1) > -1) return true;

    if ((option.description?.toLowerCase()?.indexOf(_search) ?? -1) > -1)
      return true;

    if (
      option.children?.length &&
      option.children?.some((it) => isFiltered(it))
    )
      return true;

    return false;
  };

  const nonNullOptions = options?.filter((it) => Boolean(it));

  useLayoutEffect(() => {
    if (!menuRef.current || !nonNullOptions?.length) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() ?? {
      right: window.innerWidth,
      bottom: window.innerHeight,
    };

    let adjustedX = position.x;
    let adjustedY = position.y;

    if (menuRect.right > containerRect.right) {
      adjustedX -= menuRect.right - containerRect.right;
    }
    if (menuRect.bottom > containerRect.bottom) {
      adjustedY -= menuRect.bottom - containerRect.bottom;
    }

    adjustedX = Math.max(0, adjustedX);
    adjustedY = Math.max(0, adjustedY);

    if (adjustedX !== position.x || adjustedY !== position.y) {
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [options, position.x, position.y]);

  return (
    <>
      {children({ handleContextMenu })}
      {nonNullOptions?.length ? (
        <div
          ref={menuRef}
          className={css.container}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <input
            ref={searchRef}
            type="text"
            className={css.searchInput}
            placeholder={i(i18n, "contextMenu.search", {}, "Search")}
            autoFocus
            value={search ?? ""}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ContextMenuList
            containerRef={containerRef}
            isFiltered={isFiltered}
            options={nonNullOptions}
            onSelectOption={handleMenuItemClick}
            style={{ position: "relative" }}
          />
        </div>
      ) : null}
    </>
  );
};
