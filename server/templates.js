// Template definitions for app generator
export const APP_TEMPLATES = {
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Complete online store with products, cart, and payments',
    icon: '🛒',
    frameworks: ['nextjs', 'react', 'vue'],
    features: ['products', 'cart', 'checkout', 'payments', 'user-auth', 'admin'],
    styling: ['tailwind', 'material-ui', 'bootstrap'],
    components: [
      'ProductGrid',
      'ProductCard', 
      'CartModal',
      'CheckoutForm',
      'PaymentForm',
      'UserAuth',
      'AdminDashboard'
    ],
    pages: [
      'Home',
      'Products',
      'ProductDetail',
      'Cart',
      'Checkout',
      'Profile',
      'Admin'
    ],
    dependencies: {
      nextjs: ['next', 'react', 'react-dom', 'stripe', 'next-auth'],
      react: ['react', 'react-dom', 'react-router-dom', 'stripe', 'axios'],
      vue: ['vue', 'vue-router', 'vuex', 'stripe', 'axios']
    }
  },
  
  saas: {
    id: 'saas',
    name: 'SaaS Dashboard',
    description: 'Software as a Service application with dashboard and billing',
    icon: '📊',
    frameworks: ['nextjs', 'react', 'angular'],
    features: ['dashboard', 'analytics', 'billing', 'user-auth', 'settings', 'api'],
    styling: ['tailwind', 'material-ui', 'ant-design'],
    components: [
      'Dashboard',
      'Analytics',
      'BillingForm',
      'UserSettings',
      'DataTable',
      'Charts',
      'UserManagement'
    ],
    pages: [
      'Dashboard',
      'Analytics',
      'Billing',
      'Settings',
      'Users',
      'API'
    ],
    dependencies: {
      nextjs: ['next', 'react', 'react-dom', 'chart.js', 'stripe', 'next-auth'],
      react: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'stripe', 'axios'],
      angular: ['@angular/core', '@angular/router', 'chart.js', 'stripe', '@angular/material']
    }
  },
  
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio Website',
    description: 'Professional portfolio with projects and contact form',
    icon: '💼',
    frameworks: ['nextjs', 'react', 'vue', 'vite'],
    features: ['projects', 'contact', 'blog', 'resume', 'skills'],
    styling: ['tailwind', 'styled-components', 'css-modules'],
    components: [
      'Hero',
      'About',
      'Projects',
      'Skills',
      'Contact',
      'Blog',
      'Resume'
    ],
    pages: [
      'Home',
      'About',
      'Projects',
      'Contact',
      'Blog'
    ],
    dependencies: {
      nextjs: ['next', 'react', 'react-dom', 'framer-motion'],
      react: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
      vue: ['vue', 'vue-router', 'vuex', 'gsap'],
      vite: ['vite', 'react', 'react-dom', 'framer-motion']
    }
  },
  
  blog: {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Content management system for blogging',
    icon: '📝',
    frameworks: ['nextjs', 'react', 'vue'],
    features: ['posts', 'categories', 'comments', 'search', 'admin', 'seo'],
    styling: ['tailwind', 'typography', 'css-modules'],
    components: [
      'PostCard',
      'PostDetail',
      'CategoryFilter',
      'SearchBar',
      'CommentForm',
      'AdminPanel',
      'PostEditor'
    ],
    pages: [
      'Home',
      'Post',
      'Category',
      'Search',
      'About',
      'Admin'
    ],
    dependencies: {
      nextjs: ['next', 'react', 'react-dom', 'gray-matter', 'remark'],
      react: ['react', 'react-dom', 'react-router-dom', 'gray-matter', 'remark'],
      vue: ['vue', 'vue-router', 'vuex', 'gray-matter', 'remark']
    }
  },
  
  landing: {
    id: 'landing',
    name: 'Landing Page',
    description: 'High-converting landing page for marketing',
    icon: '🚀',
    frameworks: ['nextjs', 'react', 'vue', 'vite'],
    features: ['hero', 'features', 'testimonials', 'pricing', 'contact', 'cta'],
    styling: ['tailwind', 'styled-components', 'css-modules'],
    components: [
      'Hero',
      'Features',
      'Testimonials',
      'Pricing',
      'Contact',
      'CTA',
      'Footer'
    ],
    pages: [
      'Home',
      'Features',
      'Pricing',
      'Contact'
    ],
    dependencies: {
      nextjs: ['next', 'react', 'react-dom', 'framer-motion'],
      react: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
      vue: ['vue', 'vue-router', 'gsap'],
      vite: ['vite', 'react', 'react-dom', 'framer-motion']
    }
  }
};

export const FRAMEWORKS = {
  nextjs: {
    id: 'nextjs',
    name: 'Next.js',
    description: 'React framework with SSR and static generation',
    icon: '⚡',
    features: ['ssr', 'ssg', 'api-routes', 'optimization'],
    setup: 'npx create-next-app@latest'
  },
  react: {
    id: 'react',
    name: 'React',
    description: 'Popular JavaScript library for building UIs',
    icon: '⚛️',
    features: ['components', 'hooks', 'state-management'],
    setup: 'npx create-react-app'
  },
  vue: {
    id: 'vue',
    name: 'Vue.js',
    description: 'Progressive JavaScript framework',
    icon: '💚',
    features: ['components', 'reactivity', 'routing'],
    setup: 'npm create vue@latest'
  },
  angular: {
    id: 'angular',
    name: 'Angular',
    description: 'Full-featured TypeScript framework',
    icon: '🅰️',
    features: ['typescript', 'dependency-injection', 'routing'],
    setup: 'ng new'
  },
  vite: {
    id: 'vite',
    name: 'Vite',
    description: 'Fast build tool and dev server',
    icon: '⚡',
    features: ['fast-build', 'hmr', 'optimization'],
    setup: 'npm create vite@latest'
  }
};

export const STYLING_OPTIONS = {
  tailwind: {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    icon: '🎨',
    features: ['utility-classes', 'responsive', 'customizable']
  },
  'material-ui': {
    id: 'material-ui',
    name: 'Material UI',
    description: 'React components implementing Material Design',
    icon: '🎭',
    features: ['components', 'theming', 'accessibility']
  },
  bootstrap: {
    id: 'bootstrap',
    name: 'Bootstrap',
    description: 'Popular CSS framework',
    icon: '🎪',
    features: ['components', 'grid', 'responsive']
  },
  'styled-components': {
    id: 'styled-components',
    name: 'Styled Components',
    description: 'CSS-in-JS library',
    icon: '💅',
    features: ['css-in-js', 'dynamic-styling', 'theming']
  }
};

export const DEPLOYMENT_OPTIONS = {
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy to Vercel with zero configuration',
    icon: '▲',
    features: ['auto-deploy', 'cdn', 'serverless']
  },
  netlify: {
    id: 'netlify',
    name: 'Netlify',
    description: 'Deploy to Netlify with continuous deployment',
    icon: '🌐',
    features: ['auto-deploy', 'forms', 'functions']
  },
  github: {
    id: 'github',
    name: 'GitHub Pages',
    description: 'Deploy to GitHub Pages',
    icon: '📄',
    features: ['free', 'github-integration', 'custom-domain']
  }
};

// Generate app structure based on template and choices
export function generateAppStructure(templateId, frameworkId, stylingId, customizations = {}) {
  const template = APP_TEMPLATES[templateId];
  const framework = FRAMEWORKS[frameworkId];
  const styling = STYLING_OPTIONS[stylingId];
  
  if (!template || !framework || !styling) {
    throw new Error('Invalid template, framework, or styling selection');
  }
  
  return {
    template,
    framework,
    styling,
    structure: {
      components: template.components,
      pages: template.pages,
      dependencies: template.dependencies[frameworkId] || [],
      stylingDependencies: getStylingDependencies(stylingId),
      config: generateConfig(frameworkId, stylingId),
      scripts: generateScripts(frameworkId)
    }
  };
}

function getStylingDependencies(stylingId) {
  const stylingDeps = {
    tailwind: ['tailwindcss', 'autoprefixer', 'postcss'],
    'material-ui': ['@mui/material', '@emotion/react', '@emotion/styled'],
    bootstrap: ['bootstrap', 'react-bootstrap'],
    'styled-components': ['styled-components']
  };
  return stylingDeps[stylingId] || [];
}

function generateConfig(frameworkId, stylingId) {
  const configs = {
    nextjs: {
      'package.json': {
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        }
      },
      'tailwind.config.js': stylingId === 'tailwind' ? {
        content: ['./src/**/*.{js,ts,jsx,tsx}'],
        theme: { extend: {} },
        plugins: []
      } : null
    },
    react: {
      'package.json': {
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build',
          test: 'react-scripts test'
        }
      }
    },
    vite: {
      'package.json': {
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        }
      }
    }
  };
  
  return configs[frameworkId] || {};
}

function generateScripts(frameworkId) {
  const scripts = {
    nextjs: ['dev', 'build', 'start'],
    react: ['start', 'build', 'test'],
    vite: ['dev', 'build', 'preview'],
    vue: ['serve', 'build', 'test'],
    angular: ['ng serve', 'ng build', 'ng test']
  };
  
  return scripts[frameworkId] || [];
}