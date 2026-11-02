package com.careercopilot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ResumeTailorController {
    private final ObjectMapper mapper;
    private final String apiKey;
    private final String model;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public ResumeTailorController(ObjectMapper mapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${OPENAI_MODEL:gpt-4.1-mini}") String model) {
        this.mapper = mapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @PostMapping("/tailor-resume")
    public Map<String, Object> tailor(@RequestBody Map<String, String> request) throws Exception {
        String resume = safe(request.get("resume"));
        String jobDescription = safe(request.get("jobDescription"));
        String jobUrl = safe(request.get("jobUrl"));

        if (resume.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paste your current resume first.");
        if (resume.length() > 30000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume is too long (maximum 30,000 characters).");
        if (jobDescription.length() > 30000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job description is too long (maximum 30,000 characters).");
        if (jobUrl.length() > 2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job URL is too long.");
        if (jobDescription.isBlank() && jobUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a job description or a public job posting URL.");
        }
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resume tailoring is not configured yet. Set OPENAI_API_KEY on the server.");
        }

        String source = jobDescription;
        String sourceLabel = "Pasted job description";
        if (!jobUrl.isBlank()) {
            if (!jobUrl.matches("(?i)^https://.*")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "For safety, job links must use HTTPS.");
            }
            if (source.isBlank()) {
                source = extractJobText(jobUrl);
                sourceLabel = "Fetched from job URL";
            } else {
                sourceLabel = "Pasted job description (job URL also provided)";
            }
        }
        if (source.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not extract a job description from that link. Paste the job description instead.");
        if (source.length() > 30000) source = source.substring(0, 30000);

        String instructions = """
                You are a careful resume editor. Tailor the resume to the job description.
                Do not invent employers, titles, dates, degrees, certifications, skills, achievements, metrics, or responsibilities.
                Use only facts supported by the supplied resume. Reorder and rephrase truthful experience, surface relevant existing skills, and identify missing requirements honestly.
                Return valid JSON with these keys:
                "summary": a short explanation of the main tailoring choices,
                "tailoredResume": the complete revised resume as plain text, preserving useful sections and factual details,
                "keywords": an array of relevant job-description keywords that are already supported by the resume,
                "gaps": an array of important requirements not clearly supported by the resume,
                "suggestedQuestions": an array of concise questions for the user to answer if more truthful details could strengthen the resume.
                Do not include markdown fences around the JSON.
                """;
        String input = "CURRENT RESUME:\n" + resume + "\n\nJOB DESCRIPTION:\n" + source;
        var body = mapper.createObjectNode();
        body.put("model", model);
        body.put("instructions", instructions);
        body.put("input", input);
        body.put("max_output_tokens", 5000);

        HttpRequest apiRequest = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/responses"))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response;
        try {
            response = http.send(apiRequest, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resume tailoring was interrupted.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the resume tailoring service.");
        }
        JsonNode responseJson = mapper.readTree(response.body());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String message = responseJson.path("error").path("message").asText("AI request failed.");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        }

        String outputText = responseJson.path("output_text").asText("");
        if (outputText.isBlank()) {
            StringBuilder collected = new StringBuilder();
            for (JsonNode item : responseJson.path("output")) {
                for (JsonNode content : item.path("content")) {
                    if ("output_text".equals(content.path("type").asText())) collected.append(content.path("text").asText());
                }
            }
            outputText = collected.toString();
        }
        if (outputText.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The AI service returned an empty response.");
        try {
            JsonNode result = mapper.readTree(outputText);
            return Map.of(
                    "source", sourceLabel,
                    "summary", result.path("summary").asText("Resume tailored to the supplied job."),
                    "tailoredResume", result.path("tailoredResume").asText(""),
                    "keywords", strings(result.path("keywords")),
                    "gaps", strings(result.path("gaps")),
                    "suggestedQuestions", strings(result.path("suggestedQuestions"))
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The AI service returned an unexpected format. Please try again.");
        }
    }

    private String extractJobText(String link) {
        try {
            URI uri = URI.create(link);
            String host = uri.getHost();
            if (host == null || host.isBlank() || uri.getUserInfo() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That job URL is invalid.");
            }
            String lowerHost = host.toLowerCase();
            if (lowerHost.equals("localhost") || lowerHost.endsWith(".localhost") || lowerHost.endsWith(".local")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That job URL is not allowed.");
            }
            for (InetAddress address : InetAddress.getAllByName(host)) {
                if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                        || address.isSiteLocalAddress() || address.isMulticastAddress()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That job URL is not allowed.");
                }
            }
            Document doc = Jsoup.connect(link).userAgent("CareerCopilotResumeHelper/1.0")
                    .timeout(12000).maxBodySize(2_000_000).followRedirects(false).get();
            doc.select("script, style, nav, footer, header, aside, form, noscript").remove();
            String text = doc.body() == null ? "" : doc.body().text();
            if (text.length() < 150) text = doc.title() + "\n" + text;
            if (text.length() < 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough readable text was found on that page.");
            return text;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read that job link. It may require sign-in or block automated access; paste the job description instead.");
        }
    }

    private List<String> strings(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) for (JsonNode value : node) if (value.isTextual()) values.add(value.asText());
        return values;
    }

    private String safe(String value) { return value == null ? "" : value.trim(); }
}
