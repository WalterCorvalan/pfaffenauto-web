import { generateSecret, generateURI, verify } from "otplib";

export function generarSecreto() {
  return generateSecret();
}

export function otpauthUrl(email: string, secret: string, issuer = "Pfaffen Autos") {
  return generateURI({ issuer, label: email, secret });
}

export async function verificarCodigo(codigo: string, secret: string) {
  try {
    const resultado = await verify({ secret, token: codigo.trim() });
    return resultado.valid;
  } catch {
    return false;
  }
}
