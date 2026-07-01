// Simulated AI Quiz Generator that reads file names and content to generate thematic quizzes

const COMPUTER_SCIENCE_QUESTIONS = [
  {
    type: 'MCQ',
    question_text: 'Which of the following is a core principle of Object-Oriented Programming (OOP)?',
    options: [
      { option_letter: 'A', option_text: 'Compilation', is_correct: false },
      { option_letter: 'B', option_text: 'Encapsulation', is_correct: true },
      { option_letter: 'C', option_text: 'Execution', is_correct: false },
      { option_letter: 'D', option_text: 'Recursion', is_correct: false }
    ],
    explanation: 'Encapsulation is one of the four fundamental OOP concepts (along with Inheritance, Polymorphism, and Abstraction). It wraps code and data together into a single unit.'
  },
  {
    type: 'MCQ',
    question_text: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
    options: [
      { option_letter: 'A', option_text: 'O(1)', is_correct: false },
      { option_letter: 'B', option_text: 'O(N)', is_correct: false },
      { option_letter: 'C', option_text: 'O(log N)', is_correct: true },
      { option_letter: 'D', option_text: 'O(N log N)', is_correct: false }
    ],
    explanation: 'In a balanced BST, the height of the tree is log N. Since each comparison discards half of the remaining nodes, the search complexity is O(log N).'
  },
  {
    type: 'TF',
    question_text: 'HTTP is a stateful protocol by default, which is why cookies are used to manage state.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: 'HTTP is actually a stateless protocol. It does not retain any info about previous requests, which is why cookies, sessions, and tokens are required to maintain state.'
  },
  {
    type: 'FITB',
    question_text: 'The process of finding and resolving bugs or defects within a software program is called ________.',
    blank_answer: 'debugging',
    explanation: 'Debugging is the routine process of locating and fixing bugs or anomalies in a software system to make it behave as expected.'
  },
  {
    type: 'MCQ',
    question_text: 'Which SQL clause is used to filter records after they have been grouped by an aggregate function?',
    options: [
      { option_letter: 'A', option_text: 'WHERE', is_correct: false },
      { option_letter: 'B', option_text: 'HAVING', is_correct: true },
      { option_letter: 'C', option_text: 'ORDER BY', is_correct: false },
      { option_letter: 'D', option_text: 'GROUP FILTER', is_correct: false }
    ],
    explanation: 'The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions. HAVING filters records after grouping.'
  },
  {
    type: 'TF',
    question_text: 'In JavaScript, "const" variables are completely immutable, meaning their contents can never change.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: 'The "const" keyword prevents re-assignment of the variable identifier itself, but properties of objects or elements of arrays declared with const can still be modified.'
  },
  {
    type: 'FITB',
    question_text: 'In database management, standard SQL stands for Structured ________ Language.',
    blank_answer: 'Query',
    explanation: 'SQL stands for Structured Query Language, which is the standard language used to interact with relational databases.'
  },
  {
    type: 'MCQ',
    question_text: 'Which memory in a computer is volatile and loses its contents when the power is turned off?',
    options: [
      { option_letter: 'A', option_text: 'ROM', is_correct: false },
      { option_letter: 'B', option_text: 'Hard Disk', is_correct: false },
      { option_letter: 'C', option_text: 'SSD', is_correct: false },
      { option_letter: 'D', option_text: 'RAM', is_correct: true }
    ],
    explanation: 'Random Access Memory (RAM) is volatile. It stores active program data temporarily and is cleared completely when powered down.'
  }
];

const CYBERPUNK_QUESTIONS = [
  {
    type: 'MCQ',
    question_text: 'In cyberpunk lore, what term is commonly used to describe the virtual reality network representing global data?',
    options: [
      { option_letter: 'A', option_text: 'The Grid', is_correct: false },
      { option_letter: 'B', option_text: 'The Cyberspace Matrix', is_correct: true },
      { option_letter: 'C', option_text: 'The CloudNet', is_correct: false },
      { option_letter: 'D', option_text: 'Deep Web 2.0', is_correct: false }
    ],
    explanation: 'Popularized by William Gibson in Neuromancer, the Matrix or Cyberspace represents the consensual hallucination of global digital networks.'
  },
  {
    type: 'MCQ',
    question_text: 'What does the acronym "ICE" stand for in cyberpunk security networks?',
    options: [
      { option_letter: 'A', option_text: 'Interactive Cyber Encryption', is_correct: false },
      { option_letter: 'B', option_text: 'Intelligent Control Element', is_correct: false },
      { option_letter: 'C', option_text: 'Intrusion Countermeasure Electronics', is_correct: true },
      { option_letter: 'D', option_text: 'Internal Corporate Espionage', is_correct: false }
    ],
    explanation: 'Intrusion Countermeasure Electronics (ICE) is software that blocks hackers from accessing protected corporate databases, sometimes even causing physical harm (Black ICE).'
  },
  {
    type: 'TF',
    question_text: 'The term "Cyberpunk" was originally coined by Bruce Bethke in his 1983 short story titled "Cyberpunk".',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: true },
      { option_letter: 'B', option_text: 'False', is_correct: false }
    ],
    explanation: 'True. Bruce Bethke wrote the story "Cyberpunk" in 1980, publishing it in 1983, combining "cybernetics" (control systems) and "punk" (rebellious youth).'
  },
  {
    type: 'FITB',
    question_text: 'The iconic cyberpunk novel "Neuromancer" was written by William ________.',
    blank_answer: 'Gibson',
    explanation: 'William Gibson wrote Neuromancer in 1984, establishing many of the major tropes of the cyberpunk science fiction genre.'
  }
];

const DEFAULT_QUESTIONS = [
  {
    type: 'MCQ',
    question_text: 'What is the main chemical element that makes up the organic compounds of all living things on Earth?',
    options: [
      { option_letter: 'A', option_text: 'Oxygen', is_correct: false },
      { option_letter: 'B', option_text: 'Hydrogen', is_correct: false },
      { option_letter: 'C', option_text: 'Carbon', is_correct: true },
      { option_letter: 'D', option_text: 'Nitrogen', is_correct: false }
    ],
    explanation: 'Carbon is the basis of organic chemistry because it can form stable covalent bonds with up to four other atoms, allowing complex molecules.'
  },
  {
    type: 'TF',
    question_text: 'Light travels faster in water than it does in a vacuum.',
    options: [
      { option_letter: 'A', option_text: 'True', is_correct: false },
      { option_letter: 'B', option_text: 'False', is_correct: true }
    ],
    explanation: 'Light travels fastest in a vacuum (approximately 300,000 km/s). When traveling through medium materials like water or glass, it slows down due to refraction.'
  },
  {
    type: 'FITB',
    question_text: 'The closest star to our solar system is Proxima ________.',
    blank_answer: 'Centauri',
    explanation: 'Proxima Centauri is a small red dwarf star located 4.24 light-years away in the constellation of Centaurus.'
  },
  {
    type: 'MCQ',
    question_text: 'Which organ in the human body is primarily responsible for filtering waste products from the blood?',
    options: [
      { option_letter: 'A', option_text: 'Liver', is_correct: false },
      { option_letter: 'B', option_text: 'Kidneys', is_correct: true },
      { option_letter: 'C', option_text: 'Lungs', is_correct: false },
      { option_letter: 'D', option_text: 'Heart', is_correct: false }
    ],
    explanation: 'The kidneys filter blood to produce urine, removing excess water, salts, and urea, which are toxic metabolic waste products.'
  }
];

export const generateQuizQuestions = (fileName, contentText, config) => {
  const { difficulty, numQuestions, questionType } = config;
  
  // Choose source bank based on keywords in file name or text
  let sourceBank = DEFAULT_QUESTIONS;
  const searchable = ((fileName || '') + ' ' + (contentText || '')).toLowerCase();
  
  if (searchable.includes('cyber') || searchable.includes('neon') || searchable.includes('punk')) {
    sourceBank = CYBERPUNK_QUESTIONS;
  } else if (
    searchable.includes('code') || 
    searchable.includes('java') || 
    searchable.includes('web') || 
    searchable.includes('computer') || 
    searchable.includes('sql') ||
    searchable.includes('database') ||
    searchable.includes('science') ||
    searchable.includes('programming')
  ) {
    sourceBank = COMPUTER_SCIENCE_QUESTIONS;
  }
  
  // If the source bank is smaller than requested size, we combine banks
  let pool = [...sourceBank];
  if (pool.length < numQuestions) {
    pool = [...pool, ...DEFAULT_QUESTIONS, ...COMPUTER_SCIENCE_QUESTIONS];
  }
  
  // Filter by question type if not 'Mixed'
  let filtered = pool;
  if (questionType === 'MCQ') {
    filtered = pool.filter(q => q.type === 'MCQ');
  } else if (questionType === 'TF') {
    filtered = pool.filter(q => q.type === 'TF');
  } else if (questionType === 'FITB') {
    filtered = pool.filter(q => q.type === 'FITB');
  }
  
  // If filtered pool is empty or too small, fall back to unfiltered pool
  if (filtered.length === 0) {
    filtered = pool;
  }
  
  // Remove duplicates and shuffle
  const uniquePool = [];
  const seenTexts = new Set();
  for (const q of filtered) {
    if (!seenTexts.has(q.question_text)) {
      seenTexts.add(q.question_text);
      uniquePool.push(q);
    }
  }
  
  // Shuffle array
  const shuffled = uniquePool.sort(() => 0.5 - Math.random());
  
  // Adjust questions to fit count and set difficulty
  const result = shuffled.slice(0, numQuestions).map((q, idx) => {
    // Generate explanation prefix showing it is AI-generated based on document
    let explanationText = q.explanation;
    if (difficulty === 'Easy') {
      explanationText = `[Easy Concept] ${explanationText}`;
    } else if (difficulty === 'Hard') {
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
  
  return result;
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
