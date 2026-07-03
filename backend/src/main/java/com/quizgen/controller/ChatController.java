package com.quizgen.controller;

import com.quizgen.service.GeminiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping
    public ResponseEntity<?> getAssistantResponse(@RequestBody Map<String, String> request) {
        try {
            String prompt = request.get("prompt");
            if (prompt == null || prompt.trim().isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Prompt cannot be empty.");
                return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
            }

            log.info("Received AI Assistant query: {}", prompt);
            String response = geminiService.getAssistantResponse(prompt);

            Map<String, String> res = new HashMap<>();
            res.put("response", response);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            log.error("Failed to generate assistant response: ", e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Assistant failed to generate response: " + e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
