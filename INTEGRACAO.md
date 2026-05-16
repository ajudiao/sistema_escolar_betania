# 🔗 Integração Frontend-Backend: Guia de Implementação

## ✅ O que foi criado/modificado

### 📂 Novos arquivos JS criados:

#### 1. **`public/js/api-service.js`** ⭐ PRINCIPAL
Serviço central que faz todas as requisições HTTP para o backend.
- ✅ Gerencia token JWT no localStorage
- ✅ Adiciona Bearer token automaticamente em requisições
- ✅ Faz logout automático se receber 401 (não autorizado)
- ✅ Todos os métodos da API (GET, POST, PUT, DELETE)
- ✅ Endpoints para: Usuários, Estudantes, Professores, Turmas, Disciplinas, Cursos, Notas, Faltas, Avisos

**Como usar:**
```javascript
// Login
await api.login('email', 'senha');

// Obter dados
const estudantes = await api.getEstudantes();
const avisos = await api.getAvisos();

// Criar dados
await api.createEstudante({ nome: 'João', email: 'joao@email.com' });

// Verificar autenticação
if (api.isAuthenticated()) {
  const role = api.getUserRole();
  const userId = api.getUserId();
}
```

#### 2. **`public/js/auth-helper.js`**
Gerencia autenticação nas páginas (proteção e redirecionamento).
- ✅ Verifica se está logado
- ✅ Verifica role/permissões
- ✅ Preenche dados do usuário na página
- ✅ Aplica visibilidade baseada em role
- ✅ Gerencia logout

**Como usar:**
```javascript
<!-- No HTML, adicione data-protected="true" na tag body -->
<body data-protected="true">

// Em cada página protegida, adicione no footer:
<script>
  AuthHelper.checkRole(['ADMIN']); // Protege página para ADMIN
  AuthHelper.fillUserInfo(); // Preenche dados do usuário
</script>
```

#### 3. **`public/js/data-loader.js`**
Funções auxiliares para carregar e exibir dados.
- ✅ Funções para carregar todos os recursos
- ✅ Mostrar/esconder loading
- ✅ Mostrar mensagens de erro/sucesso
- ✅ Funções para criar tabelas HTML com dados

**Como usar:**
```javascript
// Carregar dados
const estudantes = await DataLoader.loadEstudantes();

// Criar novo
await DataLoader.createEstudante({ nome, email });

// Construir tabela
DataLoader.buildEstudantesTable(estudantes, 'containerId');

// Mostrar mensagens
DataLoader.showLoading('Carregando...');
DataLoader.showSuccess('Sucesso!');
DataLoader.showError('Erro!');
```

---

## 🔄 Como integrar em cada página

### Passo 1: Adicionar scripts no HEAD
```html
<script src="../../js/api-service.js"></script>
<script src="../../js/auth-helper.js"></script>
<script src="../../js/data-loader.js"></script>
```

### Passo 2: Marcar body como protegida
```html
<body data-protected="true">
```

### Passo 3: Verificar autenticação no footer
```html
<script>
  // Verificar se está logado e qual é a role
  AuthHelper.checkRole(['ADMIN']); // Ou ['PROFESSOR'], ['ESTUDANTE']
  
  // Preencher dados do usuário no header
  AuthHelper.fillUserInfo();
</script>
```

### Passo 4: Carregar dados do backend
```html
<script>
  document.addEventListener('DOMContentLoaded', async function() {
    // Exemplo: Carregar alunos
    const alunos = await DataLoader.loadEstudantes();
    DataLoader.buildEstudantesTable(alunos, 'alunosContainer');
  });
</script>
```

---

## 🔐 Fluxo de Autenticação

```
1. Usuário acessa index.html (login)
   ↓
2. Submete form com email + senha
   ↓
3. api.login() faz POST /api/v1/usuarios/login
   ↓
4. Backend valida e retorna token JWT
   ↓
5. Token armazenado em localStorage
   ↓
6. Role do usuário armazenada em localStorage
   ↓
7. Redireciona para dashboard baseado em role:
   - ADMIN → public/views/admin/dashboard.html
   - PROFESSOR → public/views/professor/dashboard.html
   - ESTUDANTE → public/views/aluno/dashboard.html
   ↓
8. Páginas verificam autenticação com AuthHelper.checkRole()
   ↓
9. Todas requisições incluem token automaticamente
   ↓
10. Se token expirar (401), faz logout e redireciona para login
```

---

## 📋 Exemplo Completo: Página de Alunos

```html
<!DOCTYPE html>
<html>
<head>
  <title>Alunos - Admin</title>
  <link href="...bootstrap...">
</head>
<body data-protected="true">
  <h1>Alunos</h1>
  <div id="alunosContainer">Carregando...</div>
  
  <script src="../../js/api-service.js"></script>
  <script src="../../js/auth-helper.js"></script>
  <script src="../../js/data-loader.js"></script>
  
  <script>
    // Proteger página para ADMIN apenas
    AuthHelper.checkRole(['ADMIN']);
    
    // Carregar alunos quando página carrega
    document.addEventListener('DOMContentLoaded', async function() {
      const alunos = await DataLoader.loadEstudantes();
      DataLoader.buildEstudantesTable(alunos, 'alunosContainer');
    });
  </script>
</body>
</html>
```

---

## 🔗 Endpoints do Backend

**Base URL:** `http://localhost:3000/api/v1`

### Autenticação
- `POST /usuarios/login` - Email + Senha

### Recursos (todos precisam de JWT)
- `GET /estudantes` - Listar estudantes
- `POST /estudantes` - Criar estudante
- `GET /estudantes/:id` - Obter estudante
- `PUT /estudantes/:id` - Atualizar estudante
- `DELETE /estudantes/:id` - Deletar estudante

- `GET /professores` - Listar professores
- `POST /professores` - Criar professor
- `GET /turmas` - Listar turmas
- `GET /disciplinas` - Listar disciplinas
- `GET /avisos` - Listar avisos
- `GET /notas` - Listar notas
- `GET /faltas` - Listar faltas

---

## 🎯 Páginas Já Atualizadas

✅ **Admin**
- `dashboard.html` - Carrega estatísticas da API

### Páginas para Atualizar (Template Pronto)

Todas as páginas seguem o mesmo padrão. Use como modelo:

```html
<body data-protected="true">
  <!-- Seu conteúdo HTML -->
  
  <script src="../../js/api-service.js"></script>
  <script src="../../js/auth-helper.js"></script>
  <script src="../../js/data-loader.js"></script>
  
  <script>
    AuthHelper.checkRole(['ROLE_AQUI']);
    
    document.addEventListener('DOMContentLoaded', async function() {
      // Carregar dados
      // Renderizar
      // Adicionar listeners aos botões
    });
  </script>
</body>
```

---

## 🚀 Testar a Integração

### 1. Iniciar Backend
```bash
cd school-management
npm install
npm run start:dev
```

### 2. Fazer requisição ao backend
```bash
curl -X POST http://localhost:3000/api/v1/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","senha":"admin123"}'
```

### 3. Abrir Frontend no navegador
```
Abrir: file:///path/to/sistema-escolar-v2/index.html
```

### 4. Fazer login
Usar credenciais do backend para teste

### 5. Verificar Console
- F12 → Console
- Ver se requisições estão sendo feitas
- Verificar se token está em localStorage

---

## 🐛 Troubleshooting

### Erro: "Sessão expirada"
- Token expirou
- Fazer login novamente

### Erro: "Acesso negado"
- Role do usuário não tem permissão
- Verificar `AuthHelper.checkRole()`

### Erro: "Falha ao carregar"
- Backend não está rodando
- Verificar se `http://localhost:3000` está acessível
- Ver Network tab do F12

### Dados não carregam
- Verificar se token está em localStorage (F12 → Application)
- Verificar se API está retornando dados
- Ver console do backend para erros

---

## 📝 Modificações Principais no index.html

O arquivo de login foi totalmente reescrito para:
- ❌ Remover dados fictícios
- ✅ Chamar API real com `api.login()`
- ✅ Guardar token e role do usuário
- ✅ Redirecionar para dashboard correto
- ✅ Verificar se já está logado e redirecionar automaticamente

---

## 🎓 Boas Práticas

1. **Sempre proteja páginas:**
   ```javascript
   AuthHelper.checkRole(['ADMIN', 'SECRETARIA']);
   ```

2. **Use dados da API, não fictícios:**
   ```javascript
   // ❌ Ruim
   const alunos = DadosFicticios.alunos;
   
   // ✅ Bom
   const alunos = await api.getEstudantes();
   ```

3. **Sempre adicione try-catch:**
   ```javascript
   try {
     const dados = await api.getData();
   } catch (error) {
     DataLoader.showError(error.message);
   }
   ```

4. **Reutilize componentes:**
   ```javascript
   // DataLoader já tem funções prontas
   DataLoader.buildEstudantesTable(alunos, 'containerId');
   ```

---

## ✨ Próximos Passos

1. Atualizar todas as páginas com scripts da API
2. Remover referências a `DadosFicticios`
3. Adicionar formulários para CRUD (criar, editar, deletar)
4. Implementar paginação
5. Adicionar validações no frontend
6. Implementar cache de dados
7. Adicionar loading spinners em operações
8. Implementar notificações de sucesso/erro

---

## 📞 Suporte

Se algo não funcionar:
1. Verificar F12 → Console para erros
2. Verificar F12 → Network para requisições
3. Verificar Backend logs
4. Verificar localStorage (F12 → Application)

**Arquivo de referência:** Este README
