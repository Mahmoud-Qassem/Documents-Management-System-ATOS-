package com.dms.app.interfaces;
import org.springframework.core.io.Resource;

public record FilePreview(Resource resource, String mimeType) implements PreviewResponse {}
