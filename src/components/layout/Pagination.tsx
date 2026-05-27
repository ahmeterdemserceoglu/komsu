"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 0) return null;

  const handleEllipsisClick = () => {
    const input = window.prompt(`Gitmek istediğiniz sayfa numarasını girin (1 - ${totalPages}):`);
    if (input !== null) {
      const pageNum = parseInt(input.trim(), 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      } else {
        alert(`Lütfen 1 ile ${totalPages} arasında geçerli bir sayfa numarası girin.`);
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 select-none">
      {/* First Page Button (<<) */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shadow-sm"
        title="İlk Sayfa"
        aria-label="İlk Sayfa"
      >
        <ChevronsLeft size={16} strokeWidth={2.5} />
      </button>

      {/* Previous Page Button (<) */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shadow-sm"
        title="Önceki Sayfa"
        aria-label="Önceki Sayfa"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <button
                key={`ellipsis-${index}`}
                onClick={handleEllipsisClick}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-[#f58220] hover:border-[#f58220] dark:text-slate-400 dark:hover:text-[#f58220] dark:hover:border-[#f58220] flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Sayfaya Git..."
              >
                ...
              </button>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`h-9 w-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                isCurrent
                  ? "bg-[#f58220] hover:bg-[#e07216] text-white shadow-md shadow-orange-500/20 scale-105"
                  : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-sm"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Page Button (>) */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shadow-sm"
        title="Sonraki Sayfa"
        aria-label="Sonraki Sayfa"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>

      {/* Last Page Button (>>) */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shadow-sm"
        title="Son Sayfa"
        aria-label="Son Sayfa"
      >
        <ChevronsRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
