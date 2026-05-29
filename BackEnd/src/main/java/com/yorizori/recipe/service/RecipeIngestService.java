package com.yorizori.recipe.service;

import com.yorizori.foodapi.FoodApiClient;
import com.yorizori.foodapi.FoodApiFetchResult;
import com.yorizori.foodapi.FoodApiProperties;
import com.yorizori.recipe.dto.FoodApiResponse;
import com.yorizori.recipe.dto.FoodRecipeRow;
import com.yorizori.recipe.dto.RecipeStepPayload;
import com.yorizori.recipe.repository.RecipeIngestRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class RecipeIngestService {

    private static final Pattern INGREDIENT_AMOUNT_PATTERN =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(g|kg|ml|l|L|\\uAC1C|\\uB300|\\uCABD|\\uC54C|\\uC7A5|\\uCEF5|\\uD070\\uC220|\\uC791\\uC740\\uC220|\\uB9C8\\uB9AC|\\uC90C|Ts|ts|T|t)?");

    // 섹션 구분 패턴들
    private static final Pattern BRACKET_SECTION    = Pattern.compile("^\\[([^]]+)]\\s*(.*)$");
    private static final Pattern COLON_SECTION      = Pattern.compile("^(.+?)\\s*:\\s+(.+)$");
    private static final Pattern TRAILING_COLON     = Pattern.compile("^(.+?)\\s*:\\s*$");
    private static final Pattern GT_SECTION         = Pattern.compile("^(.+?)\\s>\\s(.+)$");
    private static final Pattern DOUBLE_SPACE_SECTION = Pattern.compile("^(\\S+)\\s{2,}(.+)$");
    private static final Pattern LEADING_SPECIAL    = Pattern.compile("^[^\\uAC00-\\uD7A3A-Za-z0-9\\[\\(]+");
    private static final Pattern HTML_TAG           = Pattern.compile("<[^>]+>");
    // 섹션명 오염 패턴: "소금 0.38김치조림" or "소금 0.38 김치조림" → 숫자 뒤의 한글이 실제 섹션명
    private static final Pattern POLLUTED_SECTION   = Pattern.compile("\\d+(?:\\.\\d+)?\\s*([\\uAC00-\\uD7A3].*)$");

    private final FoodApiClient foodApiClient;
    private final FoodApiProperties foodApiProperties;
    private final RecipeIngestRepository repository;
    private final TransactionTemplate transactionTemplate;

    public RecipeIngestService(
            FoodApiClient foodApiClient,
            FoodApiProperties foodApiProperties,
            RecipeIngestRepository repository,
            TransactionTemplate transactionTemplate
    ) {
        this.foodApiClient = foodApiClient;
        this.foodApiProperties = foodApiProperties;
        this.repository = repository;
        this.transactionTemplate = transactionTemplate;
    }

    public java.util.Map<String, Object> getJobStatus(long jobId) {
        return repository.getJobStatus(jobId);
    }

    public long startReparseAsync() {
        long jobId = repository.createReparseJob();
        CompletableFuture.runAsync(() -> doReparse(jobId));
        return jobId;
    }

    private void doReparse(long jobId) {
        try {
            List<String> bodies = repository.findAllRawResponseBodies();
            int savedCount = 0;
            int totalFetched = 0;
            for (String body : bodies) {
                FoodApiResponse response = foodApiClient.parseXml(body);
                if (response.getRows() == null) continue;
                for (FoodRecipeRow row : response.getRows()) {
                    if (!hasText(row.getRecipeSeq()) || !hasText(row.getName())) continue;
                    transactionTemplate.executeWithoutResult(status -> saveRecipeRow(row));
                    savedCount++;
                }
                totalFetched += response.getRows().size();
                repository.updateJobProgress(jobId, totalFetched, savedCount);
            }
            repository.markJobSuccess(jobId, totalFetched, savedCount);
        } catch (RuntimeException e) {
            repository.markJobFailed(jobId, e.getMessage());
        }
    }

    public RecipeIngestResult ingestRecipes(int startIdx, int endIdx) {
        validateRange(startIdx, endIdx);
        long jobId = repository.createIngestJob(foodApiProperties.getServiceId(), startIdx, endIdx);

        try {
            FoodApiFetchResult fetchResult = foodApiClient.fetchRecipes(startIdx, endIdx);
            repository.saveRawResponse(jobId, fetchResult.requestUrl(), fetchResult.rawBody(), 200);

            FoodApiResponse response = fetchResult.response();
            validateApiResult(response);
            int savedCount = 0;
            for (FoodRecipeRow row : response.getRows()) {
                if (!hasText(row.getRecipeSeq()) || !hasText(row.getName())) {
                    continue;
                }
                transactionTemplate.executeWithoutResult(status -> saveRecipeRow(row));
                savedCount++;
            }

            repository.markJobSuccess(jobId, response.getTotalCount(), savedCount);
            return new RecipeIngestResult(
                    jobId,
                    startIdx,
                    endIdx,
                    response.getTotalCount(),
                    response.getRows().size(),
                    savedCount
            );
        } catch (RuntimeException e) {
            repository.markJobFailed(jobId, e.getMessage());
            throw e;
        }
    }

    private void saveRecipeRow(FoodRecipeRow row) {
        long recipeId = repository.upsertRecipe(row);
        repository.replaceRecipeIngredients(recipeId, parseIngredients(row.getIngredientText()));
        List<RecipeStepPayload> steps = row.toStepPayloads();
        repository.replaceRecipeSteps(recipeId, steps);
        repository.replaceRecipeImages(recipeId, collectImages(row, steps));
    }

    private static void validateApiResult(FoodApiResponse response) {
        if (response.getResult() == null || !hasText(response.getResult().getCode())) {
            return;
        }
        String code = response.getResult().getCode().trim();
        if (!"INFO-000".equals(code)) {
            throw new IllegalStateException("Food API returned " + code + ": " + response.getResult().getMessage());
        }
    }

    private static void validateRange(int startIdx, int endIdx) {
        if (startIdx < 1) {
            throw new IllegalArgumentException("startIdx must be greater than or equal to 1.");
        }
        if (endIdx < startIdx) {
            throw new IllegalArgumentException("endIdx must be greater than or equal to startIdx.");
        }
    }

    private static List<ParsedIngredient> parseIngredients(String ingredientText) {
        if (!hasText(ingredientText)) {
            return List.of();
        }

        String normalized = ingredientText
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("<br\\s*/?>", "\n")
                .replace('●', '\n')
                .replace('▶', '\n')
                .replace('◆', '\n')
                .replace('■', '\n')
                .replace('，', ',')
                .replace('ㆍ', ',')
                .replace('·', ',');
        List<String> parts = splitRespectingParens(normalized);
        List<ParsedIngredient> ingredients = new ArrayList<>();
        int order = 1;
        String carrySection = null;
        for (String part : parts) {
            String partTrimmed = part.trim();
            if (!hasText(partTrimmed)) {
                continue;
            }

            SectionedText sectioned = extractSection(partTrimmed);
            String ingredientRaw = sectioned.ingredientRaw();

            if (!hasText(ingredientRaw)) {
                // 순수 섹션 헤더 → 이후 재료에 섹션 이어주기
                if (sectioned.section() != null) {
                    carrySection = normalizeSection(sectioned.section());
                }
                continue;
            }

            // 인라인 섹션이 있으면 그걸 쓰고, 없으면 carry-forward; 어느 쪽이든 이후 항목에 이어줌
            String section = sectioned.section() != null
                    ? normalizeSection(sectioned.section())
                    : carrySection;
            if (section != null) {
                carrySection = section;
            }

            Matcher matcher = INGREDIENT_AMOUNT_PATTERN.matcher(ingredientRaw);
            BigDecimal quantity = null;
            String unit = null;
            if (matcher.find()) {
                quantity = new BigDecimal(matcher.group(1));
                unit = trimToNull(matcher.group(2));
            }
            String name = ingredientRaw.replaceAll("\\([^)]*\\)", " ")
                    .replaceAll(INGREDIENT_AMOUNT_PATTERN.pattern(), " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!hasText(name)) {
                name = ingredientRaw;
            }
            ingredients.add(new ParsedIngredient(name, partTrimmed, ingredientRaw, quantity, unit, order++, section));
        }
        return ingredients;
    }

    /**
     * 재료 텍스트 한 항목에서 섹션 라벨과 재료 원문을 분리한다.
     *
     * 처리 패턴:
     *   [양념] 간장        → section="양념",    ingredientRaw="간장"
     *   주재료 : 소면      → section="주재료",  ingredientRaw="소면"
     *   방울토마토 소박이 : → section="방울토마토 소박이", ingredientRaw="" (스킵 대상)
     *   그릭요거트 > 그릭요거트 → section="그릭요거트 토핑", ingredientRaw="그릭요거트"
     *   - 곁들임  어린잎   → section="곁들임",  ingredientRaw="어린잎"
     *   소금 1작은술       → section=null,       ingredientRaw="소금 1작은술"
     */
    private static SectionedText extractSection(String part) {
        // HTML 태그 제거 (<br>, <b> 등 잔여 태그)
        String cleaned = HTML_TAG.matcher(part).replaceAll("").trim();

        // [대괄호] 섹션 라벨
        Matcher m = BRACKET_SECTION.matcher(cleaned);
        if (m.matches()) {
            return new SectionedText(trimToNull(m.group(1)), m.group(2).trim());
        }

        // 앞 특수문자 제거 (-, •, ●, ▶ 등)
        String stripped = LEADING_SPECIAL.matcher(cleaned).replaceFirst("").trim();

        // "섹션 : 재료" 패턴 (공백-콜론-공백)
        m = COLON_SECTION.matcher(stripped);
        if (m.matches()) {
            return new SectionedText(trimToNull(m.group(1)), m.group(2).trim());
        }

        // "섹션 :" 패턴 (재료 없는 순수 섹션 헤더 → ingredientRaw="" 로 반환하면 호출부에서 스킵)
        m = TRAILING_COLON.matcher(stripped);
        if (m.matches()) {
            return new SectionedText(trimToNull(m.group(1)), "");
        }

        // "섹션 > 재료" 패턴
        m = GT_SECTION.matcher(stripped);
        if (m.matches()) {
            return new SectionedText(trimToNull(m.group(1)), m.group(2).trim());
        }

        // "섹션  재료" 패턴 (더블 스페이스 구분, 단어 하나짜리 섹션)
        m = DOUBLE_SPACE_SECTION.matcher(stripped);
        if (m.matches()) {
            return new SectionedText(trimToNull(m.group(1)), m.group(2).trim());
        }

        // 섹션 없음
        return new SectionedText(null, stripped);
    }

    private record SectionedText(String section, String ingredientRaw) {}

    /**
     * 다양한 표기의 섹션명을 표준 명칭으로 정규화한다.
     *   "적양파 양념", "고추장소스", "드레싱"  → "양념장"
     *   "필수재료", "주재료", "XXX 재료"       → "주재료"
     *   "멸치육수", "국물"                     → "육수"
     *   "곁들임채소", "장식", "고명"            → "고명"
     *   "2인분" 등 인분 단위                   → null
     */
    private static String normalizeSection(String raw) {
        if (raw == null) return null;
        String s = raw.trim();

        // "소금 0.38김치조림" 처럼 숫자 뒤에 한글 섹션명이 붙어있는 경우 → 한글 부분만 추출
        Matcher polluted = POLLUTED_SECTION.matcher(s);
        if (polluted.find()) {
            s = polluted.group(1).trim();
        }

        String compact = s.replaceAll("\\s+", "").toLowerCase();

        if (compact.matches("\\d+인분")) return null;

        if (compact.endsWith("양념") || compact.endsWith("양념장")
                || compact.endsWith("소스") || compact.endsWith("드레싱")) return "양념장";

        if (compact.equals("주재료") || compact.equals("필수재료")
                || compact.endsWith("재료")) return "주재료";

        if (compact.endsWith("육수") || compact.endsWith("국물")) return "육수";

        if (compact.equals("고명") || compact.equals("장식")
                || compact.startsWith("곁들임") || compact.equals("곁들이채소")) return "고명";

        return s;
    }

    private static List<RecipeImagePayload> collectImages(FoodRecipeRow row, List<RecipeStepPayload> steps) {
        List<RecipeImagePayload> images = new ArrayList<>();
        if (hasText(row.getMainImageUrl())) {
            images.add(new RecipeImagePayload("MAIN", row.getMainImageUrl().trim(), 1));
        }
        if (hasText(row.getThumbnailImageUrl())) {
            images.add(new RecipeImagePayload("THUMBNAIL", row.getThumbnailImageUrl().trim(), 2));
        }
        for (RecipeStepPayload step : steps) {
            if (hasText(step.imageUrl())) {
                images.add(new RecipeImagePayload("STEP", step.imageUrl().trim(), step.stepNo()));
            }
        }
        return images;
    }

    private static List<String> splitRespectingParens(String text) {
        List<String> result = new ArrayList<>();
        int depth = 0;
        int start = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(' || c == '[') {
                depth++;
            } else if (c == ')' || c == ']') {
                if (depth > 0) depth--;
            } else if (depth == 0 && (c == ',' || c == ';' || c == '\n')) {
                String part = text.substring(start, i).trim();
                if (!part.isEmpty()) result.add(part);
                start = i + 1;
            }
        }
        String last = text.substring(start).trim();
        if (!last.isEmpty()) result.add(last);
        return result;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String trimToNull(String value) {
        return hasText(value) ? value.trim() : null;
    }
}
