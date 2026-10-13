import { GameState } from '../src/game/gameState.js';

console.log('--- TESTING GAMESTATE COMBINED SYSTEMS ---');

// Mock localStorage
const storage = {};
globalThis.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); }
};

const gs = new GameState();
gs.reset();

// 1. Initial State assertions
const snap0 = gs.getSnapshot();
console.log('Initial stats:', {
  energy: snap0.energy,
  academicProgress: snap0.academicProgress,
  peerTrust: snap0.relationshipTrust,
  partnerTrust: snap0.partnerTrust,
  money: snap0.money,
  time: snap0.time,
});

if (snap0.partnerTrust !== 50) throw new Error('partnerTrust should start at 50');
if (snap0.groupProject.totalProgress !== 40) throw new Error('groupProject totalProgress should start at 40');
if (snap0.examSystem.revisionProgress !== 20) throw new Error('examSystem revisionProgress should start at 20');

// 2. Akosua Relationship tests
console.log('\nTesting Akosua Partner System...');
const resPromise = gs.interactWithPartner('make_promise');
console.log('Make promise result:', resPromise);
if (gs.getSnapshot().partnerTrust !== 55) throw new Error('Partner trust should be 55 after make_promise');
if (!gs.getPartnerStatus().hasActivePromise) throw new Error('Should have active promise');

const resKeep = gs.interactWithPartner('keep_promise');
console.log('Keep promise result:', resKeep);
if (gs.getSnapshot().partnerTrust !== 70) throw new Error('Partner trust should be 70 after keep_promise');
if (gs.getSnapshot().energy !== 100) throw new Error('Energy should be clamped at 100');

const resChat = gs.interactWithPartner('casual_chat');
console.log('Casual chat result:', resChat);
if (gs.getSnapshot().partnerTrust !== 75) throw new Error('Partner trust should be 75 after chat');

// 3. Group Project tests
console.log('\nTesting Group Project System...');
const resWorkMark = gs.interactGroupProject('work_my_section');
console.log('Work Mark section:', resWorkMark);
if (gs.getSnapshot().groupProject.markProgress !== 30) throw new Error('Mark progress should be 30');
if (gs.getSnapshot().groupProject.totalProgress !== 70) throw new Error('Total progress should be 70');
if (gs.getSnapshot().academicProgress !== 48) throw new Error('Academics should be 48');

const resRemindKofi = gs.interactGroupProject('remind_kofi');
console.log('Remind Kofi:', resRemindKofi);
if (gs.getSnapshot().groupProject.kofiProgress !== 20) throw new Error('Kofi progress should be 20');
if (gs.getSnapshot().groupProject.totalProgress !== 90) throw new Error('Total progress should be 90');

const resSubmit = gs.interactGroupProject('submit_project');
console.log('Submit project result:', resSubmit);
if (resSubmit.grade !== 'A') throw new Error('Grade should be A at 90%');
if (!gs.getSnapshot().groupProject.submitted) throw new Error('Project should be submitted');

// 4. Balme Library Study tests
console.log('\nTesting Balme Library Revision...');
const resQuickStudy = gs.studyInLibrary('quick_review');
console.log('Quick study result:', resQuickStudy);
if (gs.getSnapshot().examSystem.revisionProgress !== 45) throw new Error('Revision should be 45%');

const resDeepStudy = gs.studyInLibrary('deep_study');
console.log('Deep study result:', resDeepStudy);
if (gs.getSnapshot().examSystem.revisionProgress !== 90) throw new Error('Revision should be 90%');

// 5. Midterm Exam tests
console.log('\nTesting Midterm Exam...');
const resExam = gs.takeMidtermExam();
console.log('Exam result:', resExam);
if (!resExam.grade.startsWith('A')) throw new Error('Grade should be A with high revision, completed project, and stamina');
if (!gs.getSnapshot().examSystem.examTaken) throw new Error('Exam should be marked taken');

// 6. Test single-sitting guard
try {
  gs.takeMidtermExam();
  throw new Error('Should have thrown when sitting exam second time');
} catch (err) {
  console.log('Single-sitting guard verified:', err.message);
}

// 7. Save & Reload persistence
console.log('\nTesting Save & Load Persistence...');
const savedJson = storage['ripple-phase-2-save'];
if (!savedJson) throw new Error('Save json missing');
console.log('Saved payload length:', savedJson.length);

const gs2 = new GameState();
const snap2 = gs2.getSnapshot();
console.log('Loaded stats from save:', {
  partnerTrust: snap2.partnerTrust,
  groupProjectSubmitted: snap2.groupProject.submitted,
  groupGrade: snap2.groupProject.groupGrade,
  examGrade: snap2.examSystem.examGrade,
  examScore: snap2.examSystem.examScore,
});

if (snap2.partnerTrust !== gs.getSnapshot().partnerTrust) throw new Error('partnerTrust mismatch on load');
if (snap2.groupProject.groupGrade !== 'A') throw new Error('groupGrade mismatch on load');
if (snap2.examSystem.examGrade !== resExam.grade) throw new Error('examGrade mismatch on load');

console.log('\n ALL GAMESTATE COMBINED SYSTEMS TESTS PASSED!');
