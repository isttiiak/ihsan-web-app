import React from "react";
import { motion } from "framer-motion";

export default function CounterButton({ onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="btn btn-primary"
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
