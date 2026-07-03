package com.quizgen.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public String generateQuizJson(String contentText, String difficulty, String questionType, int questionCount) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("YOUR_GEMINI")) {
            log.warn("Gemini API key is not configured. Generating fallback questions from uploaded file content.");
            return generateFallbackQuestionsFromText(contentText, difficulty, questionType, questionCount);
        }

        String prompt = buildPrompt(contentText, difficulty, questionType, questionCount);
        
        // Prepare Gemini Request Body
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", List.of(textPart));

        Map<String, Object> contentNode = new HashMap<>();
        contentNode.put("contents", List.of(parts));

        // Configure system to return valid JSON
        Map<String, Object> responseConfig = new HashMap<>();
        responseConfig.put("responseMimeType", "application/json");
        contentNode.put("generationConfig", responseConfig);

        String requestBody = objectMapper.writeValueAsString(contentNode);

        String fullUrl = apiUrl + "?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(30))
                .build();

        log.info("Sending request to Gemini API: {}", apiUrl);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini API failed with status code: {}, Response: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API call failed with status: " + response.statusCode());
        }

        // Parse Response JSON from Gemini
        Map<?, ?> responseMap = objectMapper.readValue(response.body(), Map.class);
        List<?> candidates = (List<?>) responseMap.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("No candidates found in Gemini response");
        }

        Map<?, ?> candidate = (Map<?, ?>) candidates.getFirst();
        Map<?, ?> content = (Map<?, ?>) candidate.get("content");
        List<?> responseParts = (List<?>) content.get("parts");
        Map<?, ?> part = (Map<?, ?>) responseParts.getFirst();
        
        String resultJson = (String) part.get("text");
        log.info("Successfully received generated quiz payload from Gemini.");
        return resultJson;
    }

    private String buildPrompt(String documentContent, String difficulty, String questionType, int questionCount) {
        String difficultyInstructions;
        switch (difficulty.toLowerCase()) {
            case "easy":
                difficultyInstructions =
                    "EASY level: Ask direct recall questions. Questions should ask for definitions, " +
                    "simple facts, or basic terminology directly stated in the text. " +
                    "Wrong options should be clearly different from the correct answer.";
                break;
            case "medium":
                difficultyInstructions =
                    "MEDIUM level: Ask application and comparison questions. Questions should require " +
                    "understanding relationships, comparing concepts, or applying information from the text " +
                    "to a slightly new context. Wrong options should be plausible but clearly distinguishable " +
                    "on careful reading.";
                break;
            case "hard":
                difficultyInstructions =
                    "HARD level: Ask analytical, inferential, and critical thinking questions. " +
                    "Questions should: (1) Require multi-step reasoning or combining multiple parts of the text, " +
                    "(2) Ask 'why', 'what would happen if', 'what is the implication of', or 'which exception', " +
                    "(3) Have wrong options that are highly plausible — they should look correct at first glance " +
                    "but fail on close analysis, (4) Avoid simple fact recall. " +
                    "For FITB, remove a key technical phrase, not just a single word. " +
                    "For TF, make the false statements differ only in one subtle but critical detail.";
                break;
            default: // Mixed
                difficultyInstructions =
                    "MIXED difficulty: Include a range — some Easy recall, some Medium application, " +
                    "and some Hard analytical questions. Label harder questions with more demanding phrasing.";
        }

        return "You are an expert quiz generation engine. Analyze the following document content:\n" +
                "------------------\n" +
                documentContent + "\n" +
                "------------------\n" +
                "Generate exactly " + questionCount + " questions based ONLY on the content above.\n" +
                "Difficulty level: " + difficulty + "\n" +
                "Difficulty instructions: " + difficultyInstructions + "\n" +
                "Question Type requested: " + questionType + " (MCQ = Multiple Choice, TF = True/False, FITB = Fill in the Blanks, Mixed = combination of all).\n\n" +
                "You MUST return a JSON array conforming exactly to this schema. Do not wrap in markdown or block codes. Return ONLY valid JSON:\n" +
                "[\n" +
                "  {\n" +
                "    \"type\": \"MCQ\",\n" +
                "    \"questionText\": \"Write the question text here?\",\n" +
                "    \"explanation\": \"Explain the answer context based on document details.\",\n" +
                "    \"options\": [\n" +
                "      {\"optionLetter\": \"A\", \"optionText\": \"Option content\", \"isCorrect\": false},\n" +
                "      {\"optionLetter\": \"B\", \"optionText\": \"Option content\", \"isCorrect\": true},\n" +
                "      {\"optionLetter\": \"C\", \"optionText\": \"Option content\", \"isCorrect\": false},\n" +
                "      {\"optionLetter\": \"D\", \"optionText\": \"Option content\", \"isCorrect\": false}\n" +
                "    ]\n" +
                "  },\n" +
                "  {\n" +
                "    \"type\": \"TF\",\n" +
                "    \"questionText\": \"Write a true or false statement here.\",\n" +
                "    \"explanation\": \"Explanation regarding the statement.\",\n" +
                "    \"options\": [\n" +
                "      {\"optionLetter\": \"A\", \"optionText\": \"True\", \"isCorrect\": true},\n" +
                "      {\"optionLetter\": \"B\", \"optionText\": \"False\", \"isCorrect\": false}\n" +
                "    ]\n" +
                "  },\n" +
                "  {\n" +
                "    \"type\": \"FITB\",\n" +
                "    \"questionText\": \"Write a sentence with a blank designated by ________.\",\n" +
                "    \"blankAnswer\": \"exactWordOrPhraseToFill\",\n" +
                "    \"explanation\": \"Explanation context.\"\n" +
                "  }\n" +
                "]";
    }

    private String generateFallbackQuestionsFromText(String contentText, String difficulty, String questionType, int count) throws Exception {
        if (contentText == null || contentText.trim().isEmpty()) {
            return generateMockQuestionsJson(difficulty, questionType, count);
        }

        // Split into clean sentences
        String[] rawSents = contentText.split("(?<=[.!?])\\s+|\\r?\\n+");
        List<String> validSentences = new ArrayList<>();
        for (String s : rawSents) {
            String clean = s.trim().replaceAll("\\s+", " ");
            if (clean.length() > 30 && clean.length() < 280) validSentences.add(clean);
        }
        if (validSentences.size() < 3) {
            for (String s : contentText.split("[,;\\.]")) {
                String clean = s.trim().replaceAll("\\s+", " ");
                if (clean.length() > 15) validSentences.add(clean);
            }
        }
        if (validSentences.isEmpty()) return generateMockQuestionsJson(difficulty, questionType, count);

        int targetCount = Math.max(1, Math.min(count, 30));
        boolean isHard   = "Hard".equalsIgnoreCase(difficulty);
        boolean isMedium = "Medium".equalsIgnoreCase(difficulty);

        java.util.Set<String> stopWords = java.util.Set.of(
            "the","and","a","of","to","in","is","that","it","for","on","are","as","with","they","at",
            "be","this","have","from","or","by","but","not","what","all","we","when","your","can",
            "there","use","an","each","which","do","how","their","if","was","has","had","been","will",
            "would","should","could","about","more","some","other","than","then","into","only","also",
            "its","may","these","those","such","after","before","between","through","during","over"
        );

        // Collect all unique meaningful keywords from the full document
        List<String> allKeywords = new ArrayList<>();
        for (String s : validSentences) {
            for (String w : s.split("[^a-zA-Z0-9]+")) {
                if (w.length() > 4 && !stopWords.contains(w.toLowerCase()) && !allKeywords.contains(w))
                    allKeywords.add(w);
            }
        }
        if (allKeywords.size() < 6)
            allKeywords.addAll(List.of("Analysis","Synthesis","Evaluation","Mechanism","Principle","Structure"));

        // Difficulty-scaled MCQ stem templates
        String[] hardMcqStems = {
            "What is the most likely implication of '%s' as described in the passage?",
            "Which of the following best explains WHY '%s' is significant according to the text?",
            "Based on the passage, what would most likely occur if '%s' were absent or changed?",
            "Which statement correctly identifies an exception or limitation related to '%s' in the text?",
            "The passage suggests that '%s' is primarily responsible for which of the following outcomes?"
        };
        String[] medMcqStems = {
            "According to the text, how does '%s' relate to the main topic?",
            "Which statement about '%s' is best supported by the passage?",
            "Based on the text, what is the function or purpose of '%s'?"
        };
        String[] hardTfStems = {
            "Based on a careful reading of the passage, is the following conclusion valid: \"%s\"?",
            "The text implies the following — is this an accurate interpretation: \"%s\"?",
            "Considering all evidence in the passage, evaluate whether this claim holds: \"%s\""
        };
        String[] easyMcqStems = {
            "According to the text, what is '%s'?",
            "The passage directly states that '%s' refers to which of the following?",
            "Which term is described as '%s' in the document?"
        };

        List<Map<String, Object>> selected = new ArrayList<>();
        int sentenceIdx = 0;

        for (int i = 0; i < targetCount; i++) {
            String sentence = validSentences.get(sentenceIdx % validSentences.size());
            sentenceIdx++;

            // Determine question type for this item
            String qType = questionType;
            if ("Mixed".equalsIgnoreCase(questionType)) {
                qType = (i % 3 == 0) ? "MCQ" : (i % 3 == 1 ? "TF" : "FITB");
            }

            // Pick the longest meaningful keyword as the primary concept
            String keyword = "concept";
            int bestLen = 0;
            for (String w : sentence.split("[^a-zA-Z0-9]+")) {
                if (w.length() > bestLen && w.length() > 4 && !stopWords.contains(w.toLowerCase())) {
                    keyword = w; bestLen = w.length();
                }
            }

            // Second keyword for Hard double-blank FITB
            String keyword2 = allKeywords.get((i + 5) % allKeywords.size());
            for (String w : sentence.split("[^a-zA-Z0-9]+")) {
                if (!w.equals(keyword) && w.length() > 4 && !stopWords.contains(w.toLowerCase())) {
                    keyword2 = w; break;
                }
            }

            Map<String, Object> q = new HashMap<>();

            if ("FITB".equalsIgnoreCase(qType)) {
                q.put("type", "FITB");
                if (isHard) {
                    String blanked = sentence
                        .replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________")
                        .replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword2), "________");
                    q.put("questionText", "Fill in BOTH blanks precisely: \"" + blanked + "\"");
                    q.put("blankAnswer", keyword + " / " + keyword2);
                    q.put("explanation", "The complete statement from the source text is: \"" + sentence + "\"");
                } else {
                    String blanked = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________");
                    q.put("questionText", "Fill in the blank: \"" + blanked + "\"");
                    q.put("blankAnswer", keyword);
                    q.put("explanation", "From the text: \"" + sentence + "\"");
                }

            } else if ("TF".equalsIgnoreCase(qType)) {
                q.put("type", "TF");
                boolean isTrue = (i % 2 == 0);
                String trueStem = isHard
                    ? String.format(hardTfStems[i % hardTfStems.length], sentence)
                    : "According to the text, is the following statement true: \"" + sentence + "\"?";

                if (isTrue) {
                    q.put("questionText", trueStem);
                    q.put("options", List.of(option("A", "True", true), option("B", "False", false)));
                    q.put("explanation", "Correct — the text directly supports: \"" + sentence + "\"");
                } else {
                    String altWord = allKeywords.get((i + 3) % allKeywords.size());
                    String falseSentence = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), altWord);
                    String falseStem = isHard
                        ? String.format(hardTfStems[i % hardTfStems.length], falseSentence)
                        : "According to the text, is the following statement true: \"" + falseSentence + "\"?";
                    q.put("questionText", falseStem);
                    q.put("options", List.of(option("A", "True", false), option("B", "False", true)));
                    q.put("explanation", "Incorrect — the text actually states: \"" + sentence + "\"");
                }

            } else {
                // MCQ — difficulty-scaled stem
                q.put("type", "MCQ");
                String stem;
                if (isHard) {
                    stem = String.format(hardMcqStems[i % hardMcqStems.length], keyword);
                } else if (isMedium) {
                    stem = String.format(medMcqStems[i % medMcqStems.length], keyword);
                } else {
                    String blanked = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________");
                    stem = "Complete the sentence: \"" + blanked + "\"";
                }
                q.put("questionText", stem);

                // Correct answer: full sentence snippet for Hard, keyword for Easy/Medium
                String correctAnswer = isHard
                    ? sentence.substring(0, Math.min(sentence.length(), 90)) + (sentence.length() > 90 ? "..." : "")
                    : keyword;

                // Build 3 distinct plausible-but-wrong distractors
                java.util.Set<String> usedSet = new java.util.HashSet<>();
                usedSet.add(correctAnswer.toLowerCase());
                List<String> distractorTexts = new ArrayList<>();
                int dBase = (i + 7) % allKeywords.size();
                for (int d = 0; d < allKeywords.size() && distractorTexts.size() < 3; d++) {
                    String dk = allKeywords.get((dBase + d) % allKeywords.size());
                    if (usedSet.contains(dk.toLowerCase())) continue;
                    String distText;
                    if (isHard) {
                        String src = validSentences.get((sentenceIdx + d) % validSentences.size());
                        distText = src.substring(0, Math.min(src.length(), 90)) + (src.length() > 90 ? "..." : "");
                    } else {
                        distText = dk;
                    }
                    if (!usedSet.contains(distText.toLowerCase())) {
                        usedSet.add(distText.toLowerCase());
                        distractorTexts.add(distText);
                    }
                }
                while (distractorTexts.size() < 3)
                    distractorTexts.add("None of the statements above (" + (distractorTexts.size() + 2) + ")");

                // Shuffle correct answer into a different position per question
                int correctPos = i % 4;
                List<Map<String, Object>> options = new ArrayList<>();
                int dIdx = 0;
                for (int o = 0; o < 4; o++) {
                    String letter = String.valueOf((char) ('A' + o));
                    if (o == correctPos) {
                        options.add(option(letter, correctAnswer, true));
                    } else {
                        options.add(option(letter, distractorTexts.get(dIdx++ % distractorTexts.size()), false));
                    }
                }
                q.put("options", options);
                q.put("explanation", "The passage states: \"" + sentence + "\"");
            }

            selected.add(q);
        }
        return objectMapper.writeValueAsString(selected);
    }

    private String generateMockQuestionsJson(String difficulty, String questionType, int count) throws Exception {
        List<Map<String, Object>> pool = buildMockQuestionPool();
        List<Map<String, Object>> filtered = new ArrayList<>();

        for (Map<String, Object> question : pool) {
            String type = (String) question.get("type");
            if ("Mixed".equalsIgnoreCase(questionType) || questionType.equalsIgnoreCase(type)) {
                filtered.add(question);
            }
        }

        if (filtered.isEmpty()) {
            filtered = pool;
        }

        List<Map<String, Object>> selected = new ArrayList<>();
        int targetCount = Math.max(1, Math.min(count, 30));
        for (int i = 0; i < targetCount; i++) {
            Map<String, Object> source = filtered.get(i % filtered.size());
            selected.add(copyQuestion(source, difficulty, i + 1));
        }

        return objectMapper.writeValueAsString(selected);
    }

    private List<Map<String, Object>> buildMockQuestionPool() {
        List<Map<String, Object>> pool = new ArrayList<>();

        pool.add(createMcq(
                "What is the primary role of a parser in a compiler pipeline?",
                "Parsers convert token sequences into tree structures, mapping formal language syntax parameters.",
                List.of(
                        option("A", "Lexical tokenization", false),
                        option("B", "Syntactic syntax tree generation", true),
                        option("C", "Memory garbage collection", false),
                        option("D", "Direct register allocation", false)
                )
        ));

        pool.add(createMcq(
                "Which of the following is a core principle of Object-Oriented Programming?",
                "Encapsulation is one of the four fundamental OOP concepts.",
                List.of(
                        option("A", "Compilation", false),
                        option("B", "Encapsulation", true),
                        option("C", "Execution", false),
                        option("D", "Recursion", false)
                )
        ));

        pool.add(createTf(
                "HTTP is a stateful protocol by default.",
                "HTTP is stateless; cookies and sessions are used to maintain state.",
                false
        ));

        pool.add(createFitb(
                "The process of finding and resolving bugs in software is called ________.",
                "debugging",
                "Debugging is the routine process of locating and fixing bugs in a software system."
        ));

        pool.add(createMcq(
                "What is the time complexity of searching in a balanced Binary Search Tree?",
                "In a balanced BST, the height is log N, so search complexity is O(log N).",
                List.of(
                        option("A", "O(1)", false),
                        option("B", "O(N)", false),
                        option("C", "O(log N)", true),
                        option("D", "O(N log N)", false)
                )
        ));

        pool.add(createTf(
                "In JavaScript, const variables are completely immutable.",
                "const prevents reassignment, but object properties can still change.",
                false
        ));

        pool.add(createFitb(
                "SQL stands for Structured ________ Language.",
                "Query",
                "SQL is the standard language for interacting with relational databases."
        ));

        return pool;
    }

    private Map<String, Object> copyQuestion(Map<String, Object> source, String difficulty, int index) {
        Map<String, Object> copy = new HashMap<>(source);
        String explanation = (String) source.get("explanation");
        if ("Easy".equalsIgnoreCase(difficulty)) {
            copy.put("explanation", "[Easy Concept] " + explanation);
        } else if ("Hard".equalsIgnoreCase(difficulty)) {
            copy.put("explanation", "[Advanced Analysis] " + explanation);
        }

        String questionText = (String) source.get("questionText");
        if (index > 1) {
            copy.put("questionText", questionText + " (Variant " + index + ")");
        }

        if (source.get("options") instanceof List<?> options) {
            List<Map<String, Object>> copiedOptions = new ArrayList<>();
            for (Object opt : options) {
                if (opt instanceof Map<?, ?> optMap) {
                    copiedOptions.add(new HashMap<>((Map<String, Object>) optMap));
                }
            }
            copy.put("options", copiedOptions);
        }

        return copy;
    }

    private Map<String, Object> createMcq(String questionText, String explanation, List<Map<String, Object>> options) {
        Map<String, Object> question = new HashMap<>();
        question.put("type", "MCQ");
        question.put("questionText", questionText);
        question.put("explanation", explanation);
        question.put("options", options);
        return question;
    }

    private Map<String, Object> createTf(String questionText, String explanation, boolean isTrue) {
        Map<String, Object> question = new HashMap<>();
        question.put("type", "TF");
        question.put("questionText", questionText);
        question.put("explanation", explanation);
        question.put("options", List.of(
                option("A", "True", isTrue),
                option("B", "False", !isTrue)
        ));
        return question;
    }

    private Map<String, Object> createFitb(String questionText, String blankAnswer, String explanation) {
        Map<String, Object> question = new HashMap<>();
        question.put("type", "FITB");
        question.put("questionText", questionText);
        question.put("blankAnswer", blankAnswer);
        question.put("explanation", explanation);
        return question;
    }

    private Map<String, Object> option(String letter, String text, boolean isCorrect) {
        Map<String, Object> option = new HashMap<>();
        option.put("optionLetter", letter);
        option.put("optionText", text);
        option.put("isCorrect", isCorrect);
        return option;
    }

    public String getAssistantResponse(String userPrompt) throws Exception {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("YOUR_GEMINI")) {
            log.warn("Gemini API key is not configured. Using local assistant rule responder.");
            return getLocalAssistantResponse(userPrompt);
        }

        String systemPrompt = "You are a helpful, cybernetic AI Assistant for the \"Quiz AI Gen\" application.\n" +
                "The application allows users to generate quizzes by:\n" +
                "1. Uploading PDF, DOCX, TXT, or Image files (which use OCR).\n" +
                "2. Copy-pasting text directly.\n" +
                "3. Selecting a difficulty (Easy, Medium, Hard).\n" +
                "4. Specifying the number of questions.\n" +
                "5. Choosing a question type (MCQ = Multiple Choice, TF = True/False, FITB = Fill in the Blanks, or Mixed).\n\n" +
                "Users can take the quiz, submit answers, and receive detailed grades, score percentages, and AI diagnostic feedback.\n" +
                "They can also review their history under the \"Quiz History\" page.\n\n" +
                "Answer the following user query about how to use the quiz generator, provide recommendations, or handle their feedback. Keep your responses concise (1-3 sentences max) and maintain a cool, futuristic/cyberpunk tone.\n\n" +
                "User Query: " + userPrompt;

        // Prepare Gemini Request Body
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", systemPrompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", List.of(textPart));

        Map<String, Object> contentNode = new HashMap<>();
        contentNode.put("contents", List.of(parts));

        String requestBody = objectMapper.writeValueAsString(contentNode);

        String fullUrl = apiUrl + "?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini Assistant failed: {}, Response: {}", response.statusCode(), response.body());
            return getLocalAssistantResponse(userPrompt);
        }

        Map<?, ?> responseMap = objectMapper.readValue(response.body(), Map.class);
        List<?> candidates = (List<?>) responseMap.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return getLocalAssistantResponse(userPrompt);
        }

        Map<?, ?> candidate = (Map<?, ?>) candidates.getFirst();
        Map<?, ?> content = (Map<?, ?>) candidate.get("content");
        List<?> responseParts = (List<?>) content.get("parts");
        Map<?, ?> part = (Map<?, ?>) responseParts.getFirst();
        
        return (String) part.get("text");
    }

    private String getLocalAssistantResponse(String prompt) {
        String query = prompt.toLowerCase();
        if (query.contains("generate") || query.contains("create") || query.contains("make") || query.contains("how to use")) {
            return "To generate a quiz, navigate to 'Generate Quiz' on the sidebar. Upload a document (PDF, DOCX, TXT, or Image) or paste your notes directly, choose a difficulty level and question type, and click 'Generate Quiz Now'!";
        }
        if (query.contains("file") || query.contains("pdf") || query.contains("docx") || query.contains("txt") || query.contains("image") || query.contains("upload") || query.contains("format")) {
            return "We support PDF, DOCX, TXT, and common image formats (JPG/PNG). Image files undergo OCR processing to automatically extract text for the quiz questions.";
        }
        if (query.contains("score") || query.contains("grade") || query.contains("calculate") || query.contains("history") || query.contains("report")) {
            return "Your submissions are graded instantly! You can view detailed correct, incorrect, and skipped counts, score percentages, and AI diagnostic feedback. All past reports are saved under 'Quiz History'.";
        }
        if (query.contains("mixed") || query.contains("mcq") || query.contains("tf") || query.contains("fitb") || query.contains("type")) {
            return "We support Multiple Choice Questions (MCQ), True/False (TF), Fill in the Blanks (FITB), or 'Mixed' mode which constructs a custom blend of all three types.";
        }
        if (query.contains("hi") || query.contains("hello") || query.contains("hey") || query.contains("who are you")) {
            return "Greetings, user! I am your cybernetic AI assistant. How can I help you navigate the Quiz AI Gen system today?";
        }
        if (query.contains("feedback") || query.contains("suggest") || query.contains("issue") || query.contains("error") || query.contains("bug")) {
            return "We highly value your feedback! If you run into any issues, verify that your document text is clean and legible. Let us know if you have suggestions for improvement.";
        }
        return "I am your Quiz AI assistant. You can upload study documents, generate customized quizzes, evaluate your knowledge, and review past reports. Try asking 'How do I generate a quiz?' or 'What file formats are supported?'";
    }
}
