package com.dms.app.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Response {

    private String statusCode;
    private String error;
    private String message;
    private LocalDateTime timestamp;

    public static Response success(String message) {
        return Response.builder()
                .statusCode(String.valueOf(200))
                .error(null)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static Response error(int statusCode, String error, String message) {
        return Response.builder()
                .statusCode(String.valueOf(statusCode))
                .error(error)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
