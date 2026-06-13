// 기상청 Lambert Conformal Conic (LCC DFS) 좌표변환
// 위도/경도 → 기상청 단기예보 격자 NX, NY

const DEGRAD = Math.PI / 180.0;

const RE = 6371.00877;
const GRID = 5.0;
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0;
const OLAT = 38.0;
const XO = 43;
const YO = 136;

function _precompute() {
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (RE / GRID) * sf / Math.pow(ro, sn);

  return { sn, sf, ro, olon };
}

const { sn, sf, ro, olon } = _precompute();

export function latLonToGrid(lat, lon) {
  const ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  const r = (RE / GRID) * sf / Math.pow(ra, sn);

  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(r * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - r * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}
