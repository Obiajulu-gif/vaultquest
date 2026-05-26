import type { FC, ReactNode } from "react";
import { useEffect, useCallback } from "react";

export interface ModalProps {
  children?: ReactNode;
  onClose: () => void;
  className?: string;
}

const Modal: FC<ModalProps> = ({ children, onClose, className = "" }) => {
  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-[#1A0505] border border-red-900/40 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden animate-in zoom-in-95 duration-300 ${className}`}>
        <div className="p-8">{children}</div>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Modal;
