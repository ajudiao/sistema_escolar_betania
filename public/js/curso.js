// ============= GERENCIAMENTO DE CURSOS =============

// Garantir que API Service está disponível
if (typeof api === 'undefined') {
  console.error('[CURSOS] APIService não está disponível!');
  const api = new APIService();
}

let cursosData = [];
let disciplinasData = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('[CURSOS] Script carregado');

  // Carregar cursos e renderizar tabela
  async function loadCursos() {
    try {
      console.log('[CURSOS] Carregando cursos...');
      cursosData = await api.getCursos();
      console.log('[CURSOS] Cursos carregados:', cursosData);
      renderCursosTable(cursosData);
    } catch (error) {
      console.error('[CURSOS] Erro ao carregar cursos:', error);
      DataLoader.showError('Erro ao carregar cursos: ' + error.message);
    }
  }

  // Renderizar tabela de cursos
  function renderCursosTable(cursos) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
      console.warn('[CURSOS] tbody não encontrado');
      return;
    }
    
    tbody.innerHTML = '';

    if (!cursos || cursos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum curso encontrado</td></tr>';
      console.log('[CURSOS] Nenhum curso na lista');
      return;
    }

    console.log(`[CURSOS] Renderizando ${cursos.length} cursos`);
    cursos.forEach(curso => {
      try {
        const row = document.createElement('tr');
        const duracao = curso.duracao_semestres ? `${curso.duracao_semestres} semestres` : '-';
        const numDisciplinas = curso.disciplinas?.length || 0;
        
        row.innerHTML = `
          <td>${curso.sigla_curso || '-'}</td>
          <td>${curso.descricao_curso || '-'}</td>
          <td>${duracao}</td>
          <td><span class="badge bg-info">${numDisciplinas} disciplinas</span></td>
          <td>${curso.descricao_curso || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline-info me-1 btn-view" data-id="${curso.id_curso}" data-bs-toggle="modal" data-bs-target="#cursoDetailsModal">Ver</button>
            <button class="btn btn-sm btn-outline-warning me-1 btn-edit" data-id="${curso.id_curso}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${curso.id_curso}" data-name="${curso.descricao_curso}">Deletar</button>
          </td>
        `;
        tbody.appendChild(row);
      } catch (error) {
        console.error('[CURSOS] Erro ao renderizar linha:', error);
      }
    });
  }

  // Carregar disciplinas
  async function loadDisciplinas() {
    try {
      disciplinasData = await api.getDisciplinas();
      console.log('[CURSOS] Disciplinas carregadas:', disciplinasData);
      renderDisciplinasCheckboxes();
    } catch (error) {
      console.error('[CURSOS] Erro ao carregar disciplinas:', error);
    }
  }

   // Renderizar checkboxes de disciplinas
  function renderDisciplinasCheckboxes() {
    const container = document.getElementById('cursoDisciplinas');
    if (!container) return;
    
    container.innerHTML = '';
    disciplinasData.forEach(disc => {
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${disc.id_disc}" id="disc_${disc.id_disc}">
        <label class="form-check-label" for="disc_${disc.id_disc}">
          ${disc.sigla_disc} - ${disc.descricao_disc}
        </label>
      `;
      container.appendChild(div);
    });
  }

  // Event delegation para botões da tabela
  const tbody = document.querySelector('table tbody');
  if (tbody) {
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const id = btn.getAttribute('data-id');
      if (!id) return;
      
      if (btn.classList.contains('btn-view')) {
        // Ver detalhes
        console.log('[CURSOS] Carregando detalhes do curso ID:', id);
        DataLoader.showLoading('Carregando detalhes...');
        
        api.getCurso(id)
          .then(cursoData => {
            DataLoader.hideLoading();
            
            const duracao = cursoData.duracao_semestres ? `${cursoData.duracao_semestres} semestres` : '-';
            const disciplinas = (cursoData.disciplinas || [])
              .map(cd => cd.disciplina.sigla_disc + ' - ' + cd.disciplina.descricao_disc)
              .join(', ') || '-';
            
            document.getElementById('detailCodigo').textContent = cursoData.sigla_curso || '-';
            document.getElementById('detailNome').textContent = cursoData.descricao_curso || '-';
            document.getElementById('detailDuracao').textContent = duracao;
            document.getElementById('detailDisciplinas').textContent = disciplinas;
            
            console.log('[CURSOS] Detalhes carregados:', cursoData);
          })
          .catch(error => {
            DataLoader.hideLoading();
            DataLoader.showError('Erro ao carregar detalhes: ' + error.message);
            console.error('[CURSOS] Erro ao carregar detalhes:', error);
          });
      } else if (btn.classList.contains('btn-edit')) {
        // Editar - carregar dados do curso
        console.log('[CURSOS] Carregando dados para edição, ID:', id);
        DataLoader.showLoading('Carregando dados...');
        
        api.getCurso(id)
          .then(cursoData => {
            DataLoader.hideLoading();
            
            document.getElementById('cursoModalTitle').textContent = 'Editar Curso';
            document.getElementById('cursoId').value = id;
            document.getElementById('cursoAction').value = 'edit';
            
            // Preencher formulário
            document.getElementById('cursoCodigo').value = cursoData.sigla_curso || '';
            document.getElementById('cursoNome').value = cursoData.descricao_curso || '';
            document.getElementById('cursoDuracao').value = cursoData.duracao_semestres || '';
            
            // Pré-selecionar disciplinas (checkboxes)
            const disciplinasIds = (cursoData.disciplinas || []).map(cd => cd.disciplina_id);
            document.querySelectorAll('#cursoDisciplinas .form-check-input').forEach(checkbox => {
              checkbox.checked = disciplinasIds.includes(parseInt(checkbox.value));
            });
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('cursoModal'));
            modal.show();
            
            console.log('[CURSOS] Dados carregados para edição:', cursoData);
          })
          .catch(error => {
            DataLoader.hideLoading();
            DataLoader.showError('Erro ao carregar curso: ' + error.message);
            console.error('[CURSOS] Erro ao carregar curso:', error);
          });
      } else if (btn.classList.contains('btn-delete')) {
        // Deletar com confirmação
        const nome = btn.getAttribute('data-name');
        if (confirm(`Deseja realmente deletar o curso ${nome}?`)) {
          console.log('[CURSOS] Deletando curso ID:', id);
          DataLoader.showLoading('Deletando curso...');
          api.deleteCurso(id)
            .then(() => {
              DataLoader.hideLoading();
              DataLoader.showSuccess('Curso deletado com sucesso!');
              loadCursos();
            })
            .catch(error => {
              DataLoader.hideLoading();
              DataLoader.showError('Erro ao deletar: ' + error.message);
            });
        }
      }
    });
  }

  // Submit do formulário
  const formCurso = document.getElementById('formCurso');
  if (formCurso) {
    formCurso.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = formCurso.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

      // Obter disciplinas selecionadas
      const disciplinasIds = Array.from(document.querySelectorAll('#cursoDisciplinas .form-check-input:checked'))
        .map(checkbox => parseInt(checkbox.value));
      
      const data = {
        sigla_curso: document.getElementById('cursoCodigo').value,
        descricao_curso: document.getElementById('cursoNome').value,
        duracao_semestres: parseInt(document.getElementById('cursoDuracao').value) || null,
        disciplinasIds: disciplinasIds
      };

      try {
        const cursoId = document.getElementById('cursoId').value;
        const action = document.getElementById('cursoAction').value;
        
        DataLoader.showLoading(action === 'edit' ? 'Atualizando curso...' : 'Criando curso...');

        if (action === 'edit' && cursoId) {
          await api.updateCurso(cursoId, data);
          showFlashMessage('Curso atualizado com sucesso!');
        } else {
          await api.createCurso(data);
          showFlashMessage('Curso criado com sucesso!');
        }

        DataLoader.hideLoading();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
        bootstrap.Modal.getInstance(document.getElementById('cursoModal')).hide();
        
        // Recarregar lista de cursos
        loadCursos();
      } catch (error) {
        DataLoader.hideLoading();
        DataLoader.showError('Erro: ' + (error.message || 'Erro desconhecido'));
        console.error('Erro API:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
      }
    });
  }

  // Filtro
  const btnFilter = document.getElementById('btnFilterCurso');
  if (btnFilter) {
    btnFilter.addEventListener('click', function () {
      const search = document.getElementById('filterCursoSearch').value.toLowerCase();
      const duracao = document.getElementById('filterCursoDuracao').value;

      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach(row => {
        const codigo = row.cells[0].textContent.toLowerCase();
        const nome = row.cells[1].textContent.toLowerCase();
        const dur = row.cells[2].textContent;

        const matchesSearch = !search || codigo.includes(search) || nome.includes(search);
        const matchesDuracao = !duracao || dur.includes(duracao);

        row.style.display = matchesSearch && matchesDuracao ? '' : 'none';
      });
    });
  }

  // Helper para mensagens
  function showFlashMessage(message, type = 'success') {
    const flash = document.getElementById('flashMessage');
    if (!flash) return;
    flash.textContent = message;
    flash.className = `alert alert-${type}`;
    flash.style.display = 'block';
    setTimeout(() => {
      flash.style.display = 'none';
    }, 5000);
  }

  // Carregar dados ao abrir o modal
  const cursoModalEl = document.getElementById('cursoModal');
  if (cursoModalEl) {
    cursoModalEl.addEventListener('show.bs.modal', function() {
      const cursoId = document.getElementById('cursoId').value;
      const action = document.getElementById('cursoAction').value;
      
      if (!cursoId || action === 'add') {
        document.getElementById('cursoModalTitle').textContent = 'Novo Curso';
        document.getElementById('formCurso').reset();
        document.getElementById('cursoId').value = '';
        document.getElementById('cursoAction').value = 'add';
      }
      
      loadDisciplinas();
    });
  }

  // Fechar modal
  if (cursoModalEl) {
    cursoModalEl.addEventListener('hidden.bs.modal', function () {
      document.getElementById('cursoModalTitle').textContent = 'Novo Curso';
      document.getElementById('formCurso').reset();
      document.getElementById('cursoId').value = '';
      document.getElementById('cursoAction').value = 'add';
    });
  }

  // Iniciar carregamento
  loadCursos();
  loadDisciplinas();
});
