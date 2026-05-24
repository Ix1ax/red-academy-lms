package com.lmsplatform.learning.feature.certificate.api;

import com.lmsplatform.learning.feature.certificate.application.CertificateService;
import com.lmsplatform.learning.feature.certificate.domain.CertificateDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {
    private final CertificateService certificates;

    public CertificateController(CertificateService certificates) {
        this.certificates = certificates;
    }

    @GetMapping
    public List<CertificateDto> list(@RequestParam(value = "userId", required = false) UUID userId) {
        return certificates.list(userId);
    }

    @PostMapping("/course/{courseId}/issue")
    public CertificateDto issueForCourse(@PathVariable("courseId") UUID courseId, @RequestParam("userId") UUID userId) {
        return certificates.issueForCourse(courseId, userId);
    }

    @PostMapping("/intensive/{intensiveId}/issue")
    public CertificateDto issueForIntensive(@PathVariable("intensiveId") UUID intensiveId, @RequestParam("userId") UUID userId) {
        return certificates.issueForIntensive(intensiveId, userId);
    }
}
