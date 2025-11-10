package com.dms.app.service;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;


@Component
public class StorageManager {

    public void createFolder(String absolutePath) throws IOException {
        Files.createDirectories(Paths.get(absolutePath));
    }

    public void deleteFolder(String absolutePath) throws IOException {
        Files.deleteIfExists(Paths.get(absolutePath));
    }


    public void saveFile(String absolutePath, MultipartFile file) throws IOException {
        Path path = Paths.get(absolutePath);
        //static Path copy(Path src, Path dest, CopyOption ... how)throws IOException
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
    }

    public void deleteFile(String absolutePath) throws IOException {
        Files.deleteIfExists(Paths.get(absolutePath));
    }

    public File getFile(String absolutePath) {
        File file = new File(absolutePath);
        return file;
    }
}
