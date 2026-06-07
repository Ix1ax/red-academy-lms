package com.lmsplatform.learning.feature.statistics.api;

import com.lmsplatform.learning.feature.course.domain.CourseStatRow;
import com.lmsplatform.learning.feature.statistics.application.StatisticsService;
import com.lmsplatform.learning.shared.security.AuthPrincipal;
import com.lmsplatform.learning.shared.security.JwtAuthService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses/statistics")
public class StatisticsController {

    private static final MediaType XLSX_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final StatisticsService statistics;
    private final JwtAuthService auth;

    public StatisticsController(StatisticsService statistics, JwtAuthService auth) {
        this.statistics = statistics;
        this.auth = auth;
    }

    @GetMapping
    public List<CourseStatRow> list(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(value = "organizationId", required = false) UUID organizationId) {
        var scope = resolveScope(authorization, organizationId);
        return statistics.courseStatistics(scope);
    }

    @GetMapping("/export.xlsx")
    public ResponseEntity<Resource> exportXlsx(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam(value = "organizationId", required = false) UUID organizationId) {
        var scope = resolveScope(authorization, organizationId);
        var bytes = statistics.exportXlsx(scope);
        var fileName = "course-statistics-" + LocalDate.now() + ".xlsx";
        var disposition = ContentDisposition.attachment()
                .filename(fileName, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(XLSX_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new ByteArrayResource(bytes));
    }

    /**
     * Server-side authorization: derive the organization scope from the verified token, never from the
     * client-supplied parameter alone.
     * <ul>
     *   <li>ADMIN — platform-wide; may optionally narrow to a specific organization via the parameter.</li>
     *   <li>PARTNER_MANAGER — locked to their own organization; the request parameter is ignored.</li>
     *   <li>Any other role — forbidden.</li>
     * </ul>
     *
     * @return the organization id to filter by, or {@code null} for platform-wide access.
     */
    private UUID resolveScope(String authorization, UUID requestedOrganizationId) {
        AuthPrincipal principal = auth.requirePrincipal(authorization);
        if (principal.hasRole("ADMIN")) {
            return requestedOrganizationId;
        }
        if (principal.hasRole("PARTNER_MANAGER")) {
            if (principal.organizationId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Аккаунт не привязан к организации");
            }
            return principal.organizationId();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Недостаточно прав для выгрузки статистики");
    }
}
