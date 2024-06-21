document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    updateLineNumbers();
  
    textarea.addEventListener('input', updateLineNumbers);
    textarea.addEventListener('scroll', syncScroll);
    updateLineNumbers();
  });
  
  function updateLineNumbers() {
    const textarea = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    const lines = textarea.value.split('\n').length;
    let lineNumbersText = '';
    for (let i = 1; i <= lines; i++) {
      lineNumbersText += i + '.\n';
    }
    lineNumbers.innerText = lineNumbersText;
    syncScroll();
  }
  
  function syncScroll() {
    const textarea = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    lineNumbers.scrollTop = textarea.scrollTop;
  }

  function showcontent(){
    var contenido = document.getElementById('code-input').value ;
    alert("El contenido ingresado es:\n" + contenido);
  } 
  