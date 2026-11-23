# Auditoria de qualidade do Loggi Flow V2 — resumo para o dono

**Feita em:** 22-23 de novembro de 2026, sobre a `main` em `d37ba30`
**O que foi mexido no sistema:** nada. Auditoria somente de leitura — nenhum código, migration, banco ou
serviço foi alterado.
**O que saiu dela:** 65 problemas identificados com evidência e um plano de 300 etapas para outro agente
executar, uma por vez.

---

## Estado geral, em três frases

O sistema está mais sólido do que a documentação sugere: o typecheck passa sem erro, não há vulnerabilidade
em dependência, as chaves de servidor não estão expostas no repositório, os webhooks das transportadoras
verificam assinatura, e existe um conjunto de ferramentas internas bem feitas (tempo limite em chamada a
terceiro, disjuntor, validação de upload por assinatura de arquivo, controle de versão em entregas). O
problema não é falta de engenharia — é que **o padrão bom foi construído e não foi aplicado em todos os
lugares**: há um jeito certo no repositório e, ao lado dele, de três a vinte lugares fazendo diferente. A
consequência é que o sistema funciona no caminho que alguém testou e falha em silêncio nos outros.

Duas coisas, porém, são mais graves do que isso e precisam de decisão sua antes do resto: **a ordem em que
uma entrega caminha não é garantida em nenhum lugar a não ser na tela**, e **o repositório está público
enquanto a instrução que todo agente lê afirma que é privado**.

---

## Os 10 maiores riscos, em linguagem de negócio

| #   | Risco                                                                                             | O que acontece na prática                                                                                                                                                                                                                                                                                                                                                                             | Gravidade |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | **Qualquer pessoa com login pode marcar uma entrega como "entregue" sem ela ter sido despachada** | A ordem das etapas (produção → cotação → nota fiscal → despacho → entrega) só é checada na tela. Quem souber usar o endereço direto pula etapas. Os painéis de SLA e OTIF passam a medir uma operação que não aconteceu — e é com esses números que você cobra transportadora e promete prazo ao cliente                                                                                              | Crítica   |
| 2   | **O repositório está público e a documentação diz que é privado**                                 | Hoje nenhuma chave de valor está exposta: conferimos uma a uma, e todas as que estão versionadas são públicas por natureza (o token de mapa que havia já foi revogado e não é mais usado). O risco é o próximo: o arquivo de configuração `.env` está versionado e desprotegido, então o primeiro agente que seguir a instrução "é privado" e colocar uma chave de verdade ali a publica para o mundo | Crítica   |
| 3   | **Um dos webhooks deixa de conferir a assinatura se o segredo não estiver configurado**           | O código verifica a assinatura **só se** o segredo existir. Sem ele, qualquer pessoa na internet injeta eventos falsos de transportadora e consegue listar suas transportadoras e telefones. Precisamos conferir com você se esse segredo está configurado — e a correção vale de qualquer forma                                                                                                      | Crítica   |
| 4   | **A tela de cotação multicanal perde a negociação ao recarregar a página**                        | O preço que a transportadora respondeu por WhatsApp ou e-mail aparece na tela e desaparece. A cotação vencedora nunca fica marcada no sistema, então não há registro de por que aquele frete foi contratado. Existe outra tela que faz isso certo — são duas telas para a mesma coisa                                                                                                                 | Crítica   |
| 5   | **Excluir vários clientes de uma vez não pergunta nada**                                          | Um clique errado apaga todos os selecionados, sem confirmação e sem desfazer. Excluir **um** cliente, na mesma tela, pergunta — o botão de excluir vários é que não                                                                                                                                                                                                                                   | Crítica   |
| 6   | **As telas mais usadas abrem e fecham conexão com o banco sem parar**                             | Em Envios, Kanban e no painel inicial, a atualização em tempo real se reinicia a cada desenho da tela. Quando a cota de conexões estoura, as telas **param de atualizar sozinhas sem avisar** — e o operador confia numa tela parada                                                                                                                                                                  | Crítica   |
| 7   | **Evento repetido da transportadora grava duas vezes**                                            | Lalamove e Rodonaves reenviam o evento quando a resposta demora — é o comportamento normal delas. Dois dos quatro webhooks protegem contra isso de um jeito que não funciona quando os dois chegam juntos. Resultado: o cliente vê o mesmo evento repetido no rastreio e os indicadores de ocorrência contam dobrado                                                                                  | Crítica   |
| 8   | **Despachos mostra "Fila Limpa" quando o banco não responde**                                     | A tela não trata erro: falha de conexão e fila vazia aparecem iguais. O despachante lê "Fila Limpa", conclui que não há nada para despachar, e mercadoria pronta não sai                                                                                                                                                                                                                              | Alta      |
| 9   | **Apagar uma transportadora é definitivo**                                                        | Nos cadastros de cliente e fornecedor a exclusão só esconde o registro e dá para recuperar. Em transportadora e frete interno, apaga de verdade — e pode arrastar o histórico ligado a ela                                                                                                                                                                                                            | Alta      |
| 10  | **Alerta de queda de acurácia que você liga e não é salvo**                                       | Ao ligar "me avise por WhatsApp", a chave muda na tela e a configuração não vai para o banco: o erro é descartado em cinco pontos da mesma tela. Quando a acurácia cair, ninguém é avisado — e a tela continuará dizendo que o aviso está ligado                                                                                                                                                      | Alta      |

### Dois riscos de processo, que afetam o próprio trabalho de corrigir

| #   | Risco                                                                         | Por que importa agora                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | **`ESTADO_ATUAL.md` descreve o banco errado, de três meses atrás**            | São 98 KB com o nome mais convidativo do repositório, afirmando que o typecheck tem 21 erros e o lint não roda. Medimos: zero erros, lint rodando. E o documento mede o banco antigo do Lovable, onde ninguém deve escrever. É o documento que mais custa em trabalho desperdiçado |
| 12  | **A instrução de merge está errada: são 10 conferências obrigatórias, não 9** | O `AGENTS.md` diz 9. Confirmamos na API do GitHub: são 10. O agente conta nove verdes, vê a décima pendente e mergeia achando que terminou. No mesmo documento, "o deploy das funções é manual" também está errado — merge na `main` publica na hora                               |

---

## Contagem por gravidade

| Gravidade   | Quantos | O que significa                                                             |
| ----------- | ------- | --------------------------------------------------------------------------- |
| **Crítica** | **11**  | Perda ou vazamento de dado, falha de segurança, ou fluxo principal quebrado |
| **Alta**    | **23**  | Função importante falha ou dá resultado errado                              |
| Média       | 22      | Funciona, com defeito ou fragilidade                                        |
| Baixa       | 9       | Acabamento e organização                                                    |
| **Total**   | **65**  |                                                                             |

Cada problema é contado **uma vez**, mesmo quando aparece em vários lugares: a troca de assinatura em tempo
real é um problema com 12 telas, não doze problemas.

**O plano tem 300 etapas**, todas pequenas e verificáveis uma a uma, ordenadas em oito ondas — segurança
primeiro, acabamento no fim. Em `04-PLANO.md`.

---

## O que não foi coberto (e isso importa)

A lacuna mais séria: **o banco de dados de produção não pôde ser inspecionado.** O acesso ao projeto Supabase
oficial não estava disponível nesta sessão, e a fonte de contexto que o próprio sistema manda consultar sobre
o banco (`docs/contexto/supabase/`) **nunca foi gerada**. Como em Supabase a permissão de verdade mora no
banco — a tela só esconde o botão —, isso significa que **a camada que mais importa para segurança não foi
verificada**. Três achados ficaram como hipótese por esse motivo, com a consulta exata para fechá-los.

Também ficou de fora:

- **48 das 61 telas** não foram lidas uma por uma (as 13 dos fluxos principais foram).
- **Nenhuma operação de gravação foi executada.** Não existe ambiente de teste: o banco é um só e merge na
  `main` já é produção. Tudo que grava dado foi conferido lendo o código, não executando.
- **Acessibilidade, celular e tempo de carregamento real** — exigiria exercitar a aplicação publicada.
- **Os segredos das funções** não são legíveis, o que deixa em aberto se o modo de teste dos webhooks está
  desligado em produção e se o monitoramento de erros (Sentry) está de fato recebendo dados.

O registro completo, item por item, com o motivo de cada lacuna, está em `01-INVENTARIO.md` §14.

---

## Uma observação sobre o que **não** está quebrado

Parte do valor desta auditoria foi descartar alarmes falsos antes de virarem trabalho. Dezoito suspeitas
foram investigadas e derrubadas — entre elas "36 tabelas sem proteção de acesso" (32 estão protegidas, por um
caminho que a ferramenta de inventário não consegue ler), "12 índices duplicados no banco" (7 já foram
removidos há três meses) e "números de coleta podem repetir" (a restrição existe e o gerador usa um
mecanismo seguro). Sem essa conferência, o plano mandaria o próximo agente alterar o banco de produção para
consertar o que já está certo. A lista completa está no fim de `03-ACHADOS.md`.

Quatro desses alarmes falsos só caíram na **redação do plano**, quando cada etapa foi conferida contra o
código — e estão registrados dentro dos próprios achados, marcados como "Correção de rota", em vez de
apagados. É proposital: quem for executar precisa saber não só o que está errado, mas também o que já foi
descartado e por quê.

---

## Onde está cada coisa

| Arquivo                    | Para quê                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| `docs/qa/00-RESUMO.md`     | este resumo                                                            |
| `docs/qa/01-INVENTARIO.md` | mapa do sistema e registro do que foi e não foi coberto                |
| `docs/qa/02-CENARIOS.md`   | os cenários testados, com o que foi executado e o que foi só rastreado |
| `docs/qa/03-ACHADOS.md`    | os 65 problemas, com evidência, causa e impacto                        |
| `docs/qa/04-PLANO.md`      | as 300 etapas, com instruções para quem vai executar                   |
| `docs/qa/05-PROGRESSO.md`  | a lista para o executor ir marcando                                    |
