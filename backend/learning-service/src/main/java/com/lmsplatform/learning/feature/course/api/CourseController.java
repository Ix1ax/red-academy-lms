package com.lmsplatform.learning.feature.course.api;

import com.lmsplatform.learning.feature.course.application.CourseService;
import com.lmsplatform.learning.feature.course.domain.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseService courses;

    public CourseController(CourseService courses) {
        this.courses = courses;
    }

    @GetMapping
    public List<CourseDto> list(@RequestParam(value = "status", required = false) String status,
                                @RequestParam(value = "organizationId", required = false) UUID organizationId) {
        return courses.list(status, organizationId);
    }

    @PostMapping
    public CourseDto create(@Valid @RequestBody CourseCreateRequest request) {
        return courses.create(request);
    }

    @PutMapping("/{id}")
    public CourseDto update(@PathVariable("id") UUID id, @Valid @RequestBody CourseCreateRequest request) {
        return courses.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public CourseDto updateStatus(@PathVariable("id") UUID id, @RequestBody Map<String, String> request) {
        return courses.updateStatus(id, request.get("status"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") UUID id) {
        courses.delete(id);
    }

    @GetMapping("/{id}")
    public CourseDetailsDto get(@PathVariable("id") UUID id) {
        return courses.get(id);
    }

    @GetMapping("/{id}/content")
    public CourseContentDto getContent(@PathVariable("id") UUID id) {
        return courses.getContent(id);
    }

    @PutMapping("/{id}/content")
    public CourseContentDto saveContent(@PathVariable("id") UUID id, @Valid @RequestBody CourseContentSaveRequest request) {
        return courses.saveContent(id, request);
    }

    @PostMapping("/{id}/send-to-moderation")
    public CourseDto sendToModeration(@PathVariable("id") UUID id) {
        return courses.sendToModeration(id);
    }

    @PostMapping("/{id}/publish")
    public CourseDto publishCourse(@PathVariable("id") UUID id) {
        return courses.publishCourse(id);
    }

    @PostMapping("/{id}/lessons")
    public LessonDto addLesson(@PathVariable("id") UUID id, @Valid @RequestBody LessonCreateRequest request) {
        return courses.addLesson(id, request);
    }

    @PostMapping("/{id}/enroll")
    public EnrollmentDto enroll(@PathVariable("id") UUID id, @Valid @RequestBody EnrollmentRequest request) {
        return courses.enroll(id, request);
    }

    @GetMapping("/{id}/progress")
    public CourseProgressDto progress(@PathVariable("id") UUID id,
                                      @RequestParam("userId") UUID userId,
                                      @RequestParam(value = "organizationId", required = false) UUID organizationId) {
        return courses.progress(id, userId, organizationId);
    }

    @PatchMapping("/{courseId}/progress")
    public EnrollmentDto updateProgress(@PathVariable("courseId") UUID courseId, @Valid @RequestBody ProgressRequest request) {
        return courses.updateProgress(courseId, request);
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public LessonProgressDto completeLesson(@PathVariable("courseId") UUID courseId,
                                            @PathVariable("lessonId") UUID lessonId,
                                            @Valid @RequestBody LessonProgressRequest request) {
        return courses.completeLesson(courseId, lessonId, request);
    }
}
