import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a'
];

function KonamiEasterEgg() {
  useEffect(() => {
    let konamiIndex = 0;
    let lastKeyPressTime = 0;
    const TIMEOUT = 3000; // Reset after 3 seconds of no input

    const triggerConfetti = () => {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Add a success message
      const message = document.createElement('div');
      message.textContent = '🎉 Konami Code Activated! 🎉';
      message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
        animation: fadeOut 3s forwards;
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
    };

    const handleKeyDown = (event) => {
      const currentTime = Date.now();
      
      // Reset if too much time has passed
      if (currentTime - lastKeyPressTime > TIMEOUT) {
        konamiIndex = 0;
      }
      
      lastKeyPressTime = currentTime;

      const key = event.key.toLowerCase();
      const expectedKey = KONAMI_CODE[konamiIndex].toLowerCase();

      if (key === expectedKey) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
          triggerConfetti();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    // Add keydown event listener
    window.addEventListener('keydown', handleKeyDown);

    // Add CSS for the fadeOut animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      style.remove();
    };
  }, []);

  return null; // This component doesn't render anything
}

export default KonamiEasterEgg; 