/* ===========================================
   GERENCIAMENTO DE NOTAS - ADMIN
   Visualiza pautas por turma com todas as disciplinas
   =========================================== */

if (typeof api === 'undefined') {
  console.error('[ADMIN-NOTAS] APIService não está disponível!');
}

let turmasData = [];
let notasData = [];
let disciplinasData = [];
let cursosData = [];
let selectedTurmaId = null;

document.addEventListener('DOMContentLoaded', function () {
  console.log('[ADMIN-NOTAS] Script carregado');

  // Proteger página para ADMIN
  if (typeof AuthHelper !== 'undefined') {
    AuthHelper.checkRole(['ADMIN']);
  }

  // Atualizar informações do usuário no header
  updateUserInfo();

  // Carregar dados iniciais
  loadInitialData();

  // Carregar avisos de notas lançadas
  loadAvisosNotasLancadas();

  // Setup event listeners
  setupEventListeners();
});

/**
 * Atualizar informações do usuário no header
 */
function updateUserInfo() {
  const userName = api.getUserName() || localStorage.getItem('userName') || 'Administrador';
  const headerUserName = document.querySelector('.header-user-name');
  const headerUserRole = document.querySelector('.header-user-role');

  if (headerUserName) headerUserName.textContent = userName;
  if (headerUserRole) headerUserRole.textContent = 'Admin';
}

/**
 * Carregar dados iniciais
 */
async function loadInitialData() {
  try {
    console.log('[ADMIN-NOTAS] Iniciando carregamento de dados...');

    // Carregar dados em paralelo
    const [turmas, notas, disciplinas, cursos] = await Promise.all([
      api.getTurmas() || [],
      api.getNotas() || [],
      api.getDisciplinas() || [],
      api.getCursos() || []
    ]);

    turmasData = turmas;
    notasData = notas;
    disciplinasData = disciplinas;
    cursosData = cursos;

    console.log('[ADMIN-NOTAS] Turmas carregadas:', turmasData?.length ?? 0);
    console.log('[ADMIN-NOTAS] Notas carregadas:', notasData?.length ?? 0);
    console.log('[ADMIN-NOTAS] Disciplinas carregadas:', disciplinasData?.length ?? 0);

    // Preencher dropdown de turmas
    populateTurmaSelect();

  } catch (erro) {
    console.error('[ADMIN-NOTAS] Erro ao carregar dados:', erro);
    showNotification('Erro ao carregar dados: ' + erro.message, 'danger');
  }
}

/**
 * Preencher dropdown de turmas
 */
function populateTurmaSelect() {
  const selectTurma = document.getElementById('selectTurma');
  
  if (!selectTurma) {
    console.error('[ADMIN-NOTAS] Select de turma não encontrado');
    return;
  }

  // Ordenar turmas por sigla
  const turmasOrdenadas = [...turmasData].sort((a, b) => {
    return (a.sigla_turma || '').localeCompare(b.sigla_turma || '');
  });

  // Adicionar opções
  turmasOrdenadas.forEach(turma => {
    const option = document.createElement('option');
    option.value = turma.id_turma;
    option.textContent = `${turma.sigla_turma} - ${turma.classe_turma}ª Classe (${turma.turno_turma})`;
    selectTurma.appendChild(option);
  });

  console.log('[ADMIN-NOTAS] Dropdown de turmas preenchido:', turmasOrdenadas.length);
}

/**
 * Obter disciplinas de uma turma via sua classe
 */
async function getDisciplinasDaTurma(turmaId) {
  const turma = turmasData.find(t => t.id_turma === turmaId);
  
  if (!turma || !turma.classe_id) {
    console.warn('[ADMIN-NOTAS] Turma ou classe_id não encontrado');
    return [];
  }

  try {
    // Usar o método da API para obter as disciplinas da classe
    const disciplinas = await api.getDisciplinasClasse(turma.classe_id);
    
    // Ordenar por descrição
    return (disciplinas || []).sort((a, b) => 
      (a.descricao_disc || '').localeCompare(b.descricao_disc || '')
    );
  } catch (erro) {
    console.error('[ADMIN-NOTAS] Erro ao obter disciplinas:', erro);
    return [];
  }
}

/**
 * Carregar e exibir pautas para a turma selecionada
 */
async function loadPautasDaTurma(turmaId) {
  try {
    console.log('[ADMIN-NOTAS] Carregando pautas para turma:', turmaId);

    if (!turmaId) {
      document.getElementById('pautasContainer').innerHTML = '';
      return;
    }

    selectedTurmaId = turmaId;

    // Obter turma
    const turma = turmasData.find(t => t.id_turma === turmaId);
    if (!turma) {
      showNotification('Turma não encontrada', 'warning');
      return;
    }

    // Obter disciplinas da turma (agora é assíncrono)
    const disciplinas = await getDisciplinasDaTurma(turmaId);

    if (disciplinas.length === 0) {
      document.getElementById('pautasContainer').innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            Nenhuma disciplina associada a esta turma.
          </div>
        </div>
      `;
      return;
    }

    // Renderizar pautas por disciplina
    renderPautasPorDisciplina(turma, disciplinas);

  } catch (erro) {
    console.error('[ADMIN-NOTAS] Erro ao carregar pautas:', erro);
    showNotification('Erro ao carregar pautas: ' + erro.message, 'danger');
  }
}

/**
 * Renderizar pautas por disciplina
 */
function renderPautasPorDisciplina(turma, disciplinas) {
  const container = document.getElementById('pautasContainer');
  container.innerHTML = ''; // Limpar conteúdo anterior

  // Renderizar uma pauta para cada disciplina
  disciplinas.forEach(disciplina => {
    // Filtrar notas para esta turma e disciplina
    const notasDisciplina = notasData.filter(nota =>
      nota.turma_id === turma.id_turma &&
      nota.disciplina_id === disciplina.id_disc
    );

    // Agrupar notas por aluno
    const alunoMap = {};
    notasDisciplina.forEach(nota => {
      if (!alunoMap[nota.estudante_id]) {
        alunoMap[nota.estudante_id] = {
          estudanteId: nota.estudante_id,
          estudante: nota.estudante,
          notas: []
        };
      }
      alunoMap[nota.estudante_id].notas.push(nota);
    });

    const alunos = Object.values(alunoMap);

    // Obter professor (pega do primeiro nota, pois todos devem ter o mesmo)
    const professorNota = notasDisciplina.length > 0 ? notasDisciplina[0] : null;
    const nomeProfessor = professorNota?.professor?.nome_prof || 'Professor não atribuído';

    // Construir HTML da pauta
    const disciplinaName = disciplina.descricao_disc || disciplina.sigla_disc;
    
    const notasHtml = alunos.map(aluno => {
      // Pegar a primeira nota (ou calcular média se houver várias)
      const ultimaNota = aluno.notas[aluno.notas.length - 1];
      
      const mac = ultimaNota?.mac_notas ?? '-';
      const pp = ultimaNota?.pp_notas ?? '-';
      const pt = ultimaNota?.pt_notas ?? '-';
      
      // Calcular média
      const media = (mac !== '-' && pp !== '-' && pt !== '-') 
        ? ((parseFloat(mac) + parseFloat(pp) + parseFloat(pt)) / 3).toFixed(2)
        : '-';

      // Determinar se está aprovado (média >= 10)
      const mediaNum = parseFloat(media);
      const aprovado = !isNaN(mediaNum) && mediaNum >= 10;
      const statusBadge = aprovado 
        ? '<span class="badge bg-success">Aprovado</span>'
        : media === '-' ? '<span class="badge bg-secondary">Sem Notas</span>' : '<span class="badge bg-danger">Reprovado</span>';

      return `
        <tr>
          <td>${aluno.estudante?.nome_estudante || 'Aluno desconhecido'}</td>
          <td class="text-center">${mac}</td>
          <td class="text-center">${pp}</td>
          <td class="text-center">${pt}</td>
          <td class="text-end"><strong>${media}</strong></td>
          <td class="text-center">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    const pautaCard = document.createElement('div');
    pautaCard.className = 'col-lg-12';
    pautaCard.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="card-title mb-1">${disciplinaName}</h5>
              <p class="text-muted mb-0">
                <strong>Professor:</strong> ${nomeProfessor}<br>
                ${turma.sigla_turma} • ${turma.classe_turma}ª Classe • ${turma.turno_turma}
              </p>
            </div>
            <span class="badge bg-info">${alunos.length} aluno(s)</span>
          </div>
          
          ${alunos.length > 0 ? `
            <div class="table-responsive mb-3">
              <table class="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th class="text-center" style="width: 80px;">MAC</th>
                    <th class="text-center" style="width: 80px;">PP</th>
                    <th class="text-center" style="width: 80px;">PT</th>
                    <th class="text-end" style="width: 80px;">Média</th>
                    <th class="text-center" style="width: 120px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${notasHtml}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="alert alert-warning mb-0">Sem notas lançadas para esta disciplina.</div>
          `}
        </div>
      </div>
    `;

    container.appendChild(pautaCard);
  });

  console.log('[ADMIN-NOTAS] Pautas renderizadas para', disciplinas.length, 'disciplina(s)');
  showNotification(`Pauta carregada com ${disciplinas.length} disciplina(s)`, 'success');
}

/**
 * Carregar avisos de notas lançadas
 */
async function loadAvisosNotasLancadas() {
  try {
    console.log('[ADMIN-NOTAS] Carregando avisos de notas lançadas...');
    
    const avisos = await api.getAvisosNotasLancadas();
    
    if (!avisos || avisos.length === 0) {
      console.log('[ADMIN-NOTAS] Nenhum aviso de notas lançadas');
      return;
    }

    renderAvisosNotasLancadas(avisos);

  } catch (erro) {
    console.warn('[ADMIN-NOTAS] Erro ao carregar avisos de notas:', erro.message);
    // Não mostrar erro se a API não retornar avisos
  }
}

/**
 * Renderizar avisos de notas lançadas
 */
function renderAvisosNotasLancadas(avisos) {
  const secaoAvisos = document.getElementById('secaoAvisos');
  const container = document.getElementById('avisosContainer');

  if (!secaoAvisos || !container) {
    console.error('[ADMIN-NOTAS] Container de avisos não encontrado');
    return;
  }

  // Limpar avisos anteriores
  container.innerHTML = '';

  // Renderizar cada aviso como um card
  avisos.forEach(aviso => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';

    const dataPublicacao = new Date(aviso.data_publicacao).toLocaleDateString('pt-AO');
    
    // Verificar se é uma nota atualizada ou nova
    const ehAtualizacao = aviso.titulo.includes('Nota Atualizada');
    const titulo = aviso.titulo.replace('Nova Nota Lançada: ', '').replace('Nota Atualizada: ', '');
    
    // Cores e badges diferentes para cada tipo
    let badgeClass = 'bg-warning text-dark';
    let badgeTexto = 'Nova Nota';
    let borderClass = 'border-warning';
    let iconTexto = '';
    
    if (ehAtualizacao) {
      badgeClass = 'bg-info text-white';
      badgeTexto = 'Nota Atualizada';
      borderClass = 'border-info';
      iconTexto = '✏️';
    }

    card.innerHTML = `
      <div class="card ${borderClass}">
        <div class="card-body">
          <h6 class="card-title">
            <span class="badge ${badgeClass}">${iconTexto} ${badgeTexto}</span>
            ${titulo}
          </h6>
          <p class="card-text small text-muted">${aviso.conteudo}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">${dataPublicacao}</small>
            <span class="badge ${ehAtualizacao ? 'bg-secondary' : 'bg-danger'}">
              ${ehAtualizacao ? 'Prioridade Média' : 'Alta Prioridade'}
            </span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Mostrar seção de avisos
  secaoAvisos.style.display = 'block';

  console.log('[ADMIN-NOTAS] Avisos renderizados:', avisos.length);
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  const selectTurma = document.getElementById('selectTurma');
  
  if (selectTurma) {
    selectTurma.addEventListener('change', async function () {
      const turmaId = parseInt(this.value);
      if (turmaId) {
        await loadPautasDaTurma(turmaId);
      } else {
        document.getElementById('pautasContainer').innerHTML = '';
      }
    });
  }
}

/**
 * Mostrar notificação
 */
function showNotification(message, type = 'success') {
  const existingNotification = document.querySelector('.alert:not(.alert-info)');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show`;
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    const header = pageContent.querySelector('.page-header');
    if (header) {
      header.after(notification);
    }
  }
}
