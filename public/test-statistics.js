// Script de Teste - Cole no Console do Navegador (F12)

console.log('%c=== TESTE DE ESTATÍSTICAS DE FALTAS ===', 'color: blue; font-weight: bold; font-size: 14px');

// Teste 1: Verificar se API está disponível
console.log('%c1. Verificando API Service...', 'color: purple; font-weight: bold');
if (typeof api !== 'undefined') {
  console.log('✅ API Service disponível');
} else {
  console.log('❌ API Service não encontrado');
  throw new Error('API não disponível');
}

// Teste 2: Listar todas as faltas do banco
console.log('%c2. Buscando TODAS as faltas do banco...', 'color: purple; font-weight: bold');
(async () => {
  try {
    const todasAsFaltas = await api.getFaltas();
    console.log('✅ Faltas encontradas:', todasAsFaltas.length);
    if (todasAsFaltas.length === 0) {
      console.log('⚠️ AVISO: Nenhuma falta registada no banco!');
    } else {
      console.table(todasAsFaltas);
    }

    // Teste 3: Testar com turmaId específico
    console.log('%c3. Testando com turmaId=1...', 'color: purple; font-weight: bold');
    const faltasTurma1 = await api.getFaltas(null, null, 1);
    console.log('✅ Faltas da turma 1:', faltasTurma1.length);
    if (faltasTurma1.length > 0) {
      console.table(faltasTurma1);
    } else {
      console.log('⚠️ AVISO: Nenhuma falta para a turma 1');
    }

    // Teste 4: Calcular estatísticas
    console.log('%c4. Calculando estatísticas da turma 1...', 'color: purple; font-weight: bold');
    const stats = await api.getFaltasEstatisticas(1);
    console.log('✅ Estatísticas calculadas:', stats);
    console.log('   - Total de faltas:', stats.totalFaltas);
    console.log('   - Total de alunos:', stats.totalAlunos);
    console.log('   - Por disciplina:', stats.porDisciplina);
    console.log('   - Por estudante:', stats.porEstudante);

    // Teste 5: Verificar se foi armazenado em window
    console.log('%c5. Verificando armazenamento em window...', 'color: purple; font-weight: bold');
    console.log('window.estatisticasFaltasAtuais:', window.estatisticasFaltasAtuais);

    console.log('%c=== TESTES COMPLETOS ===', 'color: green; font-weight: bold; font-size: 14px');
  } catch (erro) {
    console.error('❌ ERRO:', erro);
  }
})();
