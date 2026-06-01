"""
재료 테이블 마이그레이션 및 재적재 스크립트

실행 전 설치:
    pip install requests pymysql

실행:
    python BackEnd/scripts/ingest_ingredients.py
"""
import os
import re
import sys
import time
import requests
import pymysql

# ── 환경 변수 로드 ─────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, '..', '.env')
FAIL_LOG = os.path.join(SCRIPT_DIR, 'parse_failures.log')


def load_env(path):
    env = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env


env = load_env(ENV_PATH)

API_KEY = env['FOOD_API_KEY']
API_BASE = f"http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/COOKRCP01/json"
BATCH_SIZE = 100

DB_CONFIG = dict(
    host=env['DB_HOST'],
    port=int(env['DB_PORT']),
    db=env['DB_NAME'],
    user=env['DB_USERNAME'],
    password=env['DB_PASSWORD'],
    charset='utf8mb4',
    autocommit=False,
)

# ── 수량·단위 파싱 ────────────────────────────────────────────────────────────
# 긴 단위를 먼저 배치해야 부분 매칭 방지 (큰술 > 술, ml > l 등)
_UNITS = [
    'ml', 'mL', 'kg', 'g', 'L',
    '큰술', '작은술', '컵', '줄기', '마리', '조각', '토막', '봉지', '캔', '장', '쪽', '개',
    'cm', 'mm',
]
_NUM_PAT = r'\d+(?:[./]\d+)?'
_AMOUNT_RE = re.compile(
    rf'({_NUM_PAT})\s*({"|".join(re.escape(u) for u in _UNITS)})'
)


def _to_decimal(num_str: str):
    try:
        if '/' in num_str:
            a, b = num_str.split('/', 1)
            return round(float(a) / float(b), 4)
        return float(num_str)
    except Exception:
        return None


def _parse_amount(text: str):
    """재료 텍스트에서 (quantity, unit) 추출. 없으면 (None, None)."""
    # 괄호 밖에서 먼저 탐색 (예: "마 30g(1/3개)" → 30, g)
    outside = re.sub(r'\([^)]*\)', '', text)
    m = _AMOUNT_RE.search(outside)
    if m:
        return _to_decimal(m.group(1)), m.group(2)
    # 괄호 안에서 탐색 (예: "오이(55g)", "양고기(부채살, 250g)")
    m = _AMOUNT_RE.search(text)
    if m:
        return _to_decimal(m.group(1)), m.group(2)
    return None, None


def _extract_name(text: str) -> str:
    """재료명만 추출 — 수량·단위·괄호 전체 제거.

    예) "마 30g(1/3개)"       → "마"
        "오이(55g)"            → "오이"
        "양파 10g(3×1cm)"      → "양파"
        "양고기(부채살, 250g)"  → "양고기"
        "닭 550g(1마리)"       → "닭"
    """
    name = _AMOUNT_RE.sub('', text)          # 숫자+단위 제거
    name = re.sub(r'\([^)]*\)', '', name)    # 괄호 전체 제거
    return name.strip()


# ── 공통 전처리 ────────────────────────────────────────────────────────────────
# "[ 2인분 ]", "2인분 기준" 같은 인분 표기 제거
_SERVING_RE = re.compile(r'\[\s*\d+\s*인분\s*\]|\d+\s*인분\s*기준', re.IGNORECASE)


def _preprocess(text: str) -> str:
    text = text.replace('<br>', '').replace('<BR>', '')
    text = _SERVING_RE.sub('', text)
    return text.strip()


def _split_ingredients(raw: str) -> list[str]:
    """쉼표·줄바꿈 구분, 괄호 안 쉼표는 보존."""
    raw = raw.replace('\n', ',')
    result, current, depth = [], [], 0
    for ch in raw:
        if ch == '(':
            depth += 1
            current.append(ch)
        elif ch == ')':
            depth = max(0, depth - 1)
            current.append(ch)
        elif ch == ',' and depth == 0:
            token = ''.join(current).strip()
            if token:
                result.append(token)
            current = []
        else:
            current.append(ch)
    token = ''.join(current).strip()
    if token:
        result.append(token)
    return result


# ── 패턴별 파싱 ───────────────────────────────────────────────────────────────
def _parse_a(text: str) -> list:
    """패턴 A — ● 기준 그룹 분리."""
    result = []
    for section in (s.strip() for s in text.split('●') if s.strip()):
        lines = [l.strip() for l in section.split('\n') if l.strip()]
        if not lines:
            continue
        first = lines[0]
        if ':' in first:
            idx = first.index(':')
            group_name = first[:idx].strip()
            after = first[idx + 1:].strip()
            # 그룹명과 재료가 같은 줄이면 after를 사용, 아니면 다음 줄 사용
            body = (after + (',' if after and len(lines) > 1 else '') + ','.join(lines[1:])) \
                if after else ','.join(lines[1:])
        else:
            group_name = first
            body = ','.join(lines[1:])
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
    return result


def _parse_b(text: str) -> list:
    """패턴 B / K — • 기준 분리.

    B: `• [그룹명] 재료들`
    K: `•그룹명 : 재료들`  (대괄호 없이 그룹명: 형태)
    """
    result = []
    for section in (s.strip() for s in text.split('•') if s.strip()):
        # 형태 B: [그룹명]
        m = re.match(r'\[([^\]]+)\]\s*(.*)', section, re.DOTALL)
        if m:
            group_name, rest = m.group(1).strip(), m.group(2).strip()
        else:
            # 형태 K: 그룹명 : 재료들
            m2 = re.match(r'^([가-힣\s]{1,20}?)\s*:\s*(.*)', section, re.DOTALL)
            if m2 and not any(c.isdigit() for c in m2.group(1)):
                group_name, rest = m2.group(1).strip(), m2.group(2).strip()
            else:
                group_name, rest = None, section
        ingredients = _split_ingredients(rest)
        if group_name or ingredients:
            result.append({'group_name': group_name, 'ingredients': ingredients})
    return result


def _parse_c(text: str) -> list:
    """패턴 C — [그룹명] 중간 삽입 분리."""
    # re.split 결과: [before, group1, after1, group2, after2, ...]
    parts = re.split(r'\[([^\]]+)\]', text)
    result = []
    # 첫 번째 조각 (브라켓 이전, 그룹 없음)
    if parts[0].strip():
        items = _split_ingredients(parts[0].strip())
        if items:
            result.append({'group_name': None, 'ingredients': items})
    # 이후 (group_name, ingredient_text) 쌍
    i = 1
    while i + 1 <= len(parts) - 1:
        group_name = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ''
        # "양념재료:파프리카가루..." 형태: 콜론 앞이 한글 레이블이면 그룹명에 합침
        m = re.match(r'^([가-힣a-zA-Z\s]{1,20})\s*:\s*(.*)', body, re.DOTALL)
        if m and not any(c.isdigit() for c in m.group(1)):
            group_name = (group_name + ' ' + m.group(1).strip()).strip()
            body = m.group(2)
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
        i += 2
    return result


def _parse_f(text: str) -> list:
    """패턴 F — `\\n- 그룹명 :` 기준 그룹 분리.

    예) "닭고기살(150g), 소금(0.3g)\\n- 소스 : 레몬(10g), 설탕(20g)\\n다진 마늘(10g)"
        → group_name=None: [닭고기살, 소금]
        → group_name="소스": [레몬, 설탕, 다진 마늘]
    """
    # re.split 결과: [before, group1, body1, group2, body2, ...]
    parts = re.split(r'\n-\s+(.+?)\s*:', text)
    result = []

    # 첫 번째 조각 — 첫 그룹 마커 이전 재료 (group_name=None)
    if parts[0].strip():
        items = _split_ingredients(parts[0].strip())
        if items:
            result.append({'group_name': None, 'ingredients': items})

    # 이후 (group_name, body) 쌍
    i = 1
    while i + 1 <= len(parts) - 1:
        group_name = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ''
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
        i += 2

    return result


_PATTERN_F_RE = re.compile(r'\n-\s+.+?\s*:')


def _parse_g(text: str) -> list:
    """패턴 G — `그룹명 >` 줄 단위 구분.

    예) "주재료 > 아몬드가루 90g\\n초코필링 > 땅콩버터 12g"
    """
    result = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if '>' in line:
            idx = line.index('>')
            group_name = line[:idx].strip()
            body = line[idx + 1:].strip()
            ingredients = _split_ingredients(body)
            if group_name or ingredients:
                result.append({'group_name': group_name or None, 'ingredients': ingredients})
        else:
            items = _split_ingredients(line)
            if items:
                result.append({'group_name': None, 'ingredients': items})
    return result


_PATTERN_G_RE = re.compile(r'[가-힣\w]{1,15}\s*>')


def _parse_h(text: str) -> list:
    """패턴 H — `그룹명:` 공백 구분, 줄바꿈 없음.

    예) "주재료: 토마토 70, 영양부추 5 양념: 까나리액젓 2.5"
    """
    # re.split 결과: ['', '주재료:', ' 토마토 70, 영양부추 5 ', '양념:', ' 까나리액젓 2.5']
    parts = re.split(r'([가-힣]{1,15}\s*:)', text)
    result = []
    if parts[0].strip():
        items = _split_ingredients(parts[0].strip())
        if items:
            result.append({'group_name': None, 'ingredients': items})
    i = 1
    while i + 1 < len(parts):
        group_name = parts[i].rstrip(':').strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ''
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
        i += 2
    return result


_PATTERN_H_RE = re.compile(r'[가-힣]{2,10}\s*:')


def _parse_i(text: str) -> list:
    """패턴 I — `\\n·그룹명 :` 가운뎃점(U+00B7) 구분.

    예) "조선부추 50g\\n·양념장 : 저염간장 3g, 다진 대파 5g"
    """
    parts = re.split(r'\n·\s*', text)
    result = []
    if parts[0].strip():
        items = _split_ingredients(parts[0].strip())
        if items:
            result.append({'group_name': None, 'ingredients': items})
    for section in parts[1:]:
        section = section.strip()
        if not section:
            continue
        if ':' in section:
            idx = section.index(':')
            group_name = section[:idx].strip()
            body = section[idx + 1:].strip()
        else:
            group_name, body = None, section
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
    return result


_PATTERN_I_RE = re.compile(r'\n·')


def _parse_j(text: str) -> list:
    """패턴 J — `- 그룹명 :` 줄바꿈 없이 공백 구분.

    예) "- 주재료 : 민어 50g, 무 40g - 양념장 : 간 홍고추 10g"
    """
    parts = re.split(r'\s*-\s+(?=[가-힣])', text)
    result = []
    if parts[0].strip():
        items = _split_ingredients(parts[0].strip())
        if items:
            result.append({'group_name': None, 'ingredients': items})
    for section in parts[1:]:
        section = section.strip()
        if not section:
            continue
        if ':' in section:
            idx = section.index(':')
            group_name = section[:idx].strip()
            body = section[idx + 1:].strip()
        else:
            group_name, body = None, section
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
    return result


_PATTERN_J_RE = re.compile(r'(?:^|\s)-\s+[가-힣]')


def _parse_l(text: str) -> list:
    """패턴 L — 줄 첫머리 한글 그룹명 감지.

    예) "재료 느타리버섯(10g), 두부(50g)\\n배추(40g)\\n다시마육수 다시마(3g)"
        → group_name='재료':   [느타리버섯(10g), 두부(50g), 배추(40g)]
        → group_name='다시마육수': [다시마(3g)]
    """
    _HEADER_RE = re.compile(r'^([가-힣]{2,10})\s+(.*)', re.DOTALL)

    def _is_group_header(rest: str) -> bool:
        if not rest:
            return False
        first = rest[0]
        return '가' <= first <= '힣' and ('(' in rest or ',' in rest)

    result = []
    current_group = None
    current_items = []

    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        m = _HEADER_RE.match(line)
        if m and _is_group_header(m.group(2).strip()):
            if current_items:
                result.append({'group_name': current_group, 'ingredients': current_items})
            current_group = m.group(1)
            current_items = _split_ingredients(m.group(2).strip())
        else:
            current_items.extend(_split_ingredients(line))

    if current_items:
        result.append({'group_name': current_group, 'ingredients': current_items})

    return result


_PATTERN_L_RE = re.compile(r'(?:^|\n)[가-힣]{2,10}\s+[가-힣][^\n]*[\(,]')


def _parse_m(text: str) -> list:
    """패턴 M — 줄바꿈 후 `그룹명 :` 형태.

    예) "카스텔라 100g, 꿀 15g\\n해독주스 : 바나나 50g, 브로콜리 25g"
        → group_name=None:     [카스텔라 100g, 꿀 15g]
        → group_name='해독주스': [바나나 50g, 브로콜리 25g]
    """
    _LINE_GROUP_RE = re.compile(r'^([가-힣]{1,15})\s*:\s*(.*)', re.DOTALL)

    ungrouped_items = []
    groups = []

    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        m = _LINE_GROUP_RE.match(line)
        if m and not any(c.isdigit() for c in m.group(1)):
            groups.append((m.group(1).strip(), _split_ingredients(m.group(2).strip())))
        else:
            ungrouped_items.extend(_split_ingredients(line))

    result = []
    if ungrouped_items:
        result.append({'group_name': None, 'ingredients': ungrouped_items})
    for group_name, items in groups:
        if group_name or items:
            result.append({'group_name': group_name, 'ingredients': items})
    return result


_PATTERN_M_RE = re.compile(r'(?:^|\n)[가-힣]{1,15}\s*:')


def _parse_n(text: str) -> list:
    """패턴 N — `그룹명 :` 시작 + `- 그룹명 :` 연결 (줄바꿈 없음).

    예) "주재료 : 비름나물 30g, 소금물(물 100g, 소금 3g) - 양념장 : 까나리액젓 1.5g"
        → group_name='주재료': [비름나물 30g, 소금물(물 100g, 소금 3g)]
        → group_name='양념장': [까나리액젓 1.5g]
    """
    parts = re.split(r'\s*-\s*(?=[가-힣]+\s*:)', text)
    result = []
    for section in parts:
        section = section.strip()
        if not section:
            continue
        m = re.match(r'^([가-힣\s]{1,20}?)\s*:\s*(.*)', section, re.DOTALL)
        if m and not any(c.isdigit() for c in m.group(1)):
            group_name = m.group(1).strip()
            body = m.group(2).strip()
        else:
            group_name, body = None, section
        ingredients = _split_ingredients(body)
        if group_name or ingredients:
            result.append({'group_name': group_name or None, 'ingredients': ingredients})
    return result


_PATTERN_N_RE = re.compile(r'^[가-힣]+\s*:.+-\s*[가-힣]+\s*:', re.DOTALL)


# ── 파싱 실패 로그 ─────────────────────────────────────────────────────────────
def _log_failure(recipe_id: int, original: str):
    with open(FAIL_LOG, 'a', encoding='utf-8') as f:
        f.write(f"recipe_id: {recipe_id} | {original}\n")


# ── 메인 파싱 함수 ─────────────────────────────────────────────────────────────
def parse_ingredients(parts_text: str, recipe_id: int = None) -> list:
    """
    우선순위:
      1. ● 포함 → 패턴 A
      2. • 포함 → 패턴 B
      3. [ ] 포함 + 그룹성 브라켓 → 패턴 C
      4. 나머지 → 단순 나열 (D/E)
    파싱 예외 시 원본 저장 + parse_failures.log 기록.
    """
    if not parts_text or not parts_text.strip():
        return []

    original = parts_text
    try:
        text = _preprocess(parts_text)
        if not text:
            return []

        if '●' in text:
            return _parse_a(text)

        if '•' in text:
            return _parse_b(text)

        if '[' in text and ']' in text:
            bracket_contents = re.findall(r'\[([^\]]+)\]', text)
            # 숫자·분수만 있는 브라켓은 재료 표기(측량)로 간주 → 단순 나열
            is_group_bracket = any(
                not re.match(r'^[\d/\s.]+$', bc) for bc in bracket_contents
            )
            if is_group_bracket:
                return _parse_c(text)

        if _PATTERN_I_RE.search(text):
            return _parse_i(text)

        if _PATTERN_F_RE.search(text):
            return _parse_f(text)

        if _PATTERN_G_RE.search(text):
            return _parse_g(text)

        if _PATTERN_N_RE.search(text):
            return _parse_n(text)

        if _PATTERN_J_RE.search(text):
            return _parse_j(text)

        if len(_PATTERN_H_RE.findall(text)) >= 2:
            return _parse_h(text)

        if _PATTERN_M_RE.search(text):
            return _parse_m(text)

        if _PATTERN_L_RE.search(text):
            return _parse_l(text)

        # 패턴 D/E — 단순 나열
        return [{'group_name': None, 'ingredients': _split_ingredients(text)}]

    except Exception:
        if recipe_id is not None:
            _log_failure(recipe_id, original)
        # 파싱 실패 시 원본 전체를 단일 재료로 저장
        raw = original.strip()
        return [{'group_name': None, 'ingredients': [raw] if raw else []}]


# ── 1단계: 스키마 마이그레이션 ────────────────────────────────────────────────
def migrate_schema(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipe_ingredient_groups (
            group_id   BIGINT NOT NULL AUTO_INCREMENT,
            recipe_id  BIGINT NOT NULL,
            group_name VARCHAR(100) NOT NULL,
            sort_order INT NOT NULL,
            PRIMARY KEY (group_id),
            CONSTRAINT fk_rig_recipe
                FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    """)
    print("  [OK] recipe_ingredient_groups 테이블 확인/생성")

    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'recipe_ingredients'
          AND column_name = 'group_id'
    """)
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            ALTER TABLE recipe_ingredients
            ADD COLUMN group_id BIGINT NULL,
            ADD CONSTRAINT fk_ri_group
                FOREIGN KEY (group_id) REFERENCES recipe_ingredient_groups(group_id)
                ON DELETE SET NULL
        """)
        print("  [OK] recipe_ingredients.group_id 컬럼 추가")
    else:
        print("  [SKIP] recipe_ingredients.group_id 이미 존재")


# ── 2단계: 재료 테이블 초기화 ─────────────────────────────────────────────────
def truncate_tables(cursor):
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("TRUNCATE TABLE recipe_ingredients")
    cursor.execute("TRUNCATE TABLE recipe_ingredient_groups")
    cursor.execute("TRUNCATE TABLE ingredients")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    print("  [OK] recipe_ingredients / recipe_ingredient_groups / ingredients TRUNCATE 완료")


# ── API 호출 ──────────────────────────────────────────────────────────────────
def fetch_api_batch(start: int, end: int) -> list:
    url = f"{API_BASE}/{start}/{end}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get('COOKRCP01', {}).get('row', [])
    except Exception as e:
        print(f"\n    [ERROR] API 호출 실패 ({start}-{end}): {e}")
        return []


# ── 4단계: 레시피 1건 적재 ────────────────────────────────────────────────────
def ingest_recipe_ingredients(cursor, recipe_id: int, parts_text: str):
    groups = parse_ingredients(parts_text, recipe_id=recipe_id)
    global_sort = 1

    for group_sort, group in enumerate(groups, start=1):
        group_id = None

        if group['group_name']:
            cursor.execute(
                "INSERT INTO recipe_ingredient_groups (recipe_id, group_name, sort_order) VALUES (%s, %s, %s)",
                (recipe_id, group['group_name'][:100], group_sort),
            )
            group_id = cursor.lastrowid

        for raw_name in group['ingredients']:
            if not raw_name:
                continue

            name = _extract_name(raw_name)[:100]
            normalized = name.lower()
            quantity, unit = _parse_amount(raw_name)

            cursor.execute(
                "INSERT IGNORE INTO ingredients (name, normalized_name) VALUES (%s, %s)",
                (name, normalized),
            )
            cursor.execute(
                "SELECT ingredient_id FROM ingredients WHERE normalized_name = %s",
                (normalized,),
            )
            row = cursor.fetchone()
            if not row:
                continue
            ingredient_id = row[0]

            cursor.execute(
                """
                INSERT IGNORE INTO recipe_ingredients
                    (recipe_id, ingredient_id, group_id, original_name, quantity, unit, amount_text, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (recipe_id, ingredient_id, group_id, name[:150], quantity, unit, raw_name[:100], global_sort),
            )
            global_sort += 1


# ── 메인 ─────────────────────────────────────────────────────────────────────
def main():
    print(f"DB 연결 중: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['db']}")
    try:
        conn = pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"[FATAL] DB 연결 실패: {e}")
        sys.exit(1)

    cursor = conn.cursor()

    print("\n=== 1단계: 스키마 마이그레이션 ===")
    migrate_schema(cursor)
    conn.commit()

    print("\n=== 2단계: 재료 테이블 초기화 ===")
    truncate_tables(cursor)
    conn.commit()

    print("\n=== 3단계: 레시피 목록 조회 ===")
    cursor.execute(
        "SELECT recipe_id, source_recipe_id FROM recipes WHERE is_active = TRUE"
        " ORDER BY CAST(source_recipe_id AS UNSIGNED)"
    )
    recipes = cursor.fetchall()
    print(f"  레시피 {len(recipes)}건 조회됨")

    if not recipes:
        print("  [WARN] 레시피 없음, 종료")
        cursor.close()
        conn.close()
        return

    recipe_map = {r[1]: r[0] for r in recipes}  # source_recipe_id -> recipe_id

    src_ids = [int(r[1]) for r in recipes if str(r[1]).isdigit()]
    max_id = max(src_ids) if src_ids else 0

    print(f"\n=== 4단계: API 호출 및 재적재 (범위 1~{max_id}) ===")
    success = 0
    skip = 0

    for start in range(1, max_id + 1, BATCH_SIZE):
        end = min(start + BATCH_SIZE - 1, max_id)
        print(f"  배치 {start:4d}~{end:4d} ... ", end='', flush=True)

        rows = fetch_api_batch(start, end)
        if not rows:
            print("응답 없음")
            continue

        batch_ok = 0
        for row in rows:
            src_id = row.get('RCP_SEQ', '')
            parts_text = row.get('RCP_PARTS_DTLS', '') or ''
            recipe_id = recipe_map.get(src_id)

            if recipe_id is None:
                continue

            try:
                ingest_recipe_ingredients(cursor, recipe_id, parts_text)
                batch_ok += 1
                success += 1
            except Exception as e:
                print(f"\n    [ERROR] recipe_id={recipe_id} (src={src_id}): {e}")
                conn.rollback()
                skip += 1

        conn.commit()
        print(f"{batch_ok}건 완료")
        time.sleep(0.3)

    cursor.close()
    conn.close()
    print(f"\n=== 완료: 성공 {success}건, 스킵 {skip}건 ===")
    if os.path.exists(FAIL_LOG):
        with open(FAIL_LOG, encoding='utf-8') as f:
            fail_count = sum(1 for _ in f)
        print(f"  파싱 실패 로그: {FAIL_LOG} ({fail_count}건)")


if __name__ == '__main__':
    main()
