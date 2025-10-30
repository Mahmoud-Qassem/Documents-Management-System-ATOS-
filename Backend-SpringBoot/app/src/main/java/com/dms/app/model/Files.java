package com.dms.app.model;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import org.springframework.data.annotation.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EnableMongoAuditing
public class Files extends MongoBaseEntity {

    @Id
    private String id;

    private String name;
    private String type;
    private Long size;
    private String folderId;
    private String filePath;
    private boolean deleted;
    private String ownerId;
    private String ownerName;
}
