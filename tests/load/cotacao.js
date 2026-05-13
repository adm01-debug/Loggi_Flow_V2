import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = 'https://hgicfqjayrjurivtygqf.supabase.co/functions/v1';

export default function () {
  const payload = JSON.stringify({
    origem: '01001000',
    destino: '20040000',
    peso: 10,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.SUPABASE_ANON_KEY}`,
    },
  };

  const res = http.post(`${BASE_URL}/cotacao-frete`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has price': (r) => JSON.parse(r.body).price !== undefined,
  });

  sleep(1);
}
