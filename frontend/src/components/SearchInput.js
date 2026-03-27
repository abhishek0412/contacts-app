import React from "react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search contacts...",
}) => (
  <input
    type="text"
    className="search-input"
    placeholder={placeholder}
    aria-label={placeholder}
    value={value}
    onChange={onChange}
  />
);

export default SearchInput;
