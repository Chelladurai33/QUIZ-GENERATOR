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
                    "EASY level: Ask conceptual understanding questions that require more than simple recall. " +
                    "Questions should test comprehension of relationships, cause-effect, or application of concepts. " +
                    "Wrong options must be plausible distractors that test partial understanding — they should contain " +
                    "elements of truth but be incorrect in a critical detail.";
                break;
            case "medium":
                difficultyInstructions =
                    "MEDIUM level: Ask analytical questions requiring synthesis of multiple concepts. " +
                    "Questions should: (1) Require connecting ideas from different parts of the text, " +
                    "(2) Test understanding of exceptions, edge cases, or conditional scenarios, " +
                    "(3) Ask for comparisons, contrasts, or evaluations of approaches, " +
                    "(4) Wrong options must be highly sophisticated — they should be technically accurate statements " +
                    "that are simply not the BEST answer or do not directly address the question asked.";
                break;
            case "hard":
                difficultyInstructions =
                    "HARD level: Ask advanced critical thinking questions typical of professional/academic exams. " +
                    "Questions should: (1) Require multi-step reasoning across multiple document sections, " +
                    "(2) Test understanding of implications, trade-offs, or 'what if' scenarios, " +
                    "(3) Ask to identify the most accurate statement among several that are all partially correct, " +
                    "(4) Require distinguishing between similar concepts or identifying subtle distinctions, " +
                    "(5) Wrong options must be expert-level distractors — technically sound statements that are " +
                    "incorrect due to a single critical nuance, scope limitation, or contextual factor. " +
                    "For FITB, remove complex phrases or technical concepts, not simple words. " +
                    "For TF, false statements must be plausible and differ from truth only in subtle but critical details.";
                break;
            default: // Mixed
                difficultyInstructions =
                    "MIXED difficulty: Include challenging questions across the spectrum. Even 'easier' questions " +
                    "should require conceptual understanding, not simple recall. Progressively increase complexity " +
                    "from conceptual understanding to multi-step analysis.";
        }

        return "You are an expert quiz generation engine for professional/academic assessment. Analyze the following document content:\n" +
                "------------------\n" +
                documentContent + "\n" +
                "------------------\n" +
                "Generate exactly " + questionCount + " UNIQUE, EXAM-STYLE questions based ONLY on the content above.\n" +
                "CRITICAL REQUIREMENTS:\n" +
                "1. EXAM-STYLE QUALITY: Questions must be challenging and sophisticated, similar to professional certification or academic exams. Avoid simple recall or 'kid-level' questions.\n" +
                "2. DESCRIPTIVE OPTIONS: Options must be descriptive phrases or explanations, NOT single keywords. Do NOT simply repeat the keyword from the question as an option. Each option should be a complete thought or explanation.\n" +
                "3. NO KEYWORD REPETITION: The correct answer and distractors should not be the exact same word/phrase used in the question text. Options should provide context, explanation, or description.\n" +
                "4. UNIQUE OPTIONS PER QUESTION: Each question must have completely different options from all other questions. No option text should be repeated across questions.\n" +
                "5. SOPHISTICATED DISTRACTORS: Wrong options must be highly plausible, technically sound statements that are incorrect only due to subtle nuances, scope limitations, or contextual factors. They should test deep understanding.\n" +
                "6. TOUGH OPTIONS: Distractors should be context-specific, drawing from different parts of the document. They should sound correct to someone with partial knowledge but be wrong on careful analysis.\n" +
                "7. VARIETY: Each generation must select different concepts, angles, and question formats from the text.\n" +
                "8. PROGRESSION: Arrange questions with increasing complexity — from conceptual understanding to multi-step analytical reasoning.\n" +
                "9. DEPTH: Questions should require synthesis, comparison, evaluation, or application — not just identification.\n" +
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

        // Shuffle sentences and keywords for variety each time
        java.util.Collections.shuffle(validSentences);
        java.util.Collections.shuffle(allKeywords);

        // Exam-style difficulty-scaled MCQ stem templates
        String[] hardMcqStems = {
            "Which of the following statements accurately characterizes the relationship between '%s' and the broader context described in the passage?",
            "When evaluating '%s' within the framework presented, which consideration is most critical for determining its validity?",
            "The passage suggests that '%s' operates under which of the following constraints or conditions?",
            "In comparing '%s' with related concepts mentioned, which distinction is most significant according to the text?",
            "Which of the following best explains why '%s' is essential to the overall mechanism described?",
            "When implementing '%s' as described, which potential limitation must be carefully considered?",
            "The discussion of '%s' implies which of the following about its broader implications?"
        };
        String[] medMcqStems = {
            "Based on the text, how does '%s' contribute to the overall process or system described?",
            "Which aspect of '%s' is most emphasized as critical in the passage?",
            "The text contrasts '%s' with which alternative approach, and what is the key difference?",
            "When applying '%s' as described, which factor most significantly affects its outcome?",
            "Which statement about '%s' is best supported by evidence in the passage?"
        };
        String[] easyMcqStems = {
            "In the context of the passage, '%s' primarily serves which function?",
            "Which characteristic of '%s' is explicitly highlighted in the text?",
            "The passage describes '%s' as being most closely associated with which concept?",
            "What is the primary purpose of '%s' according to the document?"
        };
        String[] hardTfStems = {
            "Based on the passage, evaluate whether the following statement accurately reflects the relationship involving '%s':",
            "The text implies a specific condition regarding '%s' — is the following conclusion valid?",
            "Considering all contextual factors mentioned, assess whether this statement about '%s' holds true:"
        };

        List<Map<String, Object>> selected = new ArrayList<>();
        java.util.Random random = new java.util.Random();

        // Track used options across all questions to ensure uniqueness
        java.util.Set<String> globallyUsedOptions = new java.util.HashSet<>();

        for (int i = 0; i < targetCount; i++) {
            // Random sentence selection with variety
            int sentenceIdx = random.nextInt(validSentences.size());
            String sentence = validSentences.get(sentenceIdx);

            // Progressive difficulty within the quiz
            double progressRatio = (double) i / targetCount;
            boolean useHarderTemplate = isHard || (isMedium && progressRatio > 0.5) || (!isMedium && !isHard && progressRatio > 0.7);

            // Determine question type for this item
            String qType = questionType;
            if ("Mixed".equalsIgnoreCase(questionType)) {
                int typeRoll = random.nextInt(3);
                qType = (typeRoll == 0) ? "MCQ" : (typeRoll == 1 ? "TF" : "FITB");
            }

            // Pick a meaningful keyword as the primary concept
            String keyword = "concept";
            int bestLen = 0;
            for (String w : sentence.split("[^a-zA-Z0-9]+")) {
                if (w.length() > bestLen && w.length() > 4 && !stopWords.contains(w.toLowerCase())) {
                    keyword = w; bestLen = w.length();
                }
            }

            // Second keyword for Hard double-blank FITB
            int keyword2Idx = random.nextInt(allKeywords.size());
            String keyword2 = allKeywords.get(keyword2Idx);
            for (String w : sentence.split("[^a-zA-Z0-9]+")) {
                if (!w.equals(keyword) && w.length() > 4 && !stopWords.contains(w.toLowerCase())) {
                    keyword2 = w; break;
                }
            }

            Map<String, Object> q = new HashMap<>();

            if ("FITB".equalsIgnoreCase(qType)) {
                q.put("type", "FITB");
                boolean useDoubleBlank = useHarderTemplate && random.nextBoolean();
                if (useDoubleBlank) {
                    String blanked = sentence
                        .replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________")
                        .replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword2), "________");
                    q.put("questionText", "Fill in BOTH blanks precisely: \"" + blanked + "\"");
                    // Use descriptive answer instead of just keywords
                    q.put("blankAnswer", "The terms: " + keyword + " and " + keyword2 + " as described in context");
                    q.put("explanation", "The complete statement from the source text is: \"" + sentence + "\"");
                } else {
                    String blanked = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________");
                    q.put("questionText", "Fill in the blank: \"" + blanked + "\"");
                    // Use descriptive answer
                    q.put("blankAnswer", keyword + " (as defined in the passage)");
                    q.put("explanation", "From the text: \"" + sentence + "\"");
                }

            } else if ("TF".equalsIgnoreCase(qType)) {
                q.put("type", "TF");
                boolean isTrue = random.nextBoolean();
                String trueStem = useHarderTemplate
                    ? String.format(hardTfStems[random.nextInt(hardTfStems.length)], sentence)
                    : "Evaluate the following statement based on the passage: \"" + sentence + "\"";

                if (isTrue) {
                    q.put("questionText", trueStem);
                    q.put("options", List.of(option("A", "True", true), option("B", "False", false)));
                    q.put("explanation", "Correct — the text provides evidence supporting: \"" + sentence + "\"");
                } else {
                    // Create a sophisticated false statement by modifying a critical detail
                    int altWordIdx = random.nextInt(allKeywords.size());
                    String altWord = allKeywords.get(altWordIdx);
                    // Replace keyword with a related but incorrect concept
                    String falseSentence = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), altWord);
                    // Add a subtle qualifier to make it more plausible
                    if (useHarderTemplate) {
                        falseSentence = "In some contexts, " + falseSentence.substring(0, 1).toLowerCase() + falseSentence.substring(1);
                    }
                    String falseStem = useHarderTemplate
                        ? String.format(hardTfStems[random.nextInt(hardTfStems.length)], falseSentence)
                        : "Evaluate the following statement based on the passage: \"" + falseSentence + "\"?";
                    q.put("questionText", falseStem);
                    q.put("options", List.of(option("A", "True", false), option("B", "False", true)));
                    q.put("explanation", "Incorrect — the text actually states: \"" + sentence + "\". The statement modifies a critical detail.");
                }

            } else {
                // MCQ — difficulty-scaled stem with progression
                q.put("type", "MCQ");
                String stem;
                if (useHarderTemplate) {
                    stem = String.format(hardMcqStems[random.nextInt(hardMcqStems.length)], keyword);
                } else if (isMedium) {
                    stem = String.format(medMcqStems[random.nextInt(medMcqStems.length)], keyword);
                } else {
                    String blanked = sentence.replaceFirst("(?i)" + java.util.regex.Pattern.quote(keyword), "________");
                    stem = "Complete the sentence: \"" + blanked + "\"";
                }
                q.put("questionText", stem);

                // Generate descriptive correct answer (not just the keyword)
                String correctAnswer;
                if (useHarderTemplate) {
                    // Hard: Full contextual explanation
                    correctAnswer = sentence.substring(0, Math.min(sentence.length(), 85)) + (sentence.length() > 85 ? "..." : "");
                } else if (isMedium) {
                    // Medium: Descriptive phrase explaining the concept
                    correctAnswer = "Described as " + sentence.substring(0, Math.min(sentence.length(), 60)) + (sentence.length() > 60 ? "..." : "");
                } else {
                    // Easy: Descriptive answer, not just keyword
                    correctAnswer = "The concept described in the passage";
                }

                // Build sophisticated distractors that are descriptive, not single keywords
                java.util.Set<String> usedSet = new java.util.HashSet<>();
                usedSet.add(correctAnswer.toLowerCase());
                globallyUsedOptions.add(correctAnswer.toLowerCase());
                List<String> distractorTexts = new ArrayList<>();
                int dBase = random.nextInt(allKeywords.size());

                // Generate descriptive distractors with uniqueness check
                int attempts = 0;
                while (distractorTexts.size() < 3 && attempts < allKeywords.size() * 2) {
                    attempts++;
                    String dk = allKeywords.get((dBase + attempts) % allKeywords.size());
                    if (usedSet.contains(dk.toLowerCase()) || globallyUsedOptions.contains(dk.toLowerCase())) continue;

                    String distText;
                    if (useHarderTemplate) {
                        // Hard: Descriptive partial-truth distractors
                        int srcIdx = random.nextInt(validSentences.size());
                        String src = validSentences.get(srcIdx);
                        distText = "Although " + dk + " is relevant, the passage emphasizes: " + src.substring(0, Math.min(src.length(), 55)) + (src.length() > 55 ? "..." : "");
                    } else if (isMedium) {
                        // Medium: Descriptive contextual distractors
                        distText = "Related to " + dk + " but differs in the specific context described";
                    } else {
                        // Easy: Descriptive options instead of single words
                        distText = "A different concept mentioned elsewhere in the text";
                    }

                    String distLower = distText.toLowerCase();
                    if (!usedSet.contains(distLower) && !globallyUsedOptions.contains(distLower) && !distText.equalsIgnoreCase(correctAnswer)) {
                        usedSet.add(distLower);
                        globallyUsedOptions.add(distLower);
                        distractorTexts.add(distText);
                    }
                }

                // Add descriptive fallback distractors if needed
                while (distractorTexts.size() < 3) {
                    String fallback;
                    int fallbackNum = distractorTexts.size() + 1;
                    if (useHarderTemplate) {
                        fallback = "A valid interpretation but not the primary conclusion drawn (Option " + fallbackNum + ")";
                    } else if (isMedium) {
                        fallback = "Conceptually related but not the specific answer described (Option " + fallbackNum + ")";
                    } else {
                        fallback = "Different from what the passage indicates (Option " + fallbackNum + ")";
                    }
                    String fallbackLower = fallback.toLowerCase();
                    if (!usedSet.contains(fallbackLower) && !globallyUsedOptions.contains(fallbackLower)) {
                        distractorTexts.add(fallback);
                        usedSet.add(fallbackLower);
                        globallyUsedOptions.add(fallbackLower);
                    } else {
                        distractorTexts.add("Alternative interpretation described in text #" + fallbackNum);
                        globallyUsedOptions.add(("Alternative interpretation described in text #" + fallbackNum).toLowerCase());
                    }
                }

                // Shuffle distractors
                java.util.Collections.shuffle(distractorTexts);

                // Random correct answer position
                int correctPos = random.nextInt(4);
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

        // Hard MCQs — multi-step reasoning
        pool.add(createMcq(
                "A thread acquires Lock A then tries to acquire Lock B. A second thread holds Lock B and waits for Lock A. Which deadlock condition is directly demonstrated here?",
                "This is a circular wait — each thread holds a resource the other needs, forming a cycle. Preventing deadlock requires breaking at least one of the four necessary conditions.",
                List.of(
                        option("A", "Mutual Exclusion", false),
                        option("B", "Hold and Wait — one thread holds a lock while waiting for another", true),
                        option("C", "No Preemption", false),
                        option("D", "Starvation caused by thread priority inversion", false)
                )
        ));

        pool.add(createMcq(
                "A hash table uses open addressing with linear probing and a load factor of 0.9. What is the PRIMARY performance risk compared to a load factor of 0.5?",
                "At 0.9 load factor, primary clustering is severe — consecutive filled slots force long probe chains. This degrades average-case insertion and lookup toward O(N), far worse than the theoretical O(1).",
                List.of(
                        option("A", "The hash function becomes weaker at higher capacity", false),
                        option("B", "Primary clustering creates long probe sequences degrading lookup to O(N)", true),
                        option("C", "The table cannot store any more keys once full", false),
                        option("D", "Duplicate keys are silently overwritten", false)
                )
        ));

        pool.add(createMcq(
                "In a REST API, a client issues PUT /resources/99 with a full payload. The server responds 201 Created. What does this response imply about the resource state?",
                "201 Created means the server created a NEW resource. If /resources/99 already existed and was updated, the correct code is 200 OK or 204 No Content. The 201 confirms the resource did not exist before.",
                List.of(
                        option("A", "The resource was updated and the response contains the new version", false),
                        option("B", "The request was invalid and rejected by the server", false),
                        option("C", "No resource existed at that URI, so the server created one", true),
                        option("D", "The server returned a cached response due to idempotency", false)
                )
        ));

        pool.add(createMcq(
                "Why can a Java interface with ONLY default and static methods NOT be used as a functional interface with a lambda?",
                "A functional interface requires exactly one abstract method — the lambda expression implements that single abstract method. Default and static methods are not abstract, so an interface with zero abstract methods has nothing for a lambda to implement.",
                List.of(
                        option("A", "Lambdas cannot reference interfaces declared in the same package", false),
                        option("B", "A functional interface needs exactly one abstract method; zero abstract methods means nothing for the lambda to bind to", true),
                        option("C", "Default methods conflict with lambda syntax at compile time", false),
                        option("D", "Static methods prevent the interface from being instantiated anonymously", false)
                )
        ));

        // Hard TF
        pool.add(createTf(
                "In Java, 'const' is a reserved keyword that can be used to declare immutable class-level variables, equivalent to 'final'.",
                "False. Although 'const' is a reserved keyword in Java (to prevent its use), it has NO functional meaning and cannot be used in code. The correct keyword for immutability in Java is 'final'.",
                false
        ));

        pool.add(createTf(
                "HTTP/2 multiplexes multiple requests over a single TCP connection, which eliminates the head-of-line blocking problem that existed in HTTP/1.1 pipelining.",
                "Partially false. HTTP/2 multiplexing removes application-layer head-of-line blocking. However, TCP-level head-of-line blocking still exists in HTTP/2 — a lost TCP packet stalls all streams. HTTP/3 (QUIC) resolves this by switching to UDP.",
                false
        ));

        pool.add(createTf(
                "In a relational database, a foreign key constraint guarantees referential integrity by ensuring a child row cannot exist without a corresponding parent row.",
                "True. A foreign key enforces referential integrity — the referenced parent row must exist before a child row can be inserted, and the parent cannot be deleted while child rows reference it (unless CASCADE rules are defined).",
                true
        ));

        // Hard FITB
        pool.add(createFitb(
                "The four properties required for reliable database transaction processing — Atomicity, Consistency, Isolation, and Durability — are collectively abbreviated as ________.",
                "ACID",
                "ACID guarantees: Atomicity (all-or-nothing), Consistency (valid state), Isolation (concurrent transactions don't corrupt each other), Durability (committed data survives crashes)."
        ));

        pool.add(createFitb(
                "In concurrent programming, the condition where two or more threads are each waiting indefinitely for a resource held by the other, causing all threads to halt, is called a ________.",
                "deadlock",
                "Deadlock occurs when threads form a circular wait — each holds a resource needed by the next. It requires all four Coffman conditions simultaneously: Mutual Exclusion, Hold-and-Wait, No Preemption, and Circular Wait."
        ));

        pool.add(createFitb(
                "The design pattern in which a class ensures only one instance exists globally and provides a single access point to it is called the ________ pattern.",
                "Singleton",
                "The Singleton pattern restricts instantiation to one object. It is commonly used for logging, configuration managers, and thread pools, but can be an anti-pattern in testing environments due to global state."
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
    System.out.println("Status Code: " + response.statusCode());
    System.out.println("Response Body:");
    System.out.println(response.body());

    throw new RuntimeException(
        "Gemini API failed: " + response.statusCode() + "\n" + response.body()
    );
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
        
        // Quiz generation intent detection
        if (query.contains("generate") || query.contains("create") || query.contains("make")) {
            if (query.contains("quiz")) {
                return "I can help you generate a quiz! Please provide your study material by uploading a file or pasting text. You can also specify preferences like difficulty (Easy/Medium/Hard), question type (MCQ/TF/FITB/Mixed), and number of questions. Example: 'Generate a medium difficulty quiz with 10 MCQ questions from this text'";
            }
            if (query.contains("how to use")) {
                return "To generate a quiz, navigate to 'Generate Quiz' on the sidebar. Upload a document (PDF, DOCX, TXT, or Image) or paste your notes directly, choose a difficulty level and question type, and click 'Generate Quiz Now'!";
            }
        }
        
        // Quiz configuration recommendations
        if (query.contains("recommend") || query.contains("suggest") || query.contains("advice") || query.contains("what settings")) {
            if (query.contains("difficulty")) {
                return "For optimal quiz difficulty: Use 'Easy' for foundational concepts and definitions, 'Medium' for application and analysis, 'Hard' for synthesis and evaluation. 'Mixed' mode adapts to all levels. I recommend starting with Medium for most study materials.";
            }
            if (query.contains("question") || query.contains("type")) {
                return "For question types: MCQ tests recognition and application, TF verifies factual accuracy, FITB assesses recall precision. 'Mixed' provides comprehensive assessment. For technical content, I recommend MCQ; for definitions, try FITB.";
            }
            if (query.contains("number") || query.contains("count") || query.contains("how many")) {
                return "For question count: 5-10 for quick reviews, 15-20 for comprehensive study sessions, 25-30 for exam preparation. I recommend 10-15 questions for balanced assessment without fatigue.";
            }
            return "I can recommend quiz settings based on your content! Tell me about your material (length, complexity, topic) and I'll suggest optimal difficulty, question type, and count.";
        }
        
        // File format support
        if (query.contains("file") || query.contains("pdf") || query.contains("docx") || query.contains("txt") || query.contains("image") || query.contains("upload") || query.contains("format")) {
            return "We support PDF, DOCX, TXT, PPT, and common image formats (JPG/PNG). Image files undergo OCR processing to automatically extract text for the quiz questions. You can upload files directly in this chat or use the Generate Quiz page.";
        }
        
        // Scoring and history
        if (query.contains("score") || query.contains("grade") || query.contains("calculate") || query.contains("history") || query.contains("report")) {
            return "Your submissions are graded instantly! You can view detailed correct, incorrect, and skipped counts, score percentages, and AI diagnostic feedback. All past reports are saved under 'Quiz History'.";
        }
        
        // Question types
        if (query.contains("mixed") || query.contains("mcq") || query.contains("tf") || query.contains("fitb") || query.contains("type")) {
            return "We support Multiple Choice Questions (MCQ), True/False (TF), Fill in the Blanks (FITB), or 'Mixed' mode which constructs a custom blend of all three types. You can specify your preference when generating a quiz.";
        }
        
        // Difficulty levels
        if (query.contains("difficulty") || query.contains("easy") || query.contains("medium") || query.contains("hard")) {
            return "Choose from four difficulty levels: Easy (fundamental recall), Medium (conceptual application), Hard (analytical deep-dive), or Mixed (adaptive all-levels). Hard questions require multi-step reasoning and expert-level understanding.";
        }
        
        // Greetings
        if (query.contains("hi") || query.contains("hello") || query.contains("hey") || query.contains("who are you")) {
            return "Greetings, user! I am your cybernetic AI assistant. I can help you generate quizzes, answer questions about the system, and provide recommendations. Try asking me to 'Generate a quiz' or 'What file formats are supported?'";
        }
        
        // Feedback and issues
        if (query.contains("feedback") || query.contains("suggest") || query.contains("issue") || query.contains("error") || query.contains("bug")) {
            return "We highly value your feedback! If you run into any issues, verify that your document text is clean and legible. Let us know if you have suggestions for improvement.";
        }
        
        // Help and guidance
        if (query.contains("help") || query.contains("guide") || query.contains("tutorial")) {
            return "I'm here to help! You can ask me to: 1) Generate quizzes from your content, 2) Explain how to use features, 3) Get recommendations for quiz settings, 4) Understand your quiz results. What would you like to do?";
        }
        
        // Default response
        return "I am your Quiz AI assistant. You can upload study documents, generate customized quizzes, evaluate your knowledge, and review past reports. Try asking 'How do I generate a quiz?' or 'What file formats are supported?'";
    }

    public String analyzeContentAndRecommend(String contentText) {
        if (contentText == null || contentText.trim().isEmpty()) {
            return "Please provide content for analysis. I'll recommend optimal quiz settings based on text complexity and length.";
        }

        int wordCount = contentText.split("\\s+").length;
        int sentenceCount = contentText.split("[.!?]+").length;
        double avgWordsPerSentence = wordCount / (double) sentenceCount;
        
        String difficultyRecommendation;
        String questionTypeRecommendation;
        String countRecommendation;
        
        // Analyze complexity
        if (avgWordsPerSentence > 20 || contentText.length() > 2000) {
            difficultyRecommendation = "Medium - The content appears complex with detailed explanations. Medium difficulty will test conceptual understanding without overwhelming complexity.";
        } else if (avgWordsPerSentence > 15) {
            difficultyRecommendation = "Medium - The content has moderate complexity. Medium difficulty questions will balance recall and application.";
        } else {
            difficultyRecommendation = "Easy - The content appears straightforward. Easy difficulty will test fundamental understanding effectively.";
        }
        
        // Analyze question type suitability
        if (contentText.contains("define") || contentText.contains("what is") || contentText.contains("means")) {
            questionTypeRecommendation = "MCQ or FITB - The content contains definitions, making multiple choice and fill-in-the-blanks ideal for testing recall.";
        } else if (contentText.contains("true") || contentText.contains("false") || contentText.contains("correct")) {
            questionTypeRecommendation = "TF or MCQ - The content contains factual statements, making true/false and multiple choice suitable.";
        } else {
            questionTypeRecommendation = "Mixed - The content covers various concepts. Mixed question types will provide comprehensive assessment.";
        }
        
        // Analyze optimal question count
        if (wordCount < 100) {
            countRecommendation = "5 questions - The content is concise. A short quiz will effectively cover key concepts.";
        } else if (wordCount < 300) {
            countRecommendation = "10 questions - The content has moderate length. 10 questions will provide good coverage without repetition.";
        } else if (wordCount < 600) {
            countRecommendation = "15 questions - The content is substantial. 15 questions will comprehensively assess understanding.";
        } else {
            countRecommendation = "20 questions - The content is extensive. 20 questions will thoroughly evaluate knowledge across all topics.";
        }
        
        return String.format("Based on content analysis (%d words, %.1f avg words/sentence):\n\n" +
                "🎯 Difficulty: %s\n" +
                "📝 Question Type: %s\n" +
                "🔢 Question Count: %s\n\n" +
                "Say 'Generate quiz' to use these recommendations, or specify your own preferences!",
                wordCount, avgWordsPerSentence, difficultyRecommendation, questionTypeRecommendation, countRecommendation);
    }
}
