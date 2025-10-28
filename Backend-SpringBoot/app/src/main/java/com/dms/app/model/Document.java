package com.dms.app.model;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;

//@Document(collection = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Document {

//    @Id
//    private String id;
//
    private String name;
    private String type;

//    private String workspaceId;
//    private String fileUrl; // or S3 path, etc.
//    private boolean deleted = false;
//
//    // Link to owner (NID from SQL user table)
//    private String ownerNid;
//
//    // Public / private mode
//    private String visibility; // "PUBLIC" or "PRIVATE"
//
//    // Access control list
//    private List<AccessPermission> permissions = new ArrayList<>();
//
//    private LocalDateTime createdAt;
//    private LocalDateTime updatedAt;
}
