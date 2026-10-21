export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Campo relacionado ao erro, para o front exibir a mensagem junto do input. */
    public readonly field?: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, `${what} não encontrado(a)`);
