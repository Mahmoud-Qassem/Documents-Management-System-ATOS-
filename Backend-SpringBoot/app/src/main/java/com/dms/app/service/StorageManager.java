package com.dms.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Component
@Slf4j
public class StorageManager {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public StorageManager(S3Client s3Client) {
        this.s3Client = s3Client;
    }


    // Creates a folder "prefix" on S3 (note: S3 has no real folders)
    public void createFolder(String folderPath) {
//        if (!folderPath.endsWith("/")) {
//            folderPath += "/";
//        }
//
//        try {
//            PutObjectRequest request = PutObjectRequest.builder()
//                    .bucket(bucket)
//                    .key(folderPath)
//                    .build();
//
//            // upload empty object to represent folder
//            s3Client.putObject(request, RequestBody.empty());
//            log.info("Folder created: {}", folderPath);
//
//        } catch (Exception e) {
//            log.error("Failed to create folder: {}", folderPath, e);
//        }
    }

    public void deleteFolder(String folderPath) {
        if (!folderPath.endsWith("/")) {
            folderPath += "/";
        }

        try {
            // list all objects under folder
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucket)
                    .prefix(folderPath)
                    .build();

            ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);

            // batch delete
            List<ObjectIdentifier> objectsToDelete = listRes.contents().stream()
                    .map(s3Object -> ObjectIdentifier.builder().key(s3Object.key()).build())
                    .toList();

            if (!objectsToDelete.isEmpty()) {
                DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                        .bucket(bucket)
                        .delete(Delete.builder().objects(objectsToDelete).build())
                        .build();

                s3Client.deleteObjects(deleteRequest);
            }

            log.info("Folder deleted: {}", folderPath);

        } catch (Exception e) {
            log.error("Failed to delete folder: {}", folderPath, e);
        }
    }

    public long getFolderSize(String folderPath) {
        if (!folderPath.endsWith("/"))
            folderPath += "/";

        try {
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucket)
                    .prefix(folderPath)
                    .build();

            ListObjectsV2Response res = s3Client.listObjectsV2(listReq);

            return res.contents().stream()
                    .mapToLong(S3Object::size)
                    .sum();

        } catch (Exception e) {
            log.error("Cannot calculate folder size for: {}", folderPath, e);
            return 0L;
        }
    }


    public void saveFile(String key, MultipartFile file) throws IOException {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

        } catch (Exception e) {
            throw new IOException("Failed to upload file to S3: " + key, e);
        }
    }

    public void deleteFile(String key) throws IOException {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);

        } catch (Exception e) {
            throw new IOException("Failed to delete file: " + key, e);
        }
    }

    public InputStream getFileStream(String key) throws IOException {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            ResponseInputStream<GetObjectResponse> stream =
                    s3Client.getObject(request);

            return stream;
        } catch (Exception e) {
            throw new IOException("Failed to read file stream: " + key, e);
        }
    }


    public byte[] readFileBytes(String key) throws IOException {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            ResponseBytes<GetObjectResponse> bytes =
                    s3Client.getObjectAsBytes(request);

            return bytes.asByteArray();

        } catch (Exception e) {
            throw new IOException("Failed to read file: " + key, e);
        }
    }

    public long getFileSize(String key) throws IOException {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            HeadObjectResponse response = s3Client.headObject(request);

            return response.contentLength();

        } catch (Exception e) {
            throw new IOException("Unable to read size for file: " + key, e);
        }
    }
}

//public class StorageManager {
//
//    public void createFolder(String absolutePath){
//        try {
//            Files.createDirectories(Paths.get(absolutePath));
//        } catch (IOException e) {
//            log.error("Failed to create folder: {}", absolutePath, e);
//        }
//    }
//    public long getFolderSize(String absolutePath) {
//        Path folderPath = Paths.get(absolutePath);
//
//        if (!Files.exists(folderPath)) {
//            return 0L;
//        }
//
//        try (Stream<Path> walk = Files.walk(folderPath)) {
//            return walk
//                    .filter(Files::isRegularFile)                // count files only
//                    .mapToLong(path -> {
//                        try {
//                            return Files.size(path);             // get file size safely
//                        } catch (IOException e) {
//                            return 0L;                           // ignore unreadable files
//                        }
//                    })
//                    .sum();
//        } catch (IOException e) {
//            return 0L;                                           // folder not readable → size = 0
//        }
//    }
//
//
//    public void deleteFolder(String absolutePath) throws IOException {
//        Files.deleteIfExists(Paths.get(absolutePath));
//    }
//
//    public void saveFile(String absolutePath, MultipartFile file) throws IOException {
//        Path path = Paths.get(absolutePath);
//        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
//    }
//
//    public void deleteFile(String absolutePath) throws IOException {
//        Files.deleteIfExists(Paths.get(absolutePath));
//    }
//
//    public File getFile(String absolutePath) {
//        return new File(absolutePath);
//    }
//
//    public byte[] readFileBytes(String absolutePath) throws IOException {
//        return Files.readAllBytes(Paths.get(absolutePath));
//    }
//
//    public long getFileSize(String absolutePath) throws IOException {
//        return Files.size(Paths.get(absolutePath));
//    }
//}
