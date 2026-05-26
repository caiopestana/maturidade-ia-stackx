export interface GoogleSheetsPayload {
  nome_completo: string;
  cargo: string;
  email: string;
  telefone: string;
  empresa: string;
  tamanho_da_empresa: string;
  pergunta_aberta: string;
  pontuacao_geral: number;
  faixa_geral: string;
}

export interface GoogleSheetsResponse {
  status: 'sucesso' | string;
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-UErzSLkngDpfsjMtRMoW2nhm5_SBHpZMTLyYnKxOZ077Y_JOQSOuA81YnIsgibV3Lg/exec";

export async function submitToGoogleSheets(data: GoogleSheetsPayload): Promise<GoogleSheetsResponse> {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result as GoogleSheetsResponse;
}
