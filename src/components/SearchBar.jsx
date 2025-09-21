import React, { useState } from "react";
import "../styles/SearchBar.css";
import filter from "../assets/funnel.png";
const SearchBar = ({ onSortChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  return (
    <div className="search-container_total">
      <div className="floating-button-container">
        {/* Nút duy nhất để toggle */}
        <button className="circle-button" onClick={toggleDropdown}>
         <img src={filter} alt="" /> <span className={showDropdown ? "close-x" : ""}></span>
        </button>

        {/* Dropdown Min / Max */}
        {showDropdown && (
          <div className="circle-dropdown-menu-inside">
            <button className="circle-min"
              onClick={() => {
                onSortChange("asc");
                setShowDropdown(true);
              }}
            >
              Min
            </button>
            <button className="circle-max"
              onClick={() => {
                onSortChange("desc");
                setShowDropdown(true);
              }}
            >
              Max
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
