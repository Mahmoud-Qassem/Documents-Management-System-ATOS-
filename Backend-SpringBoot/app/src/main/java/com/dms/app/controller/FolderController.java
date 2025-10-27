package com.dms.app.controller;

import com.dms.app.model.Folder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Slf4j
@RestController
@RequestMapping("/api/folders")
public class FolderController {

    @GetMapping
    public ResponseEntity<List<Folder>> getDocuments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return ResponseEntity.ok(List.of(new Folder(1, "folder1"), new Folder(2, "folder2"), new Folder(3, "folder3")));
    }
}
