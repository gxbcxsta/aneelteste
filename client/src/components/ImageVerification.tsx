import { useState } from 'react';
import { toast } from "@/hooks/use-toast";

interface ImageVerificationProps {
  onVerify: (success: boolean) => void;
}

export default function ImageVerification({ onVerify }: ImageVerificationProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const selectImage = (index: number) => {
    setSelectedImage(index);
    
    // A tesoura deve estar na posição 4 (última posição)
    if (index === 4) {
      onVerify(true);
    } else {
      onVerify(false);
      // Mostrar alerta se a seleção estiver errada
      toast({
        title: "Verificação incorreta",
        description: "Você deve selecionar a imagem da TESOURA para prosseguir.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mb-4">
      <p className="text-[#2B4F81] text-base font-bold inline-flex items-center" style={{ fontSize: '16px' }}>
        Clique abaixo, na figura de TESOURA:
        <span className="text-red-700 text-lg">*</span>
        <span className="text-[#2B4F81] text-xs rounded-full border border-[#2B4F81] w-4 h-4 inline-flex items-center justify-center ml-1">?</span>
      </p>
      
      <div className="flex items-center mt-2">
        <div className="flex justify-center space-x-1 border-4 border-[#D8E8E8] p-1 bg-[#D8E8E8]">
          <div 
            className={`bg-[#d2d2d2] w-10 h-10 p-0 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 0 ? 'selected border-blue-500 border-2' : 'transparent'} ${selectedImage !== null && selectedImage !== 0 ? 'opacity-50' : ''}`}
            onClick={() => selectImage(0)}
          >
            <img alt="Imagem 4" className="w-5 h-5" src="/assets/img/imagem-4.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] w-10 h-10 p-0 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 1 ? 'selected border-blue-500 border-2' : 'transparent'} ${selectedImage !== null && selectedImage !== 1 ? 'opacity-50' : ''}`}
            onClick={() => selectImage(1)}
          >
            <img alt="Imagem 5" className="w-5 h-5" src="/assets/img/imagem-5.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] w-10 h-10 p-0 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 2 ? 'selected border-blue-500 border-2' : 'transparent'} ${selectedImage !== null && selectedImage !== 2 ? 'opacity-50' : ''}`}
            onClick={() => selectImage(2)}
          >
            <img alt="Imagem 1" className="w-5 h-5" src="/assets/img/imagem-1.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] w-10 h-10 p-0 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 3 ? 'selected border-blue-500 border-2' : 'transparent'} ${selectedImage !== null && selectedImage !== 3 ? 'opacity-50' : ''}`}
            onClick={() => selectImage(3)}
          >
            <img alt="Imagem 3" className="w-5 h-5" src="/assets/img/imagem-3.png" />
          </div>
          <div 
            className={`bg-[#d2d2d2] w-10 h-10 p-0 border border-white flex items-center justify-center image-option cursor-pointer ${selectedImage === 4 ? 'selected border-blue-500 border-2' : 'transparent'} ${selectedImage !== null && selectedImage !== 4 ? 'opacity-50' : ''}`}
            onClick={() => selectImage(4)}
          >
            <img alt="Tesoura" className="w-5 h-5" src="/assets/img/tesoura.png" />
          </div>
        </div>
      </div>
    </div>
  );
}