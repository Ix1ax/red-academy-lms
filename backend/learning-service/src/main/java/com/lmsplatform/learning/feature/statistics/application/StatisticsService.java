package com.lmsplatform.learning.feature.statistics.application;

import com.lmsplatform.learning.feature.course.domain.CourseStatRow;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregates course-completion statistics (per learner per course) and renders exports.
 */
@Service
public class StatisticsService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZoneOffset.UTC);

    private final JdbcTemplate jdbc;

    public StatisticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * @param organizationId when provided, restrict to courses owned by the organization
     *                       or taken by its employees; when null, return platform-wide stats (admin).
     */
    public List<CourseStatRow> courseStatistics(UUID organizationId) {
        var sql = new StringBuilder("""
                SELECT
                    e.user_id          AS user_id,
                    u.full_name        AS user_name,
                    u.email            AS user_email,
                    u.role             AS user_role,
                    c.id               AS course_id,
                    c.title            AS course_title,
                    c.course_type      AS course_type,
                    c.status           AS course_status,
                    c.organization_id  AS organization_id,
                    o.name             AS organization_name,
                    e.progress         AS progress,
                    e.status           AS enrollment_status,
                    e.created_at       AS enrolled_at,
                    e.updated_at       AS updated_at,
                    (SELECT count(*) FROM learning.lessons l
                        WHERE l.course_id = c.id AND l.item_type <> 'FOLDER')          AS total_lessons,
                    (SELECT count(*) FROM learning.lesson_progress lp
                        WHERE lp.course_id = c.id AND lp.user_id = e.user_id
                          AND lp.status = 'COMPLETED')                                  AS completed_lessons,
                    EXISTS(SELECT 1 FROM learning.certificates ct
                        WHERE ct.course_id = c.id AND ct.user_id = e.user_id)          AS certificate_issued
                FROM learning.enrollments e
                JOIN learning.courses c ON c.id = e.course_id
                LEFT JOIN identity.users u ON u.id = e.user_id
                LEFT JOIN organization.organizations o ON o.id = c.organization_id
                """);

        var args = new ArrayList<Object>();
        if (organizationId != null) {
            sql.append(" WHERE (c.organization_id = ? OR u.organization_id = ?) ");
            args.add(organizationId);
            args.add(organizationId);
        }
        sql.append(" ORDER BY c.title ASC, u.full_name ASC ");

        return jdbc.query(sql.toString(), (rs, rowNum) -> mapRow(rs), args.toArray());
    }

    private CourseStatRow mapRow(ResultSet rs) throws SQLException {
        var enrolledAt = rs.getTimestamp("enrolled_at");
        var updatedAt = rs.getTimestamp("updated_at");
        return new CourseStatRow(
                rs.getObject("user_id", UUID.class),
                rs.getString("user_name"),
                rs.getString("user_email"),
                rs.getString("user_role"),
                rs.getObject("course_id", UUID.class),
                rs.getString("course_title"),
                rs.getString("course_type"),
                rs.getString("course_status"),
                rs.getObject("organization_id", UUID.class),
                rs.getString("organization_name"),
                rs.getInt("progress"),
                rs.getString("enrollment_status"),
                rs.getInt("completed_lessons"),
                rs.getInt("total_lessons"),
                rs.getBoolean("certificate_issued"),
                enrolledAt == null ? null : enrolledAt.toInstant(),
                updatedAt == null ? null : updatedAt.toInstant()
        );
    }

    public byte[] exportXlsx(UUID organizationId) {
        var rows = courseStatistics(organizationId);
        var headers = new String[]{
                "Сотрудник", "Email", "Роль", "Курс", "Тип курса", "Статус курса",
                "Организация", "Прогресс, %", "Статус прохождения",
                "Уроков пройдено", "Уроков всего", "Сертификат", "Записан", "Обновлено"
        };

        try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Статистика курсов");

            var headerStyle = workbook.createCellStyle();
            var headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            var headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int r = 1;
            for (var row : rows) {
                var sheetRow = sheet.createRow(r++);
                int col = 0;
                sheetRow.createCell(col++).setCellValue(nullSafe(row.userName()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.userEmail()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.userRole()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.courseTitle()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.courseType()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.courseStatus()));
                sheetRow.createCell(col++).setCellValue(nullSafe(row.organizationName()));
                sheetRow.createCell(col++).setCellValue(row.progress());
                sheetRow.createCell(col++).setCellValue(nullSafe(row.enrollmentStatus()));
                sheetRow.createCell(col++).setCellValue(row.completedLessons());
                sheetRow.createCell(col++).setCellValue(row.totalLessons());
                sheetRow.createCell(col++).setCellValue(row.certificateIssued() ? "Да" : "Нет");
                sheetRow.createCell(col++).setCellValue(formatDate(row.enrolledAt()));
                sheetRow.createCell(col++).setCellValue(formatDate(row.updatedAt()));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            if (!rows.isEmpty()) {
                sheet.setAutoFilter(new CellRangeAddress(0, rows.size(), 0, headers.length - 1));
            }
            sheet.createFreezePane(0, 1);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Не удалось сформировать Excel-отчёт", ex);
        }
    }

    private String formatDate(Instant instant) {
        return instant == null ? "" : DATE_FMT.format(instant);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
