# 🍕 Sistema de Gerenciamento de Pizzaria

Sistema completo de gerenciamento para pizzarias desenvolvido com Next.js 16, React 19 e TypeScript. Aplicação web moderna que permite gerenciar pedidos, produtos, categorias, tamanhos e acompanhar vendas em tempo real.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Executar](#como-executar)
- [Principais Features](#principais-features)
- [Arquitetura](#arquitetura)

## 🎯 Sobre o Projeto

Sistema de gestão completo para pizzarias que oferece uma interface intuitiva e moderna para gerenciar todos os aspectos do negócio. Desenvolvido com foco em performance, usabilidade e escalabilidade, utilizando as mais recentes tecnologias do ecossistema React.

O projeto foi desenvolvido com arquitetura moderna, utilizando Server Components e Client Components do Next.js 16, garantindo otimização de performance e melhor experiência do usuário.

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Sistema de login com autenticação via JWT
- Middleware de proteção de rotas
- Validação de token em tempo real
- Cookies seguros com configuração HTTP-only

### 📦 Gerenciamento de Pedidos
- Visualização de pedidos em tempo real
- Detalhamento completo de pedidos
- Finalização individual ou em lote de pedidos
- Seleção múltipla de pedidos
- Atualização automática da lista de pedidos
- Interface responsiva e intuitiva

### 🍕 Gerenciamento de Produtos
- Cadastro e edição de produtos
- Upload de imagens via Cloudinary
- Suporte a produtos com múltiplos tamanhos
- Preços personalizados por tamanho
- Sistema de categorias para organização
- Produtos "meia a meia" (dois sabores)

### 📁 Gerenciamento de Categorias
- Criação e edição de categorias
- Configuração de tamanhos por categoria
- Preços diferenciados por tamanho
- Hierarquia de produtos organizada

### 📏 Gerenciamento de Tamanhos
- Sistema flexível de tamanhos (P, M, G, Família)
- Ordenação personalizada
- Preços configuráveis por tamanho

### 📊 Relatórios de Vendas
- Dashboard de vendas com filtros avançados
- Filtros por período (dia, semana, mês, personalizado)
- Visualização de total de vendas
- Análise de performance do negócio

### 🎨 Interface Moderna
- Design responsivo e moderno
- Componentes reutilizáveis
- Feedback visual com toasts (Sonner)
- Ícones com Lucide React
- Estilização com SCSS Modules

## 🛠 Tecnologias Utilizadas

### Core
- **[Next.js 16](https://nextjs.org/)** - Framework React com Server Components
- **[React 19](https://react.dev/)** - Biblioteca JavaScript para interfaces
- **[TypeScript 5](https://www.typescriptlang.org/)** - Superset JavaScript com tipagem estática

### Estilização
- **[SASS/SCSS](https://sass-lang.com/)** - Pré-processador CSS
- **CSS Modules** - Estilos com escopo local

### HTTP e APIs
- **[Axios](https://axios-http.com/)** - Cliente HTTP para requisições
- **Server Actions** - Ações do servidor do Next.js

### Autenticação
- **[cookies-next](https://www.npmjs.com/package/cookies-next)** - Gerenciamento de cookies

### UI/UX
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones moderna
- **[Sonner](https://sonner.emilkowal.ski/)** - Sistema de notificações toast

### Upload de Imagens
- **[Cloudinary](https://cloudinary.com/)** - Serviço de gerenciamento de imagens

### Desenvolvimento
- **[ESLint](https://eslint.org/)** - Linter para qualidade de código
- **[React Compiler](https://react.dev/learn/react-compiler)** - Compilador do React para otimização

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── dashboard/          # Área administrativa
│   │   │   ├── category/       # Gerenciamento de categorias
│   │   │   ├── order/          # Criação de pedidos
│   │   │   ├── product/        # Cadastro de produtos
│   │   │   ├── products/       # Listagem de produtos
│   │   │   ├── sales/          # Relatórios de vendas
│   │   │   ├── size/           # Gerenciamento de tamanhos
│   │   │   └── components/     # Componentes compartilhados
│   │   ├── signup/             # Página de cadastro
│   │   ├── layout.tsx          # Layout principal
│   │   └── page.tsx            # Página de login
│   ├── lib/                    # Utilitários e tipos
│   │   ├── cookieClient.ts     # Gerenciamento de cookies (cliente)
│   │   ├── cookieServer.ts     # Gerenciamento de cookies (servidor)
│   │   ├── helper.ts           # Funções auxiliares
│   │   ├── order.type.ts       # Tipos de pedidos
│   │   └── types.ts            # Tipos TypeScript
│   ├── providers/              # Context Providers
│   │   └── order.tsx           # Provider de pedidos
│   ├── services/               # Serviços externos
│   │   └── api.ts              # Configuração do Axios
│   └── middleware.ts           # Middleware de autenticação
├── public/                     # Arquivos estáticos
├── next.config.ts              # Configuração do Next.js
├── tsconfig.json               # Configuração do TypeScript
└── package.json                # Dependências do projeto
```


## ⚙️ Configuração

1. Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC__API=http://localhost:3333
```

2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC__API`: URL da API backend

3. Configure o Cloudinary (se necessário):
   - Crie uma conta no [Cloudinary](https://cloudinary.com/)
   - Configure as credenciais conforme necessário

## ▶️ Como Executar

### Desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build de Produção
```bash
npm run build
npm start
# ou
yarn build
yarn start
```

### Linting
```bash
npm run lint
# ou
yarn lint
```

## 🎯 Principais Features

### 1. Sistema de Autenticação Robusto
- Middleware que valida tokens em todas as rotas protegidas
- Redirecionamento automático para login quando não autenticado
- Cookies seguros com expiração configurável

### 2. Gerenciamento Inteligente de Pedidos
- Interface que permite selecionar múltiplos pedidos
- Finalização em lote para otimizar o trabalho
- Atualização em tempo real sem necessidade de recarregar a página
- Modal detalhado com informações completas do pedido

### 3. Sistema Flexível de Produtos
- Suporte a produtos com ou sem tamanhos
- Preços personalizados por tamanho
- Produtos "meia a meia" (dois sabores diferentes)
- Upload e gerenciamento de imagens via Cloudinary

### 4. Dashboard de Vendas Avançado
- Filtros por período (dia, semana, mês, intervalo personalizado)
- Visualização clara de totais e estatísticas
- Interface intuitiva para análise de vendas

### 5. Arquitetura Moderna
- Server Components para melhor performance
- Client Components apenas onde necessário
- Code splitting automático
- Otimização de imagens com Next.js Image

## 🏗 Arquitetura

### Server Components vs Client Components
O projeto utiliza uma arquitetura híbrida:
- **Server Components**: Para páginas que buscam dados do servidor
- **Client Components**: Para interatividade e estado local

### Gerenciamento de Estado
- **Context API**: Para estado global de pedidos
- **Server State**: Dados buscados diretamente no servidor
- **Local State**: Estado local com React Hooks

### Autenticação
- Tokens JWT armazenados em cookies
- Middleware valida tokens em cada requisição
- Proteção de rotas no lado do servidor

### API Integration
- Cliente Axios configurado centralmente
- Interceptadores para adicionar tokens automaticamente
- Tratamento de erros padronizado

## 📝 Notas de Desenvolvimento

- O projeto utiliza **React Compiler** para otimizações automáticas
- Imagens são otimizadas automaticamente pelo Next.js
- TypeScript garante type-safety em todo o código
- SCSS Modules evitam conflitos de estilos

## 👨‍💻 Autor

**Francisco**

---

Desenvolvido com ❤️ usando Next.js e React para a pizzaria da minha Mae

