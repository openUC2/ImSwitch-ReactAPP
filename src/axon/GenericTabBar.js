import React, { useState, useEffect, useRef } from "react";

// Global counter to generate unique IDs for each component instance
let counter = 0;

function GenericTabBar({ children, tabNames, id }) {
  // Use useRef for the unique identifier
  const componentId = useRef(id || ++counter).current; // Always generate unique id using counter or passed id

  // Generate the localStorageKey using the component's unique ID if `id` is set
  const localStorageKey = id ? `activeTab-${componentId}` : null;
  console.log("localStorageKey", localStorageKey);

  //define state active tab and load if it is saved
  const [activeTab, setActiveTab] = useState(() => {
    if (localStorageKey) {
      const savedTab = localStorage.getItem(localStorageKey);
      return savedTab !== null ? parseInt(savedTab, 10) : 0; // Return savedTab if available, else default to 0
    }
    return 0; // Default to 0 if no id is provided
  });


  // Load the active tab from localStorage when the component mounts, but only if `id` is set
  useEffect(() => {
    if (localStorageKey) {
      const savedTab = localStorage.getItem(localStorageKey);
      if (savedTab !== null) {
        setActiveTab(parseInt(savedTab, 10)); // Parse the saved tab index
      }
    }
  }, [localStorageKey]);

  // Save the active tab to localStorage whenever it changes, but only if `id` is set
  useEffect(() => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, activeTab);
    }
  }, [activeTab, localStorageKey]);

  const renderTabs = () => {
    return React.Children.map(children, (child, index) => (
      <button
        style={{
          padding: "10px",
          cursor: "pointer",
          borderBottom: activeTab === index ? "8px solid blue" : "none",
        }}
        onClick={() => setActiveTab(index)}
        key={index}
      >
        {tabNames[index] || `Tab ${index + 1}`}
      </button>
    ));
  };

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
        {renderTabs()}
      </div>
      <div style={{ marginTop: "0px" }}>
        {/* Render the content of the active tab */}
        {children[activeTab]}
      </div>
    </div>
  );
}

export default GenericTabBar;
