"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showLabel?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onChange,
  showLabel = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = starValue - 0.5 === displayRating;

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={interactive ? { scale: 1.3 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onChange?.(starValue)}
            className={`${
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : "cursor-default"
            } focus:outline-none`}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                isFilled
                  ? "text-amber-400 fill-amber-400"
                  : isHalf
                  ? "text-amber-400 fill-amber-400/50"
                  : "text-slate-300 dark:text-slate-600"
              }`}
              strokeWidth={1.5}
            />
          </motion.button>
        );
      })}

      {showLabel && (
        <span className="ml-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          {rating > 0 ? `${rating.toFixed(1)} / ${maxStars}` : "Değerlendirilmemiş"}
        </span>
      )}
    </div>
  );
}
