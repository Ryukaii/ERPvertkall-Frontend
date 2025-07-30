# Configuração de Variáveis de Ambiente

## Configuração da API

O frontend agora usa variáveis de ambiente para configurar a URL da API. Isso permite diferentes configurações para desenvolvimento, produção, etc.

### Variáveis Disponíveis

- `VITE_API_URL`: URL da API backend

### Configuração Local

1. Crie um arquivo `.env` na raiz do projeto:
```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

### Configuração para Produção

Para diferentes ambientes de produção, você pode configurar:

#### Heroku
```bash
heroku config:set VITE_API_URL=https://seu-backend.herokuapp.com/api
```

#### Vercel
Configure no dashboard do Vercel:
- `VITE_API_URL`: `https://seu-backend.vercel.app/api`

#### Outros provedores
Configure a variável `VITE_API_URL` com a URL correta da sua API.

### Exemplos de URLs

- **Desenvolvimento local**: `http://localhost:3000/api`
- **Heroku**: `https://seu-backend.herokuapp.com/api`
- **Vercel**: `https://seu-backend.vercel.app/api`
- **AWS**: `https://api.seudominio.com/api`

### Fallback

Se a variável `VITE_API_URL` não estiver definida, o sistema usará `http://localhost:3000/api` como padrão para desenvolvimento.

### Verificação

Para verificar se a configuração está correta, abra o console do navegador e procure pela mensagem:
```
Initializing API with URL: [sua-url-aqui]
``` 