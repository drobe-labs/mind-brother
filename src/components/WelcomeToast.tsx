import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeToastProps {
  name: string;
  isNewUser?: boolean;
  onClose: () => void;
}

export default function WelcomeToast({ name, isNewUser = false, onClose }: WelcomeToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-4 pr-12 max-w-md">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div>
          <h3 className="font-bold text-lg">
            {isNewUser ? `Hello, ${name}!` : `Welcome back, ${name}!`}
          </h3>
          <p className="text-white/90 text-sm">
            {isNewUser 
              ? "We're glad to have you here!" 
              : "Ready to continue your wellness journey?"}
          </p>
        </div>
      </div>
    </div>
  );
}

