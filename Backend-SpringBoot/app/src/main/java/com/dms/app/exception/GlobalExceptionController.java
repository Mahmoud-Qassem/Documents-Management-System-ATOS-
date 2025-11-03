package com.dms.app.exception;

import com.dms.app.model.Response;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestControllerAdvice(annotations = RestController.class)
@Order(1)
public class GlobalExceptionController extends ResponseEntityExceptionHandler {


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode statusCode,
            WebRequest request) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .toList();

        Response response = new Response(
                HttpStatus.BAD_REQUEST.value() + "",
                "Validation failed",
                String.join(", ", errors),
                LocalDateTime.now()
        );

        log.warn("Validation failed: {}", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Response> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        Response response = new Response(
                HttpStatus.BAD_REQUEST.value() + "",
                "Invalid input",
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidJWTException.class)
    public ResponseEntity<Response> handleInvalidJwt(InvalidJWTException ex) {
        log.warn("Invalid JWT: {}", ex.getMessage());
        Response response = new Response(
                HttpStatus.UNAUTHORIZED.value() + "",
                "Invalid or expired token",
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }


    @ExceptionHandler({
            CanNotCreateFolderException.class,
            CanNotDeleteFolderException.class,
            CanNotCreateFileException.class,
            CanNotDeleteFileException.class,
            ErrorUploadingFileException.class
    })
    public ResponseEntity<Response> handleFileOrFolderErrors(Exception ex) {
        log.error("Storage operation failed: {}", ex.getMessage(), ex);
        Response response = new Response(
                HttpStatus.INTERNAL_SERVER_ERROR.value() + "",
                "Storage operation failed",
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<Response> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred: {}", ex.getMessage(), ex);
        Response response = new Response(
                HttpStatus.INTERNAL_SERVER_ERROR.value() + "",
                "Internal Server Error",
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
