/* ===========================================
   Auth Helper - Gerenciar Autenticação
   =========================================== */

class AuthHelper {
  /**
   * Verifica se o usuário está autenticado
   * Se não estiver, redireciona para login
   */
  static checkAuth() {
    if (!api.isAuthenticated()) {
      window.location.href = '/index.html';
    }
  }

  /**
   * Verifica se o usuário tem um role específico
   * Se não tiver, redireciona para login
   */
  static checkRole(allowedRoles) {
    this.checkAuth();
    
    const userRole = api.getUserRole();
    
    // Debug log
    console.log('[AUTH-HELPER] Verificando acesso:', {
      userRole: userRole,
      allowedRoles: allowedRoles,
      hasAccess: allowedRoles.includes(userRole)
    });
    
    if (!allowedRoles.includes(userRole)) {
      console.error('[AUTH-HELPER] Acesso negado para role:', userRole, 'Roles permitidas:', allowedRoles);
      alert(`Acesso negado. Seu perfil é "${userRole}" mas esta página requer: ${allowedRoles.join(', ')}`);
      this.logout(); // Fazer logout automático
    }
  }

  /**
   * Fazer logout
   */
  static logout() {
    api.logout();
    window.location.href = '/index.html';
  }

  /**
   * Preencher informações do usuário na página
   */
  static fillUserInfo() {
    const userName = api.getUserName();
    const userRole = api.getUserRole();
    const translatedRole = this.translateRole(userRole);

    // Atualizar nome do usuário na sidebar ou header
    const userNameSelectors = ['[data-user-name]', '.header-user-name'];
    userNameSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = userName || 'Utilizador';
      });
    });

    // Atualizar role do usuário
    const userRoleSelectors = ['[data-user-role]', '.header-user-role'];
    userRoleSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = translatedRole || 'Utilizador';
      });
    });

    // Atualizar avatar com as iniciais do usuário
    const initials = (userName || 'Utilizador')
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    document.querySelectorAll('.header-user-avatar').forEach(el => {
      el.textContent = initials || 'U';
    });

    // Adicionar event listener ao botão de logout
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  }

  /**
   * Traduz roles para português
   */
  static translateRole(role) {
    const roleMap = {
      'ADMIN': 'Administrador',
      'PROFESSOR': 'Professor',
      'ESTUDANTE': 'Estudante',
      'ALUNO': 'Aluno',
      'SECRETARIA': 'Secretaria',
      'ENCARREGADO': 'Encarregado de Educação'
    };
    return roleMap[role] || role;
  }

  /**
   * Remover itens de menu baseado em role
   */
  static applyRoleBasedVisibility() {
    const userRole = api.getUserRole();
    
    // Remover itens com role restriction
    document.querySelectorAll('[data-role-only]').forEach(el => {
      const allowedRoles = el.getAttribute('data-role-only').split(',');
      if (!allowedRoles.includes(userRole)) {
        el.style.display = 'none';
      }
    });
  }
}

// Chamar quando documento carregar
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação (opcional - só para páginas protegidas)
  if (document.body.getAttribute('data-protected') === 'true') {
    AuthHelper.checkAuth();
  }

  // Preencher informações do usuário
  if (api.isAuthenticated()) {
    AuthHelper.fillUserInfo();
    AuthHelper.applyRoleBasedVisibility();
  }
});
