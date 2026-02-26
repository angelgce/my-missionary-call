import * as jose from 'jose';

export async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string, secret: string) {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jose.jwtVerify(token, key);
  return payload;
}
