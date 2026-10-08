"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#0b0b0c", color: "#ececef", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 16, fontWeight: 500 }}>Algo deu errado</h1>
            <p style={{ color: "#a3a3ab" }}>Não foi possível carregar o Pauta. Confira as variáveis de ambiente e tente de novo.</p>
            {error.digest && <p style={{ color: "#6e6e77", fontFamily: "monospace", fontSize: 12 }}>ref: {error.digest}</p>}
            <button onClick={retry} style={{ marginTop: 12, padding: "8px 14px", borderRadius: 6, border: "1px solid #303036", background: "#19191c", color: "inherit", cursor: "pointer" }}>
              Tentar de novo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
