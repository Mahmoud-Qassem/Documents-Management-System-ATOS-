package com.dms.app.controller;

import com.dms.app.model.Folder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/folders")
public class FolderController {

    @GetMapping
    public ResponseEntity<List<Folder>> getDocuments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return ResponseEntity.ok(List.of(new Folder(1, "folder1"), new Folder(2, "folder2"), new Folder(3, "folder3")));
    }

    // get the owner of the folder
    // endpoint /api/folders/owner/{folderId}
    @GetMapping("/owner/{folderId}")
    public ResponseEntity<Map<String, Object>> folderOwner(@PathVariable String folderId ){
        Map<String, Object>response = new HashMap<>();
        response.put("ownerName", "owner"+folderId);
        return ResponseEntity.ok(response);
    }
    // api POST http://localhost:8080/api/folders
    @PostMapping
    public String createFolder(){
        return "folder created";
    }
    @DeleteMapping
    public String deleteFolder(){
        return "folder deleted";
    }
    @PutMapping
    public String updateFolder(){
        return "folder updated";
    }

}
