package com.quizgen.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizgen.model.*;
import com.quizgen.repository.QuizRepository;
import com.quizgen.repository.QuizResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    private static final Logger log = LoggerFactory.getLogger(QuizService.class);

    private final ParserService parserService;
    private final GeminiService geminiService;
    private final QuizRepository quizRepository;
    private final QuizResultRepository quizResultRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizService(ParserService parserService,
                       GeminiService geminiService,
                       QuizRepository quizRepository,
                       QuizResultRepository quizResultRepository) {
        this.parserService = parserService;
        this.geminiService = geminiService;
        this.quizRepository = quizRepository;
        this.quizResultRepository = quizResultRepository;
    }

    @Transactional
    public Quiz generateQuiz(User user, MultipartFile file, String textInput, String difficulty, String questionType, int questionCount) throws Exception {
        String extractedText;
        String title = "Concept Quiz";

        if (file != null && !file.isEmpty()) {
            extractedText = parserService.parseFile(file);
            title = file.getOriginalFilename();
            // remove extension from title
            if (title != null && title.contains(".")) {
                title = title.substring(0, title.lastIndexOf('.'));
            }
        } else if (textInput != null && !textInput.trim().isEmpty()) {
            extractedText = textInput;
            title = "Text Snippet Quiz";
        } else {
            throw new IllegalArgumentException("No document file or text input provided.");
        }

        // Invoke Gemini
        String jsonQuestions = geminiService.generateQuizJson(extractedText, difficulty, questionType, questionCount);
        
        // Parse Questions JSON from Gemini
        List<Map<String, Object>> rawQuestions = objectMapper.readValue(jsonQuestions, new TypeReference<List<Map<String, Object>>>() {});

        Quiz quiz = new Quiz();
        quiz.setUser(user);
        quiz.setTitle(title);
        quiz.setDifficulty(difficulty);
        quiz.setQuestionType(questionType);
        quiz.setQuestionCount(rawQuestions.size());
        quiz.setFileName(file != null ? file.getOriginalFilename() : "Direct Input.txt");
        quiz.setQuestions(new ArrayList<>());
        quiz.setCreatedAt(LocalDateTime.now());

        for (Map<String, Object> rawQ : rawQuestions) {
            String type = (String) rawQ.get("type");
            String questionText = (String) rawQ.get("questionText");
            String explanation = (String) rawQ.get("explanation");
            String blankAnswer = (String) rawQ.get("blankAnswer");

            Question question = new Question();
            question.setQuiz(quiz);
            question.setType(type);
            question.setQuestionText(questionText);
            question.setExplanation(explanation);
            question.setBlankAnswer(blankAnswer);
            question.setOptions(new ArrayList<>());

            List<?> rawOptions = (List<?>) rawQ.get("options");
            if (rawOptions != null) {
                for (Object rawOpt : rawOptions) {
                    Map<?, ?> optMap = (Map<?, ?>) rawOpt;
                    AnswerOption option = new AnswerOption();
                    option.setQuestion(question);
                    option.setOptionLetter((String) optMap.get("optionLetter"));
                    option.setOptionText((String) optMap.get("optionText"));
                    option.setCorrect(Boolean.TRUE.equals(optMap.get("isCorrect")));
                    question.getOptions().add(option);
                }
            }

            quiz.getQuestions().add(question);
        }

        return quizRepository.save(quiz);
    }

    @Transactional
    public QuizResult evaluateSubmission(User user, Long quizId, Map<String, String> answers, Long timeTakenSeconds) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz with ID " + quizId + " not found."));

        Map<Long, String> normalizedAnswers = new HashMap<>();
        if (answers != null) {
            for (Map.Entry<String, String> entry : answers.entrySet()) {
                try {
                    normalizedAnswers.put(Long.valueOf(entry.getKey()), entry.getValue());
                } catch (NumberFormatException ignored) {
                }
            }
        }

        int correctCount = 0;
        int skippedCount = 0;

        for (Question q : quiz.getQuestions()) {
            String userAns = normalizedAnswers.get(q.getId());
            if (userAns == null || userAns.trim().isEmpty()) {
                skippedCount++;
                continue;
            }

            if ("MCQ".equals(q.getType()) || "TF".equals(q.getType())) {
                AnswerOption correctOption = q.getOptions().stream()
                        .filter(AnswerOption::isCorrect)
                        .findFirst()
                        .orElse(null);
                
                if (correctOption != null && correctOption.getOptionLetter().equalsIgnoreCase(userAns.trim())) {
                    correctCount++;
                }
            } else if ("FITB".equals(q.getType())) {
                if (q.getBlankAnswer() != null && q.getBlankAnswer().trim().equalsIgnoreCase(userAns.trim())) {
                    correctCount++;
                }
            }
        }

        int totalQ = quiz.getQuestions().size();
        int wrongCount = totalQ - correctCount - skippedCount;
        double percentage = ((double) correctCount / totalQ) * 100.0;

        // Grade mapping
        String grade = "F";
        if (percentage >= 90.0) grade = "A+";
        else if (percentage >= 80.0) grade = "A";
        else if (percentage >= 70.0) grade = "B";
        else if (percentage >= 60.0) grade = "C";
        else if (percentage >= 50.0) grade = "D";

        // AI Feedback generation
        String aiFeedbackJson = generateFeedbackJson(correctCount, totalQ, percentage);

        String userAnswersJson = "{}";
        try {
            userAnswersJson = objectMapper.writeValueAsString(answers);
        } catch (Exception e) {
            log.error("Failed to serialize user answers map", e);
        }

        QuizResult result = new QuizResult();
        result.setQuiz(quiz);
        result.setUser(user);
        result.setScore(correctCount);
        result.setTotalQuestions(totalQ);
        result.setCorrectAnswers(correctCount);
        result.setWrongAnswers(wrongCount);
        result.setSkippedQuestions(skippedCount);
        result.setPercentage(Math.round(percentage * 100.0) / 100.0);
        result.setGrade(grade);
        result.setTimeTakenSeconds(timeTakenSeconds);
        result.setAiFeedback(aiFeedbackJson);
        result.setUserAnswers(userAnswersJson);
        result.setCompletedAt(LocalDateTime.now());

        return quizResultRepository.save(result);
    }

    private String generateFeedbackJson(int correct, int total, double percentage) {
        // Build JSON representation of AI diagnostics
        try {
            Map<String, Object> feedback = new HashMap<>();
            List<String> strengths = new ArrayList<>();
            List<String> weaknesses = new ArrayList<>();
            List<String> recommendations = new ArrayList<>();
            String summary;

            if (correct == total && total > 0) {
                summary = String.format("Perfect score! You answered %d out of %d questions correctly.", correct, total);
                strengths.add("Complete concept coverage");
                strengths.add("Accurate detail recall");
                weaknesses.add("None detected in this session");
                recommendations.add("Continue with advanced material");
            } else if (percentage >= 90) {
                summary = String.format("Excellent performance with %d correct out of %d questions.", correct, total);
                strengths.add("Strong conceptual understanding");
                strengths.add("Accurate reasoning");
                weaknesses.add("Minor precision gaps");
                recommendations.add("Review a few targeted topics");
            } else if (percentage >= 70) {
                summary = String.format("Good effort — %d correct out of %d. Focus on refining detail recall.", correct, total);
                strengths.add("Primary concept recall");
                weaknesses.add("Secondary detail retention");
                recommendations.add("Revisit important definitions and examples");
            } else if (percentage >= 40) {
                summary = String.format("Below expectation — %d correct out of %d. More review is needed.", correct, total);
                strengths.add("Basic subject-matter recall");
                weaknesses.add("Unstable reasoning chains");
                recommendations.add("Study early chapter segments and redo practice questions");
            } else {
                summary = String.format("Critical gaps found — only %d out of %d answered correctly. Start with foundational review.", correct, total);
                strengths.add("Execution completion logged");
                weaknesses.add("Foundational concept gaps");
                recommendations.add("Study core concepts from the beginning");
            }

            feedback.put("summary", summary);
            feedback.put("strengths", strengths);
            feedback.put("weaknesses", weaknesses);
            feedback.put("recommendations", recommendations);
            feedback.put("correctAnswers", correct);
            feedback.put("totalQuestions", total);

            return objectMapper.writeValueAsString(feedback);
        } catch (Exception e) {
            log.error("Failed to map AI feedback JSON.", e);
            return "{\"summary\":\"Evaluation logged successfully.\",\"strengths\":[],\"weaknesses\":[],\"recommendations\":[]}";
        }
    }
}
