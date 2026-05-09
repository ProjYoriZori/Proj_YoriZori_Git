package com.yorizori.recipe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FoodRecipeRow {

    @JsonProperty("RCP_SEQ")
    private String recipeSeq;

    @JsonProperty("RCP_NM")
    private String name;

    @JsonProperty("RCP_WAY2")
    private String cookingMethod;

    @JsonProperty("RCP_PAT2")
    private String category;

    @JsonProperty("INFO_WGT")
    private String weight;

    @JsonProperty("INFO_ENG")
    private String calorie;

    @JsonProperty("INFO_CAR")
    private String carbohydrate;

    @JsonProperty("INFO_PRO")
    private String protein;

    @JsonProperty("INFO_FAT")
    private String fat;

    @JsonProperty("INFO_NA")
    private String sodium;

    @JsonProperty("HASH_TAG")
    private String hashTag;

    @JsonProperty("ATT_FILE_NO_MAIN")
    private String mainImageUrl;

    @JsonProperty("ATT_FILE_NO_MK")
    private String thumbnailImageUrl;

    @JsonProperty("RCP_PARTS_DTLS")
    private String ingredientText;

    @JsonProperty("RCP_NA_TIP")
    private String sodiumTip;

    @JsonProperty("MANUAL01")
    private String manual01;
    @JsonProperty("MANUAL02")
    private String manual02;
    @JsonProperty("MANUAL03")
    private String manual03;
    @JsonProperty("MANUAL04")
    private String manual04;
    @JsonProperty("MANUAL05")
    private String manual05;
    @JsonProperty("MANUAL06")
    private String manual06;
    @JsonProperty("MANUAL07")
    private String manual07;
    @JsonProperty("MANUAL08")
    private String manual08;
    @JsonProperty("MANUAL09")
    private String manual09;
    @JsonProperty("MANUAL10")
    private String manual10;
    @JsonProperty("MANUAL11")
    private String manual11;
    @JsonProperty("MANUAL12")
    private String manual12;
    @JsonProperty("MANUAL13")
    private String manual13;
    @JsonProperty("MANUAL14")
    private String manual14;
    @JsonProperty("MANUAL15")
    private String manual15;
    @JsonProperty("MANUAL16")
    private String manual16;
    @JsonProperty("MANUAL17")
    private String manual17;
    @JsonProperty("MANUAL18")
    private String manual18;
    @JsonProperty("MANUAL19")
    private String manual19;
    @JsonProperty("MANUAL20")
    private String manual20;

    @JsonProperty("MANUAL_IMG01")
    private String manualImage01;
    @JsonProperty("MANUAL_IMG02")
    private String manualImage02;
    @JsonProperty("MANUAL_IMG03")
    private String manualImage03;
    @JsonProperty("MANUAL_IMG04")
    private String manualImage04;
    @JsonProperty("MANUAL_IMG05")
    private String manualImage05;
    @JsonProperty("MANUAL_IMG06")
    private String manualImage06;
    @JsonProperty("MANUAL_IMG07")
    private String manualImage07;
    @JsonProperty("MANUAL_IMG08")
    private String manualImage08;
    @JsonProperty("MANUAL_IMG09")
    private String manualImage09;
    @JsonProperty("MANUAL_IMG10")
    private String manualImage10;
    @JsonProperty("MANUAL_IMG11")
    private String manualImage11;
    @JsonProperty("MANUAL_IMG12")
    private String manualImage12;
    @JsonProperty("MANUAL_IMG13")
    private String manualImage13;
    @JsonProperty("MANUAL_IMG14")
    private String manualImage14;
    @JsonProperty("MANUAL_IMG15")
    private String manualImage15;
    @JsonProperty("MANUAL_IMG16")
    private String manualImage16;
    @JsonProperty("MANUAL_IMG17")
    private String manualImage17;
    @JsonProperty("MANUAL_IMG18")
    private String manualImage18;
    @JsonProperty("MANUAL_IMG19")
    private String manualImage19;
    @JsonProperty("MANUAL_IMG20")
    private String manualImage20;

    public List<RecipeStepPayload> toStepPayloads() {
        List<RecipeStepPayload> steps = new ArrayList<>();
        String[] manuals = {
                manual01, manual02, manual03, manual04, manual05,
                manual06, manual07, manual08, manual09, manual10,
                manual11, manual12, manual13, manual14, manual15,
                manual16, manual17, manual18, manual19, manual20
        };
        String[] images = {
                manualImage01, manualImage02, manualImage03, manualImage04, manualImage05,
                manualImage06, manualImage07, manualImage08, manualImage09, manualImage10,
                manualImage11, manualImage12, manualImage13, manualImage14, manualImage15,
                manualImage16, manualImage17, manualImage18, manualImage19, manualImage20
        };

        for (int i = 0; i < manuals.length; i++) {
            if (hasText(manuals[i])) {
                steps.add(new RecipeStepPayload(i + 1, manuals[i].trim(), trimToNull(images[i])));
            }
        }
        return steps;
    }

    public String getRecipeSeq() {
        return recipeSeq;
    }

    public void setRecipeSeq(String recipeSeq) {
        this.recipeSeq = recipeSeq;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCookingMethod() {
        return cookingMethod;
    }

    public void setCookingMethod(String cookingMethod) {
        this.cookingMethod = cookingMethod;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public String getCalorie() {
        return calorie;
    }

    public void setCalorie(String calorie) {
        this.calorie = calorie;
    }

    public String getCarbohydrate() {
        return carbohydrate;
    }

    public void setCarbohydrate(String carbohydrate) {
        this.carbohydrate = carbohydrate;
    }

    public String getProtein() {
        return protein;
    }

    public void setProtein(String protein) {
        this.protein = protein;
    }

    public String getFat() {
        return fat;
    }

    public void setFat(String fat) {
        this.fat = fat;
    }

    public String getSodium() {
        return sodium;
    }

    public void setSodium(String sodium) {
        this.sodium = sodium;
    }

    public String getHashTag() {
        return hashTag;
    }

    public void setHashTag(String hashTag) {
        this.hashTag = hashTag;
    }

    public String getMainImageUrl() {
        return mainImageUrl;
    }

    public void setMainImageUrl(String mainImageUrl) {
        this.mainImageUrl = mainImageUrl;
    }

    public String getThumbnailImageUrl() {
        return thumbnailImageUrl;
    }

    public void setThumbnailImageUrl(String thumbnailImageUrl) {
        this.thumbnailImageUrl = thumbnailImageUrl;
    }

    public String getIngredientText() {
        return ingredientText;
    }

    public void setIngredientText(String ingredientText) {
        this.ingredientText = ingredientText;
    }

    public String getSodiumTip() {
        return sodiumTip;
    }

    public void setSodiumTip(String sodiumTip) {
        this.sodiumTip = sodiumTip;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String trimToNull(String value) {
        return hasText(value) ? value.trim() : null;
    }
}
