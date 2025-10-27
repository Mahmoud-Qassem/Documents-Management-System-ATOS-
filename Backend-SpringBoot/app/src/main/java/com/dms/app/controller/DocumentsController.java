package com.dms.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/documents")
public class DocumentsController {

    @GetMapping
    public String getDocuments() {
        return "Documents";
    }
}
