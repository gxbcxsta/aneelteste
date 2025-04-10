import { useState } from 'react';

interface ImageVerificationProps {
  onVerify: (success: boolean) => void;
}

export default function ImageVerification({ onVerify }: ImageVerificationProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const selectImage = (index: number) => {
    setSelectedImage(index);
    
    // A tesoura está na posição 3, verificar se o usuário selecionou a imagem correta
    if (index === 3) {
      onVerify(true);
    } else {
      onVerify(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-700 mb-2 font-medium font-bold">Clique abaixo, na figura da TESOURA:</p>
      <div className="flex items-center">
        <div className="grid grid-cols-5 gap-1 border-4 border-[#D8E8E8] p-1 bg-[#D8E8E8] w-full">
          <div 
            className="bg-[#d2d2d2] p-3 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(0)}
          >
            <img alt="Imagem 4" className="w-10 h-10" src="/assets/img/imagem-4.png" />
          </div>
          <div 
            className="bg-[#d2d2d2] p-3 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(1)}
          >
            <img alt="Imagem 5" className="w-10 h-10" src="/assets/img/imagem-5.png" />
          </div>
          <div 
            className="bg-[#d2d2d2] p-3 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(2)}
          >
            <img alt="Imagem 1" className="w-10 h-10" src="/assets/img/imagem-1.png" />
          </div>
          <div 
            className="bg-[#d2d2d2] p-3 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(3)}
          >
            <img alt="Tesoura" className="w-10 h-10" src="/assets/img/tesoura.png" />
          </div>
          <div 
            className="bg-[#d2d2d2] p-3 border border-white flex items-center justify-center image-option cursor-pointer"
            onClick={() => selectImage(4)}
          >
            <img alt="Imagem 3" className="w-10 h-10" src="/assets/img/imagem-3.png" />
          </div>
        </div>
      </div>
    </div>
  );
}