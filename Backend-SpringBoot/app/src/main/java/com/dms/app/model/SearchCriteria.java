package com.dms.app.model;

import lombok.*;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SearchCriteria {

    private String name;
    private String type;
    private String folderId;
    private boolean deleted;
    private int page;
    private int size;
    private String sort;
    private String dir;
    public boolean getDeleted(){
        return deleted;
    }
}

    /*
     @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String folderId,
            @RequestParam(defaultValue = "false") boolean deleted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String dir,
     */
