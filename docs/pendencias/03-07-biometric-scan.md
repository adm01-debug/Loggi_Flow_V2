# 3.7 — BiometricConsentModal scan falso

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/dashboard/BiometricConsentModal.tsx` 'Scan biométrico' era `setTimeout(2500)` falso.
- **Estado real**: NÃO VERIFICADO (na Fase 1); o sistema já tinha infra WebAuthn real (`src/hooks/auth/useWebAuthn.tsx`, tabela `webauthn_credentials`) que a UI não usava.
- **Camadas**: front (modal de dashboard).
- **Aceite**: autenticar de verdade (WebAuthn) ou sinalizar honestamente indisponibilidade; sem timer falso; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #231 (commit `24dbf919`).
- **Resolução**: o modal agora usa `useWebAuthn` (`authenticateWithPasskey`) em vez de simular. Detecta suporte do dispositivo via `isUserVerifyingPlatformAuthenticatorAvailable`; sem suporte, desabilita o botão e mostra aviso (sem falsa simulação). Rótulo extraído em função pura `scanButtonLabel` (0 warnings eslint).
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 2 arquivos com 0 erros/0 warnings novos; `npm run lint:budget` OK (104/105); CI completa verde; deploy de produção confirmado em `24dbf919` ("Deployment has completed").
