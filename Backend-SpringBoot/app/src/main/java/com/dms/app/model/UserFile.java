package com.dms.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Document(collection = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFile extends MongoBaseEntity {

    private String id;

    @NotBlank(message = "File name cannot be empty.")
    @Size(min = 1, max = 150, message = "File name must be between 1 and 150 characters.")
    @Indexed
    private String name;

    @NotBlank(message = "File type is required.")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "File type contains invalid characters.")
    @Indexed
    private String type;

    private Long size;

    @NotBlank(message = "Folder ID is required.")
    @Indexed
    private String folderId;
    @JsonIgnore
    private String filePath;
    @JsonIgnore
    @Indexed
    private boolean deleted = false;
    @Indexed
    private String ownerId;
    private String ownerName;
}
