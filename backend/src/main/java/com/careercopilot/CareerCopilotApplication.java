package com.careercopilot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.net.InetAddress;
import java.util.Map;
import java.util.Optional;

@SpringBootApplication
public class CareerCopilotApplication {
    public static void main(String[] args) {
        SpringApplication.run(CareerCopilotApplication.class, args);
    }

    @Bean
    WorkspaceRepository workspaceRepository(EntityManager entityManager) {
        return new JpaRepositoryFactory(entityManager).getRepository(WorkspaceRepository.class);
    }

    @Entity
    @Table(name = "workspaces")
    public static class Workspace {
        @Id private String id;
        @Column(nullable = false, columnDefinition = "text") private String payload;
        @Column(nullable = false) private Instant updatedAt;

        protected Workspace() {}
        Workspace(String id, String payload) {
            this.id = id;
            this.payload = payload;
            this.updatedAt = Instant.now();
        }
        public String getId() { return id; }
        public String getPayload() { return payload; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void update(String payload) {
            this.payload = payload;
            this.updatedAt = Instant.now();
        }
    }

    public interface WorkspaceRepository extends JpaRepository<Workspace, String> {}

    @RestController
    @RequestMapping("/api")
    public static class ApiController {
        private static final String DEFAULT_WORKSPACE = "default";
        private final WorkspaceRepository repository;
        private final ObjectMapper mapper;

        public ApiController(WorkspaceRepository repository, ObjectMapper mapper) {
            this.repository = repository;
            this.mapper = mapper;
        }

        @GetMapping("/health")
        public Map<String, Object> health() {
            return Map.of("status", "ok", "service", "career-copilot-api",
                    "timestamp", Instant.now().toString());
        }

        @GetMapping("/workspace")
        public ResponseEntity<JsonNode> getWorkspace() throws Exception {
            Optional<Workspace> found = repository.findById(DEFAULT_WORKSPACE);
            if (found.isEmpty()) return ResponseEntity.ok(mapper.createObjectNode());
            return ResponseEntity.ok(mapper.readTree(found.get().getPayload()));
        }

        @PutMapping("/workspace")
        public ResponseEntity<Map<String, Object>> saveWorkspace(@RequestBody JsonNode payload) throws Exception {
            if (payload == null || !payload.isObject()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body must be a JSON object");
            }
            JsonNode jobs = payload.get("jobs");
            if (jobs == null || !jobs.isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payload.jobs must be an array");
            }
            if (jobs.size() > 2000) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "Workspace may contain at most 2000 applications");
            }
            String json = mapper.writeValueAsString(payload);
            Workspace workspace = repository.findById(DEFAULT_WORKSPACE)
                    .map(existing -> { existing.update(json); return existing; })
                    .orElseGet(() -> new Workspace(DEFAULT_WORKSPACE, json));
            repository.save(workspace);
            return ResponseEntity.ok(Map.of("saved", true,
                    "updatedAt", workspace.getUpdatedAt().toString(), "applications", jobs.size()));
        }

        @PostMapping("/job-description/extract")
        public Map<String, String> extractJobDescription(@RequestBody JsonNode payload,
                                                         jakarta.servlet.http.HttpServletRequest request) {
            try {
                InetAddress caller = InetAddress.getByName(request.getRemoteAddr());
                if (!caller.isLoopbackAddress()) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Job URL extraction is available only from this computer.");
                }
            } catch (java.net.UnknownHostException exception) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Could not verify this local request.");
            }
            String url = payload == null ? "" : payload.path("url").asText("").trim();
            if (url.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A job posting URL is required.");
            }
            return Map.of("text", JobDescriptionFetcher.fetch(url));
        }

        @DeleteMapping("/workspace")
        public ResponseEntity<Void> clearWorkspace() {
            repository.deleteById(DEFAULT_WORKSPACE);
            return ResponseEntity.noContent().build();
        }
    }
}
