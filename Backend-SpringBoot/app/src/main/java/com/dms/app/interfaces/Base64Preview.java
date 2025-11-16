package com.dms.app.interfaces;

// package com.example.dms.service.preview;

public record Base64Preview(
        String mimeType,
        String base64Data,
        String fileName,
        String type
) implements PreviewResponse {}

