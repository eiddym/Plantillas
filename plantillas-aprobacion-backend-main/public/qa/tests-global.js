suite('Global Tests', function(){
  test('Toda página debe tener un título válido', function(){
    assert(document.title && document.title.match(/\S/) &&
    document.title.toUpperCase() !== 'TODO');
  });
  test('Toda página debe tener un enlace a dpa', function(){
    assert($('a[href^="dpas"]').length);
  });
  test('Todos los enlaces deben tener destino', function(){
    assert($('a[href="#"]').length === 0);
  });
  test('No debe existir código css inline', function(){
    assert($("*[style *= ':']").length);
  });
});
