package com.dms.app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/*
export interface SharedFile {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  ownerName?: string;
  createdAt?: string | Date;
  permission?: SharePermission;
}
 */
@Data
@Builder
public class SharedFile {
    private String id;
    private String name;
    private String type;
    private Long size;
    private String ownerName;
    private LocalDateTime createdAt;
    private String permission;
}
