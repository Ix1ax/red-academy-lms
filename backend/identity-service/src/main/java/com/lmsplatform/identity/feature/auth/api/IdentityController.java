package com.lmsplatform.identity.feature.auth.api;

import com.lmsplatform.identity.feature.auth.application.IdentityService;
import com.lmsplatform.identity.feature.auth.domain.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class IdentityController {
    private final IdentityService identity;

    public IdentityController(IdentityService identity) {
        this.identity = identity;
    }

    @PostMapping("/auth/register")
    public UserSession register(@Valid @RequestBody RegisterRequest request) {
        return identity.register(request);
    }

    @PostMapping("/auth/login")
    public UserSession login(@Valid @RequestBody LoginRequest request) {
        return identity.login(request);
    }

    @GetMapping("/users/me")
    public UserDto me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return identity.me(authorization);
    }

    @PatchMapping("/auth/profile")
    public UserDto updateProfile(@RequestHeader("Authorization") String authorization,
                                 @RequestBody UpdateProfileRequest request) {
        return identity.updateProfile(authorization, request);
    }

    @GetMapping("/users")
    public List<UserDto> users(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return identity.users(authorization);
    }

    @GetMapping("/users/search")
    public List<UserDto> searchUsers(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestParam("q") String query) {
        return identity.searchUsers(authorization, query);
    }
}
