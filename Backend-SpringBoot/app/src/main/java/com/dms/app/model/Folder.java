package com.dms.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;


@Document(collection = "folders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Folder extends MongoBaseEntity {

    private String id;
    private String name;
    @JsonIgnore
    private String path;
    private String parentId;
    @JsonIgnore
    private boolean deleted;
    private Long size;
    private String ownerName;
    private String ownerId;
}
