"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useDiscovery } from "./DiscoveryProvider";

export function SaveButton({ id, name, variant = "overlay", showLabel = false }: { id: string; name: string; variant?: "overlay" | "plain"; showLabel?: boolean }) {
  const { saved, toggleSave } = useDiscovery();
  const isSaved = saved.has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void toggleSave(id);
      }}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Хадгалсан жагсаалтаас хасах: ${name}` : `Хадгалах: ${name}`}
      className={
        variant === "overlay"
          ? "flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-95"
          : "btn btn-ghost"
      }
    >
      <motion.span key={String(isSaved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className="flex">
        <Heart size={17} className={isSaved ? "fill-accent text-accent" : ""} />
      </motion.span>
      {showLabel && <span>{isSaved ? "Хадгалсан" : "Хадгалах"}</span>}
    </button>
  );
}
