package com.quizgen.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizgen.model.*;
import com.quizgen.repository.QuizResultRepository;
import com.quizgen.repository.UserRepository;
import com.quizgen.service.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private static final Logger log = LoggerFactory.getLogger(QuizController.class);

    private final QuizService quizService;
    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;

    public QuizController(QuizService quizService,
                          UserRepository userRepository,
                          QuizResultRepository quizResultRepository) {
        this.quizService = quizService;
        this.userRepository = userRepository;
        this.quizResultRepository = quizResultRepository;
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam("difficulty") String difficulty,
            @RequestParam("questionType") String questionType,
            @RequestParam("questionCount") Integer questionCount) {
        
        try {
            User user = getAuthenticatedUser();
            Quiz quiz = quizService.generateQuiz(user, file, text, difficulty, questionType, questionCount);
            
            // Map to client response model to prevent Jackson recursion on LAZY relationships
            Map<String, Object> response = new HashMap<>();
            response.put("quiz", mapQuizToDto(quiz));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate quiz: ", e);
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswers(@RequestBody SubmissionRequest request) {
        try {
            User user = getAuthenticatedUser();
            QuizResult result = quizService.evaluateSubmission(user, request.getQuizId(), request.getAnswers(), request.getTimeTakenSeconds());
            return ResponseEntity.ok(mapResultToDto(result));
        } catch (Exception e) {
            log.error("Failed to process quiz submission: ", e);
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/history")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getQuizHistory() {
        try {
            User user = getAuthenticatedUser();
            List<QuizResult> results = quizResultRepository.findByUserOrderByCompletedAtDesc(user);
            List<Map<String, Object>> dtoList = results.stream().map(this::mapResultToDto).toList();
            return ResponseEntity.ok(dtoList);
        } catch (Exception e) {
            log.error("Failed to fetch history: ", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/results/{id}")
    @Transactional
    public ResponseEntity<?> deleteResult(@PathVariable Long id) {
        try {
            User user = getAuthenticatedUser();
            QuizResult result = quizResultRepository.findById(id).orElse(null);
            
            if (result == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            if (!result.getUser().getId().equals(user.getId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }

            quizResultRepository.delete(result);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to delete result: ", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Helper functions to prevent Jackson circular reference exceptions
    private Map<String, Object> mapQuizToDto(Quiz quiz) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", quiz.getId());
        map.put("title", quiz.getTitle());
        map.put("difficulty", quiz.getDifficulty());
        map.put("questionType", quiz.getQuestionType());
        map.put("questionCount", quiz.getQuestionCount());
        map.put("fileName", quiz.getFileName());
        
        List<Map<String, Object>> questionsList = quiz.getQuestions().stream().map(q -> {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("type", q.getType());
            qMap.put("question_text", q.getQuestionText());
            qMap.put("explanation", q.getExplanation());
            qMap.put("blank_answer", q.getBlankAnswer());
            
            if (q.getOptions() != null) {
                List<Map<String, Object>> optionsList = q.getOptions().stream().map(o -> {
                    Map<String, Object> oMap = new HashMap<>();
                    oMap.put("option_letter", o.getOptionLetter());
                    oMap.put("option_text", o.getOptionText());
                    oMap.put("is_correct", o.isCorrect());
                    return oMap;
                }).toList();
                qMap.put("options", optionsList);
            }
            return qMap;
        }).toList();
        
        map.put("questions", questionsList);
        return map;
    }

    private Map<String, Object> mapResultToDto(QuizResult res) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", res.getId());
        map.put("quizId", res.getQuiz().getId());
        map.put("quizTitle", res.getQuiz().getTitle());
        map.put("difficulty", res.getQuiz().getDifficulty());
        map.put("questionCount", res.getTotalQuestions());
        map.put("correctAnswers", res.getCorrectAnswers());
        map.put("wrongAnswers", res.getWrongAnswers());
        map.put("skippedQuestions", res.getSkippedQuestions());
        map.put("scorePercentage", res.getPercentage().intValue());
        map.put("grade", res.getGrade());
        map.put("timeTakenSeconds", res.getTimeTakenSeconds());
        if (res.getCompletedAt() != null) {
            map.put("createdAt", res.getCompletedAt().toString());
        }
        
        // Parse feedback string back into object
        try {
            ObjectMapper mapper = new ObjectMapper();
            map.put("aiFeedback", mapper.readValue(res.getAiFeedback(), Map.class));
        } catch (Exception e) {
            map.put("aiFeedback", new HashMap<>());
        }
        
        // Parse user answers map
        Map<String, String> userAnsMap = new HashMap<>();
        try {
            if (res.getUserAnswers() != null) {
                ObjectMapper mapper = new ObjectMapper();
                userAnsMap = mapper.readValue(res.getUserAnswers(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
            }
        } catch (Exception e) {
            log.error("Failed to parse user answers JSON", e);
        }

        // Build answersList
        final Map<String, String> finalUserAnsMap = userAnsMap;
        List<Map<String, Object>> answersList = res.getQuiz().getQuestions().stream().map(q -> {
            Map<String, Object> ansMap = new HashMap<>();
            String userAns = finalUserAnsMap.get(String.valueOf(q.getId()));
            if (userAns == null) {
                userAns = finalUserAnsMap.get(q.getId().toString());
            }
            
            boolean isCorrect = false;
            if (userAns != null && !userAns.trim().isEmpty()) {
                if ("MCQ".equals(q.getType()) || "TF".equals(q.getType())) {
                    AnswerOption correctOption = q.getOptions().stream()
                            .filter(AnswerOption::isCorrect)
                            .findFirst()
                            .orElse(null);
                    
                    if (correctOption != null && correctOption.getOptionLetter().equalsIgnoreCase(userAns.trim())) {
                        isCorrect = true;
                    }
                } else if ("FITB".equals(q.getType())) {
                    if (q.getBlankAnswer() != null && q.getBlankAnswer().trim().equalsIgnoreCase(userAns.trim())) {
                        isCorrect = true;
                    }
                }
            }
            
            ansMap.put("questionId", q.getId());
            ansMap.put("selectedAnswer", userAns);
            ansMap.put("isCorrect", isCorrect);
            return ansMap;
        }).toList();

        map.put("answersList", answersList);
        
        // Map questions lists to allow review on report details
        map.put("questions", res.getQuiz().getQuestions().stream().map(q -> {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("type", q.getType());
            qMap.put("question_text", q.getQuestionText());
            qMap.put("explanation", q.getExplanation());
            qMap.put("blank_answer", q.getBlankAnswer());
            if (q.getOptions() != null) {
                qMap.put("options", q.getOptions().stream().map(o -> {
                    Map<String, Object> oMap = new HashMap<>();
                    oMap.put("option_letter", o.getOptionLetter());
                    oMap.put("option_text", o.getOptionText());
                    oMap.put("is_correct", o.isCorrect());
                    return oMap;
                }).toList());
            }
            return qMap;
        }).toList());

        return map;
    }

    public static class SubmissionRequest {
        private Long quizId;
        private Map<String, String> answers;
        private Long timeTakenSeconds;

        public Long getQuizId() {
            return quizId;
        }

        public void setQuizId(Long quizId) {
            this.quizId = quizId;
        }

        public Map<String, String> getAnswers() {
            return answers;
        }

        public void setAnswers(Map<String, String> answers) {
            this.answers = answers;
        }

        public Long getTimeTakenSeconds() {
            return timeTakenSeconds;
        }

        public void setTimeTakenSeconds(Long timeTakenSeconds) {
            this.timeTakenSeconds = timeTakenSeconds;
        }
    }
}
