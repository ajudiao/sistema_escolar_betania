/* ===========================================
   Data Loader - Carregar dados da API
   =========================================== */

class DataLoader {
  /**
   * Mostrar loading indicator
   */
  static showLoading(message = 'Carregando...') {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.style.display = 'block';
    }
    console.log(message);
  }

  /**
   * Esconder loading indicator
   */
  static hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Mostrar mensagem de erro
   */
  static showError(message, containerId = 'errorContainer') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Erro:</strong> ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    } else {
      alert('Erro: ' + message);
    }
  }

  /**
   * Mostrar mensagem de sucesso
   */
  static showSuccess(message, containerId = 'successContainer') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }

  /**
   * Carregar estudantes
   */
  static async loadEstudantes(turmaId = null, classe = null) {
    try {
      this.showLoading('Carregando estudantes...');
      const estudantes = await api.getEstudantes(turmaId, classe);
      this.hideLoading();
      return estudantes;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar estudantes: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar professores
   */
  static async loadProfessores() {
    try {
      this.showLoading('Carregando professores...');
      const professores = await api.getProfessores();
      this.hideLoading();
      return professores;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar professores: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar turmas
   */
  static async loadTurmas() {
    try {
      this.showLoading('Carregando turmas...');
      const turmas = await api.getTurmas();
      this.hideLoading();
      return turmas;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar turmas: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar disciplinas
   */
  static async loadDisciplinas() {
    try {
      this.showLoading('Carregando disciplinas...');
      const disciplinas = await api.getDisciplinas();
      this.hideLoading();
      return disciplinas;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar disciplinas: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar cursos
   */
  static async loadCursos() {
    try {
      this.showLoading('Carregando cursos...');
      const cursos = await api.getCursos();
      this.hideLoading();
      return cursos;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar cursos: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar notas
   */
  static async loadNotas(estudanteId = null, disciplinaId = null) {
    try {
      this.showLoading('Carregando notas...');
      const notas = await api.getNotas(estudanteId, disciplinaId);
      this.hideLoading();
      return notas;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar notas: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar faltas
   */
  static async loadFaltas(estudanteId = null, disciplinaId = null) {
    try {
      this.showLoading('Carregando faltas...');
      const faltas = await api.getFaltas(estudanteId, disciplinaId);
      this.hideLoading();
      return faltas;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar faltas: ' + error.message);
      return [];
    }
  }

  /**
   * Carregar avisos
   */
  static async loadAvisos(tipo = null) {
    try {
      this.showLoading('Carregando avisos...');
      const avisos = await api.getAvisos(tipo);
      this.hideLoading();
      return avisos;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao carregar avisos: ' + error.message);
      return [];
    }
  }

  /**
   * Criar estudante
   */
  static async createEstudante(data) {
    try {
      this.showLoading('Criando estudante...');
      const result = await api.createEstudante(data);
      this.hideLoading();
      this.showSuccess('Estudante criado com sucesso!');
      return result;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao criar estudante: ' + error.message);
      throw error;
    }
  }

  /**
   * Atualizar estudante
   */
  static async updateEstudante(id, data) {
    try {
      this.showLoading('Atualizando estudante...');
      const result = await api.updateEstudante(id, data);
      this.hideLoading();
      this.showSuccess('Estudante atualizado com sucesso!');
      return result;
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao atualizar estudante: ' + error.message);
      throw error;
    }
  }

  /**
   * Deletar estudante
   */
  static async deleteEstudante(id) {
    try {
      if (confirm('Tem certeza que quer desativar este estudante?')) {
        this.showLoading('Desativando estudante...');
        await api.deleteEstudante(id);
        this.hideLoading();
        this.showSuccess('Estudante desativado com sucesso!');
        return true;
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Erro ao desativar estudante: ' + error.message);
      throw error;
    }
  }

  /**
   * Construir tabela de estudantes
   */
  static buildEstudantesTable(estudantes, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!estudantes || estudantes.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum estudante encontrado.</p>';
      return;
    }

    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Turma</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    estudantes.forEach(est => {
      html += `
        <tr>
          <td>${est.id}</td>
          <td>${est.nome}</td>
          <td>${est.email}</td>
          <td>${est.turmaId || '-'}</td>
          <td>
            <a href="#" class="btn btn-sm btn-info" data-estudante-id="${est.id}">Ver</a>
            <a href="#" class="btn btn-sm btn-warning" data-studied-edit="${est.id}">Editar</a>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  /**
   * Construir tabela de professores
   */
  static buildProfessoresTable(professores, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!professores || professores.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum professor encontrado.</p>';
      return;
    }

    let html = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Disciplinas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    professores.forEach(prof => {
      html += `
        <tr>
          <td>${prof.id}</td>
          <td>${prof.nome}</td>
          <td>${prof.email}</td>
          <td>${prof.disciplinas || '-'}</td>
          <td>
            <a href="#" class="btn btn-sm btn-info" data-professor-id="${prof.id}">Ver</a>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  /**
   * Construir lista de avisos
   */
  static buildAvisosList(avisos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!avisos || avisos.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum aviso encontrado.</p>';
      return;
    }

    let html = '';
    avisos.forEach(aviso => {
      html += `
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="card-title mb-0">${aviso.titulo}</h5>
            <small class="text-muted">${new Date(aviso.data).toLocaleDateString('pt-AO')}</small>
          </div>
          <div class="card-body">
            <p class="card-text">${aviso.conteudo}</p>
            <small class="text-muted">Por: ${aviso.autor}</small>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}
