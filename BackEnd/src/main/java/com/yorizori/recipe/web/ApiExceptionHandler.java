package com.yorizori.recipe.web;

import com.yorizori.foodapi.FoodApiParseException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Invalid request.");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler({RestClientException.class, FoodApiParseException.class})
    public ResponseEntity<Map<String, String>> handleUpstreamFailure(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
    }
}
