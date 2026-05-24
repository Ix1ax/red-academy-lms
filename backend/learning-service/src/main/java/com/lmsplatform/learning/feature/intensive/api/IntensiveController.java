package com.lmsplatform.learning.feature.intensive.api;

import com.lmsplatform.learning.feature.intensive.application.IntensiveService;
import com.lmsplatform.learning.feature.intensive.domain.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/intensives")
public class IntensiveController {
    private final IntensiveService intensives;

    public IntensiveController(IntensiveService intensives) {
        this.intensives = intensives;
    }

    @GetMapping
    public List<IntensiveDto> list() {
        return intensives.list();
    }

    @PostMapping
    public IntensiveDto create(@Valid @RequestBody IntensiveCreateRequest request) {
        return intensives.create(request);
    }

    @PutMapping("/{id}")
    public IntensiveDto update(@PathVariable("id") UUID id, @Valid @RequestBody IntensiveCreateRequest request) {
        return intensives.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") UUID id) {
        intensives.delete(id);
    }

    @PatchMapping("/{id}/status")
    public IntensiveDto updateStatus(@PathVariable("id") UUID id, @RequestBody java.util.Map<String, String> request) {
        return intensives.updateStatus(id, request.get("status"));
    }

    @GetMapping("/{id}")
    public IntensiveDetailsDto get(@PathVariable("id") UUID id) {
        return intensives.get(id);
    }

    @PostMapping("/{id}/apply")
    public ApplicationDto apply(@PathVariable("id") UUID id, @Valid @RequestBody ApplicationRequest request) {
        return intensives.apply(id, request);
    }

    @PostMapping("/applications/{applicationId}/approve")
    public ParticipantDto approve(@PathVariable("applicationId") UUID applicationId) {
        return intensives.approve(applicationId);
    }

    @PostMapping("/applications/{applicationId}/reject")
    public ApplicationDto reject(@PathVariable("applicationId") UUID applicationId) {
        return intensives.reject(applicationId);
    }

    @GetMapping("/{id}/rating")
    public List<ParticipantDto> rating(@PathVariable("id") UUID id) {
        return intensives.rating(id);
    }

    @GetMapping("/{id}/managers")
    public List<IntensiveManagerDto> managers(@PathVariable("id") UUID id) {
        return intensives.managers(id);
    }

    @PostMapping("/{id}/managers")
    public IntensiveManagerDto addManager(@PathVariable("id") UUID id, @Valid @RequestBody IntensiveManagerCreateRequest request) {
        return intensives.addManager(id, request);
    }

    @PostMapping("/{id}/participants/{participantId}/kick")
    public ParticipantDto kickParticipant(@PathVariable("id") UUID id,
                                          @PathVariable("participantId") UUID participantId,
                                          @Valid @RequestBody KickParticipantRequest request) {
        return intensives.kickParticipant(id, participantId, request);
    }

    @PostMapping("/{id}/stages/{stageId}/submissions")
    public IntensiveSubmissionDto submitStage(@PathVariable("id") UUID id,
                                              @PathVariable("stageId") UUID stageId,
                                              @Valid @RequestBody IntensiveSubmissionRequest request) {
        return intensives.submitStage(id, stageId, request);
    }
}
