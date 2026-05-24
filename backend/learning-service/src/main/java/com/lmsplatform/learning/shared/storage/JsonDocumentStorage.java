package com.lmsplatform.learning.shared.storage;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

@Service
public class JsonDocumentStorage {
    private final S3Client s3;
    private final ObjectMapper objectMapper;
    private final String bucket;

    public JsonDocumentStorage(S3Client s3, ObjectMapper objectMapper, @Value("${s3.bucket}") String bucket) {
        this.s3 = s3;
        this.objectMapper = objectMapper;
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException ex) {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        } catch (Exception ignored) {
            // The first read/write will fail explicitly if storage is still unavailable.
        }
    }

    public <T> void put(String key, T document) {
        try {
            var json = objectMapper.writeValueAsString(document);
            s3.putObject(PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType("application/json")
                            .build(),
                    RequestBody.fromString(json));
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot write JSON document to S3: " + key, ex);
        }
    }

    public <T> T get(String key, Class<T> type) {
        try {
            ResponseBytes<GetObjectResponse> bytes = s3.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            return objectMapper.readValue(bytes.asByteArray(), type);
        } catch (NoSuchKeyException ex) {
            return null;
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot read JSON document from S3: " + key, ex);
        }
    }
}
