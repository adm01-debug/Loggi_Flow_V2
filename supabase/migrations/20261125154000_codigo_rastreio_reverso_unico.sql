-- Etapa 027 - unicidade do codigo de rastreio reverso (achado F-03)
-- A etapa 026 conferiu no banco ao vivo: numero_coleta e numero_entrega ja tem UNIQUE;
-- o codigo de rastreio reverso nao tem nenhuma restricao.
-- Indice unico PARCIAL, e nao ALTER TABLE: a coluna aceita nulo e o codigo e digitado a mao.
-- Sem CONCURRENTLY: o workflow aplicar-migration.yml roda dentro de uma transacao.
DO $$
DECLARE
    repetidos integer;
BEGIN
    SELECT count(*) INTO repetidos
    FROM (
        SELECT codigo_rastreio_reverso
        FROM public.logistica_reversa
        WHERE codigo_rastreio_reverso IS NOT NULL
        GROUP BY codigo_rastreio_reverso
        HAVING count(*) > 1
    ) d;

    IF repetidos > 0 THEN
        RAISE EXCEPTION
            'Etapa 027 abortada: % codigo(s) de rastreio reverso repetido(s) em public.logistica_reversa. Limpar as duplicatas antes de criar o indice unico.',
            repetidos;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_logistica_reversa_codigo_rastreio
    ON public.logistica_reversa (codigo_rastreio_reverso)
    WHERE codigo_rastreio_reverso IS NOT NULL;

COMMENT ON INDEX public.ux_logistica_reversa_codigo_rastreio IS
    'Etapa 027: dois registros de devolucao nao podem ter o mesmo codigo de rastreio (a coluna aceita nulo).';