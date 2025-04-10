import { useState } from 'react';

interface ImageVerificationProps {
  onVerify: (success: boolean) => void;
}

export default function ImageVerification({ onVerify }: ImageVerificationProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const selectImage = (index: number) => {
    setSelectedImage(index);
    
    // A tesoura (ícone com X) está na posição 3, verificar se o usuário selecionou a imagem correta
    if (index === 3) {
      onVerify(true);
    } else {
      onVerify(false);
    }
  };

  return (
    <div className="mb-4">
      <p className="text-[#2B4F81] text-base font-bold" style={{ fontSize: '16px' }}>
        Clique abaixo, na figura de TESOURA:
        <span className="text-red-700 text-lg">*</span>
        <span className="text-[#2B4F81] text-base rounded-full border border-[#2B4F81] w-5 h-5 inline-flex items-center justify-center ml-1">?</span>
      </p>
      
      <div className="flex items-center mt-2">
        <div className="grid grid-cols-5 gap-1 border-4 border-[#D8E8E8] p-1 bg-[#D8E8E8] w-full">
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 0 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(0)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 1 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 2 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(2)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 3 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(3)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="18" cy="18" r="3"></circle>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 4 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(4)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}