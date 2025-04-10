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
            <img alt="Imagem 4" className="w-5 h-5" src="/assets/img/imagem-4.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 1 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(1)}
          >
            <img alt="Imagem 5" className="w-5 h-5" src="/assets/img/imagem-5.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 2 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(2)}
          >
            <img alt="Imagem 1" className="w-5 h-5" src="/assets/img/imagem-1.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 3 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(3)}
          >
            <img alt="Tesoura" className="w-5 h-5" src="/assets/img/tesoura.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 4 ? 'selected border-blue-500 border-2' : 'transparent'}`}
            onClick={() => selectImage(4)}
          >
            <img alt="Imagem 3" className="w-5 h-5" src="/assets/img/imagem-3.png" />
          </div>
        </div>
      </div>
    </div>
  );
}