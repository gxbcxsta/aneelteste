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
      <p className="text-sm text-gray-700 mb-2 font-medium">Clique abaixo, na figura do RAIO:</p>
      <div className="grid grid-cols-5 gap-1 border-4 border-[#D8E8E8] p-1 bg-[#D8E8E8]">
        <div 
          className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center cursor-pointer ${selectedImage === 0 ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => selectImage(0)}
        >
          <img alt="Globe icon" className="w-6 h-6" src="/assets/img/globe.svg" />
        </div>
        <div 
          className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center cursor-pointer ${selectedImage === 1 ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => selectImage(1)}
        >
          <img alt="Search icon" className="w-6 h-6" src="/assets/img/search.svg" />
        </div>
        <div 
          className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center cursor-pointer ${selectedImage === 2 ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => selectImage(2)}
        >
          <img alt="Footprint icon" className="w-6 h-6" src="/assets/img/footprint.svg" />
        </div>
        <div 
          className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center cursor-pointer ${selectedImage === 3 ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => selectImage(3)}
        >
          <img alt="Lock icon" className="w-6 h-6" src="/assets/img/lock.svg" />
        </div>
        <div 
          className={`bg-[#d2d2d2] p-2 border border-white flex items-center justify-center cursor-pointer ${selectedImage === 4 ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => selectImage(4)}
        >
          <img alt="Lightning icon" className="w-6 h-6" src="/assets/img/lightning.svg" />
        </div>
      </div>
    </div>
  );
}