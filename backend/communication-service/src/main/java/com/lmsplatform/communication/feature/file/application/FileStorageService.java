package com.lmsplatform.communication.feature.file.application;

import com.lmsplatform.communication.feature.file.domain.FileDto;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {
    private final JdbcTemplate jdbc;
    private final S3Client s3;
    private final String bucket;

    public FileStorageService(JdbcTemplate jdbc, S3Client s3, @Value("${s3.bucket}") String bucket) {
        this.jdbc = jdbc;
        this.s3 = s3;
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException ex) {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        } catch (Exception ignored) {
            // Uploads will fail explicitly if S3 storage is still unavailable.
        }
    }

    public FileDto upload(MultipartFile file, UUID ownerUserId, UUID organizationId, String accessLevel) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        var id = UUID.randomUUID();
        var key = id + "/" + file.getOriginalFilename();
        s3.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes()));
        jdbc.update("""
                        INSERT INTO communication.files (id, owner_user_id, organization_id, bucket, object_key, original_name, content_type, size_bytes, access_level)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, id, ownerUserId, organizationId, bucket, key, file.getOriginalFilename(),
                file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                file.getSize(), accessLevel);
        return new FileDto(id, ownerUserId, organizationId, bucket, key, file.getOriginalFilename(), file.getContentType(), file.getSize(), accessLevel);
    }

    public record FileContent(InputStream stream, String contentType, long contentLength) {}

    public FileContent download(UUID id) {
        var rows = jdbc.query("""
                SELECT bucket, object_key, content_type, size_bytes
                FROM communication.files
                WHERE id = ?
                """, (rs, rowNum) -> new Object[]{
                rs.getString("bucket"), rs.getString("object_key"),
                rs.getString("content_type"), rs.getLong("size_bytes")
        }, id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        var row = rows.get(0);
        var fileBucket = (String) row[0];
        var key = (String) row[1];
        var contentType = row[2] != null ? (String) row[2] : "application/octet-stream";
        var size = (long) row[3];
        var response = s3.getObject(GetObjectRequest.builder().bucket(fileBucket).key(key).build());
        return new FileContent(response, contentType, size);
    }

    public List<FileDto> list() {
        return jdbc.query("""
                SELECT id, owner_user_id, organization_id, bucket, object_key, original_name, content_type, size_bytes, access_level
                FROM communication.files
                ORDER BY created_at DESC
                LIMIT 100
                """, (rs, rowNum) -> new FileDto(
                rs.getObject("id", UUID.class),
                rs.getObject("owner_user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("bucket"),
                rs.getString("object_key"),
                rs.getString("original_name"),
                rs.getString("content_type"),
                rs.getLong("size_bytes"),
                rs.getString("access_level")
        ));
    }
}
