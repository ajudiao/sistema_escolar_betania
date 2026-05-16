// Script de Teste - Verificar se Cards são Atualizados
// Cole no Console (F12) na página de faltas do professor

console.log('%c=== TESTE DE ATUALIZAÇÃO DOS CARDS ===', 'color: blue; font-weight: bold; font-size: 14px');

// Teste 1: Verificar se os elementos dos cards existem
console.log('%c1. Verificando se os cards existem no DOM...', 'color: purple; font-weight: bold');

const cards = {
  totalAlunos: document.getElementById('totalAlunos'),
  totalPresentes: document.getElementById('totalPresentes'),
  totalFaltas: document.getElementById('totalFaltas'),
  totalAtrasos: document.getElementById('totalAtrasos')
};

console.log('Elementos encontrados:');
Object.entries(cards).forEach(([name, el]) => {
  if (el) {
    console.log(`✅ ${name}: ${el.textContent}`);
  } else {
    console.log(`❌ ${name}: NÃO ENCONTRADO`);
  }
});

// Teste 2: Simular atualização dos cards
console.log('%c2. Simulando atualização dos cards...', 'color: purple; font-weight: bold');

if (cards.totalAlunos) {
  cards.totalAlunos.textContent = 5;
  console.log('✅ totalAlunos atualizado para 5');
}

if (cards.totalPresentes) {
  cards.totalPresentes.textContent = 3;
  console.log('✅ totalPresentes atualizado para 3');
}

if (cards.totalFaltas) {
  cards.totalFaltas.textContent = 2;
  console.log('✅ totalFaltas atualizado para 2');
}

if (cards.totalAtrasos) {
  cards.totalAtrasos.textContent = 0;
  console.log('✅ totalAtrasos atualizado para 0');
}

// Teste 3: Verificar dados armazenados em window
console.log('%c3. Verificando dados em window.estatisticasFaltasAtuais...', 'color: purple; font-weight: bold');
if (window.estatisticasFaltasAtuais) {
  console.log('✅ Estatísticas disponíveis:', window.estatisticasFaltasAtuais);
} else {
  console.log('❌ Nenhuma estatística armazenada ainda');
}

// Teste 4: Verificar função carregarEstatisticasFaltas
console.log('%c4. Testando função carregarEstatisticasFaltas...', 'color: purple; font-weight: bold');
if (typeof carregarEstatisticasFaltas === 'function') {
  console.log('✅ Função carregarEstatisticasFaltas existe');
  
  // Obter turmaId da página
  const turmaId = document.getElementById('selectTurma')?.value;
  const disciplinaId = document.getElementById('selectDisciplina')?.value;
  
  if (turmaId) {
    console.log('Tentando carregar estatísticas para turma:', turmaId);
    carregarEstatisticasFaltas(turmaId, disciplinaId).then(stats => {
      console.log('✅ Estatísticas carregadas:', stats);
    }).catch(err => {
      console.error('❌ Erro:', err);
    });
  } else {
    console.log('⚠️ Nenhuma turma selecionada');
  }
} else {
  console.log('❌ Função carregarEstatisticasFaltas NÃO encontrada');
}

console.log('%c=== TESTES COMPLETOS ===', 'color: green; font-weight: bold; font-size: 14px');
