import { useState } from 'react';

interface ImageVerificationProps {
  onVerify: (success: boolean) => void;
}

export default function ImageVerification({ onVerify }: ImageVerificationProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const selectImage = (index: number) => {
    setSelectedImage(index);
    
    // O raio está na posição 4, verificar se o usuário selecionou a imagem correta
    if (index === 4) {
      onVerify(true);
    } else {
      onVerify(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-700 mb-2 font-medium font-bold">Clique abaixo, na figura do RAIO:</p>
      <div className="flex items-center">
        <div className="grid grid-cols-5 gap-1 border-4 border-[#D8E8E8] p-1 bg-[#D8E8E8] w-full">
          <div 
            className="bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(0)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div 
            className="bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div 
            className="bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(2)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M4 18v-5.5C4 9.5 6 8 8.5 8S13 9.5 13 12.5V18"/>
              <path d="M3 18h18v2H3v-2z"/>
              <path d="M7 8v1"/>
              <path d="M10 8v1"/>
            </svg>
          </div>
          <div 
            className="bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(3)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div 
            className="bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(4)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}