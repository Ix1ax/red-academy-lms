package com.lmsplatform.communication.feature.file.api;

import com.lmsplatform.communication.feature.file.application.FileStorageService;
import com.lmsplatform.communication.feature.file.domain.FileDto;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {
    private final FileStorageService files;

    public FileController(FileStorageService files) {
        this.files = files;
    }

    @PostMapping
    public FileDto upload(@RequestParam("file") MultipartFile file,
                          @RequestParam(value = "ownerUserId", required = false) UUID ownerUserId,
                          @RequestParam(value = "organizationId", required = false) UUID organizationId,
                          @RequestParam(value = "accessLevel", defaultValue = "PRIVATE") String accessLevel) throws IOException {
        return files.upload(file, ownerUserId, organizationId, accessLevel);
    }

    @GetMapping
    public List<FileDto> list() {
        return files.list();
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<InputStreamResource> content(@PathVariable UUID id) {
        var result = files.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .contentType(MediaType.parseMediaType(result.contentType()))
                .contentLength(result.contentLength())
                .body(new InputStreamResource(result.stream()));
    }
}
