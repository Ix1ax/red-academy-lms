package com.lmsplatform.learning.feature.task.api;

import com.lmsplatform.learning.feature.task.application.TaskService;
import com.lmsplatform.learning.feature.task.domain.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService tasks;

    public TaskController(TaskService tasks) {
        this.tasks = tasks;
    }

    @PostMapping
    public TaskDto create(@Valid @RequestBody TaskCreateRequest request) {
        return tasks.create(request);
    }

    @PostMapping("/{taskId}/submissions")
    public SubmissionDto submit(@PathVariable("taskId") UUID taskId, @Valid @RequestBody SubmissionRequest request) {
        return tasks.submit(taskId, request);
    }

    @PostMapping("/submissions/{submissionId}/review")
    public SubmissionDto review(@PathVariable("submissionId") UUID submissionId, @Valid @RequestBody ReviewRequest request) {
        return tasks.review(submissionId, request);
    }
}
