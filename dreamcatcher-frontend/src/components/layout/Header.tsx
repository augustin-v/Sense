import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.nav 
      style={{ 
        position: 'relative', 
        zIndex: 50, 
        padding: '1rem 1.5rem' 
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: 'linear-gradient(to right, #7C3AED, #6366F1)'
            }}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(to right, #ffffff, #e9d5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Dreamcatcher
          </span>
        </a>
        
        <div style={{ display: 'none', alignItems: 'center', gap: '1.5rem' }} className="desktop-menu">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/dreams">Dreams</NavLink>
          <NavLink href="/about">About</NavLink>
          <button style={{
            border: '1px solid #8B5CF6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            transition: 'background-color 0.3s',
            background: 'transparent'
          }}>
            Connect
          </button>
        </div>
        
        <button 
          style={{ color: 'white' }}
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <motion.div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)'
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem' }}>
            <NavLink href="/">Home</NavLink>
            <NavLink href="/dreams">Dreams</NavLink>
            <NavLink href="/about">About</NavLink>
            <button style={{
              border: '1px solid #8B5CF6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              transition: 'background-color 0.3s',
              background: 'transparent'
            }}>
              Connect
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      style={{
        color: '#D1D5DB',
        transition: 'color 0.3s',
        position: 'relative'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
      onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
    >
      <span>{children}</span>
      <span style={{
        position: 'absolute',
        bottom: '-4px',
        left: 0,
        width: 0,
        height: '2px',
        background: '#8B5CF6',
        transition: 'width 0.3s'
      }} className="hover-line" />
    </a>
  );
}

export default Header;
