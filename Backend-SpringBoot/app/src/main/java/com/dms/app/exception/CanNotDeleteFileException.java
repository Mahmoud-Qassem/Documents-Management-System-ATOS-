package com.dms.app.exception;

public class CanNotDeleteFileException extends RuntimeException {
    public CanNotDeleteFileException(String message) {
        super(message);
    }
}
