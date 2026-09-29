package com.ecom.controller;

import com.ecom.DTO.*;
import com.ecom.service.AiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private AiService aiService;

    /**
     * AI Shopping Assistant Chat
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            Principal principal) {
        String userId = principal != null ? principal.getName() : "anonymous";
        AiChatResponse response = aiService.chat(request, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Natural-language Search
     * POST /api/ai/search
     */
    @PostMapping("/search")
    public ResponseEntity<List<ProductResponseDTO>> search(
            @RequestBody AiSearchRequest request) {
        List<ProductResponseDTO> results = aiService.naturalLanguageSearch(request.getQuery());
        return ResponseEntity.ok(results);
    }

    /**
     * "You may also like" Recommendations
     * GET /api/ai/recommendations/{productId}
     */
    @GetMapping("/recommendations/{productId}")
    public ResponseEntity<List<ProductResponseDTO>> recommendations(
            @PathVariable Long productId) {
        return ResponseEntity.ok(aiService.getRecommendations(productId));
    }

    /**
     * AI Review Summary
     * GET /api/ai/review-summary/{productId}
     */
    @GetMapping("/review-summary/{productId}")
    public ResponseEntity<Map<String, String>> reviewSummary(
            @PathVariable Long productId) {
        String summary = aiService.getReviewSummary(productId);
        return ResponseEntity.ok(Map.of("summary", summary));
    }

    /**
     * Admin: AI Product Description Generator
     * POST /api/ai/admin/generate-description
     */
    @PostMapping("/admin/generate-description")
    public ResponseEntity<Map<String, String>> generateDescription(
            @RequestBody AiGenerateRequest request) {
        String description = aiService.generateDescription(
                request.getProductName(),
                request.getCategory(),
                request.getPrice(),
                request.getExistingDescription());
        return ResponseEntity.ok(Map.of("description", description));
    }

    /**
     * Admin: AI Tag/Category Suggester
     * POST /api/ai/admin/suggest-tags
     */
    @PostMapping("/admin/suggest-tags")
    public ResponseEntity<Map<String, Object>> suggestTags(
            @RequestBody Map<String, String> request) {
        Map<String, Object> suggestions = aiService.suggestTags(
                request.getOrDefault("productName", ""),
                request.getOrDefault("description", ""));
        return ResponseEntity.ok(suggestions);
    }
}
