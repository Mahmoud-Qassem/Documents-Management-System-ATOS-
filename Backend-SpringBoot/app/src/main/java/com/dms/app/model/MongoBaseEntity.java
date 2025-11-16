package com.dms.app.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
public abstract class MongoBaseEntity {

    @CreatedDate
    @Field("created_at")
//    @JsonIgnore
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Field("updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @JsonIgnore
    @Field("created_by")
    private String createdBy;

    @LastModifiedBy
    @JsonIgnore
    @Field("updated_by")
    private String updatedBy;
}
