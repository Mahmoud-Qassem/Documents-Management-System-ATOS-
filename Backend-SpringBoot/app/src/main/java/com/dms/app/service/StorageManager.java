package com.dms.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Stream;

@Component
@Slf4j
public class StorageManager {

    public void createFolder(String absolutePath){
        try {
            Files.createDirectories(Paths.get(absolutePath));
        } catch (IOException e) {
            log.error("Failed to create folder: {}", absolutePath, e);
        }
    }
    public long getFolderSize(String absolutePath) {
        Path folderPath = Paths.get(absolutePath);

        if (!Files.exists(folderPath)) {
            return 0L;
        }

        try (Stream<Path> walk = Files.walk(folderPath)) {
            return walk
                    .filter(Files::isRegularFile)                // count files only
                    .mapToLong(path -> {
                        try {
                            return Files.size(path);             // get file size safely
                        } catch (IOException e) {
                            return 0L;                           // ignore unreadable files
                        }
                    })
                    .sum();
        } catch (IOException e) {
            return 0L;                                           // folder not readable → size = 0
        }
    }


    public void deleteFolder(String absolutePath) throws IOException {
        Files.deleteIfExists(Paths.get(absolutePath));
    }

    public void saveFile(String absolutePath, MultipartFile file) throws IOException {
        Path path = Paths.get(absolutePath);
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
    }

    public void deleteFile(String absolutePath) throws IOException {
        Files.deleteIfExists(Paths.get(absolutePath));
    }

    public File getFile(String absolutePath) {
        return new File(absolutePath);
    }

    public byte[] readFileBytes(String absolutePath) throws IOException {
        return Files.readAllBytes(Paths.get(absolutePath));
    }

    public long getFileSize(String absolutePath) throws IOException {
        return Files.size(Paths.get(absolutePath));
    }
}
