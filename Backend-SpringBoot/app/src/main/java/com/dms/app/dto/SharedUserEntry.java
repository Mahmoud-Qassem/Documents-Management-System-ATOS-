package com.dms.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SharedUserEntry {
    private String userId;
    private String email;
    private String permission;
    private LocalDateTime sharedAt;
}
