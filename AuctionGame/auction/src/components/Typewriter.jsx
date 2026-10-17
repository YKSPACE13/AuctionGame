import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Typewriter = ({ text = '', speed = 50, className = '', onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when text changes
  useEffect(() => {
    if (text && text.length > 0) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsComplete(false);
    }
  }, [text]);

  useEffect(() => {
    if (!text || text.length === 0) {
      if (!isComplete) {
        setIsComplete(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete && currentIndex >= text.length && text.length > 0) {
      setIsComplete(true);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }
  }, [currentIndex, text, speed, isComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-0.5 h-[1em] bg-current ml-1"
        >
          |
        </motion.span>
      )}
    </span>
  );
};

export default Typewriter;

