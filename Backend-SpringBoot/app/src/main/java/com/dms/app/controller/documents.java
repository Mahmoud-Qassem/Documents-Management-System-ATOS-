package com.dms.app.controller;

import com.dms.app.model.Document;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class documents {

    @GetMapping("/{userEmail}")
    public ResponseEntity<List<Document>> getDocuments(@RequestParam String userEmail ) {
        return ResponseEntity.ok(List.of(new Document("file1", "txt")));
    }


}
