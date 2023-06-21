import { useEffect, useRef, useState } from "react";
import styles from "./ContextMenu.module.css";

export const ContextMenu = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [options, setOptions] = useState(null);

  const menuRef = useRef(null);

  const handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('handleContextMenu', e, options)
    setOptions(options);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMenuItemClick = (option) => {
    option.onClick?.()
    setOptions(null)
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setOptions(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <>
      {children({ handleContextMenu })}
      <div ref={menuRef} className={styles["context-menu"]} style={{ left: position.x, top: position.y, visibility: options ? 'visible' : 'hidden' }}>
        <ul>
          {options?.map((option) => (
            <li key={option.id} onClick={() => handleMenuItemClick(option)}>
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
};