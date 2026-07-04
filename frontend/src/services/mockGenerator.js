// Simulated AI Quiz Generator that reads file names and content to generate thematic quizzes

const COMPUTER_SCIENCE_QUESTIONS = [
  // --- HARD MCQs ---
  {
    type: 'MCQ',
    difficulty: 'hard',
    question_text: 'A thread acquires Lock A then tries to acquire Lock B, while another thread holds Lock B and waits for Lock A. Which condition does this scenario directly violate to prevent deadlock?',
    options: [
      { option_letter: 'A', option_text: 'Mutual Exclusion', is_correct: false },
      { option_letter: 'B', option_text: 'Hold and Wait', is_correct: true },
      { option_letter: 'C', option_text: 'No Preemption', is_correct: false },
      { option_letter: 'D', option_text: 'Circular Wait', is_correct: false }
    ],
    explanation: 'Deadlock requires four conditions simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. To prevent deadlock, you must eliminate at least one. Requiring threads to acquire all locks atomically (never holding one while waiting) eliminates the "Hold and Wait" condition.'
  },
  {
    type: 'MCQ',
    difficulty: 'hard',
    question_text: 'Consider a hash table using open addressing with linear probing and a load factor of 0.9. What is the primary performance concern compared to a load factor of 0.5?',
    options: [
      { option_letter: 'A', option_text: 'Increased memory usage per bucket', is_correct: false },
      { option_letter: 'B', option_text: 'Primary clustering causing long probe sequences', is_correct: true },
      { option_letter: 'C', option_text: 'Higher collision rate due to a weaker hash function', is_correct: false },
      { option_letter: 'D', option_text: 'Inability to handle duplicate keys', is_correct: false }
    ],
    explanation: 'With linear probing at a high load factor (0.9), primary clustering becomes severe — occupied slots form long contiguous runs, making each insertion and lookup degrade toward O(N) as the probe sequence must skip many filled slots.'
  },
  {
    type: 'MCQ',
    difficulty: 'hard',
    question_text: 'In a REST API, a client sends a PUT request to /users/42 with a full user payload, but the server responds with 201 Created instead of 200 OK. What does this imply?',
    options: [
      { option_letter: 'A', option_text: 'The server updated the existing user record successfully', is_correct: false },
      { option_letter: 'B', option_text: 'The request was malformed and rejected', is_correct: false },
      { option_letter: 'C', option_text: 'No resource existed at /users/42, so the server created it', is_correct: true },
      { option_letter: 'D', option_text: 'The server treated the request as idempotent and returned a cached response', is_correct: false }
    ],
    explanation: '201 Created indicates the request resulted in a new resource being created. A proper PUT to an existing resource returns 200 OK or 204 No Content. The 201 response means /users/42 did not exist before this request.'
  },
  // --- MEDIUM MCQs ---
  {
    type: 'MCQ',
    difficulty: 'medium',
    question_text: 'Why does a balanced BST guarantee O(log N) search time while an unbalanced one degrades to O(N)?',
    options: [
      { option_letter: 'A', option_text: 'Balanced BSTs use hashing internally to speed up comparisons', is_correct: false },
      { option_letter: 'B', option_text: 'An unbalanced BST can resemble a linked list, eliminating the halving benefit', is_correct: true },
      { option_letter: 'C', option_text: 'Balanced BSTs store duplicate keys which shortens search paths', is_correct: false },
      { option_letter: 'D', option_text: 'Unbalanced BSTs use linear probing to resolve collisions', is_correct: false }
    ],
    explanation: 'In a balanced BST, each comparison eliminates half the remaining nodes (height ≈ log N). In a worst-case unbalanced tree (e.g., all insertions in sorted order), it degenerates to a linked list of height N, making search O(N).'
  },
  {
    type: 'MCQ',
    difficulty: 'medium',
    question_text: 'Which SQL clause is used to filter records AFTER they have been grouped by an aggregate function?',
    options: [
      { option_letter: 'A', option_text: 'WHERE', is_correct: false },
      { option_letter: 'B', option_text: 'HAVING', is_correct: true },
      { option_letter: 'C', option_text: 'ORDER BY', is_correct: false },
      { option_letter: 'D', option_text: 'FILTER BY', is_correct: false }
    ],
    explanation: 'HAVING filters groups after GROUP BY aggregation, whereas WHERE filters individual rows before grouping. Using WHERE with aggregate functions like COUNT() or SUM() causes a SQL syntax error.'
  },
  // --- EASY MCQs ---
  {
    type: 'MCQ',
    difficulty: 'easy',
    question_text: 'Which memory type in a computer is volatile — losing all data when power is cut?',
    options: [
      { option_letter: 'A', option_text: 'ROM', is_correct: false },
      { option_letter: 'B', option_text: 'Hard Disk', is_correct: false },
      { option_letter: 'C', option_text: 'SSD', is_correct: false },
      { option_letter: 'D', option_text: 'RAM', is_correct: true }
    ],
    explanation: 'RAM (Random Access Memory) is volatile storage. It holds running program data and is completely erased on power loss. ROM, HDD, and SSD are non-volatile.'
  },
  // --- HARD TF ---
  {
    type: 'TF',
    difficulty: 'hard',
    question_text: 'A Java interface declared with only default and static methods (no abstract methods) can still be used as a functional interface with a lambda expression.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: 'A functional interface requires exactly ONE abstract method — that is what the lambda binds to. An interface with only default and static methods has zero abstract methods, so it cannot be a functional interface and cannot be instantiated via a lambda.'
  },
  {
    type: 'TF',
    difficulty: 'hard',
    question_text: 'In JavaScript, "const" declared at the module level prevents all mutations to the object it references, including property additions.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: '"const" only prevents re-binding the variable to a different reference. The object it points to is still mutable — properties can be added, changed, or deleted unless Object.freeze() is explicitly called.'
  },
  // --- MEDIUM TF ---
  {
    type: 'TF',
    difficulty: 'medium',
    question_text: 'HTTP is a stateless protocol, meaning each request is independent and the server retains no session information between requests by default.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: true },
      { option_letter: 'B', option_text: 'False', is_correct: false }
    ],
    explanation: 'Correct. HTTP is stateless by design. Mechanisms like cookies, JWT tokens, or server-side sessions were invented specifically to layer stateful behavior on top of the stateless HTTP protocol.'
  },
  // --- HARD FITB ---
  {
    type: 'FITB',
    difficulty: 'hard',
    question_text: 'In database transactions, the four properties that guarantee reliable processing are collectively called ________, where each letter represents Atomicity, Consistency, Isolation, and Durability.',
    blank_answer: 'ACID',
    explanation: 'ACID properties ensure that database transactions are processed reliably. Atomicity = all-or-nothing; Consistency = valid state transitions; Isolation = concurrent transactions do not interfere; Durability = committed data survives crashes.'
  },
  {
    type: 'FITB',
    difficulty: 'hard',
    question_text: 'The design pattern that defines a one-to-many dependency between objects so that when one object changes state, all dependents are automatically notified is called the ________ pattern.',
    blank_answer: 'Observer',
    explanation: 'The Observer pattern (also called Publish-Subscribe) decouples the subject from its observers. It is the basis for event-driven systems, React state management, and GUI frameworks.'
  },
  // --- MEDIUM FITB ---
  {
    type: 'FITB',
    difficulty: 'medium',
    question_text: 'The SQL command used to permanently remove all rows from a table while keeping the table structure intact, and which cannot be rolled back, is ________.',
    blank_answer: 'TRUNCATE',
    explanation: 'TRUNCATE removes all rows instantly without logging individual row deletions and cannot be rolled back in most databases. DELETE removes rows one-by-one and is logged, making it rollback-safe within a transaction.'
  },
  // --- EASY FITB ---
  {
    type: 'FITB',
    difficulty: 'easy',
    question_text: 'The process of finding and removing errors (bugs) from a computer program is called ________.',
    blank_answer: 'debugging',
    explanation: 'Debugging involves identifying, isolating, and fixing bugs in a program so it behaves as expected.'
  }
];

const CYBERPUNK_QUESTIONS = [
  {
    type: 'MCQ',
    difficulty: 'hard',
    question_text: 'In William Gibson\'s "Neuromancer", Case is denied cyberspace access via a mycotoxin that damages his nervous system. What does this narrative device most directly critique about the cyberpunk world?',
    options: [
      { option_letter: 'A', option_text: 'The unreliability of black-market surgery', is_correct: false },
      { option_letter: 'B', option_text: 'Corporate power using bodily control as punishment and leverage', is_correct: true },
      { option_letter: 'C', option_text: 'The addictive nature of virtual reality environments', is_correct: false },
      { option_letter: 'D', option_text: 'The physical dangers of direct neural interfaces', is_correct: false }
    ],
    explanation: 'Case\'s enforced exile from cyberspace is a form of corporate punishment — his body becomes the site of corporate control. This critiques how in the cyberpunk world, mega-corporations weaponize technology against individuals, reducing the human body to a controllable asset.'
  },
  {
    type: 'MCQ',
    difficulty: 'medium',
    question_text: 'What does the acronym "ICE" stand for in cyberpunk security networks, and what distinguishes "Black ICE" from regular ICE?',
    options: [
      { option_letter: 'A', option_text: 'Interactive Cyber Encryption; Black ICE uses quantum algorithms', is_correct: false },
      { option_letter: 'B', option_text: 'Intrusion Countermeasure Electronics; Black ICE can cause physical neural harm to attackers', is_correct: true },
      { option_letter: 'C', option_text: 'Internal Control Engine; Black ICE is government-exclusive software', is_correct: false },
      { option_letter: 'D', option_text: 'Intelligent Crypto Engine; Black ICE encrypts data permanently on breach', is_correct: false }
    ],
    explanation: 'ICE = Intrusion Countermeasure Electronics, software that guards corporate cyberspace. Black ICE is lethal ICE — it can flatline (kill) a hacker by sending harmful signals through their neural jack, bridging the digital and physical consequences.'
  },
  {
    type: 'TF',
    difficulty: 'hard',
    question_text: 'Philip K. Dick\'s "Do Androids Dream of Electric Sheep?" and William Gibson\'s "Neuromancer" both share a core thematic concern: the erosion of the distinction between authentic human experience and technological simulation.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: true },
      { option_letter: 'B', option_text: 'False', is_correct: false }
    ],
    explanation: 'True. Dick explores the android/human boundary through empathy and Mercerism (a simulated religious experience). Gibson explores it through cyberspace as a "consensual hallucination" indistinguishable from reality. Both destabilize what "real" human experience means in a technologized world.'
  },
  {
    type: 'TF',
    difficulty: 'medium',
    question_text: 'The term "Cyberpunk" as a genre label was first used by author Bruce Bethke in the title of his 1983 published short story.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: true },
      { option_letter: 'B', option_text: 'False', is_correct: false }
    ],
    explanation: 'True. Bruce Bethke wrote "Cyberpunk" in 1980 and published it in Amazing Stories in 1983. The term was popularized as a genre label by editor Gardner Dozois, and the genre itself was codified by William Gibson\'s Neuromancer (1984).'
  },
  {
    type: 'FITB',
    difficulty: 'hard',
    question_text: 'In cyberpunk fiction, the corporate-dominated, high-tech but decayed urban environment is often described by the maxim "High tech, low ________" — capturing the genre\'s central tension.',
    blank_answer: 'life',
    explanation: '"High tech, low life" is the defining maxim of cyberpunk, coined by Bruce Bethke and popularized by Gardner Dozois. It encapsulates the genre\'s core irony: advanced technology exists alongside profound social decay, poverty, and human suffering.'
  },
  {
    type: 'FITB',
    difficulty: 'medium',
    question_text: 'The iconic cyberpunk novel that introduced "cyberspace" as a concept and won the Hugo, Nebula, and Philip K. Dick awards was "________" by William Gibson.',
    blank_answer: 'Neuromancer',
    explanation: 'Neuromancer (1984) by William Gibson is the foundational cyberpunk novel. It introduced cyberspace, ICE, and the console cowboy archetype, winning the Hugo, Nebula, and Philip K. Dick awards — a rare triple crown.'
  }
];

const DEFAULT_QUESTIONS = [
  {
    type: 'MCQ',
    difficulty: 'hard',
    question_text: 'The Heisenberg Uncertainty Principle states that the position and momentum of a particle cannot both be precisely known simultaneously. What is the MOST accurate interpretation of why this is fundamentally the case?',
    options: [
      { option_letter: 'A', option_text: 'Measurement instruments are too imprecise to detect both values', is_correct: false },
      { option_letter: 'B', option_text: 'A particle does not possess definite values for both simultaneously — measurement disturbs the system', is_correct: false },
      { option_letter: 'C', option_text: 'Position and momentum are conjugate variables — their uncertainties are mathematically linked by wave-particle duality', is_correct: true },
      { option_letter: 'D', option_text: 'At quantum scales, relativity prevents simultaneous observation', is_correct: false }
    ],
    explanation: 'The uncertainty is not due to instrument limitations or observer disturbance — it is intrinsic. Position and momentum are Fourier conjugates: a localized wave packet (precise position) necessarily has a broad spread of frequencies (uncertain momentum). This is a fundamental feature of wave mechanics, not a measurement problem.'
  },
  {
    type: 'MCQ',
    difficulty: 'medium',
    question_text: 'Why does light slow down when passing through a medium like glass or water, even though photons always travel at c in a vacuum?',
    options: [
      { option_letter: 'A', option_text: 'Photons lose energy by interacting with gravity inside the medium', is_correct: false },
      { option_letter: 'B', option_text: 'Photons are absorbed and re-emitted by atoms in the medium, causing an effective delay', is_correct: true },
      { option_letter: 'C', option_text: 'The wavelength of light increases inside denser materials', is_correct: false },
      { option_letter: 'D', option_text: 'Friction between photons and molecules reduces photon velocity', is_correct: false }
    ],
    explanation: 'In a medium, photons interact with atoms — being absorbed and re-emitted repeatedly. Each interaction introduces a small delay, so the effective (phase) velocity of light through the medium is less than c. Individual photons still travel at c between interactions.'
  },
  {
    type: 'MCQ',
    difficulty: 'easy',
    question_text: 'Which chemical element forms the backbone of all organic molecules and is the basis of all known life on Earth?',
    options: [
      { option_letter: 'A', option_text: 'Oxygen', is_correct: false },
      { option_letter: 'B', option_text: 'Hydrogen', is_correct: false },
      { option_letter: 'C', option_text: 'Carbon', is_correct: true },
      { option_letter: 'D', option_text: 'Nitrogen', is_correct: false }
    ],
    explanation: 'Carbon can form four covalent bonds simultaneously, allowing it to build complex chain and ring structures — the basis of proteins, DNA, and all organic chemistry.'
  },
  {
    type: 'TF',
    difficulty: 'hard',
    question_text: 'Natural selection acts on individual organisms, but evolution — in the sense of changing allele frequencies — occurs at the level of the population, not the individual.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: true },
      { option_letter: 'B', option_text: 'False', is_correct: false }
    ],
    explanation: 'True. An individual\'s genome does not change during its lifetime (somatic mutations aside). Natural selection acts on individuals (differential survival/reproduction), but evolution is measured as a change in allele frequency within a population across generations.'
  },
  {
    type: 'TF',
    difficulty: 'medium',
    question_text: 'Light travels faster in water than it does in a vacuum because water\'s high density increases photon momentum.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: 'False. Light travels SLOWER in water (refractive index ≈ 1.33), not faster. The speed of light in a vacuum (c ≈ 3×10⁸ m/s) is the absolute maximum. Density does not increase photon speed — it reduces effective propagation speed through absorption-re-emission.'
  },
  {
    type: 'FITB',
    difficulty: 'hard',
    question_text: 'The minimum energy required to remove an electron from the surface of a metal, as demonstrated in the photoelectric effect, is called the ________ of that metal.',
    blank_answer: 'work function',
    explanation: 'The work function (Φ) is the minimum photon energy (hf) needed to eject an electron. Einstein\'s explanation of the photoelectric effect using photon quanta (not wave intensity) earned him the Nobel Prize and confirmed the particle nature of light.'
  },
  {
    type: 'FITB',
    difficulty: 'easy',
    question_text: 'The closest star to our solar system, located approximately 4.24 light-years away, is Proxima ________.',
    blank_answer: 'Centauri',
    explanation: 'Proxima Centauri is a red dwarf star in the Alpha Centauri system, the nearest stellar system to the Sun at 4.24 light-years.'
  }
];

export const generateQuizQuestions = (fileName, contentText, config) => {
  const { difficulty, numQuestions, questionType } = config;

  // All question banks are now merged; pick a thematic subset first
  const ALL_BANKS = [...COMPUTER_SCIENCE_QUESTIONS, ...CYBERPUNK_QUESTIONS, ...DEFAULT_QUESTIONS];

  const searchable = ((fileName || '') + ' ' + (contentText || '')).toLowerCase();
  let sourceBank;
  if (searchable.includes('cyber') || searchable.includes('neon') || searchable.includes('punk')) {
    sourceBank = [...CYBERPUNK_QUESTIONS, ...DEFAULT_QUESTIONS, ...COMPUTER_SCIENCE_QUESTIONS];
  } else if (
    searchable.includes('code') || searchable.includes('java') || searchable.includes('web') ||
    searchable.includes('computer') || searchable.includes('sql') ||
    searchable.includes('database') || searchable.includes('science') ||
    searchable.includes('programming')
  ) {
    sourceBank = [...COMPUTER_SCIENCE_QUESTIONS, ...DEFAULT_QUESTIONS, ...CYBERPUNK_QUESTIONS];
  } else {
    sourceBank = ALL_BANKS;
  }

  // Filter by question type
  let pool = sourceBank;
  if (questionType === 'MCQ')       pool = sourceBank.filter(q => q.type === 'MCQ');
  else if (questionType === 'TF')   pool = sourceBank.filter(q => q.type === 'TF');
  else if (questionType === 'FITB') pool = sourceBank.filter(q => q.type === 'FITB');
  if (pool.length === 0) pool = sourceBank;

  // ── Difficulty-aware prioritization ──────────────────────────────────────
  // Questions tagged with a `difficulty` field are sorted to the front so the
  // requested difficulty gets priority. Fallback tiers ensure pool is never empty.
  const diffLower = (difficulty || 'medium').toLowerCase();

  const hardTier   = pool.filter(q => (q.difficulty || '') === 'hard').sort(() => 0.5 - Math.random());
  const medTier    = pool.filter(q => (q.difficulty || '') === 'medium').sort(() => 0.5 - Math.random());
  const easyTier   = pool.filter(q => (q.difficulty || '') === 'easy').sort(() => 0.5 - Math.random());
  const untagged   = pool.filter(q => !q.difficulty).sort(() => 0.5 - Math.random());

  let orderedPool;
  if (diffLower === 'hard')        orderedPool = [...hardTier, ...medTier, ...easyTier, ...untagged];
  else if (diffLower === 'easy')   orderedPool = [...easyTier, ...medTier, ...hardTier, ...untagged];
  else                             orderedPool = [...medTier, ...hardTier, ...easyTier, ...untagged];

  // Remove duplicates
  const uniquePool = [];
  const seenTexts = new Set();
  for (const q of orderedPool) {
    if (!seenTexts.has(q.question_text)) {
      seenTexts.add(q.question_text);
      uniquePool.push(q);
    }
  }

  return uniquePool.slice(0, numQuestions).map((q, idx) => {
    // Generate explanation prefix showing it is AI-generated based on document
    let explanationText = q.explanation;
    if (diffLower === 'easy') {
      explanationText = `[Easy Concept] ${explanationText}`;
    } else if (diffLower === 'hard') {
      explanationText = `[Advanced Analysis] ${explanationText} Detailed analysis of document data suggests this relationship holds under secondary conditions.`;
    }
    
    return {
      id: idx + 1,
      type: q.type,
      question_text: q.question_text,
      options: q.options ? q.options.map(opt => ({ ...opt })) : null,
      blank_answer: q.blank_answer || null,
      explanation: explanationText
    };
  });
};

// Generate personalized AI feedback
export const generateAIFeedback = (correct, total, timeSec, difficulty) => {
  const percentage = (correct / total) * 100;
  
  const strengths = [];
  const weaknesses = [];
  const studyTopics = [];
  let summary = '';
  
  if (percentage >= 90) {
    summary = 'Outstanding cybernetic cognitive alignment! You have fully assimilated the content of the uploaded document. Your analytical parsing is flawless.';
    strengths.push('Complete context comprehension', 'High execution accuracy', 'Optimal time management');
    weaknesses.push('None detected. Keep maintaining this level.');
    studyTopics.push('Advanced theoretical concepts', 'Edge case configurations');
  } else if (percentage >= 70) {
    summary = 'Good operational efficiency. You have captured the main core concepts of the document, but minor node packet losses occurred in detail extraction.';
    strengths.push('Core semantic mapping', 'Logical process exclusion');
    weaknesses.push('Detail retention', 'Terminology memorization');
    studyTopics.push('Chapter definitions', 'Parameter limitations', 'Section summaries');
  } else if (percentage >= 40) {
    summary = 'Sub-optimal query resolution. Multiple nodes failed during matching. We recommend re-reading the text and attempting the quiz with Easy difficulty first.';
    strengths.push('Basic terminology matching');
    weaknesses.push('Deep analytical linking', 'Multiple choice trap avoidance', 'Process flows');
    studyTopics.push('Primary building blocks', 'Chronological timelines in document', 'Core diagrams');
  } else {
    summary = 'Critical system alert. Cognitive sync failed. The quiz parameters exceeded your current knowledge parsing bounds. Complete review of documentation is mandatory.';
    strengths.push('Persistent attempt metrics');
    weaknesses.push('High failure rate on multiple core topics', 'Skipped critical nodes', 'Incorrect fill-ins');
    studyTopics.push('Basic concepts glossary', 'Introductory documentation notes', 'Document keywords');
  }
  
  return {
    summary,
    strengths,
    weaknesses,
    recommendations: studyTopics
  };
};
