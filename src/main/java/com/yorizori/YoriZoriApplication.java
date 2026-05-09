package com.yorizori;

import com.yorizori.foodapi.FoodApiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(FoodApiProperties.class)
public class YoriZoriApplication {

    public static void main(String[] args) {
        SpringApplication.run(YoriZoriApplication.class, args);
    }
}
