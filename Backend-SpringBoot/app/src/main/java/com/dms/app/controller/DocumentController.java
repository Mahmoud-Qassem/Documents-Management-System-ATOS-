package com.dms.app.controller;

import com.dms.app.model.Document;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @GetMapping("/{folderId}")
    public ResponseEntity<List<Document>> getDocuments(@PathVariable("folderId") Long folderId ) {
        return ResponseEntity.ok(List.of(new Document("file1", "txt")));
    }

    // api POST http://localhost:8080/api/documents
    @PostMapping
    public String createDocument(){
        return "document created";
    }
    @DeleteMapping
    public String deleteDocument(){
        return "document deleted";
    }
    @PutMapping
    public String updateDocument(){
        return "document updated";
    }


}
