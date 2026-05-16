/* ===========================================
   API Service - Sistema de Geatão Escolar Betânia
   Conecta o frontend com o backend NestJS
   =========================================== */

class APIService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/v1';
    this.token = this.getToken();
  }

  /**
   * Obtém o token armazenado no localStorage
   */
  getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Define o token no localStorage
   */
  setToken(token) {
    localStorage.setItem('authToken', token);
    this.token = token;
  }

  /**
   * Remove o token do localStorage
   */
  clearToken() {
    // Limpar TODO o localStorage para evitar conflitos de dados
    localStorage.clear();
    this.token = null;
  }

  /**
   * Headers padrão para requisições
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // IMPORTANTE: Ler o token do localStorage em CADA requisição
    // Não usar this.token porque ele pode estar desatualizado
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[API-SERVICE] ✓ Token JWT adicionado aos headers');
    } else {
      console.warn('[API-SERVICE] ⚠️ Nenhum token JWT encontrado - requisição pode falhar com 401');
    }

    return headers;
  }

  /**
   * Faz uma requisição genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log('[API-SERVICE] Requisição:', options.method || 'GET', url);
      if (options.body) {
        console.log('[API-SERVICE] Body:', options.body);
      }

      const response = await fetch(url, config);

      console.log('[API-SERVICE] Resposta:', response.status, response.statusText);

      // Se retornar 401 (não autorizado), fazer logout
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/index.html';
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`;
        console.error('[API-SERVICE] ✗ Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMsg,
          data: errorData
        });
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      console.log('[API-SERVICE] ✓ Sucesso - Response data:', responseData);
      console.log('[API-SERVICE] Tipo de responseData:', typeof responseData);
      console.log('[API-SERVICE] responseData é null?', responseData === null);
      console.log('[API-SERVICE] responseData é undefined?', responseData === undefined);
      
      // Se responseData for null ou undefined, retornar assim mesmo
      if (!responseData) {
        console.warn('[API-SERVICE] ⚠️ responseData é falsy');
        return responseData;
      }
      
      return responseData;
    } catch (error) {
      console.error('[API-SERVICE] ✗ Erro geral na requisição:', error);
      throw error;
    }
  }

  /**
   * GET - Obter recurso
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST - Criar recurso
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT - Atualizar recurso
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE - Deletar recurso
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Login - POST /usuarios/login
   */
  async login(email, password) {
    const response = await this.post('/usuarios/login', {
      email,
      password,
    });

    if (response.access_token) {
      this.setToken(response.access_token);
      // Armazenar dados do utilizador
      if (response) {
        if (response.id_usuario) localStorage.setItem('userId', response.id_usuario);
        if (response.id) localStorage.setItem('userId', response.id);
        
        // Armazenar perfil
        const userRole = response.perfil || response.role || 'ADMIN';
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', response.user_name || response.userName || 'Utilizador');
        localStorage.setItem('userEmail', response.email || '');
        
        // Armazenar estudanteId direto do login (vem da tabela Usuario)
        if (response.estudanteId) {
          localStorage.setItem('estudanteId', response.estudanteId);
          console.log('[API-SERVICE] EstudanteId armazenado do login:', response.estudanteId);
        }
        
        // Debug log
        console.log('[API-SERVICE] Login successful:', {
          email: response.email,
          perfil: userRole,
          user_name: localStorage.getItem('userName'),
          stored_role: localStorage.getItem('userRole'),
          estudanteId: localStorage.getItem('estudanteId')
        });
      }
    }

    return response;
  }

  /**
   * Logout
   */
  logout() {
    this.clearToken();
  }

  // ============= USUARIOS ENDPOINTS =============

  /**
   * Listar todos os utilizadores
   */
  async getUsuarios() {
    return this.get('/usuarios');
  }

  /**
   * Obter utilizador por ID
   */
  async getUsuario(id) {
    return this.get(`/usuarios/${id}`);
  }

  /**
   * Criar novo utilizador
   */
  async createUsuario(data) {
    return this.post('/usuarios', data);
  }

  /**
   * Atualizar utilizador
   */
  async updateUsuario(id, data) {
    return this.put(`/usuarios/${id}`, data);
  }

  /**
   * Deletar utilizador
   */
  async deleteUsuario(id) {
    return this.delete(`/usuarios/${id}`);
  }

  /**
   * Alterar password do utilizador
   */
  async changePassword(usuarioId, currentPassword, newPassword, confirmPassword) {
    console.log('[API-SERVICE] === changePassword ===');
    console.log('[API-SERVICE] usuarioId:', usuarioId);
    
    try {
      const response = await this.post(`/usuarios/change-password/${usuarioId}`, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      
      console.log('[API-SERVICE] ✓ Palavra-passe alterada com sucesso');
      return response;
    } catch (error) {
      console.error('[API-SERVICE] ✗ Erro ao alterar palavra-passe:', error.message);
      throw error;
    }
  }

  // ============= ESTUDANTES ENDPOINTS =============

  /**
   * Listar estudantes com filtros opcionais
   */
  async getEstudantes(turmaId = null, classe = null, status = null) {
    let endpoint = '/estudantes';
    const params = new URLSearchParams();

    if (turmaId) params.append('turmaId', turmaId);
    if (classe) params.append('classe', classe);
    if (status) params.append('status', status);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.get(endpoint);
  }

  /**
   * Obter estudante por ID
   */
  async getEstudante(id) {
    return this.get(`/estudantes/${id}`);
  }

  /**
   * Obter estudante do usuário logado por usuário ID
   */
  async getEstudanteByUsuario(usuarioId) {
    console.log('%c[API-SERVICE] === getEstudanteByUsuario ===', 'color: #8b5cf6; font-weight: bold');
    console.log('[API-SERVICE] usuarioId:', usuarioId, '| Type:', typeof usuarioId);
    
    if (!usuarioId) {
      console.error('[API-SERVICE] ✗ usuarioId é obrigatório');
      throw new Error('usuarioId é obrigatório para buscar estudante');
    }
    
    try {
      const endpoint = `/estudantes/usuario/${usuarioId}`;
      console.log('[API-SERVICE] GET', endpoint);
      
      const resposta = await this.get(endpoint);
      console.log('[API-SERVICE] ✓ Resposta recebida');
      console.log('[API-SERVICE] Tipo da resposta:', typeof resposta);
      console.log('[API-SERVICE] Resposta:', resposta);
      
      // Se a resposta vem como { data: {...} }, extrair o data
      if (resposta && resposta.data && typeof resposta.data === 'object') {
        console.log('[API-SERVICE] Extraindo .data da resposta');
        const estudante = resposta.data;
        console.log('[API-SERVICE] ✓ Estudante extraído:', estudante);
        return estudante;
      }
      
      // Se for um objeto direto com id_estudante, retornar
      if (resposta && resposta.id_estudante) {
        console.log('[API-SERVICE] ✓ Resposta é objeto estudante direto');
        console.log('[API-SERVICE] id_estudante:', resposta.id_estudante);
        console.log('[API-SERVICE] nome_estudante:', resposta.nome_estudante);
        return resposta;
      }
      
      console.error('[API-SERVICE] ✗ Resposta inesperada:', resposta);
      return null;
    } catch (error) {
      if (error.message && error.message.includes('401')) {
        console.error('[API-SERVICE] ✗ 401 Não autorizado - token pode estar expirado');
      } else if (error.message && error.message.includes('404')) {
        console.warn('[API-SERVICE] ⚠️ 404 Estudante não encontrado para usuarioId:', usuarioId);
      } else {
        console.error('[API-SERVICE] ✗ Erro ao buscar estudante:', error.message);
      }
      throw error;
    }
  }

  /**
   * Criar novo estudante
   */
  async createEstudante(data) {
    return this.post('/estudantes', data);
  }

  /**
   * Atualizar estudante
   */
  async updateEstudante(id, data) {
    return this.put(`/estudantes/${id}`, data);
  }

  /**
   * Desativar estudante
   */
  async deleteEstudante(id) {
    return this.delete(`/estudantes/${id}`);
  }

  // ============= PROFESSORES ENDPOINTS =============

  /**
   * Listar professores
   */
  async getProfessores(status = null) {
    let endpoint = '/professores';

    if (status) {
      endpoint += `?status=${encodeURIComponent(status)}`;
    }

    return this.get(endpoint);
  }

  /**
   * Obter professor por ID
   */
  async getProfessor(id) {
    return this.get(`/professores/${id}`);
  }

  /**
   * Obter professor por usuário ID (para o professor logado)
   */
  async getProfessorByUsuario(usuarioId) {
    console.log('%c[API-SERVICE] === getProfessorByUsuario ===', 'color: #f59e0b; font-weight: bold');
    console.log('[API-SERVICE] usuarioId:', usuarioId);
    
    if (!usuarioId) {
      console.error('[API-SERVICE] ✗ usuarioId é obrigatório');
      throw new Error('usuarioId é obrigatório para buscar professor');
    }
    
    try {
      const endpoint = `/professores/usuario/${usuarioId}`;
      console.log('[API-SERVICE] GET', endpoint);
      
      const resposta = await this.get(endpoint);
      console.log('[API-SERVICE] ✓ Resposta recebida');
      console.log('[API-SERVICE] Resposta completa:', resposta);
      
      // Se a resposta vem como { data: {...} }, extrair o data
      if (resposta && resposta.data && typeof resposta.data === 'object') {
        console.log('[API-SERVICE] Extraindo .data da resposta');
        const professor = resposta.data;
        console.log('[API-SERVICE] ✓ Professor extraído:', professor);
        return professor;
      }
      
      // Se for um objeto direto com id_prof, retornar
      if (resposta && resposta.id_prof) {
        console.log('[API-SERVICE] ✓ Resposta é objeto professor direto');
        console.log('[API-SERVICE] id_prof:', resposta.id_prof);
        console.log('[API-SERVICE] nome_prof:', resposta.nome_prof);
        console.log('[API-SERVICE] turmas_dirigidas:', resposta.turmas_dirigidas);
        console.log('[API-SERVICE] turmas:', resposta.turmas);
        console.log('[API-SERVICE] disciplinas:', resposta.disciplinas);
        return resposta;
      }
      
      console.error('[API-SERVICE] ✗ Resposta inesperada:', resposta);
      return null;
    } catch (error) {
      if (error.message && error.message.includes('401')) {
        console.error('[API-SERVICE] ✗ 401 Não autorizado - token pode estar expirado');
      } else if (error.message && error.message.includes('404')) {
        console.warn('[API-SERVICE] ⚠️ 404 Professor não encontrado para usuarioId:', usuarioId);
      } else {
        console.error('[API-SERVICE] ✗ Erro ao buscar professor:', error.message);
      }
      throw error;
    }
  }

  async getProfessorByEmail(email) {
    console.log('%c[API-SERVICE] === getProfessorByEmail ===', 'color: #f59e0b; font-weight: bold');
    console.log('[API-SERVICE] email:', email);
    
    if (!email) {
      console.error('[API-SERVICE] ✗ email é obrigatório');
      throw new Error('Email é obrigatório para buscar professor');
    }
    
    try {
      const endpoint = `/professores/email/${encodeURIComponent(email)}`;
      console.log('[API-SERVICE] GET', endpoint);
      
      const resposta = await this.get(endpoint);
      console.log('[API-SERVICE] ✓ Resposta recebida');
      console.log('[API-SERVICE] Resposta completa:', resposta);
      
      // Se a resposta vem como { data: {...} }, extrair o data
      if (resposta && resposta.data && typeof resposta.data === 'object') {
        console.log('[API-SERVICE] Extraindo .data da resposta');
        const professor = resposta.data;
        console.log('[API-SERVICE] ✓ Professor extraído:', professor);
        return professor;
      }
      
      // Se for um objeto direto com id_prof, retornar
      if (resposta && resposta.id_prof) {
        console.log('[API-SERVICE] ✓ Resposta é objeto professor direto');
        console.log('[API-SERVICE] id_prof:', resposta.id_prof);
        console.log('[API-SERVICE] nome_prof:', resposta.nome_prof);
        return resposta;
      }
      
      console.error('[API-SERVICE] ✗ Resposta inesperada:', resposta);
      return null;
    } catch (error) {
      if (error.message && error.message.includes('401')) {
        console.error('[API-SERVICE] ✗ 401 Não autorizado - token pode estar expirado');
      } else if (error.message && error.message.includes('404')) {
        console.warn('[API-SERVICE] ⚠️ 404 Professor não encontrado com email:', email);
      } else {
        console.error('[API-SERVICE] ✗ Erro ao buscar professor:', error.message);
      }
      throw error;
    }
  }

  /**
   * Criar novo professor
   */
  async createProfessor(data) {
    return this.post('/professores', data);
  }

  /**
   * Atualizar professor
   */
  async updateProfessor(id, data) {
    return this.put(`/professores/${id}`, data);
  }

  /**
   * Deletar professor
   */
  async deleteProfessor(id) {
    return this.delete(`/professores/${id}`);
  }

  // ============= TURMAS ENDPOINTS =============

  /**
   * Listar turmas
   */
  async getTurmas() {
    return this.get('/turmas');
  }

  /**
   * Obter turma por ID
   */
  async getTurma(id) {
    return this.get(`/turmas/${id}`);
  }

  /**
   * Criar nova turma
   */
  async createTurma(data) {
    return this.post('/turmas', data);
  }

  /**
   * Atualizar turma
   */
  async updateTurma(id, data) {
    return this.put(`/turmas/${id}`, data);
  }

  /**
   * Deletar turma
   */
  async deleteTurma(id) {
    return this.delete(`/turmas/${id}`);
  }

  /**
   * Obter turmas de um professor
   */
  async getTurmasProfessor(professorId) {
    return this.get(`/turmas/professor/${professorId}`);
  }

  // ============= DISCIPLINAS ENDPOINTS =============

  /**
   * Listar disciplinas
   */
  async getDisciplinas() {
    return this.get('/disciplinas');
  }

  /**
   * Obter disciplina por ID
   */
  async getDisciplina(id) {
    return this.get(`/disciplinas/${id}`);
  }

  /**
   * Criar nova disciplina
   */
  async createDisciplina(data) {
    return this.post('/disciplinas', data);
  }

  /**
   * Atualizar disciplina
   */
  async updateDisciplina(id, data) {
    return this.put(`/disciplinas/${id}`, data);
  }

  /**
   * Deletar disciplina
   */
  async deleteDisciplina(id) {
    return this.delete(`/disciplinas/${id}`);
  }

  // ============= CURSOS ENDPOINTS =============

  /**
   * Listar cursos
   */
  async getCursos() {
    return this.get('/cursos');
  }

  /**
   * Obter curso por ID
   */
  async getCurso(id) {
    return this.get(`/cursos/${id}`);
  }

  /**
   * Criar novo curso
   */
  async createCurso(data) {
    return this.post('/cursos', data);
  }

  /**
   * Atualizar curso
   */
  async updateCurso(id, data) {
    return this.put(`/cursos/${id}`, data);
  }

  /**
   * Deletar curso
   */
  async deleteCurso(id) {
    return this.delete(`/cursos/${id}`);
  }

  // ============= CLASSES ENDPOINTS =============

  /**
   * Listar classes (ensino secundário e médio)
   */
  async getClasses() {
    return this.get('/classes');
  }

  /**
   * Obter classe por ID
   */
  async getClass(id) {
    return this.get(`/classes/${id}`);
  }

  /**
   * Criar nova classe
   */
  async createClass(data) {
    return this.post('/classes', data);
  }

  /**
   * Atualizar classe
   */
  async updateClass(id, data) {
    return this.put(`/classes/${id}`, data);
  }

  /**
   * Deletar classe
   */
  async deleteClass(id) {
    return this.delete(`/classes/${id}`);
  }

  /**
   * Listar disciplinas de uma classe
   */
  async getClassDisciplinas(classeId) {
    return this.get(`/classes/${classeId}/disciplinas`);
  }

  // ============= NOTAS ENDPOINTS =============

  /**
   * Listar notas com filtros opcionais
   */
  async getNotas(estudanteId = null, disciplinaId = null) {
    let endpoint = '/notas';
    const params = new URLSearchParams();

    if (estudanteId) params.append('estudanteId', estudanteId);
    if (disciplinaId) params.append('disciplinaId', disciplinaId);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.get(endpoint);
  }

  /**
   * Obter nota por ID
   */
  async getNota(id) {
    return this.get(`/notas/${id}`);
  }

  /**
   * Criar nova nota
   */
  async createNota(data) {
    return this.post('/notas', data);
  }

  /**
   * Lançar ou atualizar nota (UPSERT)
   */
  async upsertNota(data) {
    return this.post('/notas/upsert', data);
  }

  /**
   * Atualizar nota
   */
  async updateNota(id, data) {
    return this.put(`/notas/${id}`, data);
  }

  /**
   * Deletar nota
   */
  async deleteNota(id) {
    return this.delete(`/notas/${id}`);
  }

  // ============= FALTAS ENDPOINTS =============

  /**
   * Listar faltas
   */
  async getFaltas(estudanteId = null, disciplinaId = null, turmaId = null) {
    console.log('%c[API-SERVICE] === getFaltas CHAMADO ===', 'color: #0ea5e9; font-weight: bold');
    console.log('[API-SERVICE] Parâmetros:', { estudanteId, disciplinaId, turmaId });
    
    // IMPORTANTE: Pelo menos um filtro deve ser fornecido
    if (!estudanteId && !turmaId && !disciplinaId) {
      console.error('[API-SERVICE] ✗ Erro: Nenhum filtro fornecido (estudanteId, turmaId ou disciplinaId obrigatório)');
      return [];
    }
    
    let endpoint = '/faltas';
    const params = new URLSearchParams();

    if (estudanteId) {
      console.log('[API-SERVICE] Adicionando estudanteId:', estudanteId);
      params.append('estudanteId', estudanteId);
    }
    if (disciplinaId) params.append('disciplinaId', disciplinaId);
    if (turmaId) {
      console.log('[API-SERVICE] Adicionando turmaId:', turmaId);
      params.append('turmaId', turmaId);
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    console.log('[API-SERVICE] Endpoint completo:', `${this.baseURL}${endpoint}`);
    
    try {
      const resultado = await this.get(endpoint);
      console.log('[API-SERVICE] ✓ Resposta recebida');
      console.log('[API-SERVICE] Tipo:', typeof resultado, '| É array?', Array.isArray(resultado));
      
      // Se a resposta vem como { data: [...] }, extrair o data
      if (resultado && resultado.data && Array.isArray(resultado.data)) {
        console.log('[API-SERVICE] Extraindo .data da resposta');
        console.log('[API-SERVICE] ✓ Total de faltas:', resultado.data.length);
        return resultado.data;
      }
      
      // Se for um array direto, retornar
      if (Array.isArray(resultado)) {
        console.log('[API-SERVICE] ✓ Resultado é array direto');
        console.log('[API-SERVICE] ✓ Total de faltas:', resultado.length);
        return resultado;
      }
      
      console.warn('[API-SERVICE] ⚠️ Formato inesperado de resposta:', resultado);
      return [];
    } catch (error) {
      console.error('%c[API-SERVICE] ✗ ERRO em getFaltas:', 'color: red; font-weight: bold', error.message);
      console.error('[API-SERVICE] Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Obter falta por ID
   */
  async getFalta(id) {
    return this.get(`/faltas/${id}`);
  }

  /**
   * Criar nova falta
   */
  async createFalta(data) {
    try {
      console.log('[API-SERVICE] Enviando falta para backend:', data);
      
      // Validação básica
      if (!data.estudante_id || !data.disciplina_id || !data.turma_id || !data.data_falta || !data.tipo_falta) {
        throw new Error('Falta incompleta - campos obrigatórios faltando: ' + 
          JSON.stringify({
            estudante_id: data.estudante_id,
            disciplina_id: data.disciplina_id,
            turma_id: data.turma_id,
            data_falta: data.data_falta,
            tipo_falta: data.tipo_falta
          }));
      }
      
      const resultado = await this.post('/faltas', data);
      console.log('[API-SERVICE] ✓ Falta criada com sucesso:', resultado);
      return resultado;
    } catch (error) {
      console.error('[API-SERVICE] ✗ Erro ao criar falta:', error);
      throw error;
    }
  }

  /**
   * Atualizar falta
   */
  async updateFalta(id, data) {
    return this.put(`/faltas/${id}`, data);
  }

  /**
   * Deletar falta
   */
  async deleteFalta(id) {
    return this.delete(`/faltas/${id}`);
  }

  /**
   * Obter estatísticas de faltas por turma e disciplina
   */
  async getFaltasEstatisticas(turmaId = null, disciplinaId = null) {
    try {
      console.log('%c[API-SERVICE] === INICIANDO CÁLCULO DE ESTATÍSTICAS ===', 'color: darkblue; font-weight: bold; font-size: 12px');
      console.log('[API-SERVICE] Parâmetros:', { turmaId, disciplinaId });
      
      // Buscar todas as faltas com filtros
      console.log('[API-SERVICE] Chamando getFaltas com turmaId:', turmaId);
      const faltas = await this.getFaltas(null, null, turmaId);
      
      console.log('[API-SERVICE] Faltas recebidas do backend:', faltas);
      console.log('[API-SERVICE] Quantidade de faltas:', faltas ? faltas.length : 0);
      
      if (!faltas || faltas.length === 0) {
        console.warn('[API-SERVICE] ⚠️ Nenhuma falta encontrada para a turma', turmaId);
        return {
          totalFaltas: 0,
          totalAlunos: 0,
          totalPresentes: 0,
          taxaMédia: 0,
          porDisciplina: {},
          porEstudante: {},
          estudantesComFaltas: []
        };
      }

      // Filtrar por disciplina se especificado
      let faltasFiltradas = faltas;
      if (disciplinaId) {
        console.log('[API-SERVICE] Filtrando por disciplinaId:', disciplinaId);
        faltasFiltradas = faltas.filter(f => f.disciplina_id === parseInt(disciplinaId));
        console.log('[API-SERVICE] Faltas após filtro de disciplina:', faltasFiltradas.length);
      }

      // Calcular estatísticas
      const porEstudante = {};
      const porDisciplina = {};
      const estudantesComFaltas = []; // Lista de estudantes com faltas
      
      console.log('[API-SERVICE] Processando', faltasFiltradas.length, 'faltas...');
      
      faltasFiltradas.forEach((falta, idx) => {
        console.log(`[API-SERVICE] Falta ${idx}:`, {
          estudante_id: falta.estudante_id,
          disciplina_id: falta.disciplina_id,
          tipo_falta: falta.tipo_falta,
          observacao: falta.observacao,
          estudante_nome: falta.estudante?.nome_estudante,
          disciplina_nome: falta.disciplina?.descricao_disc
        });

        // Adicionar à lista de estudantes com faltas
        estudantesComFaltas.push({
          id: falta.estudante_id,
          nome: falta.estudante?.nome_estudante || 'Desconhecido',
          disciplina: falta.disciplina?.descricao_disc || falta.disciplina?.sigla_disc || 'Desconhecida',
          tipo: falta.tipo_falta,
          data: falta.data_falta,
          observacao: falta.observacao || '(sem observação)'
        });

        // Por estudante
        if (!porEstudante[falta.estudante_id]) {
          porEstudante[falta.estudante_id] = {
            nome: falta.estudante?.nome_estudante || 'Desconhecido',
            id: falta.estudante_id,
            total: 0,
            justificadas: 0,
            injustificadas: 0
          };
        }
        porEstudante[falta.estudante_id].total++;
        if (falta.tipo_falta === 'JUSTIFICADA') {
          porEstudante[falta.estudante_id].justificadas++;
        } else {
          porEstudante[falta.estudante_id].injustificadas++;
        }

        // Por disciplina
        const disciplinaIdAtual = falta.disciplina_id;
        if (!porDisciplina[disciplinaIdAtual]) {
          porDisciplina[disciplinaIdAtual] = {
            nome: falta.disciplina?.descricao_disc || falta.disciplina?.sigla_disc || 'Desconhecida',
            id: disciplinaIdAtual,
            total: 0,
            justificadas: 0,
            injustificadas: 0
          };
        }
        porDisciplina[disciplinaIdAtual].total++;
        if (falta.tipo_falta === 'JUSTIFICADA') {
          porDisciplina[disciplinaIdAtual].justificadas++;
        } else {
          porDisciplina[disciplinaIdAtual].injustificadas++;
        }
      });

      // Contar estudantes únicos
      const estudantesUnicos = Object.keys(porEstudante).length;

      const resultado = {
        totalFaltas: faltasFiltradas.length,
        totalAlunos: estudantesUnicos,
        porDisciplina,
        porEstudante,
        estudantesComFaltas
      };

      console.log('%c[API-SERVICE] ✓ ESTATÍSTICAS CALCULADAS COM SUCESSO', 'color: green; font-weight: bold; font-size: 12px');
      console.log('[API-SERVICE] Resultado:', resultado);
      
      // IMPRIMIR LISTA FORMATADA DE ESTUDANTES COM FALTAS
      console.log('%c\n╔════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold');
      console.log('%c║           LISTA DE ESTUDANTES COM FALTAS REGISTADAS             ║', 'color: #3b82f6; font-weight: bold');
      console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold');
      
      if (estudantesComFaltas.length === 0) {
        console.log('%c✓ Nenhuma falta registada para este filtro', 'color: green; font-style: italic');
      } else {
        estudantesComFaltas.forEach((falta, idx) => {
          const numeroFalta = idx + 1;
          const marcador = falta.tipo === 'JUSTIFICADA' ? '📋' : '❌';
          console.log(`${marcador} [${numeroFalta}] ${falta.nome}`);
          console.log(`    📚 Disciplina: ${falta.disciplina}`);
          console.log(`    📅 Data: ${falta.data}`);
          console.log(`    🏷️  Tipo: ${falta.tipo === 'JUSTIFICADA' ? 'Justificada' : 'Injustificada'}`);
          console.log(`    💬 Observação: ${falta.observacao}`);
          console.log('    ─────────────────────────────────────────────');
        });
      }
      
      // TABELA DE RESUMO
      console.log('%c\n═══ RESUMO DAS ESTATÍSTICAS ═══', 'color: #10b981; font-weight: bold; font-size: 12px');
      console.table({
        'Total de Faltas': resultado.totalFaltas,
        'Total de Alunos': resultado.totalAlunos,
        'Disciplinas': Object.keys(resultado.porDisciplina).length
      });
      
      return resultado;
    } catch (error) {
      console.error('%c[API-SERVICE] ✗ ERRO AO BUSCAR ESTATÍSTICAS', 'color: red; font-weight: bold; font-size: 12px', error);
      return {
        totalFaltas: 0,
        totalAlunos: 0,
        porDisciplina: {},
        porEstudante: {},
        estudantesComFaltas: []
      };
    }
  }

  // ============= AVISOS ENDPOINTS =============

  /**
   * Listar avisos
   */
  async getAvisos(tipo = null) {
    let endpoint = '/avisos';
    if (tipo) {
      endpoint += `?tipo=${tipo}`;
    }
    return this.get(endpoint);
  }

  /**
   * Obter avisos de notas lançadas (somente ADMIN)
   */
  async getAvisosNotasLancadas() {
    return this.get('/notas/avisos/notas-lancadas');
  }

  /**
   * Obter aviso por ID
   */
  async getAviso(id) {
    return this.get(`/avisos/${id}`);
  }

  /**
   * Criar novo aviso
   */
  async createAviso(data) {
    return this.post('/avisos', data);
  }

  /**
   * Atualizar aviso
   */
  async updateAviso(id, data) {
    return this.put(`/avisos/${id}`, data);
  }

  /**
   * Deletar aviso
   */
  async deleteAviso(id) {
    return this.delete(`/avisos/${id}`);
  }

  // ============= ESTUDANTE LOGADO =============

  /**
   * Buscar estudante pelo email do usuário logado
   * Armazena o ID do estudante no localStorage
   */
  async getEstudanteLogado() {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        console.warn('[API-SERVICE] Email não encontrado no localStorage');
        return null;
      }

      // Buscar todos os estudantes e procurar o que corresponde ao email
      const estudantes = await this.getEstudantes();
      // Nota: Isso é um workaround. O ideal seria ter um endpoint específico
      console.log('[API-SERVICE] Estudantes carregados:', estudantes);
      
      // Se não conseguir, retorna null - o backend deveria ter um endpoint /me para estudante
      return null;
    } catch (error) {
      console.error('[API-SERVICE] Erro ao buscar estudante logado:', error);
      return null;
    }
  }

  /**
   * Armazenar ID do estudante logado
   */
  setEstudanteId(id) {
    localStorage.setItem('estudanteId', id);
  }

  /**
   * Obter ID do estudante armazenado
   */
  getEstudanteId() {
    return localStorage.getItem('estudanteId');
  }

  /**
   * Buscar turma com disciplinas do curso
   */
  async getTurmaComDisciplinas(turmaId) {
    try {
      const turma = await this.getTurma(turmaId);
      console.log('[API-SERVICE] Turma carregada:', turma);
      
      if (!turma || !turma.classe_id) {
        console.warn('[API-SERVICE] Turma sem curso associado');
        return turma;
      }

      // Buscar disciplinas do curso
      const disciplinas = await this.getDisciplinasClasse(turma.classe_id);
      console.log('[API-SERVICE] Disciplinas do curso:', disciplinas);

      // Combinar turma com disciplinas
      return {
        ...turma,
        disciplinas: disciplinas
      };
    } catch (error) {
      console.error('[API-SERVICE] Erro ao buscar turma com disciplinas:', error);
      throw error;
    }
  }

  /**
   * Buscar disciplinas de um curso
   */
  async getDisciplinasCurso(cursoId) {
    try {
      const endpoint = `/cursos/${cursoId}/disciplinas`;
      const result = await this.get(endpoint);
      return result || [];
    } catch (error) {
      console.error('[API-SERVICE] Erro ao buscar disciplinas do curso:', error);
      // Fallback: buscar todas as disciplinas
      return await this.getDisciplinas();
    }
  }

  async getDisciplinasClasse(classeId) {
    try {
      const endpoint = `/classes/${classeId}/disciplinas`;
      const result = await this.get(endpoint);
      return result || [];
    } catch (error) {
      console.error('[API-SERVICE] Erro ao buscar disciplinas da classe:', error);
      // Fallback: buscar todas as disciplinas
      return await this.getDisciplinas();
    }
  }

  // ============= NOTAS ENDPOINTS =============

  /**
   * Criar nova nota
   */
  async createNota(data) {
    return this.post('/notas', data);
  }

  /**
   * Listar notas com filtros
   */
  async getNotas(estudanteId = null, disciplinaId = null, turmaId = null, anoLetivo = null) {
    let endpoint = '/notas';
    const params = [];
    
    if (estudanteId) params.push(`estudanteId=${estudanteId}`);
    if (disciplinaId) params.push(`disciplinaId=${disciplinaId}`);
    if (turmaId) params.push(`turmaId=${turmaId}`);
    if (anoLetivo) params.push(`anoLetivo=${anoLetivo}`);
    
    if (params.length > 0) {
      endpoint += '?' + params.join('&');
    }
    
    return this.get(endpoint);
  }

  /**
   * Obter nota por ID
   */
  async getNota(id) {
    return this.get(`/notas/${id}`);
  }

  /**
   * Obter boletim de um estudante
   */
  async getBoletim(estudanteId, anoLetivo) {
    return this.get(`/notas/boletim/${estudanteId}?anoLetivo=${anoLetivo}`);
  }

  /**
   * Atualizar nota
   */
  async updateNota(id, data) {
    return this.put(`/notas/${id}`, data);
  }

  /**
   * Deletar nota
   */
  async deleteNota(id) {
    return this.delete(`/notas/${id}`);
  }

  // ============= VERIFICAR AUTENTICAÇÃO =============

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Obtém o role do usuário logado
   */
  getUserRole() {
    return localStorage.getItem('userRole');
  }

  /**
   * Obtém o ID do usuário logado
   */
  getUserId() {
    return localStorage.getItem('userId');
  }

  /**
   * Obtém o nome do usuário logado
   */
  getUserName() {
    return localStorage.getItem('userName');
  }
}

// Instância global do serviço
const api = new APIService();
