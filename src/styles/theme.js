// Global Theme Configuration
export const theme = {
  colors: {
    // Primary colors
    primary: '#000000',
    secondary: '#ffffff',
    
    // Background colors
    background: '#ffffff',
    backgroundDark: '#000000',
    backgroundLight: '#f8f9fa',
    
    // Text colors
    text: '#000000',
    textLight: '#6b7280',
    textDark: '#ffffff',
    
    // Border colors
    border: '#e5e7eb',
    borderDark: '#374151',
    
    // Accent colors
    accent: '#3b82f6',
    accentHover: '#2563eb',
    
    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    
    // Interactive colors
    hover: '#f3f4f6',
    hoverDark: '#1f2937',
    active: '#e5e7eb',
    activeDark: '#374151',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
};

export default theme;