package com.dms.app.exception;

public class CanNotCreateFolderException extends RuntimeException{
    public CanNotCreateFolderException(String message) {
        super(message);
    }
}