import { z } from 'zod';

/** Mensagens padrão do Zod em português (as específicas ficam nos próprios schemas). */
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined' || issue.received === 'null') return { message: 'Campo obrigatório' };
    return { message: 'Valor inválido' };
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value) return { message: 'Opção inválida' };
  if (issue.code === z.ZodIssueCode.too_small && issue.type === 'string')
    return { message: `Mínimo de ${issue.minimum} caracteres` };
  if (issue.code === z.ZodIssueCode.too_big && issue.type === 'string')
    return { message: `Máximo de ${issue.maximum} caracteres` };
  return { message: ctx.defaultError };
});
