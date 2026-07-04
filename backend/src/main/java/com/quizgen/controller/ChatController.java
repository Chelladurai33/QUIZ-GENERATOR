package com.quizgen.controller;

import com.quizgen.model.Quiz;
import com.quizgen.model.User;
import com.quizgen.service.GeminiService;
import com.quizgen.service.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final GeminiService geminiService;
    private final QuizService quizService;

    public ChatController(GeminiService geminiService, QuizService quizService) {
        this.geminiService = geminiService;
        this.quizService = quizService;
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

    @PostMapping("/generate-quiz")
    public ResponseEntity<?> generateQuizFromChat(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request) {
        try {
            String textInput = (String) request.get("text");
            String difficulty = (String) request.getOrDefault("difficulty", "Medium");
            String questionType = (String) request.getOrDefault("questionType", "Mixed");
            Integer questionCount = (Integer) request.getOrDefault("questionCount", 10);

            if (textInput == null || textInput.trim().isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Text input is required for quiz generation.");
                return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
            }

            log.info("Generating quiz from chat for user: {}, difficulty: {}, type: {}, count: {}", 
                    user.getEmail(), difficulty, questionType, questionCount);

            Quiz quiz = quizService.generateQuiz(user, null, textInput, difficulty, questionType, questionCount);

            Map<String, Object> response = new HashMap<>();
            response.put("quizId", quiz.getId());
            response.put("title", quiz.getTitle());
            response.put("questionCount", quiz.getQuestionCount());
            response.put("message", "Quiz generated successfully! Redirecting to quiz page...");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate quiz from chat: ", e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Failed to generate quiz: " + e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeContent(@RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            if (content == null || content.trim().isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Content is required for analysis.");
                return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
            }

            log.info("Analyzing content for quiz recommendations");
            String recommendations = geminiService.analyzeContentAndRecommend(content);

            Map<String, String> response = new HashMap<>();
            response.put("recommendations", recommendations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to analyze content: ", e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Failed to analyze content: " + e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
