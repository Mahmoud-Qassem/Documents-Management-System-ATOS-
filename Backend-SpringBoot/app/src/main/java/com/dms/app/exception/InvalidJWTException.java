package com.dms.app.exception;

public class InvalidJWTException extends RuntimeException{
    public InvalidJWTException(String message) {
        super(message);
    }
}
