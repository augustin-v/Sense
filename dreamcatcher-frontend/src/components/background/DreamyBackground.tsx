import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const DreamyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Stars parameters
    const stars = [];
    const count = 200;
    const maxRadius = 2;

    // Create stars
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * maxRadius,
        color: `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`,
        velocity: Math.random() * 0.05 + 0.02
      });
    }

    // Add some colorful dreamy nebulas
    const nebulas = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3, radius: 150, color: 'rgba(98, 54, 255, 0.1)' },
      { x: canvas.width * 0.8, y: canvas.height * 0.7, radius: 180, color: 'rgba(255, 54, 243, 0.08)' },
      { x: canvas.width * 0.5, y: canvas.height * 0.5, radius: 200, color: 'rgba(54, 200, 255, 0.06)' },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw nebulas
      nebulas.forEach(nebula => {
        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.radius
        );
        gradient.addColorStop(0, nebula.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw and update stars
      stars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move star
        star.y += star.velocity;

        // Reset star position when it goes off screen
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -10, overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to bottom, #000000, rgba(88, 28, 135, 0.2), #000000)'
        }}
      />
      {/* Add floating dream elements */}
      <motion.div 
        style={{
          position: 'absolute',
          borderRadius: '100%',
          width: '8rem',
          height: '8rem',
          background: 'rgba(98, 54, 255, 0.1)',
          filter: 'blur(3rem)'
        }}
        animate={{
          x: ['-10%', '110%'],
          y: ['10%', '40%', '20%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      <motion.div 
        style={{
          position: 'absolute',
          borderRadius: '100%',
          width: '16rem',
          height: '16rem',
          background: 'rgba(99, 102, 241, 0.05)',
          filter: 'blur(3rem)'
        }}
        animate={{
          x: ['110%', '-10%'],
          y: ['60%', '30%', '70%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    </div>
  );
};

export default DreamyBackground;
