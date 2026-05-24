package com.lmsplatform.learning.feature.certificate.application;

import com.lmsplatform.learning.feature.certificate.domain.CertificateDto;
import com.lmsplatform.learning.shared.messaging.EventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CertificateService {
    private final JdbcTemplate jdbc;
    private final EventPublisher events;

    public CertificateService(JdbcTemplate jdbc, EventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    public List<CertificateDto> list(UUID userId) {
        if (userId != null) {
            return jdbc.query("""
                    SELECT id, user_id, course_id, intensive_id, title, file_id, issued_at
                    FROM learning.certificates
                    WHERE user_id = ?
                    ORDER BY issued_at DESC
                    """, (rs, rowNum) -> mapCertificate(rs), userId);
        }
        return jdbc.query("""
                SELECT id, user_id, course_id, intensive_id, title, file_id, issued_at
                FROM learning.certificates
                ORDER BY issued_at DESC
                LIMIT 100
                """, (rs, rowNum) -> mapCertificate(rs));
    }

    public CertificateDto issueForCourse(UUID courseId, UUID userId) {
        var title = jdbc.queryForObject("SELECT title FROM learning.courses WHERE id = ?", String.class, courseId);
        var id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO learning.certificates (id, user_id, course_id, title)
                VALUES (?, ?, ?, ?)
                """, id, userId, courseId, "Сертификат: " + title);
        events.publish("certificate.issued", Map.of("certificateId", id.toString(), "userId", userId.toString()));
        return list(userId).get(0);
    }

    public CertificateDto issueForIntensive(UUID intensiveId, UUID userId) {
        var title = jdbc.queryForObject("SELECT title FROM learning.intensives WHERE id = ?", String.class, intensiveId);
        var id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO learning.certificates (id, user_id, intensive_id, title)
                VALUES (?, ?, ?, ?)
                """, id, userId, intensiveId, "Сертификат интенсива: " + title);
        events.publish("certificate.issued", Map.of("certificateId", id.toString(), "userId", userId.toString()));
        return list(userId).get(0);
    }

    private CertificateDto mapCertificate(ResultSet rs) throws SQLException {
        return new CertificateDto(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("course_id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getString("title"),
                rs.getObject("file_id", UUID.class),
                rs.getTimestamp("issued_at").toInstant()
        );
    }
}
