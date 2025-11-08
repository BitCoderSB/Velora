import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

const animations = [
  { name: 'windy', path: '/animations/windy icon.json' },
  { name: 'sunny', path: '/animations/sunny.json' },
  { name: 'snow', path: '/animations/snow icon.json' },
  { name: 'rainy', path: '/animations/rainy icon.json' },
  { name: 'cloudy', path: '/animations/cloudy icon (1).json' }
];

const LottieBackground = () => {
  const [animationData, setAnimationData] = useState({});
  const [loadedAnimations, setLoadedAnimations] = useState([]);

  useEffect(() => {
    const loadAnimations = async () => {
      const loaded = {};
      
      for (const animation of animations) {
        try {
          const response = await fetch(animation.path);
          const data = await response.json();
          loaded[animation.name] = data;
        } catch (error) {
          console.error(`Error loading ${animation.name}:`, error);
        }
      }
      
      setAnimationData(loaded);
      setLoadedAnimations(Object.keys(loaded));
    };

    loadAnimations();
  }, []);

  // Generate straight grid positions for each animation
  const generateAnimationProps = (index) => {
    const positions = [
      { top: '10%', left: '10%' },
      { top: '10%', right: '10%' },
      { top: '50%', left: '5%' },
      { top: '50%', right: '5%' },
      { bottom: '10%', left: '10%' },
      { bottom: '10%', right: '10%' },
      { top: '30%', left: '50%' },
      { bottom: '30%', right: '50%' }
    ];

    return positions[index % positions.length];
  };

  // Function to get size based on animation type
  const getAnimationSize = (animName) => {
    if (animName === 'sunny' || animName === 'windy') {
      return {
        width: Math.random() * 300 + 250, // Larger: 250-550px
        height: Math.random() * 300 + 250,
      };
    }
    return {
      width: Math.random() * 200 + 160, // Normal: 160-360px
      height: Math.random() * 200 + 160,
    };
  };

  if (loadedAnimations.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {loadedAnimations.map((animName, index) => (
        <motion.div
          key={`${animName}-${index}`}
          className="absolute opacity-10 blur-sm"
          style={{
            ...generateAnimationProps(index),
            ...getAnimationSize(animName),
          }}
          initial={{ 
            opacity: 0, 
            scale: 0.5
          }}
          animate={{ 
            opacity: [0.05, 0.15, 0.05],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: Math.random() * 20 + 15, // Random duration 15-35s
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5 // Random delay up to 5s
          }}
        >
          <Lottie
            animationData={animationData[animName]}
            loop={true}
            autoplay={true}
            style={{
              width: '100%',
              height: '100%',
              filter: 'blur(2px) brightness(0.7)',
              transform: 'rotate(0deg)', // Ensure no rotation
            }}
          />
        </motion.div>
      ))}

      {/* Create additional scattered instances for more coverage */}
      {loadedAnimations.slice(0, 3).map((animName, index) => (
        <motion.div
          key={`duplicate-${animName}-${index}`}
          className="absolute opacity-5 blur-lg"
          style={{
            ...generateAnimationProps(index + 5),
            width: Math.random() * 120 + 80, // Smaller duplicates (double size)
            height: Math.random() * 120 + 80,
          }}
          initial={{ 
            opacity: 0, 
            scale: 0.3,
          }}
          animate={{ 
            opacity: [0.02, 0.08, 0.02],
            scale: [0.6, 0.9, 0.6]
          }}
          transition={{
            duration: Math.random() * 25 + 20, // Slower for subtlety
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 8
          }}
        >
          <Lottie
            animationData={animationData[animName]}
            loop={true}
            autoplay={true}
            style={{
              width: '100%',
              height: '100%',
              filter: 'blur(4px) brightness(0.5)',
              transform: 'rotate(0deg)', // Ensure no rotation
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LottieBackground;