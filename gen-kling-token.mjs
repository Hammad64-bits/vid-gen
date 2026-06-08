/**
 * gen-kling-token.mjs
 * Generates a Kling AI JWT token for console verification.
 * Run: node gen-kling-token.mjs
 */
import { SignJWT } from 'jose';

const ak = 'APN4ybYfRGFm3DpkphDaadnRKMfe4pDM';
const sk = 'AQEhrARfpL9MQhkMdPK3LhndNCdpCRfG';

const now = Math.floor(Date.now() / 1000);
const skBytes = new TextEncoder().encode(sk);

const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .setIssuer(ak)
  .setExpirationTime(now + 1800)
  .setNotBefore(now - 5)
  .sign(skBytes);

console.log('\n✅ Kling JWT Token (valid for 30 min):\n');
console.log(token);
console.log('\n👆 Paste this into the JWT Verification box at https://kling.ai/dev/api-key\n');
