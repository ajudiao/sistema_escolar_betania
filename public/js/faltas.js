/* ===========================================
   GERENCIAMENTO DE FALTAS - ALUNO
   Integração com API para carregamento de faltas
   =========================================== */

// Garantir que API Service está disponível
if (typeof api === 'undefined') {
  console.error('[FALTAS] APIService não está disponível!');
  const api = new APIService();
}

let faltasData = [];
let disciplinasDisponíveis = [];
let estudanteId = null;
let estudante = null;

document.addEventListener('DOMContentLoaded', function () {
  console.log('%c[FALTAS] ===== INICIANDO SCRIPT =====', 'color: blue; font-weight: bold; font-size: 12px');

  // DEBUG: Mostrar todo o localStorage
  console.log('[FALTAS] localStorage completo:', {
    userId: localStorage.getItem('estudanteId'),
    userRole: localStorage.getItem('userRole'),
    userName: localStorage.getItem('userName'),
    userEmail: localStorage.getItem('userEmail'),
    todas_chaves: Object.keys(localStorage).map(k => `${k}: ${localStorage.getItem(k)}`)
  });

  // Obter ID do estudante do localStorage
  estudanteId = localStorage.getItem('estudanteId');
  console.log('[FALTAS] estudanteId do localStorage:', estudanteId);

  if (!estudanteId) {
    console.error('[FALTAS] ✗ estudanteId não encontrado no localStorage');
    DataLoader.showError('Erro: Usuário não identificado. Faça login novamente.');
    return;
  }

  console.log('[FALTAS] ✓ estudanteId carregado:', estudanteId);

  // Atualizar informações do usuário no header
  updateUserInfo();

  // Carregar turma e disciplinas primeiro
  console.log('[FALTAS] Chamando loadTurmaComDisciplinas()...');
  loadTurmaComDisciplinas()
    .then(() => {
      console.log('[FALTAS] ✓ loadTurmaComDisciplinas concluído');
      console.log('[FALTAS] Objeto estudante agora:', estudante);
      console.log('[FALTAS] ID do estudante (id_estudante):', estudante?.id_estudante);
    })
    .catch(erro => {
      console.warn('[FALTAS] ⚠️ Erro em loadTurmaComDisciplinas, continuando com fallback:', erro.message);
    })
    .finally(() => {
      // Depois carregar faltas (seja qual for o resultado de loadTurmaComDisciplinas)
      console.log('[FALTAS] Chamando loadFaltas()...');
      loadFaltas()
        .then(() => {
          console.log('[FALTAS] ✓ loadFaltas concluído');
        })
        .catch(erro => {
          console.error('[FALTAS] ✗ Erro em loadFaltas:', erro.message);
          DataLoader.showError('Erro ao carregar dados de faltas: ' + erro.message);
        });
    });

  // Event listener para botão de carregar faltas
  const btnCarregarFaltas = document.getElementById('btnCarregarFaltas');
  if (btnCarregarFaltas) {
    btnCarregarFaltas.addEventListener('click', loadFaltas);
  }

  // Event listener para filtro de disciplina
  const disciplinaSelect = document.getElementById('disciplinaSelect');
  if (disciplinaSelect) {
    disciplinaSelect.addEventListener('change', function() {
      console.log('[FALTAS] Disciplina selecionada:', this.value);
      renderFaltasDetalhes(faltasData, this.value);
    });
  }
});

/**
 * Atualizar informações do usuário no header
 */
function updateUserInfo() {
  const userName = localStorage.getItem('userName') || 'Aluno';
  const userRole = localStorage.getItem('userRole') || 'Aluno';
  
  const headerUserName = document.querySelector('.header-user-name');
  const headerUserRole = document.querySelector('.header-user-role');
  const headerUserAvatar = document.querySelector('.header-user-avatar');

  if (headerUserName) headerUserName.textContent = userName;
  if (headerUserRole) headerUserRole.textContent = userRole;
  if (headerUserAvatar) {
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
    headerUserAvatar.textContent = initials || 'AL';
  }
}

/**
 * Carregar turma e disciplinas do estudante
 */
async function loadTurmaComDisciplinas() {
  try {
    console.log('%c[FALTAS] === loadTurmaComDisciplinas INICIADO ===', 'color: purple; font-weight: bold');
    console.log('[FALTAS] Chamando api.getEstudanteByUsuario com estudanteId:', estudanteId);
    console.log('[FALTAS] Tipo de estudanteId:', typeof estudanteId);
    console.log('[FALTAS] estudanteId vazio?', !estudanteId || estudanteId === '');

    // 1. Obter dados do estudante via API
    console.log('[FALTAS] Fazendo chamada à API...');
    const resposta = await api.getEstudanteByUsuario(estudanteId);
    console.log('[FALTAS] Resposta bruta da API:', resposta);
    console.log('[FALTAS] Tipo da resposta:', typeof resposta);
    console.log('[FALTAS] Resposta é null?', resposta === null);
    console.log('[FALTAS] Resposta é undefined?', resposta === undefined);
    
    estudante = resposta;
    console.log('[FALTAS] ✓ Resposta atribuída a estudante:', estudante);
    
    if (!estudante) {
      console.warn('[FALTAS] ⚠️ api.getEstudanteByUsuario retornou null/undefined');
      console.log('[FALTAS] Carregando fallback de disciplinas (getDisciplinas)');
      disciplinasDisponíveis = await api.getDisciplinas();
      console.log('[FALTAS] Total de disciplinas (fallback):', disciplinasDisponíveis?.length || 0);
      return; // Continua com faltas, vai carregar dados com estudanteId
    }

    console.log('[FALTAS] Estudante completo:', JSON.stringify(estudante, null, 2));
    console.log('[FALTAS] Estudante.nome_estudante:', estudante.nome_estudante);
    console.log('[FALTAS] Estudante.id_estudante:', estudante.id_estudante);
    console.log('[FALTAS] Estudante.turma:', estudante.turma);

    if (!estudante.turma || !estudante.turma.id_turma) {
      console.warn('[FALTAS] ⚠️ Estudante sem turma. Carregando todas as disciplinas.');
      disciplinasDisponíveis = await api.getDisciplinas();
      console.log('[FALTAS] Total de disciplinas (fallback):', disciplinasDisponíveis.length);
      return;
    }

    const turmaId = estudante.turma.id_turma;
    console.log('[FALTAS] Turma ID encontrado:', turmaId);

    // 2. Carregar turma completa com disciplinas
    console.log('[FALTAS] Chamando api.getTurmaComDisciplinas...');
    const turma = await api.getTurmaComDisciplinas(turmaId);
    console.log('[FALTAS] ✓ Turma recebida:', turma);
    console.log('[FALTAS] Turma.disciplinas:', turma?.disciplinas);

    // 3. Extrair disciplinas da turma
    let disciplinas = [];
    
    if (turma && turma.disciplinas && Array.isArray(turma.disciplinas)) {
      console.log('[FALTAS] Encontradas', turma.disciplinas.length, 'disciplinas na turma');
      console.log('[FALTAS] Primeira disciplina:', turma.disciplinas[0]);
      
      // Se as disciplinas vêm como CursoDisciplina com nested disciplina
      if (turma.disciplinas[0] && turma.disciplinas[0].disciplina) {
        console.log('[FALTAS] Mapeando disciplinas de CursoDisciplina');
        disciplinas = turma.disciplinas
          .filter(cd => cd.disciplina)
          .map(cd => cd.disciplina);
      } else {
        // Caso contrário, usar como estão
        console.log('[FALTAS] Usando disciplinas diretamente');
        disciplinas = turma.disciplinas;
      }
    } else if (turma && turma.classe_id) {
      // Se turma não tem disciplinas mas tem classe_id, tentar carregar pela classe
      console.log('[FALTAS] Turma sem disciplinas diretas, carregando pela classe...');
      const disciplinasDaClasse = await api.getDisciplinasClasse(turma.classe_id);
      console.log('[FALTAS] Disciplinas da classe:', disciplinasDaClasse);
      
      if (disciplinasDaClasse && disciplinasDaClasse.length > 0) {
        if (disciplinasDaClasse[0] && disciplinasDaClasse[0].disciplina) {
          console.log('[FALTAS] Mapeando disciplinas de ClasseDisciplina da classe');
          disciplinas = disciplinasDaClasse
            .filter(cd => cd.disciplina)
            .map(cd => cd.disciplina);
        } else {
          disciplinas = disciplinasDaClasse;
        }
      }
    } else {
      console.warn('[FALTAS] ⚠️ Turma sem disciplinas nem curso_id');
    }

    if (disciplinas && disciplinas.length > 0) {
      disciplinasDisponíveis = disciplinas;
      console.log('[FALTAS] ✓ Disciplinas carregadas:', disciplinasDisponíveis.length);
    } else {
      console.warn('[FALTAS] Nenhuma disciplina encontrada. Usando fallback...');
      disciplinasDisponíveis = await api.getDisciplinas();
      console.log('[FALTAS] Disciplinas fallback:', disciplinasDisponíveis.length);
    }

    console.log('%c[FALTAS] ✓ === loadTurmaComDisciplinas CONCLUÍDO ===', 'color: green; font-weight: bold');
  } catch (error) {
    console.error('%c[FALTAS] ✗ Erro em loadTurmaComDisciplinas:', 'color: red; font-weight: bold', error);
    console.error('[FALTAS] Stack:', error.stack);
    console.log('[FALTAS] Tentando fallback: carregar todas as disciplinas');
    try {
      disciplinasDisponíveis = await api.getDisciplinas();
      console.log('[FALTAS] ✓ Fallback sucesso:', disciplinasDisponíveis?.length || 0, 'disciplinas');
    } catch (fallbackError) {
      console.error('[FALTAS] ✗ Erro no fallback:', fallbackError);
      console.log('[FALTAS] Continuando sem disciplinas...');
      disciplinasDisponíveis = [];
    }
  }
}

/**
 * Carregar faltas da API
 */
async function loadFaltas() {
  try {
    console.log('%c[FALTAS] === loadFaltas INICIADO ===', 'color: teal; font-weight: bold; font-size: 12px');
    
    // Dados do estudante
    console.log('[FALTAS] estudanteId (do localStorage):', estudanteId);
    console.log('[FALTAS] Objeto estudante:', estudante);
    console.log('[FALTAS] id_estudante:', estudante?.id_estudante);
    console.log('[FALTAS] nome_estudante:', estudante?.nome_estudante);
    
    // IMPORTANTE: Usar o ID REAL do estudante (id_estudante) do objeto estudante
    // NÃO usar userId que é o ID de login do usuário
    let idEstudanteReal = estudante?.id_estudante;
    
    // Fallback: Se não conseguir o id_estudante do objeto, usar o estudanteId do localStorage
    if (!idEstudanteReal) {
      console.warn('[FALTAS] ⚠️ id_estudante não encontrado no objeto estudante, usando fallback com estudanteId');
      idEstudanteReal = estudanteId;
      
      if (!idEstudanteReal) {
        console.error('[FALTAS] ✗ ERRO CRÍTICO: Nenhum ID de estudante disponível (id_estudante e estudanteId ambos ausentes)');
        console.log('[FALTAS] Objeto estudante:', JSON.stringify(estudante, null, 2));
        console.log('[FALTAS] estudanteId:', estudanteId);
        throw new Error('Impossível carregar faltas: ID do estudante não identificado');
      }
      
      console.log('[FALTAS] ✓ Usando userId como fallback:', idEstudanteReal);
    }
    
    console.log('[FALTAS] ✓ ID do estudante confirmado:', idEstudanteReal);
    
    // Obter filtro de disciplina (sem filtro de ano)
    const disciplina = document.getElementById('disciplinaSelect')?.value || 'todas';

    console.log('[FALTAS] Filtro selecionado:', { disciplina });

    // Carregar faltas da API com o ID real do estudante
    console.log('%c[FALTAS] Fazendo requisição à API...', 'color: #3b82f6; font-weight: bold');
    console.log('[FALTAS] GET /faltas?estudanteId=' + idEstudanteReal);
    faltasData = await api.getFaltas(idEstudanteReal);
    
    console.log('[FALTAS] ✓ Resposta recebida de api.getFaltas');
    console.log('[FALTAS] faltasData:', faltasData);
    console.log('[FALTAS] faltasData type:', typeof faltasData);
    console.log('[FALTAS] faltasData é array?', Array.isArray(faltasData));
    console.log('[FALTAS] Total de faltas:', faltasData ? faltasData.length : 0);

    if (faltasData && faltasData.length > 0) {
      console.log('[FALTAS] Estrutura da primeira falta:', faltasData[0]);
    }

    // Atualizar select de disciplinas com disciplinas da turma
    try {
      console.log('[FALTAS] Chamando updateDisciplinaSelect()');
      updateDisciplinaSelect();
    } catch (e) {
      console.error('[FALTAS] Erro em updateDisciplinaSelect():', e);
    }

    // Renderizar lista detalhada de faltas
    try {
      console.log('[FALTAS] Chamando renderFaltasDetalhes()');
      renderFaltasDetalhes(faltasData, disciplina);
    } catch (e) {
      console.error('[FALTAS] Erro em renderFaltasDetalhes():', e);
    }

    // Renderizar tabela com filtros
    try {
      console.log('[FALTAS] Chamando renderFaltasTable()');
      renderFaltasTable(disciplina);
    } catch (e) {
      console.error('[FALTAS] Erro em renderFaltasTable():', e);
    }

    // Atualizar cards de resumo
    try {
      console.log('[FALTAS] Chamando updateFaltasStatistics()');
      updateFaltasStatistics();
    } catch (e) {
      console.error('[FALTAS] Erro em updateFaltasStatistics():', e);
    }

    console.log('%c[FALTAS] ✓ === loadFaltas CONCLUÍDO COM SUCESSO ===', 'color: green; font-weight: bold; font-size: 12px');

  } catch (error) {
    console.error('%c[FALTAS] ✗ ERRO CRÍTICO em loadFaltas:', 'color: red; font-weight: bold; font-size: 12px', error);
    console.error('[FALTAS] Message:', error.message);
    console.error('[FALTAS] Stack:', error.stack);
    
    DataLoader.showError('Erro ao carregar faltas: ' + error.message);
    
    // Mostrar mensagem de erro na tabela
    const tbody = document.getElementById('faltasTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar faltas: ' + error.message + '</td></tr>';
    }

    // Ainda assim, atualizar as estatísticas com dados vazios
    try {
      console.log('[FALTAS] Atualizando estatísticas com dados vazios após erro');
      faltasData = [];
      updateFaltasStatistics();
    } catch (statsError) {
      console.error('[FALTAS] Erro ao atualizar estatísticas após erro:', statsError);
    }
  }
}

/**
 * Atualizar select de disciplinas com dados da API
 */
function updateDisciplinaSelect() {
  const select = document.getElementById('disciplinaSelect');
  if (!select) {
    console.warn('[FALTAS] Select disciplina não encontrado');
    return;
  }

  // Manter a opção "Todas"
  const currentValue = select.value;
  select.innerHTML = '<option value="todas">Todas</option>';

  console.log('%c[FALTAS] === updateDisciplinaSelect INICIADO ===', 'color: orange; font-weight: bold');
  console.log('[FALTAS] disciplinasDisponíveis:', disciplinasDisponíveis);
  console.log('[FALTAS] Quantidade:', disciplinasDisponíveis ? disciplinasDisponíveis.length : 0);
  console.log('[FALTAS] É array?', Array.isArray(disciplinasDisponíveis));

  // Adicionar disciplinas carregadas da turma
  if (disciplinasDisponíveis && disciplinasDisponíveis.length > 0) {
    console.log('[FALTAS] ✓ Preenchendo select com', disciplinasDisponíveis.length, 'disciplinas');
    
    disciplinasDisponíveis.forEach((disciplina, idx) => {
      try {
        console.log(`[FALTAS] Processando disciplina ${idx}:`, disciplina);
        
        const option = document.createElement('option');
        
        // Tentar diferentes propriedades para o nome
        let nomeDisciplina = null;
        if (disciplina.descricao_disc) {
          nomeDisciplina = disciplina.descricao_disc;
          console.log(`[FALTAS]   → Encontrada propriedade descricao_disc: ${nomeDisciplina}`);
        } else if (disciplina.descricao_disciplina) {
          nomeDisciplina = disciplina.descricao_disciplina;
          console.log(`[FALTAS]   → Encontrada propriedade descricao_disciplina: ${nomeDisciplina}`);
        } else if (disciplina.nome) {
          nomeDisciplina = disciplina.nome;
          console.log(`[FALTAS]   → Encontrada propriedade nome: ${nomeDisciplina}`);
        } else if (disciplina.nome_disc) {
          nomeDisciplina = disciplina.nome_disc;
          console.log(`[FALTAS]   → Encontrada propriedade nome_disc: ${nomeDisciplina}`);
        } else {
          nomeDisciplina = 'Disciplina';
          console.log(`[FALTAS]   → Nenhuma propriedade encontrada, usando padrão`);
        }
        
        option.value = nomeDisciplina;
        option.textContent = nomeDisciplina;
        select.appendChild(option);
        console.log(`[FALTAS]   ✓ Opção adicionada ao select`);
      } catch (error) {
        console.error(`[FALTAS] Erro ao processar disciplina ${idx}:`, error);
      }
    });
    
    console.log('[FALTAS] ✓ Select preenchido com sucesso');
  } else {
    console.warn('[FALTAS] ⚠️ Nenhuma disciplina em disciplinasDisponíveis. Tentando fallback...');
    
    // FALLBACK: Carregar todas as disciplinas da API
    api.getDisciplinas()
      .then(disciplinas => {
        console.log('[FALTAS] Disciplinas do fallback (getDisciplinas):', disciplinas);
        
        if (disciplinas && disciplinas.length > 0) {
          // Limpar select novamente
          select.innerHTML = '<option value="todas">Todas</option>';
          
          disciplinas.forEach((disciplina, idx) => {
            try {
              const option = document.createElement('option');
              
              let nomeDisciplina = null;
              if (disciplina.descricao_disc) {
                nomeDisciplina = disciplina.descricao_disc;
              } else if (disciplina.descricao_disciplina) {
                nomeDisciplina = disciplina.descricao_disciplina;
              } else if (disciplina.nome) {
                nomeDisciplina = disciplina.nome;
              } else if (disciplina.nome_disc) {
                nomeDisciplina = disciplina.nome_disc;
              } else {
                nomeDisciplina = 'Disciplina';
              }
              
              option.value = nomeDisciplina;
              option.textContent = nomeDisciplina;
              select.appendChild(option);
              console.log(`[FALTAS] ✓ Disciplina do fallback adicionada: ${nomeDisciplina}`);
            } catch (error) {
              console.error('[FALTAS] Erro ao processar disciplina do fallback:', error);
            }
          });
          
          console.log('[FALTAS] ✓ Select preenchido com disciplinas do fallback');
        } else {
          console.warn('[FALTAS] Fallback também retornou vazio');
          const disabledOption = document.createElement('option');
          disabledOption.textContent = 'Nenhuma disciplina';
          disabledOption.disabled = true;
          select.appendChild(disabledOption);
        }
      })
      .catch(error => {
        console.error('[FALTAS] ✗ Erro no fallback de getDisciplinas:', error);
        const disabledOption = document.createElement('option');
        disabledOption.textContent = 'Erro ao carregar disciplinas';
        disabledOption.disabled = true;
        select.appendChild(disabledOption);
      });
  }
  
  // Manter valor selecionado se ainda existir
  if (Array.from(select.options).some(opt => opt.value === currentValue)) {
    select.value = currentValue;
  }
  
  console.log('%c[FALTAS] ✓ === updateDisciplinaSelect CONCLUÍDO ===', 'color: green; font-weight: bold');
}

/**
 * Renderizar tabela de faltas com filtros
 */
function renderFaltasTable(disciplina) {
  console.log('%c[FALTAS] === renderFaltasTable INICIADO ===', 'color: #6366f1; font-weight: bold');
  console.log('[FALTAS] Parâmetros:', { disciplina });
  console.log('[FALTAS] faltasData:', faltasData);
  console.log('[FALTAS] faltasData.length:', faltasData ? faltasData.length : 0);
  
  const tbody = document.getElementById('faltasTableBody');
  if (!tbody) {
    console.warn('[FALTAS] ✗ tbody (faltasTableBody) não encontrado');
    return;
  }

  tbody.innerHTML = '';

  if (!faltasData || faltasData.length === 0) {
    console.log('[FALTAS] Nenhuma falta carregada, mostrando mensagem');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma falta encontrada</td></tr>';
    renderFaltasDetalhes([], disciplina);
    return;
  }

  // Filtrar faltas baseado nos critérios selecionados
  console.log('[FALTAS] Iniciando filtro de faltas...');
  let filteredData = faltasData.filter((falta, idx) => {
    console.log(`[FALTAS] Analisando falta ${idx}:`, {
      data_falta: falta.data_falta,
      disciplina_nome: falta.disciplina?.descricao_disc || falta.disciplina?.descricao_disciplina,
      tipo: falta.tipo_falta
    });

    // Filtrar por disciplina apenas (remover filtro de ano)
    if (disciplina !== 'todas') {
      const nomeDisciplinaFalta = falta.disciplina?.descricao_disc || 
                                  falta.disciplina?.descricao_disciplina ||
                                  falta.disciplina?.nome ||
                                  'Desconhecida';
      
      console.log(`[FALTAS]   - Disciplina: "${nomeDisciplinaFalta}" (procurando: "${disciplina}")`);
      
      if (nomeDisciplinaFalta !== disciplina) {
        console.log(`[FALTAS]   - ✗ Descartada: disciplina não corresponde`);
        return false;
      }
    }

    console.log(`[FALTAS]   - ✓ Incluída`);
    return true;
  });

  console.log('[FALTAS] Após filtro:', filteredData.length, 'faltas');

  // Ordenar por data descendente
  filteredData.sort((a, b) => {
    const dateA = new Date(a.data_falta || 0);
    const dateB = new Date(b.data_falta || 0);
    return dateB - dateA;
  });

  if (filteredData.length === 0) {
    console.log('[FALTAS] Nenhuma falta após filtro');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma falta encontrada para os filtros selecionados.</td></tr>';
    renderFaltasDetalhes([], disciplina);
    return;
  }

  console.log(`[FALTAS] Renderizando ${filteredData.length} faltas na tabela`);

  // Agrupar faltas por data e disciplina
  const faltasAgrupadas = {};
  filteredData.forEach(falta => {
    const key = `${falta.data_falta}_${falta.disciplina?.id_disc || 'unknown'}`;
    if (!faltasAgrupadas[key]) {
      faltasAgrupadas[key] = {
        data: falta.data_falta,
        disciplina: falta.disciplina?.descricao_disc || 'Disciplina desconhecida',
        quantidade: 0,
        justificada: falta.tipo_falta === 'JUSTIFICADA',
        status: falta.tipo_falta === 'JUSTIFICADA' ? 'Justificado' : 'Não justificado'
      };
    }
    faltasAgrupadas[key].quantidade++;
  });

  // Renderizar linhas da tabela
  Object.values(faltasAgrupadas).forEach(falta => {
    try {
      const row = document.createElement('tr');
      const statusClass = falta.status === 'Justificado' ? 'badge-success' : 'badge-danger';
      
      // Formatar data
      const dataFormatada = new Date(falta.data).toLocaleDateString('pt-AO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      row.innerHTML = `
        <td>${dataFormatada}</td>
        <td>${falta.disciplina}</td>
        <td class="text-center">${falta.quantidade}</td>
        <td class="text-center"><span class="badge ${statusClass}">${falta.status}</span></td>
      `;
      tbody.appendChild(row);
    } catch (error) {
      console.error('[FALTAS] Erro ao renderizar linha:', error);
    }
  });

  // Renderizar detalhes das faltas filtradas
  renderFaltasDetalhes(filteredData, disciplina);
  
  console.log('%c[FALTAS] ✓ === renderFaltasTable CONCLUÍDO ===', 'color: green; font-weight: bold');
  console.log('[FALTAS] Total renderizado na tabela:', Object.keys(faltasAgrupadas).length, 'agrupamentos');
}

/**
 * Renderizar lista detalhada de faltas com observações
 */
function renderFaltasDetalhes(faltas, disciplinaFiltro = 'todas') {
  try {
    console.log('%c[FALTAS] === renderFaltasDetalhes INICIADO ===', 'color: #8b5cf6; font-weight: bold');
    console.log('[FALTAS] Faltas recebidas:', faltas);
    console.log('[FALTAS] Faltas.length:', faltas ? faltas.length : 0);
    console.log('[FALTAS] Filtro disciplina:', disciplinaFiltro);
    
    const containerDetalhes = document.getElementById('faltasDetalhesContainer');
    const listaDetalhes = document.getElementById('listaFaltasDetalhes');
    const semFaltasMsg = document.getElementById('semFaltasMsg');

    if (!containerDetalhes || !listaDetalhes) {
      console.warn('[FALTAS] ✗ Elementos para renderizar detalhes não encontrados');
      console.warn('[FALTAS]   - faltasDetalhesContainer:', !!containerDetalhes);
      console.warn('[FALTAS]   - listaFaltasDetalhes:', !!listaDetalhes);
      return;
    }

    // Filtrar faltas se houver filtro de disciplina
    let faltasFiltradas = faltas;
    if (disciplinaFiltro && disciplinaFiltro !== 'todas') {
      console.log('[FALTAS] Filtrando faltas por disciplina:', disciplinaFiltro);
      faltasFiltradas = faltas.filter(f => {
        const nomeDisciplina = f.disciplina?.descricao_disc || 
                              f.disciplina?.descricao_disciplina ||
                              f.disciplina?.nome;
        console.log('[FALTAS]   - Falta tem disciplina:', nomeDisciplina);
        return nomeDisciplina === disciplinaFiltro;
      });
      console.log('[FALTAS] Faltas após filtro de disciplina:', faltasFiltradas.length);
    }

    if (!faltasFiltradas || faltasFiltradas.length === 0) {
      console.log('[FALTAS] ✓ Nenhuma falta para exibir detalhes');
      containerDetalhes.style.display = 'none';
      semFaltasMsg.style.display = 'block';
      return;
    }

    console.log('[FALTAS] ✓ Renderizando', faltasFiltradas.length, 'faltas em detalhes');
    containerDetalhes.style.display = 'block';
    semFaltasMsg.style.display = 'none';

    // Ordenar por data descendente
    faltasFiltradas.sort((a, b) => {
      const dateA = new Date(a.data_falta || 0);
      const dateB = new Date(b.data_falta || 0);
      return dateB - dateA;
    });

    // Criar HTML da lista
    let htmlLista = '<div class="list-group list-group-flush">';

    faltasFiltradas.forEach((falta, idx) => {
      const numero = idx + 1;
      const marcador = falta.tipo_falta === 'JUSTIFICADA' ? '📋' : '❌';
      const badgeClass = falta.tipo_falta === 'JUSTIFICADA' ? 'badge bg-warning text-dark' : 'badge bg-danger';
      
      const nomeDisciplina = falta.disciplina?.descricao_disc || 
                            falta.disciplina?.descricao_disciplina || 
                            'Disciplina desconhecida';
      
      const dataFormatada = new Date(falta.data_falta).toLocaleDateString('pt-AO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      htmlLista += `
        <div class="list-group-item px-3 py-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="flex-grow-1">
              <h6 class="mb-1">
                <span style="font-size: 1.3em; margin-right: 8px;">${marcador}</span>
                ${nomeDisciplina}
                <span class="${badgeClass}" style="margin-left: 8px; font-size: 0.75rem;">
                  ${falta.tipo_falta === 'JUSTIFICADA' ? 'Justificada' : 'Injustificada'}
                </span>
              </h6>
              <p class="mb-2 text-muted">
                <small>
                  📅 ${dataFormatada}
                </small>
              </p>
              ${falta.observacao ? `
                <p class="mb-0">
                  <small class="text-secondary">
                    <strong>Observação:</strong> ${falta.observacao}
                  </small>
                </p>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    htmlLista += '</div>';
    listaDetalhes.innerHTML = htmlLista;
    console.log('%c[FALTAS] ✓ Lista detalhada renderizada com ' + faltasFiltradas.length + ' faltas', 'color: green; font-weight: bold');
    console.log('[FALTAS] HTML renderizado, length:', htmlLista.length);

  } catch (error) {
    console.error('%c[FALTAS] ✗ Erro ao renderizar detalhes:', 'color: red', error);
    console.error('[FALTAS] Stack:', error.stack);
  }
}

/**
 * Atualizar estatísticas de faltas
 */
function updateFaltasStatistics() {
  console.log('%c[FALTAS] === updateFaltasStatistics INICIADO ===', 'color: orange; font-weight: bold; font-size: 12px');
  console.log('[FALTAS] faltasData:', faltasData);
  console.log('[FALTAS] faltasData type:', typeof faltasData);
  console.log('[FALTAS] faltasData length:', faltasData ? faltasData.length : 'null/undefined');
  console.log('[FALTAS] Array.isArray(faltasData):', Array.isArray(faltasData));

  // Verificar se elementos existem
  const elTotalFaltas = document.getElementById('totalFaltas');
  const elFaltasJustificadas = document.getElementById('faltasJustificadas');
  const elFaltasNaoJustificadas = document.getElementById('faltasNaoJustificadas');
  const elAssiduidade = document.getElementById('assiduidade');

  console.log('[FALTAS] Elementos encontrados:', {
    totalFaltas: !!elTotalFaltas,
    faltasJustificadas: !!elFaltasJustificadas,
    faltasNaoJustificadas: !!elFaltasNaoJustificadas,
    assiduidade: !!elAssiduidade
  });

  // Se nenhum elemento foi encontrado, não há nada para atualizar
  if (!elTotalFaltas && !elFaltasJustificadas && !elFaltasNaoJustificadas && !elAssiduidade) {
    console.warn('[FALTAS] ⚠️ Nenhum elemento de estatísticas encontrado na página');
    return;
  }

  if (!faltasData || faltasData.length === 0) {
    console.log('[FALTAS] Nenhuma falta, resetando para 0');
    if (elTotalFaltas) {
      elTotalFaltas.textContent = '0';
      console.log('[FALTAS] ✓ totalFaltas = 0');
    }
    if (elFaltasJustificadas) {
      elFaltasJustificadas.textContent = '0';
      console.log('[FALTAS] ✓ faltasJustificadas = 0');
    }
    if (elFaltasNaoJustificadas) {
      elFaltasNaoJustificadas.textContent = '0';
      console.log('[FALTAS] ✓ faltasNaoJustificadas = 0');
    }
    if (elAssiduidade) {
      elAssiduidade.textContent = '100%';
      console.log('[FALTAS] ✓ assiduidade = 100%');
    }
    console.log('%c[FALTAS] ✓ === updateFaltasStatistics CONCLUÍDO ===', 'color: green; font-weight: bold; font-size: 12px');
    return;
  }

  // Calcular totais
  const total = faltasData.length;
  console.log('[FALTAS] Total de faltas:', total);

  const justificadas = faltasData.filter(f => {
    console.log('[FALTAS] Analisando falta:', f);
    console.log('[FALTAS] tipo_falta:', f.tipo_falta);
    return f.tipo_falta === 'JUSTIFICADA';
  }).length;
  console.log('[FALTAS] Faltas justificadas:', justificadas);

  const naoJustificadas = total - justificadas;
  console.log('[FALTAS] Faltas não justificadas:', naoJustificadas);

  // Assumir 200 aulas no ano (aproximadamente)
  const totalAulasEsperadas = 200;
  const assiduidade = Math.max(0, Math.round(((totalAulasEsperadas - total) / totalAulasEsperadas) * 100));

  console.log('[FALTAS] Cálculos finalizados:', {
    total,
    justificadas,
    naoJustificadas,
    assiduidade,
    totalAulasEsperadas
  });

  // Atualizar elementos
  if (elTotalFaltas) {
    console.log('[FALTAS] Atualizando totalFaltas para:', total);
    elTotalFaltas.textContent = total;
  } else {
    console.warn('[FALTAS] ✗ Elemento totalFaltas não encontrado');
  }
  
  if (elFaltasJustificadas) {
    console.log('[FALTAS] Atualizando faltasJustificadas para:', justificadas);
    elFaltasJustificadas.textContent = justificadas;
  } else {
    console.warn('[FALTAS] ✗ Elemento faltasJustificadas não encontrado');
  }
  
  if (elFaltasNaoJustificadas) {
    console.log('[FALTAS] Atualizando faltasNaoJustificadas para:', naoJustificadas);
    elFaltasNaoJustificadas.textContent = naoJustificadas;
  } else {
    console.warn('[FALTAS] ✗ Elemento faltasNaoJustificadas não encontrado');
  }
  
  if (elAssiduidade) {
    console.log('[FALTAS] Atualizando assiduidade para:', assiduidade + '%');
    elAssiduidade.textContent = assiduidade + '%';
  } else {
    console.warn('[FALTAS] ✗ Elemento assiduidade não encontrado');
  }

  console.log('%c[FALTAS] ✓ === updateFaltasStatistics CONCLUÍDO ===', 'color: green; font-weight: bold; font-size: 12px');
}
