import { latLonToGrid } from '../utils/weatherGrid';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

// 기상청 단기예보 발표시각 (매일 02/05/08/11/14/17/20/23시 발표)
const BASE_TIMES = ['2300', '2000', '1700', '1400', '1100', '0800', '0500', '0200'];

function getBaseDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const hhmm = pad(now.getHours()) + pad(now.getMinutes());

  // 현재 시각보다 이전인 가장 최근 발표시각 선택
  for (const t of BASE_TIMES) {
    if (hhmm >= t) return { base_date: dateStr, base_time: t };
  }
  // 자정~02시 사이: 전날 2300 사용
  const prev = new Date(now);
  prev.setDate(prev.getDate() - 1);
  const prevDate =
    `${prev.getFullYear()}${pad(prev.getMonth() + 1)}${pad(prev.getDate())}`;
  return { base_date: prevDate, base_time: '2300' };
}

// SKY/PTY 코드 → 한국어 문자열 & 아이콘명(MaterialCommunityIcons)
export function weatherDescription(skyCode, ptyCode) {
  if (ptyCode === '1') return { label: '비', icon: 'weather-rainy' };
  if (ptyCode === '2') return { label: '비/눈', icon: 'weather-snowy-rainy' };
  if (ptyCode === '3') return { label: '눈', icon: 'weather-snowy' };
  if (ptyCode === '4') return { label: '소나기', icon: 'weather-pouring' };
  if (skyCode === '1') return { label: '맑음', icon: 'weather-sunny' };
  if (skyCode === '3') return { label: '구름 조금', icon: 'weather-partly-cloudy' };
  if (skyCode === '4') return { label: '흐림', icon: 'weather-cloudy' };
  return { label: '–', icon: 'weather-partly-cloudy' };
}

export async function fetchCurrentWeather(lat, lon) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_WEATHER_API_KEY not set');

  const { nx, ny } = latLonToGrid(lat, lon);
  const { base_date, base_time } = getBaseDateTime();

  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${encodeURIComponent(API_KEY)}` +
    `&pageNo=1&numOfRows=100&dataType=JSON` +
    `&base_date=${base_date}&base_time=${base_time}` +
    `&nx=${nx}&ny=${ny}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API HTTP ${res.status}`);

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!Array.isArray(items)) throw new Error('Unexpected API response shape');

  // 현재 시각에 가장 가까운 예보 슬롯
  const firstFcstTime = items[0]?.fcstTime;
  const slot = items.filter((it) => it.fcstTime === firstFcstTime);

  const get = (cat) => slot.find((it) => it.category === cat)?.fcstValue ?? null;
  // TMN/TMX는 하루 1회만 존재하므로 전체 items에서 탐색
  const getAny = (cat) => items.find((it) => it.category === cat)?.fcstValue ?? null;

  return {
    temp: get('TMP'),       // 기온 °C
    skyCode: get('SKY'),    // 하늘상태 1/3/4
    ptyCode: get('PTY'),    // 강수형태 0/1/2/3/4
    humidity: get('REH'),   // 습도 %
    tmn: getAny('TMN'),     // 일 최저기온
    tmx: getAny('TMX'),     // 일 최고기온
  };
}
