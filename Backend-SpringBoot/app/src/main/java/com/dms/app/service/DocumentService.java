package com.dms.app.service;

import com.dms.app.model.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DocumentService {

    public List<Document> getDocumentsForEmail(String email) {
        return List.of();
    }
}
