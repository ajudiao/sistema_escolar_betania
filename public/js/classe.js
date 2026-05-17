// ============= GERENCIAMENTO DE CLASSES =============

// Garantir que API Service está disponível
if (typeof api === 'undefined') {
  console.error('[CLASSES] APIService não está disponível!');
  const api = new APIService();
}

let classesData = [];
let disciplinasData = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('[CLASSES] Script carregado');

  if (typeof AuthHelper !== 'undefined') {
    AuthHelper.checkRole(['ADMIN']);
  }

  // Carregar classes e renderizar tabela
  async function loadClasses() {
    try {
      console.log('[CLASSES] Carregando classes...');
      classesData = await api.getClasses();
      console.log('[CLASSES] Classes carregadas:', classesData);
      renderClassesTable(classesData);
    } catch (error) {
      console.error('[CLASSES] Erro ao carregar classes:', error);
      DataLoader.showError('Erro ao carregar classes: ' + error.message);
    }
  }

  // Renderizar tabela de classes
  function renderClassesTable(classes) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
      console.warn('[CLASSES] tbody não encontrado');
      return;
    }
    
    tbody.innerHTML = '';

    if (!classes || classes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma classe encontrada</td></tr>';
      console.log('[CLASSES] Nenhuma classe na lista');
      return;
    }

    console.log(`[CLASSES] Renderizando ${classes.length} classes`);
    classes.forEach(classe => {
      try {
        const row = document.createElement('tr');
        const duracao = classe.duracao_semestres ? `${classe.duracao_semestres} semestres` : '-';
        const numDisciplinas = classe.disciplinas?.length || 0;
        const tipoEnsino = classe.tipoEnsino === 'MEDIO' ? 'Médio' : 'Secundário';
        const nomeCurso = classe.nomeCurso ? `${classe.nomeCurso}` : '-';
        
        row.innerHTML = `
          <td>${classe.sigla_classe || '-'}</td>
          <td>${classe.descricao_classe || '-'}</td>
          <td>${tipoEnsino}</td>
          <td>${nomeCurso}</td>
          <td>${duracao}</td>
          <td><span class="badge bg-info">${numDisciplinas} disciplinas</span></td>
          <td>
            <button class="btn btn-sm btn-outline-info me-1 btn-view" data-id="${classe.id_classe}" data-bs-toggle="modal" data-bs-target="#classeDetailsModal">Ver</button>
            <button class="btn btn-sm btn-outline-warning me-1 btn-edit" data-id="${classe.id_classe}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${classe.id_classe}" data-name="${classe.descricao_classe}">Deletar</button>
          </td>
        `;
        tbody.appendChild(row);
      } catch (error) {
        console.error('[CLASSES] Erro ao renderizar linha:', error);
      }
    });
  }

  // Carregar disciplinas
  async function loadDisciplinas() {
    try {
      disciplinasData = await api.getDisciplinas();
      console.log('[CLASSES] Disciplinas carregadas:', disciplinasData);
      renderDisciplinasCheckboxes();
    } catch (error) {
      console.error('[CLASSES] Erro ao carregar disciplinas:', error);
    }
  }

   // Renderizar checkboxes de disciplinas
  function renderDisciplinasCheckboxes() {
    const container = document.getElementById('classeDisciplinas');
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
        console.log('[CLASSES] Carregando detalhes da classe ID:', id);
        DataLoader.showLoading('Carregando detalhes...');
        
        api.getClass(id)
          .then(classeData => {
            DataLoader.hideLoading();
            
            const duracao = classeData.duracao_semestres ? `${classeData.duracao_semestres} semestres` : '-';
            const disciplinas = (classeData.disciplinas || [])
              .map(cd => cd.disciplina.sigla_disc + ' - ' + cd.disciplina.descricao_disc)
              .join(', ') || '-';
            const tipoEnsino = classeData.tipoEnsino === 'MEDIO' ? 'Médio' : 'Secundário';
            const nomeCurso = classeData.nomeCurso || '-';
            
            document.getElementById('detailCodigo').textContent = classeData.sigla_classe || '-';
            document.getElementById('detailNome').textContent = classeData.descricao_classe || '-';
            document.getElementById('detailTipo').textContent = tipoEnsino;
            document.getElementById('detailCurso').textContent = nomeCurso;
            document.getElementById('detailDuracao').textContent = duracao;
            document.getElementById('detailDisciplinas').textContent = disciplinas;
            
            console.log('[CLASSES] Detalhes carregados:', classeData);
          })
          .catch(error => {
            DataLoader.hideLoading();
            DataLoader.showError('Erro ao carregar detalhes: ' + error.message);
            console.error('[CLASSES] Erro ao carregar detalhes:', error);
          });
      } else if (btn.classList.contains('btn-edit')) {
        // Editar - carregar dados da classe
        console.log('[CLASSES] Carregando dados para edição, ID:', id);
        DataLoader.showLoading('Carregando dados...');
        
        api.getClass(id)
          .then(classeData => {
            DataLoader.hideLoading();
            
            document.getElementById('classeModalTitle').textContent = 'Editar Classe';
            document.getElementById('classeId').value = id;
            document.getElementById('classeAction').value = 'edit';
            
            // Preencher formulário
            document.getElementById('classeCodigo').value = classeData.sigla_classe || '';
            document.getElementById('classeNome').value = classeData.descricao_classe || '';
            document.getElementById('classeDuracao').value = classeData.duracao_semestres || '';
            document.getElementById('classeCurso').value = classeData.nomeCurso || '';
            document.getElementById('classeTipo').value = classeData.tipoEnsino || 'SECUNDARIO';

            updateClasseDependentFields();
            
            // Pré-selecionar disciplinas (checkboxes)
            const disciplinasIds = (classeData.disciplinas || []).map(cd => cd.disciplina_id);
            document.querySelectorAll('#classeDisciplinas .form-check-input').forEach(checkbox => {
              checkbox.checked = disciplinasIds.includes(parseInt(checkbox.value));
            });
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('classeModal'));
            modal.show();
            
            console.log('[CLASSES] Dados carregados para edição:', classeData);
          })
          .catch(error => {
            DataLoader.hideLoading();
            DataLoader.showError('Erro ao carregar classe: ' + error.message);
            console.error('[CLASSES] Erro ao carregar classe:', error);
          });
      } else if (btn.classList.contains('btn-delete')) {
        // Deletar com confirmação
        const nome = btn.getAttribute('data-name');
        if (confirm(`Deseja realmente deletar a classe ${nome}?`)) {
          console.log('[CLASSES] Deletando classe ID:', id);
          DataLoader.showLoading('Deletando classe...');
          api.deleteClass(id)
            .then(() => {
              DataLoader.hideLoading();
              DataLoader.showSuccess('Classe deletada com sucesso!');
              loadClasses();
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
  const formClasse = document.getElementById('formClasse');
  if (formClasse) {
    formClasse.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = formClasse.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

      // Obter disciplinas selecionadas
      const disciplinasIds = Array.from(document.querySelectorAll('#classeDisciplinas .form-check-input:checked'))
        .map(checkbox => parseInt(checkbox.value));
      
      const data = {
        sigla_classe: document.getElementById('classeCodigo').value,
        descricao_classe: document.getElementById('classeNome').value,
        nomeCurso: document.getElementById('classeCurso').value || null,
        duracao_semestres: parseInt(document.getElementById('classeDuracao').value) || null,
        tipoEnsino: document.getElementById('classeTipo').value,
        disciplinasIds: disciplinasIds
      };

      try {
        const classeId = document.getElementById('classeId').value;
        const action = document.getElementById('classeAction').value;
        
        DataLoader.showLoading(action === 'edit' ? 'Atualizando classe...' : 'Criando classe...');

        if (action === 'edit' && classeId) {
          await api.updateClass(classeId, data);
          showFlashMessage('Classe atualizada com sucesso!');
        } else {
          await api.createClass(data);
          showFlashMessage('Classe criada com sucesso!');
        }

        DataLoader.hideLoading();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
        bootstrap.Modal.getInstance(document.getElementById('classeModal')).hide();
        
        // Recarregar lista de classes
        loadClasses();
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
  const btnFilter = document.getElementById('btnFilterClasse');
  if (btnFilter) {
    btnFilter.addEventListener('click', function () {
      const search = document.getElementById('filterClasseSearch').value.toLowerCase();
      const tipo = document.getElementById('filterClasseTipo').value;
      const duracao = document.getElementById('filterClasseDuracao').value;

      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach(row => {
        const codigo = row.cells[0].textContent.toLowerCase();
        const nome = row.cells[1].textContent.toLowerCase();
        const classTipo = row.cells[2].textContent;
        const dur = row.cells[4].textContent;

        const matchesSearch = !search || codigo.includes(search) || nome.includes(search);
        const matchesTipo = !tipo || classTipo.includes(tipo);
        const matchesDuracao = !duracao || dur.includes(duracao);

        row.style.display = matchesSearch && matchesTipo && matchesDuracao ? '' : 'none';
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
  const classeModalEl = document.getElementById('classeModal');
  if (classeModalEl) {
    classeModalEl.addEventListener('show.bs.modal', function() {
      const classeId = document.getElementById('classeId').value;
      const action = document.getElementById('classeAction').value;
      
      if (!classeId || action === 'add') {
        document.getElementById('classeModalTitle').textContent = 'Nova Classe';
        document.getElementById('formClasse').reset();
        document.getElementById('classeId').value = '';
        document.getElementById('classeAction').value = 'add';
        document.getElementById('classeTipo').value = 'SECUNDARIO';
        updateClasseDependentFields();
      }
      
      loadDisciplinas();
    });
  }

  // listener for `classeTipo` is handled inline in the page to avoid duplicate bindings

  // Fechar modal
  if (classeModalEl) {
    classeModalEl.addEventListener('hidden.bs.modal', function () {
      document.getElementById('classeModalTitle').textContent = 'Nova Classe';
      document.getElementById('formClasse').reset();
      document.getElementById('classeId').value = '';
      document.getElementById('classeAction').value = 'add';
    });
  }

  // Iniciar carregamento
  loadClasses();
  loadDisciplinas();
});
