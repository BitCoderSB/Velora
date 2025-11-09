import { ensureUserId, insertTemplate, topK, logAuth } from
  '../../infra/persistence/repositories/face.repo.js';

const ACCEPT = 0.75, GRAY = 0.60;
const l2 = v => { const n = Math.hypot(...v); return n ? v.map(x=>x/n) : v; };
const meanEmb = embs => { const d=embs[0].length,m=new Array(d).fill(0);
  for(const e of embs) for(let i=0;i<d;i++) m[i]+=e[i];
  for(let i=0;i<d;i++) m[i]/=embs.length; return l2(m); };

async function enroll({ user_id, email, embeddings, quality }) {
  const uid = await ensureUserId({ user_id, email });
  const template = meanEmb(embeddings.map(l2));
  const face_id = await insertTemplate({ user_id: uid, emb: template, quality });
  return { user_id: uid, face_id };
}
async function verify({ emb, pos_id, liveness_ok }) {
  const rows = await topK({ emb: l2(emb), k: 5 });
  if (!rows.length) { await logAuth({ user_id:null, pos_id, score:null, liveness_ok, decision:'no-candidate' });
    return { match:false, score:0, decision:'no-candidate' }; }
  const best = rows[0], s = Number(best.score);
  const decision = s>=ACCEPT?'accept': s>=GRAY?'gray':'reject';
  await logAuth({ user_id:best.user_id, pos_id, score:s, liveness_ok, decision });
  return { match: decision==='accept', score: s, user_id: best.user_id, decision };
}
export { enroll, verify };
