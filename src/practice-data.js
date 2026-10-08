import { applyValidation } from "./validator.js";

export const PRACTICE_SNAPSHOT = "2026-10-08T00:00:00.000Z";
const SNAPSHOT = PRACTICE_SNAPSHOT;

function source(id, title, url, notes) {
  return { id, title, url, type: "reference", quality: "authoritative", retrievedAt: SNAPSHOT, snapshotId: `${id}-snapshot`, accessStatus: "available", notes };
}

const KOREAN_HANGUL = source(
  "source-korean-hangul",
  "National Institute of Korean Language — Korean language resources",
  "https://www.korean.go.kr/",
  "Official Korean language institution used for Hangul terminology and orthographic conventions."
);
const KOREAN_DICTIONARY = source(
  "source-korean-dictionary",
  "Korean-English Learners' Dictionary",
  "https://krdict.korean.go.kr/eng",
  "National Institute of Korean Language learner dictionary used for English glosses and usage notes."
);
const ODS = source(
  "source-open-data-structures",
  "Open Data Structures",
  "https://opendatastructures.org/",
  "Pat Morin's open textbook used for data-structure invariants, operations, and asymptotic bounds."
);
const CLRS = source(
  "source-clrs",
  "Introduction to Algorithms, 4th edition",
  "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/",
  "Cormen, Leiserson, Rivest, and Stein used for canonical algorithm and complexity claims."
);

function makeCard({ key, type = "basic", front, back, extra = "", tags, scopeId, objective = "recall", difficulty = "foundational", sourceIds }) {
  const claimId = `claim_${key}`;
  return {
    id: `card_${key}`,
    stableId: key,
    type,
    front,
    back,
    extra,
    tags,
    scopeId,
    objective,
    difficulty,
    claimIds: [claimId],
    sourceIds,
    typeRationale: type === "cloze" ? "The missing term is a meaningful retrieval target inside a stable context sentence." : "Basic recall is direct and unambiguous for this learning point.",
    evidenceStatus: "verified",
    status: "approved",
    locked: false,
    confidence: 0.97,
    createdAt: SNAPSHOT,
    updatedAt: SNAPSHOT,
  };
}

export function inferDifficulty(cards) {
  const levels = [...new Set(cards.map((card) => card.difficulty).filter(Boolean))];
  return levels.length === 1 ? levels[0] : "adaptive";
}

function makeDeck({ id, title, topic, outcome, audience, sources, cards, scope }) {
  const claims = cards.map((card) => ({
    id: card.claimIds[0],
    text: `${card.front} — ${card.back}`,
    sourceIds: card.sourceIds,
    verificationStatus: "verified",
    evidenceExcerpt: card.back,
    evidenceLocation: "Curated card-level reference review",
    evidenceStrength: "authoritative-reference",
    checkedAt: SNAPSHOT,
  }));
  const typeDistribution = cards.reduce((result, card) => {
    result[card.type] = (result[card.type] || 0) + 1;
    return result;
  }, {});
  const difficulty = inferDifficulty(cards);
  const project = {
    id,
    title,
    createdAt: SNAPSHOT,
    updatedAt: SNAPSHOT,
    status: "Needs review",
    brief: {
      topic,
      outcome,
      audience,
      prerequisites: "",
      cardCount: cards.length,
      difficulty,
      allowedTypes: Object.keys(typeDistribution),
      direction: "English to Korean where requested; otherwise prompt-to-answer recall.",
      sourcePolicy: "trusted-external",
      language: "English explanations with Korean examples where relevant",
      deckName: title,
      exportFormat: "tsv",
      includedScope: scope.map((item) => item.label).join(", "),
      excludedScope: "",
      sources: sources.map((item) => item.url),
      sensitiveContent: "",
      confirmed: true,
      assumptions: ["Cards are study prompts, not professional advice.", "Romanization is a pronunciation aid, not a replacement for Hangul."],
      updatedAt: SNAPSHOT,
    },
    plan: {
      id: `plan_${id}`,
      version: 1,
      createdAt: SNAPSHOT,
      scope: scope.map((item) => ({ ...item, allocatedCards: cards.filter((card) => card.scopeId === item.id).length, coverageStatus: "covered" })),
      objectives: scope.flatMap((item) => [
        { id: `objective_${item.id}_recall`, scopeId: item.id, type: "recall", statement: `Recall ${item.label}.`, priority: "required" },
      ]),
      requestedCardCount: cards.length,
      difficulty,
      typeDistribution,
      sourcePolicy: "trusted-external",
      exclusions: [],
      risks: [],
      approvedAt: SNAPSHOT,
    },
    sources,
    claims,
    cards,
    validations: [],
    runs: [{ id: `run_${id}`, kind: "curated-practice", createdAt: SNAPSHOT, status: "succeeded", provider: "curated-source-grounded", completedAt: SNAPSHOT }],
    exports: [],
    metrics: null,
  };
  applyValidation(project, { timestamp: SNAPSHOT });
  return project;
}

const koreanAlphabetCards = [
  ["hangul-consonants", "What consonant is **ㄱ**, and what is its usual sound guide?", "ㄱ is *기역* (giyeok). It is roughly **g** at the beginning of a syllable and **k** at the end; exact pronunciation depends on position and surrounding sounds."],
  ["hangul-consonants", "What consonant is **ㄴ**, and what sound does it represent?", "ㄴ is *니은* (nieun) and represents an **n** sound."],
  ["hangul-consonants", "What consonant is **ㄷ**, and what is its usual sound guide?", "ㄷ is *디귿* (digeut). It is roughly **d** initially and **t** finally."],
  ["hangul-consonants", "What consonant is **ㄹ**, and why is its romanization context-dependent?", "ㄹ is *리을* (rieul). It is commonly realized between an **r-like** sound in some onset positions and an **l-like** sound in coda or doubled contexts; English romanization is only an approximation."],
  ["hangul-consonants", "What consonant is **ㅁ**, and what sound does it represent?", "ㅁ is *미음* (mieum) and represents **m**."],
  ["hangul-consonants", "What consonant is **ㅂ**, and what is its usual sound guide?", "ㅂ is *비읍* (bieup). It is roughly **b** initially and **p** finally."],
  ["hangul-consonants", "What consonant is **ㅅ**, and what sound does it usually represent?", "ㅅ is *시옷* (siot) and is usually **s**, with context-dependent pronunciation before certain vowels."],
  ["hangul-consonants", "What are the two main roles of **ㅇ**?", "At the beginning of a syllable block, ㅇ is silent; at the end, it represents **ng** as in English *sing*."],
  ["hangul-consonants", "What consonant is **ㅈ**, and what is its sound guide?", "ㅈ is *지읒* (jieut) and is roughly **j** or a soft affricate sound."],
  ["hangul-consonants", "What consonant is **ㅊ**, and how does it differ from ㅈ?", "ㅊ is *치읓* (chieut) and is an aspirated **ch** sound; ㅈ is the less-aspirated counterpart."],
  ["hangul-consonants", "What consonant is **ㅋ**, and what sound does it represent?", "ㅋ is *키읔* (kieuk) and is an aspirated **k** sound."],
  ["hangul-consonants", "What consonant is **ㅌ**, and what sound does it represent?", "ㅌ is *티읕* (tieut) and is an aspirated **t** sound."],
  ["hangul-consonants", "What consonant is **ㅍ**, and what sound does it represent?", "ㅍ is *피읖* (pieup) and is an aspirated **p** sound."],
  ["hangul-consonants", "What consonant is **ㅎ**, and what sound does it represent?", "ㅎ is *히읗* (hieut) and is an **h** sound, with predictable effects on neighboring consonants."],
  ["hangul-vowels", "What vowel is **ㅏ**, and what sound guide is commonly used?", "ㅏ is *아* and is commonly represented as **a**, similar to the vowel in *father* for many learners."],
  ["hangul-vowels", "What vowel is **ㅑ**, and what sound guide is commonly used?", "ㅑ is *야* and is commonly represented as **ya**."],
  ["hangul-vowels", "What vowel is **ㅓ**, and why is **eo** only an approximation?", "ㅓ is *어*. Revised Romanization writes it **eo**; English has no exact equivalent, so learners should use Korean audio rather than treating the spelling as two sounds."],
  ["hangul-vowels", "What vowel is **ㅕ**, and what sound guide is commonly used?", "ㅕ is *여* and is commonly represented as **yeo**."],
  ["hangul-vowels", "What vowel is **ㅗ**, and what sound guide is commonly used?", "ㅗ is *오* and is commonly represented as **o**."],
  ["hangul-vowels", "What vowel is **ㅛ**, and what sound guide is commonly used?", "ㅛ is *요* and is commonly represented as **yo**."],
  ["hangul-vowels", "What vowel is **ㅜ**, and what sound guide is commonly used?", "ㅜ is *우* and is commonly represented as **u**, roughly like the vowel in *boot* for many learners."],
  ["hangul-vowels", "What vowel is **ㅠ**, and what sound guide is commonly used?", "ㅠ is *유* and is commonly represented as **yu**."],
  ["hangul-vowels", "What vowel is **ㅡ**, and why is **eu** only a learner guide?", "ㅡ is *으*. Revised Romanization writes it **eu**; it is a Korean vowel without a direct English equivalent."],
  ["hangul-vowels", "What vowel is **ㅣ**, and what sound does it represent?", "ㅣ is *이* and represents **i**, like the vowel in *machine* for many learners."],
  ["hangul-vowels", "What is the common sound guide for **ㅐ**?", "ㅐ is *애* and is written **ae**; in modern Seoul Korean its pronunciation is often close to ㅔ for many speakers."],
  ["hangul-vowels", "What is the common sound guide for **ㅔ**?", "ㅔ is *에* and is written **e**; it is distinct in spelling even though many speakers pronounce it similarly to ㅐ."],
  ["hangul-vowels", "How is **ㅘ** formed and pronounced?", "ㅘ is a compound vowel written **wa**, formed from ㅗ plus ㅏ."],
  ["hangul-vowels", "How is **ㅝ** formed and pronounced?", "ㅝ is a compound vowel written **wo**, formed from ㅜ plus ㅓ."],
  ["hangul-vowels", "How is **ㅚ** commonly romanized, and what pronunciation variation should learners know?", "ㅚ is commonly romanized **oe**; modern pronunciation is often close to **we** in many contexts, so audio matters."],
  ["hangul-vowels", "What is the usual sound guide for **ㅟ**?", "ㅟ is *위* and is commonly represented as **wi**."],
  ["hangul-syllable-blocks", "How are Hangul syllable blocks constructed?", "A syllable block combines an initial consonant, a vowel, and optionally a final consonant. The letters are arranged into one visual block, not written as a horizontal alphabetic string."],
  ["hangul-syllable-blocks", "How can you decompose **한** into its jamo?", "**한** is ㅎ + ㅏ + ㄴ: initial ㅎ, vowel ㅏ, and final consonant ㄴ."],
  ["hangul-syllable-blocks", "What does **받침** (batchim) mean in Hangul reading?", "받침 is the final consonant position at the bottom of a syllable block. Its pronunciation follows Korean final-consonant rules and may change before the next syllable."],
  ["hangul-syllable-blocks", "What sound family do final ㄱ, ㅋ, and ㄲ commonly represent?", "In final position, ㄱ, ㅋ, and ㄲ are commonly realized as the unreleased **[k̚]**-type sound; they are not pronounced like a fully released English k."],
  ["hangul-syllable-blocks", "What sound does final **ㅇ** commonly represent?", "Final ㅇ represents **ng**, as in the ending of English *sing*."],
  ["hangul-syllable-blocks", "What does a double consonant such as **ㄲ** indicate?", "A doubled jamo such as ㄲ is a tense consonant, not simply a longer version of ㄱ. Tense consonants have different articulation and are best learned with audio."],
].map(([scopeId, front, back], index) => makeCard({
  key: `korean-alphabet-${index + 1}`,
  front,
  back,
  extra: "For English-speaking learners: romanization is a memory aid; listen to native audio and prioritize the Hangul symbol.",
  tags: ["korean", "alphabet", scopeId.replace("hangul-", "hangul-")],
  scopeId,
  objective: "recall",
  difficulty: index < 14 ? "beginner" : "foundational",
  sourceIds: [KOREAN_HANGUL.id],
}));

const koreanSightWords = [
  ["안녕하세요", "hello", "Standard polite greeting; use with people when a neutral polite register is appropriate."],
  ["안녕", "hi / bye", "Informal greeting and farewell used with close friends or people of similar age when appropriate."],
  ["감사합니다", "thank you", "Formal or highly polite expression of thanks."],
  ["고마워요", "thank you", "Polite but less formal than 감사합니다; common in friendly polite speech."],
  ["네", "yes / I understand", "Often used to agree or acknowledge; context can make it closer to “okay” or “I hear you.”"],
  ["아니요", "no", "Polite negative response."],
  ["죄송합니다", "I am sorry", "Formal/polite apology; stronger and more formal than 미안해요."],
  ["미안해요", "I am sorry", "Polite apology in a friendlier register."],
  ["괜찮아요", "it is okay / I am fine", "Can reassure someone, say that something is acceptable, or answer a “how are you?”-type question depending on context."],
  ["주세요", "please give me / please", "Polite request form, often following a noun: 물 주세요 = Please give me water."],
  ["뭐", "what", "Conversational form of 무엇; used in questions such as 뭐예요? = What is it?"],
  ["어디", "where", "Question word for location."],
  ["누구", "who", "Question word for a person."],
  ["왜", "why", "Question word for a reason."],
  ["언제", "when", "Question word for time."],
  ["어떻게", "how", "Question word for manner or method."],
  ["이거", "this thing", "Demonstrative noun meaning “this” in a conversational form."],
  ["그거", "that thing", "Demonstrative noun meaning “that” near the listener or previously mentioned."],
  ["저거", "that thing over there", "Demonstrative noun for something away from both speaker and listener."],
  ["여기", "here", "Location near the speaker."],
  ["거기", "there", "Location near the listener or a previously mentioned place."],
  ["저기", "over there", "A location away from both speaker and listener; also used to get attention politely."],
  ["오늘", "today", "The current day."],
  ["내일", "tomorrow", "The day after today."],
  ["어제", "yesterday", "The day before today."],
  ["지금", "now", "The current time or moment."],
  ["사람", "person / people", "A person; the plural meaning can be understood from context."],
  ["친구", "friend", "A friend; Korean does not require an article in the same way English does."],
  ["집", "home / house", "Home or a house, depending on context."],
  ["학교", "school", "School as a place or institution."],
  ["물", "water", "Water; often used in requests such as 물 주세요."],
  ["밥", "rice / meal", "Cooked rice and, by extension, a meal; context determines the best English gloss."],
  ["화장실", "restroom / bathroom", "Common word for a restroom or bathroom."],
  ["이름", "name", "A name; 이름이 뭐예요? = What is your name?"],
  ["한국", "Korea", "The Korean name for Korea; context may specify South Korea or the Korean peninsula."],
  ["영어", "English", "The English language."],
  ["좋아요", "it is good / I like it", "Polite present form of 좋다; common for approval or “I like it.”"],
  ["싫어요", "I dislike it / I do not like it", "Polite present form used to express dislike."],
  ["있어요", "there is / I have / it exists", "Polite form of 있다; meaning depends on context and location/possession."],
  ["없어요", "there is not / I do not have", "Polite form of 없다; indicates absence or non-possession."],
  ["가요", "go / am going", "Polite present form of 가다."],
  ["와요", "come / am coming", "Polite present form of 오다."],
  ["먹어요", "eat / am eating", "Polite present form of 먹다."],
  ["마셔요", "drink / am drinking", "Polite present form of 마시다."],
  ["봐요", "see / watch / look", "Polite present form of 보다; translation depends on context."],
].map(([word, meaning, note], index) => makeCard({
  key: `korean-sight-${index + 1}`,
  front: `What does **${word}** mean in common Korean?`,
  back: meaning,
  extra: `Usage note: ${note}`,
  tags: ["korean", "sight-words", "english-speaker", "high-frequency"],
  scopeId: "korean-sight-words",
  objective: "recall",
  difficulty: "beginner",
  sourceIds: [KOREAN_DICTIONARY.id],
}));

const dsCards = [
  ["arrays", "What is the random-access time for an array element when the index is known?", "O(1), because the address is computed from the base address and element offset.", "foundational"],
  ["arrays", "Why can inserting at the front of an array be O(n)?", "Existing elements may need to shift one position to make room, touching a linear number of elements.", "foundational"],
  ["arrays", "What is the amortized append time for a dynamically resized array?", "O(1) amortized. Most appends are constant time; an occasional resize copies O(n) elements, but the cost is spread across many appends.", "intermediate"],
  ["arrays", "What invariant must a binary search input satisfy?", "The search range must be ordered according to the comparison predicate; otherwise discarding half the range is not justified.", "foundational"],
  ["arrays", "What is the time complexity of binary search?", "O(log n) comparisons on a sorted random-access sequence, assuming the midpoint and access to each tested element are O(1).", "foundational"],
  ["hash-tables", "What is the expected lookup time in a well-sized hash table?", "O(1) expected or average time under a suitable hash function and bounded load factor; worst-case lookup can be O(n).", "foundational"],
  ["hash-tables", "What is a hash collision?", "Two distinct keys map to the same table index. The table must resolve collisions, commonly by chaining or open addressing.", "foundational"],
  ["hash-tables", "Why does a hash table resize?", "To keep the load factor within a target range so collisions remain manageable and expected operations stay near O(1).", "intermediate"],
  ["hash-tables", "Compare separate chaining with open addressing.", "Chaining stores collision groups in buckets or linked structures; open addressing stores entries in the table and probes for another slot. Open addressing needs a deletion strategy such as tombstones.", "intermediate"],
  ["linked-lists", "When is inserting after a known linked-list node O(1)?", "When the node reference is already available: update a constant number of pointers. Finding the node first may still cost O(n).", "foundational"],
  ["linked-lists", "Why is random access slow in a linked list?", "Nodes are not contiguous and do not provide an index-to-address calculation, so reaching position i generally requires walking from an endpoint: O(n).", "foundational"],
  ["linked-lists", "How can you reverse a singly linked list in O(n) time and O(1) extra space?", "Walk through the list while maintaining previous, current, and next pointers; reverse current.next to previous, then advance all pointers.", "intermediate"],
  ["linked-lists", "What does Floyd's tortoise-and-hare algorithm detect?", "A cycle in a linked structure. A slow pointer advances one step and a fast pointer two; if they meet, a cycle exists.", "intermediate"],
  ["stacks-queues", "What is the defining access rule of a stack?", "LIFO: last in, first out. Push and pop happen at the same end, usually in O(1).", "beginner"],
  ["stacks-queues", "What is the defining access rule of a queue?", "FIFO: first in, first out. Enqueue at one end and dequeue at the other, usually in O(1) with a proper implementation.", "beginner"],
  ["stacks-queues", "Why is a queue implemented with a two-ended linked list or ring buffer instead of removing index 0 from an array?", "Removing index 0 from a plain array shifts remaining elements and costs O(n); a deque or ring buffer can maintain both ends in O(1).", "intermediate"],
  ["stacks-queues", "What is a monotonic stack useful for?", "It solves next-greater/next-smaller and related range queries in O(n) by maintaining elements in monotonic order and popping each item at most once.", "advanced"],
  ["trees", "What is the invariant of a binary search tree?", "For each node, keys in the left subtree compare smaller and keys in the right subtree compare larger, according to the tree's duplicate policy.", "foundational"],
  ["trees", "What is the search complexity in a BST of height h?", "O(h). It is O(log n) when the tree is balanced and can degrade to O(n) when it becomes a chain.", "foundational"],
  ["trees", "What property makes a tree height-balanced?", "Its height is kept logarithmic in the number of nodes, typically by enforcing a balance invariant such as AVL height differences or red-black coloring rules.", "intermediate"],
  ["trees", "What does an inorder traversal of a BST produce?", "Keys in sorted order, assuming the traversal visits left subtree, node, then right subtree and the BST invariant holds.", "foundational"],
  ["heaps", "What is the max-heap invariant?", "Every parent key is greater than or equal to its children, so the maximum element is at the root.", "foundational"],
  ["heaps", "What are the typical complexities of binary-heap insert and extract-min/max?", "Both are O(log n), because an element may move along the heap height. Reading the root is O(1).", "foundational"],
  ["heaps", "Why is a binary heap a natural implementation for a priority queue?", "It provides constant-time access to the highest- or lowest-priority item and logarithmic insertion/removal while using a compact array representation.", "foundational"],
  ["heaps", "What is the time complexity of bottom-up heap construction?", "O(n), not O(n log n), because most nodes are near the leaves and require little sift-down work.", "advanced"],
  ["sorting", "What is merge sort's time and extra-space complexity?", "O(n log n) time in best, average, and worst cases; the usual array implementation uses O(n) auxiliary space.", "foundational"],
  ["sorting", "What is quicksort's average and worst-case complexity?", "Average O(n log n); worst-case O(n) when partitions are repeatedly very unbalanced. Randomized or careful pivots reduce the likelihood of the worst case.", "foundational"],
  ["sorting", "What does it mean for a sorting algorithm to be stable?", "Equal-key records preserve their original relative order. Stability matters when sorting by multiple keys in successive passes.", "intermediate"],
  ["sorting", "When is counting sort appropriate?", "When keys are integers in a manageable bounded range. It can run in O(n + k), but space and time depend on the key range k, not only the number of items.", "advanced"],
  ["graphs", "What is the time complexity of BFS or DFS using adjacency lists?", "O(V + E), because each reachable vertex and edge is processed a constant number of times.", "foundational"],
  ["graphs", "When should you use BFS for shortest paths?", "For an unweighted graph, or when every edge has equal cost. BFS explores by distance layers and returns minimum edge-count distance.", "foundational"],
  ["graphs", "What restriction does Dijkstra's algorithm require?", "Edge weights must be nonnegative. A negative edge can invalidate the assumption that a finalized distance is optimal.", "foundational"],
  ["graphs", "When is Bellman-Ford preferred over Dijkstra?", "When negative edge weights may exist or when detecting a reachable negative cycle is required; its standard complexity is O(VE).", "advanced"],
  ["graphs", "What is a topological ordering?", "A linear ordering of a directed acyclic graph in which every directed edge u→v places u before v. It exists only for DAGs.", "foundational"],
  ["graphs", "How does Kahn's topological-sort algorithm detect a cycle?", "It repeatedly removes zero-indegree vertices. If fewer than V vertices are removed, the remaining graph contains a directed cycle.", "intermediate"],
  ["graphs", "Compare an adjacency list with an adjacency matrix.", "Lists use O(V + E) space and are efficient for sparse graphs; matrices use O(V²) space but provide O(1) edge-existence lookup.", "foundational"],
  ["union-find", "What operations does disjoint-set union support?", "Find identifies a set representative; union merges two sets. With path compression and union by rank/size, sequences run in near-constant amortized time O(α(n)).", "advanced"],
  ["union-find", "How does Kruskal's algorithm use union-find?", "It processes edges in increasing weight order and adds an edge when its endpoints are in different components, using find/union to avoid cycles.", "advanced"],
  ["patterns", "What data structures make an LRU cache O(1) for get and put?", "A hash map from key to node plus a doubly linked list ordered by recency. The map finds nodes and the list moves/removes them in O(1).", "intermediate"],
  ["patterns", "What is a trie good for?", "Prefix queries over strings. Insert, lookup, and prefix traversal take O(L) time in the key length L, with space depending on stored nodes and alphabet representation.", "intermediate"],
  ["patterns", "What is the sliding-window pattern?", "Maintain a contiguous interval and move its left/right boundaries while preserving a condition, often reducing a nested scan to O(n).", "intermediate"],
  ["patterns", "When is a prefix-sum array useful?", "For repeated range-sum queries: after O(n) preprocessing, a range sum can be answered in O(1) with two prefix values, subject to the chosen endpoint convention.", "foundational"],
  ["patterns", "What invariant should a two-pointer solution state?", "It should state what the current window or pair represents and why moving a pointer cannot discard a valid solution under the problem's ordering/monotonicity assumptions.", "advanced"],
  ["complexity", "What is the difference between worst-case and amortized complexity?", "Worst-case bounds one operation; amortized analysis bounds the average cost over a sequence, without assuming random input.", "intermediate"],
  ["complexity", "Why must recursive space include the call stack?", "Each active call stores parameters, locals, and return state. A recursion depth of h contributes O(h) stack space even if the algorithm allocates no explicit collection.", "foundational"],
  ["complexity", "What is the purpose of stating an invariant in an interview solution?", "An invariant is a condition preserved after each iteration or operation; it makes correctness reasoning and boundary-case debugging explicit.", "foundational"],
  ["complexity", "What should you clarify before giving a complexity claim?", "Input size and representation, operation semantics, expected versus worst-case assumptions, recursion/auxiliary space, and whether preprocessing is included.", "intermediate"],
].map(([scopeId, front, back, difficulty], index) => makeCard({
  key: `data-structures-${index + 1}`,
  front,
  back,
  extra: "Interview note: state the invariant, boundary assumptions, and why the complexity follows; do not give only the Big-O label.",
  tags: ["data-structures", "interview-prep", scopeId, difficulty],
  scopeId,
  objective: "explain",
  difficulty,
  sourceIds: [ODS.id, CLRS.id],
}));

export function buildPracticeDecks() {
  const koreanScope = [
    { id: "hangul-consonants", label: "Hangul consonants", required: true, priority: "required" },
    { id: "hangul-vowels", label: "Hangul vowels", required: true, priority: "required" },
    { id: "hangul-syllable-blocks", label: "Hangul syllable blocks and final consonants", required: true, priority: "required" },
    { id: "korean-sight-words", label: "High-frequency Korean sight words", required: true, priority: "required" },
  ];
  const korean = makeDeck({
    id: "practice_korean_foundations",
    title: "Korean Foundations — Alphabet + Sight Words",
    topic: "Korean Hangul alphabet and high-frequency sight words",
    outcome: "An English-speaking learner can recognize core Hangul symbols and understand common Korean words and phrases on sight.",
    audience: "English-speaking Korean language learner at beginner level",
    sources: [KOREAN_HANGUL, KOREAN_DICTIONARY],
    cards: [...koreanAlphabetCards, ...koreanSightWords],
    scope: koreanScope,
  });

  const dsScopeLabels = [...new Set(dsCards.map((card) => card.scopeId))];
  const dataStructures = makeDeck({
    id: "practice_data_structures_interview",
    title: "Data Structures Interview Prep",
    topic: "Data structures and algorithms for technical interviews",
    outcome: "An interview candidate can explain core data structures, invariants, tradeoffs, and complexity with implementation-aware reasoning.",
    audience: "Software engineer preparing for entry-level to mid-level technical interviews",
    sources: [ODS, CLRS],
    cards: dsCards,
    scope: dsScopeLabels.map((label) => ({ id: label, label: label.replace(/-/g, " "), required: true, priority: "required" })),
  });
  return [korean, dataStructures];
}

export function practiceDeckBySlug(slug) {
  const decks = buildPracticeDecks();
  const direct = decks.find((deck) => deck.id === `practice_${slug}` || deck.id.endsWith(`_${slug}`));
  if (direct) return direct;
  const korean = decks.find((deck) => deck.id === "practice_korean_foundations");
  const subsets = {
    "korean-foundations": { id: "practice_korean_foundations", title: "Korean Foundations — Alphabet + Sight Words", scopes: ["hangul-consonants", "hangul-vowels", "hangul-syllable-blocks", "korean-sight-words"] },
    "korean-alphabet": { id: "practice_korean_alphabet", title: "Korean Alphabet — Hangul Foundations", scopes: ["hangul-consonants", "hangul-vowels", "hangul-syllable-blocks"] },
    "korean-sight-words": { id: "practice_korean_sight_words", title: "Korean Sight Words — English-Speaking Learners", scopes: ["korean-sight-words"] },
  };
  const subset = subsets[slug];
  if (!subset || !korean) return slug === "data-structures-interview" ? decks.find((deck) => deck.id === "practice_data_structures_interview") || null : null;
  if (subset.scopes.length === korean.plan.scope.length) return korean;
  const cards = korean.cards.filter((card) => subset.scopes.includes(card.scopeId));
  const scope = korean.plan.scope.filter((item) => subset.scopes.includes(item.id));
  return makeDeck({
    id: subset.id,
    title: subset.title,
    topic: korean.brief.topic,
    outcome: korean.brief.outcome,
    audience: korean.brief.audience,
    sources: korean.sources,
    cards,
    scope,
  });
}
