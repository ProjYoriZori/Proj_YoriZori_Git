package com.yorizori.recipe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@JacksonXmlRootElement(localName = "COOKRCP01")
public class FoodApiResponse {

    @JsonProperty("total_count")
    private Integer totalCount;

    @JacksonXmlProperty(localName = "RESULT")
    private FoodApiResult result;

    @JacksonXmlProperty(localName = "row")
    @JacksonXmlElementWrapper(useWrapping = false)
    private List<FoodRecipeRow> rows = new ArrayList<>();

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer totalCount) {
        this.totalCount = totalCount;
    }

    public FoodApiResult getResult() {
        return result;
    }

    public void setResult(FoodApiResult result) {
        this.result = result;
    }

    public List<FoodRecipeRow> getRows() {
        return rows == null ? List.of() : rows;
    }

    public void setRows(List<FoodRecipeRow> rows) {
        this.rows = rows;
    }
}
