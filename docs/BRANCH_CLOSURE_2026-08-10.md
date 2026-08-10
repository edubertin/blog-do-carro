# Encerramento provisório de branches — 10 de agosto de 2026

## Objetivo

Consolidar o trabalho aprovado na branch principal antes de tornar o repositório público, preservando rastreabilidade sem manter branches remotas obsoletas.

## Critérios adotados

- mudanças de produto aprovadas foram preservadas por commits e Pull Requests mesclados;
- atualizações de dependências só entraram após CI verde;
- propostas incompatíveis ou com CI falhando foram encerradas sem merge;
- nenhuma branch foi combinada cegamente apenas para reduzir a lista;
- o histórico Git foi examinado em busca de credenciais antes da abertura pública.

## Resultado

A branch principal representa a versão final da demonstração. Pull Requests encerrados continuam documentando decisões e tentativas, enquanto branches remotas já incorporadas podem ser removidas sem perda do histórico revisável.

O projeto permanece **pausado, público e não arquivado**, permitindo consulta, issues de segurança e uma retomada futura controlada.
