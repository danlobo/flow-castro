import { build } from "./_common";

const theme = {
  colors: {
    primary: "#000088",
    secondary: "#008800",
    background: "#222",
    text: "#DDD",
    hover: "#333",
    border: "#888",
    selectionBorder: "#aaa", // Cor mais clara para ser visível no tema escuro
  },
};

export default build(theme);
