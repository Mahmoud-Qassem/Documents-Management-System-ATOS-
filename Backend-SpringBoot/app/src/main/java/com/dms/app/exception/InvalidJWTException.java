package com.dms.app.exception;

public class InvalidJWTException extends Exception{
    public InvalidJWTException(String message) {
        super(message);
    }
}
