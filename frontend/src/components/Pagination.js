import React from "react";

const Pagination = ({ currentPage, totalPages, onPrev, onNext }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination" role="navigation" aria-label="Pagination">
      <button
        className="page-btn"
        disabled={currentPage === 1}
        onClick={onPrev}
        aria-label="Previous page"
      >
        &laquo; Prev
      </button>
      <span className="page-info" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="page-btn"
        disabled={currentPage === totalPages}
        onClick={onNext}
        aria-label="Next page"
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;
