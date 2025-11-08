import { motion } from "framer-motion";

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: {
    rotateX: -90,
    opacity: 0,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: {
    rotateX: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

export default function LiquidHeading({ children }) {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative inline-block h-6"
      style={{
        perspective: "600px",
        transformStyle: "preserve-3d",
        transformOrigin: "center bottom",
      }}
    >
      {/* Glow */}
      <motion.div
        className="absolute -inset-6 -z-10 rounded-full"
        variants={glowVariants}
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
          filter: "blur(12px)",
        }}
      />

      {/* Front */}
      <motion.div variants={itemVariants} className="absolute inset-0">
        <span className="text-sm font-medium text-slate-700 dark:text-white">{children}</span>
      </motion.div>
      {/* Back (duplicate) */}
      <motion.div variants={backVariants} className="absolute inset-0">
        <span className="text-sm font-medium text-slate-800 dark:text-white">{children}</span>
      </motion.div>
      {/* Reserve space */}
      <span className="invisible text-sm font-medium">{children}</span>
    </motion.div>
  );
}
