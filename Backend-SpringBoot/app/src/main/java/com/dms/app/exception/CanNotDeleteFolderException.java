package com.dms.app.exception;

public class CanNotDeleteFolderException extends RuntimeException{
    public CanNotDeleteFolderException(String message) {
        super(message);
    }
}