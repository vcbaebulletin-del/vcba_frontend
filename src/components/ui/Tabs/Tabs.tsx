import React, { createContext, useContext, useState } from 'react';
import './Tabs.css';

// Context for Tabs state management
interface TabsContextType {
  activeTab: string;
  onTabChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

// Main Tabs component
export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className = '',
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const handleTabChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue: TabsContextType = {
    activeTab,
    onTabChange: handleTabChange,
    orientation,
  };

  const tabsClasses = [
    'tabs',
    `tabs--${orientation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={tabsClasses}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({
  className = '',
  children,
}) => {
  const { orientation } = useTabsContext();

  const listClasses = [
    'tabs__list',
    `tabs__list--${orientation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={listClasses} role="tablist" aria-orientation={orientation}>
      {children}
    </div>
  );
};

// TabsTrigger component
export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  disabled = false,
  className = '',
  children,
}) => {
  const { activeTab, onTabChange } = useTabsContext();

  const handleClick = () => {
    if (!disabled) {
      onTabChange(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onTabChange(value);
      }
    }
  };

  const isActive = activeTab === value;

  const triggerClasses = [
    'tabs__trigger',
    isActive ? 'tabs__trigger--active' : '',
    disabled ? 'tabs__trigger--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={triggerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </button>
  );
};

// TabsContent component
export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className = '',
  children,
}) => {
  const { activeTab } = useTabsContext();

  const isActive = activeTab === value;

  if (!isActive) return null;

  const contentClasses = [
    'tabs__content',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={contentClasses}
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
};
