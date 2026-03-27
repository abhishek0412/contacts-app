import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Show up to 5 page numbers centered on current page
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    startPage = Math.max(1, endPage - 4);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="pagination" role="navigation" aria-label="Pagination">
      <span className="pagination-info">
        Showing {start}–{end} of {totalItems} contacts
      </span>
      <div className="pagination-controls">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`page-number${page === currentPage ? " active" : ""}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages && (
          <button
            className="page-number page-next"
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
