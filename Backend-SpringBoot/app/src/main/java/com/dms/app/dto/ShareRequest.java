package com.dms.app.dto;

import lombok.Data;

@Data
public class ShareRequest {
    private String targetUserEmail;
    private String permission;
}