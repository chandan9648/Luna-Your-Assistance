import React, { useEffect, useState } from 'react';

// Allows two render modes:
// - floating (default): fixed button at corner using .theme-toggle styles
// - icon: inline button styled like other navbar icon buttons
const ThemeToggle = ({ variant = 'floating', className = '' }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }

  const isFloating = variant === 'floating';
  const btnClass = isFloating ? 'theme-toggle' : 'chat-icon-btn';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${btnClass} ${className}`.trim()}
      aria-label={theme === 'light' ? 'Activate dark mode' : 'Activate light mode'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;