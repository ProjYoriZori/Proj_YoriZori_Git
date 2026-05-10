package com.yorizori.foodapi;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.yorizori.recipe.dto.FoodApiResponse;
import java.net.URI;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class FoodApiClient {

    private final FoodApiProperties properties;
    private final RestClient restClient;
    private final XmlMapper xmlMapper;

    public FoodApiClient(FoodApiProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectTimeout());
        requestFactory.setReadTimeout(properties.getReadTimeout());
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
        this.xmlMapper = new XmlMapper();
    }

    public FoodApiFetchResult fetchRecipes(int startIdx, int endIdx) {
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .pathSegment("api", properties.getApiKey(), properties.getServiceId(), properties.getDataType(),
                        String.valueOf(startIdx), String.valueOf(endIdx))
                .build()
                .toUri();

        String rawBody = restClient.get()
                .uri(uri)
                .retrieve()
                .body(String.class);

        return new FoodApiFetchResult(uri.toString(), rawBody, readResponse(rawBody));
    }

    private FoodApiResponse readResponse(String rawBody) {
        try {
            return xmlMapper.readValue(rawBody, FoodApiResponse.class);
        } catch (JsonProcessingException e) {
            throw new FoodApiParseException("Failed to parse food API XML response.", e);
        }
    }
}
