# Contribuindo para o Loggi-Flow

## Como Contribuir

### Pull Requests

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commits seguindo Conventional Commits:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` documentação
   - `test:` testes
   - `chore:` manutenção
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

### Padrões de Código

- TypeScript strict
- ESLint + Prettier
- Testes para novos hooks/componentes
- Documentação de componentes

### Estrutura de Commits

```
feat(coletas): adicionar filtro por data
fix(envios): corrigir paginação
docs: atualizar README
test(usePagination): adicionar testes
```

## Desenvolvimento Local

```bash
npm install
npm run dev
npm run test
npm run lint
```
