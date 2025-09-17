'use client';

import { useState, useRef } from 'react';

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
  isMinimized?: boolean;
  icon?: React.ReactNode;
}

interface TabPanelProps {
  initialTabs: Tab[];
}

export default function TabPanel({ initialTabs }: TabPanelProps) {
  const [tabs, setTabs] = useState<Tab[]>(
    initialTabs.map(tab => ({ ...tab, isMinimized: false }))
  );
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', tabId);
    
    // Create custom drag image
    const dragElement = e.target as HTMLElement;
    const dragImage = dragElement.cloneNode(true) as HTMLElement;
    dragImage.className = 'drag-preview';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverTab(tabId);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverTab(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    
    if (!draggedTab || draggedTab === dropTargetId) {
      return;
    }

    const draggedIndex = tabs.findIndex(tab => tab.id === draggedTab);
    const dropTargetIndex = tabs.findIndex(tab => tab.id === dropTargetId);

    if (draggedIndex === -1 || dropTargetIndex === -1) {
      return;
    }

    const newTabs = [...tabs];
    const draggedTabData = newTabs[draggedIndex];
    
    // Remove dragged tab from its current position
    newTabs.splice(draggedIndex, 1);
    
    // Insert at new position
    newTabs.splice(dropTargetIndex, 0, draggedTabData);
    
    setTabs(newTabs);
    setDragOverTab(null);
    dragCounter.current = 0;
  };

  const toggleTabMinimize = (tabId: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, isMinimized: !tab.isMinimized }
          : tab
      )
    );
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-black border-l border-gray-800 overflow-hidden">
      {/* Accordion-style Tab Panels */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, tab.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tab.id)}
            className={`
              accordion-tab border-b border-gray-800 last:border-b-0 tab-item
              ${draggedTab === tab.id ? 'tab-dragging' : ''}
              ${dragOverTab === tab.id && draggedTab !== tab.id ? 'tab-drag-over' : ''}
              transition-all duration-300 ease-in-out hover:bg-gray-900/30
            `}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Tab Header */}
            <div 
              className="tab-header flex items-center justify-between p-3 cursor-pointer hover:bg-gray-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20"
              onClick={() => toggleTabMinimize(tab.id)}
            >
              {/* Left Section: Drag Handle + Icon + Title */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Drag Handle */}
                <div className="drag-handle flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
                  </svg>
                </div>

                {/* Tab Icon */}
                <div className="tab-icon text-gray-400 flex-shrink-0">
                  {getTabIcon(tab.id)}
                </div>

                {/* Tab Title */}
                <span className="text-sm font-medium text-white truncate">
                  {tab.title}
                </span>
              </div>

              {/* Right Section: Minimize/Expand Button */}
              <button
                className="minimize-btn p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-300 flex-shrink-0 hover:scale-110 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTabMinimize(tab.id);
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className={`transform transition-all duration-500 ease-out ${
                    tab.isMinimized ? 'rotate-90' : 'rotate-0'
                  }`}
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Tab Content */}
            <div 
              className={`tab-content-area overflow-hidden ${
                tab.isMinimized ? 'max-h-0 opacity-0 py-0' : 'max-h-[600px] opacity-100 py-1'
              }`}
              style={{
                transition: 'max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              <div className="px-1 overflow-y-auto max-h-[600px]">
                <div 
                  className={`transition-all duration-300 ${
                    tab.isMinimized ? 'transform scale-95 opacity-0' : 'transform scale-100 opacity-100'
                  }`}
                >
                  {tab.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Helper function to get tab icons
  function getTabIcon(tabId: string) {
    const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
    
    switch (tabId) {
      case 'trip-details':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
          </svg>
        );
      case 'itinerary':
        return (
          <svg {...iconProps}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        );
      case 'preferences':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15A1.65 1.65 0 0 0 21 13.35V10.65A1.65 1.65 0 0 0 19.4 9L18.36 8.5A1.65 1.65 0 0 1 17.5 6.93L18 5.89A1.65 1.65 0 0 0 16.11 4L13.35 3A1.65 1.65 0 0 0 10.65 3L7.89 4A1.65 1.65 0 0 0 6 5.89L6.5 6.93A1.65 1.65 0 0 1 5.64 8.5L4.6 9A1.65 1.65 0 0 0 3 10.65V13.35A1.65 1.65 0 0 0 4.6 15L5.64 15.5A1.65 1.65 0 0 1 6.5 17.07L6 18.11A1.65 1.65 0 0 0 7.89 20L10.65 21A1.65 1.65 0 0 0 13.35 21L16.11 20A1.65 1.65 0 0 0 18 18.11L17.5 17.07A1.65 1.65 0 0 1 18.36 15.5L19.4 15Z"/>
          </svg>
        );
      case 'weather':
        return (
          <svg {...iconProps}>
            <path d="M18 10H16.74A7 7 0 1 0 9 17H18A3 3 0 0 0 18 11Z"/>
            <path d="M13 8L16 5L19 8"/>
          </svg>
        );
      case 'bookmarks':
        return (
          <svg {...iconProps}>
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"/>
          </svg>
        );
      case 'history':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      default:
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
        );
    }
  }
}
