// ============= GERENCIAMENTO DE ALUNOS =============

// Garantir que API Service está disponível
if (typeof api === 'undefined') {
  console.error('[ALUNOS] APIService não está disponível!');
  const api = new APIService();
}

let cursosData = [];
let turmasData = [];
let alunosData = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('[ALUNOS] Script carregado');

  // Carregar alunos e renderizar tabela
  async function loadAlunos() {
    try {
      console.log('[ALUNOS] Carregando alunos...');
      alunosData = await api.getEstudantes();
      console.log('[ALUNOS] Alunos carregados:', alunosData);
      renderAlunosTable(alunosData);
    } catch (error) {
      console.error('[ALUNOS] Erro ao carregar alunos:', error);
      DataLoader.showError('Erro ao carregar alunos: ' + error.message);
    }
  }

  // Renderizar tabela de alunos
  function renderAlunosTable(alunos) {
    const tbody = document.getElementById('alunosTableBody');
    if (!tbody) {
      console.warn('[ALUNOS] tbody não encontrado');
      return;
    }
    
    tbody.innerHTML = '';

    if (!alunos || alunos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum aluno encontrado</td></tr>';
      console.log('[ALUNOS] Nenhum aluno na lista');
      return;
    }

    console.log(`[ALUNOS] Renderizando ${alunos.length} alunos`);
    alunos.forEach(aluno => {
      try {
        const row = document.createElement('tr');
        const classe = aluno.turma?.classe?.descricao_classe || '-';
        row.innerHTML = `
          <td>${aluno.nome_estudante || '-'}</td>
          <td>${classe}</td>
          <td>${aluno.turma?.sigla_turma || '-'}</td>
          <td>${aluno.telefone_estudante || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline-info me-1 btn-view" data-id="${aluno.id_estudante}" data-bs-toggle="modal" data-bs-target="#alunoDetailsModal">Ver</button>
            <button class="btn btn-sm btn-outline-warning me-1 btn-edit" data-id="${aluno.id_estudante}" data-name="${aluno.nome_estudante}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${aluno.id_estudante}" data-name="${aluno.nome_estudante}">Deletar</button>
          </td>
        `;
        tbody.appendChild(row);
      } catch (error) {
        console.error('[ALUNOS] Erro ao renderizar linha:', error);
      }
    });
  }

  // Carregar cursos (retorna Promise)
  function loadCursos() {
    return api.getClasses()
      .then(data => {
        cursosData = data;
        const select = document.getElementById('alunoCurso');
        if (!select) return;
        select.innerHTML = '<option value="">Selecionar Classe (Opcional)</option>';
        cursosData.forEach(classe => {
          const option = document.createElement('option');
          option.value = classe.id_classe;
          option.textContent = classe.descricao_classe || 'Classe sem nome';
          select.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Erro ao carregar cursos:', error);
      });
  }

  // Carregar turmas (retorna Promise)
  function loadTurmas() {
    return api.getTurmas()
      .then(data => {
        turmasData = data;
        console.log('Turmas carregadas:', turmasData);
        renderAllTurmas();
      })
      .catch(error => {
        console.error('Erro ao carregar turmas:', error);
      });
  }

  // Renderizar todas as turmas inicialmente
  function renderAllTurmas() {
    const turmaSelect = document.getElementById('alunoTurma');
    if (!turmaSelect) return;
    
    turmaSelect.innerHTML = '<option value="">Selecionar Turma</option>';
    turmasData.forEach(turma => {
      const option = document.createElement('option');
      option.value = turma.id_turma;
      option.textContent = `${turma.sigla_turma} (${turma.classe_turma}) - ${turma.turno_turma}`;
      turmaSelect.appendChild(option);
    });
  }

  // Atualizar turmas quando classe é selecionada
  const cursoSelect = document.getElementById('alunoCurso');
  // if (cursoSelect) {
  //   cursoSelect.addEventListener('change', function() {
  //     const classeId = parseInt(this.value) || 0;
  //     const turmaSelect = document.getElementById('alunoTurma');
      
  //     if (classeId) {
  //       // Filtrar turmas da classe selecionada
  //       const turmasClasse = turmasData.filter(t => t.classe_id === classeId);
  //       turmaSelect.innerHTML = '<option value="">Selecionar Turma</option>';
  //       turmasClasse.forEach(turma => {
  //         const option = document.createElement('option');
  //         option.value = turma.id_turma;
  //         option.textContent = `${turma.sigla_turma} (${turma.classe_turma}) - ${turma.turno_turma}`;
  //         turmaSelect.appendChild(option);
  //       });
  //     } else {
  //       renderAllTurmas();
  //     }
  //   }
  // );
  // }

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

  // Toggle escola anterior
  const alunoTransferido = document.getElementById('alunoTransferido');
  if (alunoTransferido) {
    alunoTransferido.addEventListener('change', function () {
      const escolaDiv = document.getElementById('escolaAnterior');
      if (escolaDiv) {
        escolaDiv.style.display = this.checked ? 'block' : 'none';
      }
    });
  }

  // Quando o modal abre, apenas garantir que senha está oculta se for edição
  const alunoModalEl = document.getElementById('alunoModal');
  if (alunoModalEl) {
    alunoModalEl.addEventListener('show.bs.modal', function() {
      const alunoId = document.getElementById('alunoId').value;
      const action = document.getElementById('alunoAction').value;
      
      console.log('[ALUNOS] Modal show.bs.modal event - alunoId:', alunoId, 'action:', action);
      
      // Se for novo aluno, mostrar seção de senha/email
      if (!alunoId || action === 'add') {
        const senhaEmail = document.getElementById('alunoEmail')?.parentElement;
        const senhaPwd = document.getElementById('alunoSenha')?.parentElement;
        if (senhaEmail) senhaEmail.style.display = 'block';
        if (senhaPwd) senhaPwd.style.display = 'block';
        console.log('[ALUNOS] Mostrando campos de email/senha');
      }
    });
  }

  // Iniciar carregamento ao abrir a página
  loadAlunos();
  loadCursos();
  loadTurmas();

  // Fechar o modal
  if (alunoModalEl) {
    alunoModalEl.addEventListener('hidden.bs.modal', function () {
      console.log('[ALUNOS] Fechando modal');
      document.getElementById('alunoModalTitle').textContent = 'Novo Aluno';
      document.getElementById('alunoId').value = '';
      document.getElementById('alunoAction').value = 'add';
      
      // Limpar todos os campos
      document.getElementById('formAluno').reset();
      document.getElementById('alunoNome').value = '';
      document.getElementById('alunoDataNascimento').value = '';
      document.getElementById('alunoIdentidade').value = '';
      document.getElementById('alunoTelefone').value = '';
      document.getElementById('alunoNaturalidade').value = '';
      document.getElementById('encarregadoNome').value = '';
      document.getElementById('encarregadoTelefone').value = '';
      document.getElementById('alunoRua').value = '';
      document.getElementById('alunoBairro').value = '';
      document.getElementById('alunoCidade').value = '';
      document.getElementById('alunoProvincia').value = '';
      document.getElementById('alunoCurso').value = '';
      document.getElementById('alunoTurma').value = '';
      document.getElementById('alunoTransferido').checked = false;
      document.getElementById('escolaAnterior').style.display = 'none';
      
      const senhaSection = document.getElementById('alunoSenha')?.parentElement?.parentElement;
      if (senhaSection) senhaSection.style.display = 'block';
    });
  }

  // Event delegation para botões da tabela
  const tbody = document.getElementById('alunosTableBody');
  if (tbody) {
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const id = btn.getAttribute('data-id');
      if (!id) return;
      
      if (btn.classList.contains('btn-view')) {
        // Ver detalhes - buscar dados completos do servidor
        console.log('[ALUNOS] Carregando detalhes do aluno ID:', id);
        
        // Adicionar spinner ao botão
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        api.getEstudante(id)
          .then(alunoData => {
            // Restaurar botão
            btn.disabled = false;
            btn.innerHTML = originalText;
            
            const classe = alunoData.turma?.classe?.descricao_classe || '-';
            const turma = alunoData.turma?.sigla_turma || '-';
            const anoLetivo = alunoData.turma?.ano_lectivo_turma || '-';
            
            // Preencher todos os campos do modal
            document.getElementById('detailNome').textContent = alunoData.nome_estudante || '-';
            document.getElementById('detailStatus').textContent = alunoData.status || '-';
            
            // Data de nascimento formatada
            const dataNasc = alunoData.data_nascimento ? new Date(alunoData.data_nascimento).toLocaleDateString('pt-AO') : '-';
            document.getElementById('detailDataNascimento').textContent = dataNasc;
            
            document.getElementById('detailNaturalidade').textContent = alunoData.naturalidade_estudante || '-';
            document.getElementById('detailIdentidade').textContent = alunoData.numero_bi_estudante || '-';
            document.getElementById('detailTelefone').textContent = alunoData.telefone_estudante || '-';
            document.getElementById('detailEmail').textContent = alunoData.usuario?.email || '-';
            document.getElementById('detailEndereco').textContent = alunoData.endereco_fisico_estudante || '-';
            document.getElementById('detailEncarregado').textContent = alunoData.encarregado_estudante || '-';
            document.getElementById('detailCurso').textContent = classe;
            document.getElementById('detailTurma').textContent = turma;
            document.getElementById('detailAnoLetivo').textContent = anoLetivo;
            
            console.log('[ALUNOS] Detalhes carregados:', alunoData);
          })
          .catch(error => {
            // Restaurar botão em caso de erro
            btn.disabled = false;
            btn.innerHTML = originalText;
            DataLoader.showError('Erro ao carregar detalhes: ' + error.message);
            console.error('[ALUNOS] Erro ao carregar detalhes:', error);
          });
      } else if (btn.classList.contains('btn-edit')) {
        // Editar - carregar dados do aluno
        console.log('[ALUNOS] Carregando dados para edição, ID:', id);
        
        // Adicionar spinner ao botão
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        // Primeiro carregar cursos e turmas, depois dados do aluno
        Promise.all([loadCursos(), loadTurmas()])
          .then(() => api.getEstudante(id))
          .then(alunoData => {
            // Restaurar botão
            btn.disabled = false;
            btn.innerHTML = originalText;
            
            console.log('[ALUNOS] Preparando modal com dados:', alunoData);
            
            // Preparar dados antes de abrir o modal
            document.getElementById('alunoModalTitle').textContent = 'Editar Aluno';
            document.getElementById('alunoId').value = id;
            document.getElementById('alunoAction').value = 'edit';
            
            // Preencher formulário com dados do aluno
            console.log('[ALUNOS] Preenchendo nome:', alunoData.nome_estudante);
            document.getElementById('alunoNome').value = alunoData.nome_estudante || '';
            
            const dataNasc = alunoData.data_nascimento ? alunoData.data_nascimento.split('T')[0] : '';
            console.log('[ALUNOS] Data nascimento:', dataNasc);
            document.getElementById('alunoDataNascimento').value = dataNasc;
            
            document.getElementById('alunoIdentidade').value = alunoData.numero_bi_estudante || '';
            document.getElementById('alunoTelefone').value = alunoData.telefone_estudante || '';
            document.getElementById('alunoNaturalidade').value = alunoData.naturalidade_estudante || '';
            document.getElementById('encarregadoNome').value = alunoData.encarregado_estudante || '';
            
            // Preencher endereço (dividindo por vírgula se estiver concatenado)
            if (alunoData.endereco_fisico_estudante) {
              const enderecoParts = alunoData.endereco_fisico_estudante.split(',').map(p => p.trim());
              document.getElementById('alunoRua').value = enderecoParts[0] || '';
              document.getElementById('alunoBairro').value = enderecoParts[1] || '';
              document.getElementById('alunoCidade').value = enderecoParts[2] || '';
            }
            
            // Definir curso e turma
            if (alunoData.turma?.classe?.id_classe) {
              console.log('[ALUNOS] Setando classe:', alunoData.turma.classe.id_classe);
              document.getElementById('alunoCurso').value = alunoData.turma.classe.id_classe;
            }
            if (alunoData.turma?.id_turma) {
              console.log('[ALUNOS] Setando turma:', alunoData.turma.id_turma);
              document.getElementById('alunoTurma').value = alunoData.turma.id_turma;
            }
            
            // Ocultar campo de email e senha em modo edição
            const senhaDiv = document.getElementById('alunoEmail')?.parentElement;
            if (senhaDiv) {
              console.log('[ALUNOS] Ocultando seção de segurança');
              senhaDiv.style.display = 'none';
              const senhaPwdDiv = senhaDiv.nextElementSibling;
              if (senhaPwdDiv) senhaPwdDiv.style.display = 'none';
            }
            
            console.log('[ALUNOS] Todos os campos preenchidos, abrindo modal...');
            
            // Abrir modal imediatamente após preenchimento
            const modal = new bootstrap.Modal(document.getElementById('alunoModal'));
            modal.show();
            console.log('[ALUNOS] Modal aberto');
            console.log('[ALUNOS] Dados carregados para edição:', alunoData);
          })
          .catch(error => {
            // Restaurar botão em caso de erro
            btn.disabled = false;
            btn.innerHTML = originalText;
            DataLoader.showError('Erro ao carregar aluno: ' + error.message);
            console.error('[ALUNOS] Erro ao carregar aluno:', error);
          });
      } else if (btn.classList.contains('btn-delete')) {
        // Deletar com confirmação
        const nome = btn.getAttribute('data-name');
        if (confirm(`Deseja realmente deletar o aluno ${nome}?`)) {
          console.log('[ALUNOS] Deletando aluno ID:', id);
          
          // Adicionar spinner ao botão
          const originalText = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
          
          api.deleteEstudante(id)
            .then(() => {
              // Restaurar botão
              btn.disabled = false;
              btn.innerHTML = originalText;
              DataLoader.showSuccess('Aluno deletado com sucesso!');
              loadAlunos();
            })
            .catch(error => {
              // Restaurar botão em caso de erro
              btn.disabled = false;
              btn.innerHTML = originalText;
              DataLoader.showError('Erro ao deletar: ' + error.message);
            });
        }
      }
    });
  }

  // Submit do formulário
  const formAluno = document.getElementById('formAluno');
  if (formAluno) {
    formAluno.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = formAluno.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

      const alunoId = document.getElementById('alunoId').value;
      const action = document.getElementById('alunoAction').value;
      
      console.log('[ALUNOS] Enviando formulário - Action:', action, 'ID:', alunoId);

      // Validar email e senha APENAS para novo aluno
      if (action === 'add' || !alunoId) {
        const email = document.getElementById('alunoEmail').value;
        const senha = document.getElementById('alunoSenha').value;
        
        if (!email || !email.trim()) {
          DataLoader.showError('Email é obrigatório para novo aluno!');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Guardar';
          return;
        }
        if (!senha || !senha.trim()) {
          DataLoader.showError('Senha é obrigatória para novo aluno!');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Guardar';
          return;
        }
      }

      const tipoDocumento = document.querySelector('input[name="tipoDocumento"]:checked').value;
      const turmaValue = document.getElementById('alunoTurma').value;
      
      // Validar data de nascimento antes de enviar
      const dataNascimentoInput = document.getElementById('alunoDataNascimento').value;
      const dataNascimentoError = Utils.validarDataNascimento(dataNascimentoInput, 4, 100);
      if (dataNascimentoError) {
        DataLoader.showError(dataNascimentoError);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
        return;
      }

      // Converter data para ISO-8601 DateTime
      const dataNascimento = dataNascimentoInput ? new Date(dataNascimentoInput + 'T00:00:00Z').toISOString() : null;
      
      const data = {
        nome_estudante: document.getElementById('alunoNome').value,
        data_nascimento: dataNascimento,
        numero_bi_estudante: document.getElementById('alunoIdentidade').value,
        telefone_estudante: document.getElementById('alunoTelefone').value,
        endereco_fisico_estudante: [
          document.getElementById('alunoRua').value,
          document.getElementById('alunoBairro').value,
          document.getElementById('alunoCidade').value
        ].filter(x => x).join(', ') || 'Não especificado',
        naturalidade_estudante: document.getElementById('alunoNaturalidade').value,
        encarregado_estudante: document.getElementById('encarregadoNome').value,
        turma_id: turmaValue ? parseInt(turmaValue) : null,
        status: 'ATIVO'
      };

      try {
        DataLoader.showLoading(action === 'edit' ? 'Atualizando aluno...' : 'Criando aluno...');

        if (action === 'edit' && alunoId) {
          // Edição - enviar apenas dados editáveis
          console.log('[ALUNOS] Atualizando aluno ID:', alunoId);
          await api.updateEstudante(alunoId, data);
          showFlashMessage('Aluno atualizado com sucesso!');
        } else {
          // Criação - incluir email e senha
          const newData = {
            ...data,
            email: document.getElementById('alunoEmail').value,
            password: document.getElementById('alunoSenha').value,
            user_name: document.getElementById('alunoEmail').value
          };
          console.log('[ALUNOS] Criando novo aluno com email:', newData.email);
          await api.createEstudante(newData);
          showFlashMessage('Aluno criado com sucesso!');
        }

        DataLoader.hideLoading();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
        bootstrap.Modal.getInstance(document.getElementById('alunoModal')).hide();
        
        // Recarregar lista de alunos
        loadAlunos();
      } catch (error) {
        DataLoader.hideLoading();
        DataLoader.showError('Erro: ' + (error.message || 'Erro desconhecido'));
        console.error('[ALUNOS] Erro API:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar';
      }
    });
  }

  //Filter functionality
  const btnFilter = document.getElementById('btnFilterAluno');
  if (btnFilter) {
    btnFilter.addEventListener('click', function () {
      const searchValue = document.getElementById('filterAlunoSearch').value.toLowerCase();
      const turmaValue = document.getElementById('filterAlunoTurma').value;

      const rows = document.querySelectorAll('#alunosTableBody tr');
      rows.forEach(row => {
        const nome = row.cells[0].textContent.toLowerCase();
        const processo = row.cells[1].textContent.toLowerCase();
        const turma = row.cells[2].textContent;

        const matchesSearch = !searchValue || nome.includes(searchValue) || processo.includes(searchValue);
        const matchesTurma = !turmaValue || turma === turmaValue;

        row.style.display = matchesSearch && matchesTurma ? '' : 'none';
      });
    });
  }
});
