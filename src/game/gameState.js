const SAVE_KEY = 'ripple-phase-2-save';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Controlled time pace: 2.5 real seconds = 1 in-game minute
export const SECONDS_PER_GAME_MINUTE = 2.5;

export const SHIFTS = [
  {
    id: 'morning_shift',
    title: 'Morning Barista Shift',
    startTimeStr: '9:00 AM',
    endTimeStr: '12:00 PM',
    startMinutes: 9 * 60,
    endMinutes: 12 * 60,
    durationMinutes: 180,
    wage: 60.0,
    energyCost: 25,
    employerTrustGain: 8,
    icon: '☕',
    description: 'Brew fresh Sobolo, grind coffee, and serve breakfast pastries to students.',
  },
  {
    id: 'afternoon_shift',
    title: 'Afternoon Food & Counter Shift',
    startTimeStr: '1:00 PM',
    endTimeStr: '4:00 PM',
    startMinutes: 13 * 60,
    endMinutes: 16 * 60,
    durationMinutes: 180,
    wage: 65.0,
    energyCost: 30,
    employerTrustGain: 8,
    icon: '🥪',
    description: 'Serve hot meat pies, restock the counter, and assist lunchtime student crowds.',
  },
  {
    id: 'evening_shift',
    title: 'Evening Terrace Closing Shift',
    startTimeStr: '5:00 PM',
    endTimeStr: '8:00 PM',
    startMinutes: 17 * 60,
    endMinutes: 20 * 60,
    durationMinutes: 180,
    wage: 75.0,
    energyCost: 35,
    employerTrustGain: 10,
    icon: '🧹',
    description: 'Handle evening rush, balance cash till, and clean patio terrace for closing.',
  },
];

export const EXPENSES = [
  {
    id: 'lunch_meal',
    name: 'Waakye & Chilled Sobolo Meal',
    cost: 25.0,
    energyGain: 25,
    academicGain: 0,
    trustGain: 0,
    icon: '🍛',
    description: 'Fresh Ghanaian rice & beans with beef, egg, shito, and chilled hibiscus Sobolo drink.',
  },
  {
    id: 'mobile_data',
    name: '5GB MTN Student Data Bundle',
    cost: 20.0,
    energyGain: 0,
    academicGain: 2,
    trustGain: 5,
    icon: '📱',
    description: 'High-speed 4G data to download lecture slides and participate in study group chats.',
  },
  {
    id: 'trotro_fare',
    name: 'Campus Shuttle / Trotro Pass',
    cost: 10.0,
    energyGain: 5,
    academicGain: 0,
    trustGain: 0,
    icon: '🚐',
    description: 'Ride the perimeter campus minibus to save walking fatigue in the heat.',
  },
  {
    id: 'course_printing',
    name: 'CSC 201 Lab Handout & Notes',
    cost: 15.0,
    energyGain: 0,
    academicGain: 10,
    trustGain: 0,
    icon: '📄',
    description: 'Printed algorithm problem sets and revision diagrams from the campus print shop.',
  },
];

const INITIAL_STATE = {
  dayIndex: 0, // Monday
  minutesOfDay: 7 * 60, // 7:00 AM
  money: 250, // Fictional Ghanaian cedis (GH₵ 250.00)
  energy: 100, // 0 - 100
  academicProgress: 40, // 0 - 100
  relationshipTrust: 50, // 0 - 100 (Peer Trust)
  employerTrust: 50, // 0 - 100 (Employer Trust)
  partnerTrust: 50, // 0 - 100 (Romantic Partner Trust with Akosua)
  partnerPromise: null, // null | { state: 'promised', meetTimeStr: '12:00 PM', meetMinutes: 720, place: 'Quad Garden Bench' }
  partnerTalkCount: 0,
  lectureDecision: null, // 'attend' | 'skip' | null
  lectureCompleted: false, // true once classroom session or skip is finalized
  completedShifts: [], // shift IDs worked today
  groupProject: {
    title: 'CSC 201 Term Project: Campus Query Engine',
    deadlineMinutes: 17 * 60, // 5:00 PM Monday
    deadlineStr: 'Monday · 5:00 PM',
    totalProgress: 40, // Esi started with 40%
    markProgress: 0,
    esiProgress: 40,
    kofiProgress: 0,
    kofiStatus: 'falling_behind', // 'falling_behind' | 'reminded' | 'assisted' | 'confronted'
    submitted: false,
    groupGrade: null,
  },
  examSystem: {
    course: 'CSC 201 Midterm Examination',
    examTimeStr: 'Monday · 6:00 PM',
    examMinutes: 18 * 60,
    revisionProgress: 20, // 0 - 100%
    studySessionsCompleted: 0,
    examTaken: false,
    examScore: null,
    examGrade: null,
    examFeedback: null,
  },
  objective: {
    id: 'morning_lecture_decision',
    title: 'Attend your morning lecture.',
    description: 'Head to the Great Hall entrance at the north end of the campus courtyard.',
    locationName: 'Great Hall — Lecture Room 101',
    completed: false,
    outcome: null,
  },
  history: [],
};

function isValidSave(value) {
  return (
    value &&
    Number.isInteger(value.dayIndex) &&
    value.dayIndex >= 0 &&
    Number.isInteger(value.minutesOfDay) &&
    value.minutesOfDay >= 0 &&
    value.minutesOfDay < 24 * 60 &&
    Number.isFinite(value.money) &&
    value.money >= 0 &&
    ['energy', 'academicProgress', 'relationshipTrust', 'employerTrust'].every(
      (key) => Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 100
    ) &&
    Array.isArray(value.history)
  );
}

function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class GameState {
  constructor() {
    this.elapsedSeconds = 0;
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) {
        this.state = structuredClone(INITIAL_STATE);
        return;
      }
      const parsed = JSON.parse(saved);
      if (!isValidSave(parsed)) {
        throw new Error('Saved game data validation failed.');
      }
      this.state = {
        ...INITIAL_STATE,
        ...parsed,
        partnerTrust: Number.isFinite(parsed.partnerTrust) ? parsed.partnerTrust : INITIAL_STATE.partnerTrust,
        partnerPromise: parsed.partnerPromise ? { ...parsed.partnerPromise } : null,
        partnerTalkCount: Number.isInteger(parsed.partnerTalkCount) ? parsed.partnerTalkCount : 0,
        groupProject: {
          ...INITIAL_STATE.groupProject,
          ...(parsed.groupProject || {}),
        },
        examSystem: {
          ...INITIAL_STATE.examSystem,
          ...(parsed.examSystem || {}),
        },
        completedShifts: Array.isArray(parsed.completedShifts) ? parsed.completedShifts : [],
        objective: {
          ...INITIAL_STATE.objective,
          ...(parsed.objective || {}),
        },
        history: Array.isArray(parsed.history) ? parsed.history.slice(-50) : [],
      };
    } catch (error) {
      console.warn('Unable to load RIPPLE save, using initial state:', error);
      this.state = structuredClone(INITIAL_STATE);
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Unable to save RIPPLE progress:', error);
    }
  }

  getSnapshot() {
    const hour24 = Math.floor(this.state.minutesOfDay / 60);
    const minute = this.state.minutesOfDay % 60;
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
    const militaryTime = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    return {
      ...this.state,
      day: DAYS[this.state.dayIndex % DAYS.length],
      time: formattedTime,
      militaryTime,
      hour24,
      minute,
      period,
    };
  }

  getSummaryStats() {
    const hour24 = Math.floor(this.state.minutesOfDay / 60);
    const minute = this.state.minutesOfDay % 60;
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
    return {
      money: this.state.money,
      energy: this.state.energy,
      academicProgress: this.state.academicProgress,
      relationshipTrust: this.state.relationshipTrust,
      employerTrust: this.state.employerTrust,
      partnerTrust: this.state.partnerTrust,
      day: DAYS[this.state.dayIndex % DAYS.length],
      time: formattedTime,
    };
  }

  advanceMinutes(minutes) {
    const total = this.state.minutesOfDay + minutes;
    const dayCount = Math.floor(total / (24 * 60));
    this.state.minutesOfDay = total % (24 * 60);
    this.state.dayIndex += dayCount;
    // Clear completed shifts on new day
    if (dayCount > 0) {
      this.state.completedShifts = [];
    }
    this.save();
  }

  update(deltaSeconds) {
    this.elapsedSeconds += deltaSeconds;
    if (this.elapsedSeconds >= SECONDS_PER_GAME_MINUTE) {
      const minutesToAdvance = Math.floor(this.elapsedSeconds / SECONDS_PER_GAME_MINUTE);
      this.elapsedSeconds -= minutesToAdvance * SECONDS_PER_GAME_MINUTE;
      this.advanceMinutes(minutesToAdvance);
    }
  }

  // -------------------------------------------------------------
  // PART A: LECTURE DECISION & ATTENDANCE FLOW
  // -------------------------------------------------------------

  /**
   * Records Mark's initial lecture choice from the decision modal.
   * If 'attend', sets transit objective towards Great Hall without granting classroom rewards yet.
   * If 'skip', immediately applies skip consequences and routes to Café.
   */
  makeChoice(choice) {
    if (this.state.lectureDecision !== null) {
      console.warn('Decision already recorded for this morning lecture.');
      return null;
    }

    this.state.lectureDecision = choice;
    const before = this.getSnapshot();

    if (choice === 'attend') {
      this.state.objective = {
        id: 'morning_lecture',
        title: 'Attend your morning lecture.',
        description: 'Head into the Great Hall for Introduction to Computing (CSC 201).',
        locationName: 'Great Hall — Lecture Room 101',
        completed: false,
        outcome: null,
      };

      const historyEntry = {
        id: 'lecture_decision_attend',
        option: 'attend',
        label: 'Decided to attend morning lecture',
        description: 'Mark decided to attend the 7:00 AM Computing lecture in the Great Hall.',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 0, money: 0, energy: 0, academicProgress: 0, relationshipTrust: 0, employerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();
      return historyEntry;
    } else if (choice === 'skip') {
      // Skip consequences: +30 mins, +5 energy, -5 trust
      this.advanceMinutes(30);
      this.state.energy = clampStat(this.state.energy + 5);
      this.state.relationshipTrust = clampStat(this.state.relationshipTrust - 5);
      this.state.lectureCompleted = true;

      this.state.objective = {
        id: 'cafe_chill',
        title: 'Relax at Campus Café',
        description: 'Skipped morning lecture. Head to the Campus Café terrace to unwind and conserve energy.',
        locationName: 'Campus Café Terrace',
        completed: true,
        outcome: 'skip',
      };

      const after = this.getSnapshot();
      const historyEntry = {
        id: 'lecture_decision_skip',
        option: 'skip',
        label: 'Skipped morning lecture',
        description: 'Skipped computing lecture to relax at the café terrace and conserve stamina.',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 30, money: 0, energy: 5, academicProgress: 0, relationshipTrust: -5, employerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();
      return historyEntry;
    }

    return null;
  }

  /**
   * Called when Mark physically reaches the Great Hall lecture destination.
   * Advances the clock by class duration (90 mins), applies academic reward and energy cost exactly once,
   * records completion, and transitions to the next objective.
   */
  completeLectureArrival() {
    if (this.state.lectureCompleted) {
      return null;
    }
    if (this.state.lectureDecision !== 'attend') {
      return null;
    }

    const before = this.getSnapshot();

    // 1. Advance clock by lecture duration: 90 minutes (1h 30m)
    this.advanceMinutes(90);

    // 2. Apply academic & energy consequences
    this.state.energy = clampStat(this.state.energy - 20);
    this.state.academicProgress = clampStat(this.state.academicProgress + 20);
    this.state.relationshipTrust = clampStat(this.state.relationshipTrust + 5);

    // 3. Mark completed
    this.state.lectureCompleted = true;

    // 4. Set next objective: visit Campus Café & shift board
    this.state.objective = {
      id: 'cafe_visit',
      title: 'Visit Campus Café & Shift Board',
      description: 'CSC 201 lecture concluded! Head to Campus Café terrace to check part-time work shifts or grab lunch.',
      locationName: 'Campus Café Terrace',
      completed: false,
      outcome: null,
    };

    const after = this.getSnapshot();

    const historyEntry = {
      id: 'lecture_completed_event',
      option: 'attended_classroom',
      label: 'Completed CSC 201 Lecture in Great Hall',
      description: 'Attended full 1h 30m lecture on Computer Architecture & Algorithms with Dr. Kwame Mensah.',
      day: before.day,
      time: before.time,
      statusChanges: { minutes: 90, money: 0, energy: -20, academicProgress: 20, relationshipTrust: 5, employerTrust: 0 },
      resultingState: this.getSummaryStats(),
      timestamp: Date.now(),
    };
    this.state.history.push(historyEntry);
    this.save();

    return {
      historyEntry,
      durationMinutes: 90,
      energyCost: 20,
      academicGain: 20,
      trustGain: 5,
      newTime: after.time,
      newDay: after.day,
    };
  }

  /**
   * Called when Mark reaches the Campus Café patio after skipping.
   */
  completeCafeSkipArrival() {
    if (this.state.objective.id === 'cafe_chill') {
      this.state.objective = {
        id: 'cafe_explore',
        title: 'Check Campus Café Shift Board',
        description: 'Arrived at the café terrace. Check available part-time work shifts or order refreshments.',
        locationName: 'Campus Café Terrace',
        completed: false,
        outcome: null,
      };
      this.save();
    }
  }

  // -------------------------------------------------------------
  // PART B: PART-TIME JOB & FINANCIAL PRESSURE
  // -------------------------------------------------------------

  getAvailableShifts() {
    return SHIFTS.map((shift) => {
      const alreadyCompleted = this.state.completedShifts.includes(shift.id);
      const hasEnoughEnergy = this.state.energy >= shift.energyCost;
      const isPastShift = this.state.minutesOfDay > shift.endMinutes;

      let status = 'available';
      if (alreadyCompleted) {
        status = 'completed';
      } else if (!hasEnoughEnergy) {
        status = 'insufficient_energy';
      } else if (isPastShift) {
        status = 'expired';
      }

      return {
        ...shift,
        status,
        alreadyCompleted,
        hasEnoughEnergy,
        isPastShift,
      };
    });
  }

  workShift(shiftId) {
    const shift = SHIFTS.find((s) => s.id === shiftId);
    if (!shift) throw new Error(`Unknown shift ID: ${shiftId}`);

    if (this.state.completedShifts.includes(shiftId)) {
      throw new Error('Shift already completed today.');
    }
    if (this.state.energy < shift.energyCost) {
      throw new Error(`Not enough energy (${this.state.energy}/${shift.energyCost}). Eat a meal or rest first.`);
    }

    const before = this.getSnapshot();

    // Advance clock by shift duration
    this.advanceMinutes(shift.durationMinutes);

    // Update stats
    this.state.money += shift.wage;
    this.state.energy = clampStat(this.state.energy - shift.energyCost);
    this.state.employerTrust = clampStat(this.state.employerTrust + shift.employerTrustGain);
    this.state.completedShifts.push(shiftId);

    // Update objective
    this.state.objective = {
      id: 'shift_completed',
      title: 'Shift Complete — Rest or Study',
      description: `Earned GH₵ ${shift.wage.toFixed(2)} from ${shift.title}. Grab lunch, review coursework, or relax.`,
      locationName: 'Campus Courtyard',
      completed: false,
      outcome: null,
    };

    const after = this.getSnapshot();

    const historyEntry = {
      id: `shift_${shift.id}`,
      option: 'worked_shift',
      label: `Worked ${shift.title}`,
      description: `Completed 3-hour work shift at Campus Café. Earned GH₵ ${shift.wage.toFixed(2)}.`,
      day: before.day,
      time: before.time,
      statusChanges: {
        minutes: shift.durationMinutes,
        money: shift.wage,
        energy: -shift.energyCost,
        academicProgress: 0,
        relationshipTrust: 0,
        employerTrust: shift.employerTrustGain,
      },
      resultingState: this.getSummaryStats(),
      timestamp: Date.now(),
    };
    this.state.history.push(historyEntry);
    this.save();

    return {
      shift,
      earnedWage: shift.wage,
      energyCost: shift.energyCost,
      employerTrustGain: shift.employerTrustGain,
      resultingState: after,
    };
  }

  getAvailableExpenses() {
    return EXPENSES.map((exp) => ({
      ...exp,
      canAfford: this.state.money >= exp.cost,
    }));
  }

  purchaseExpense(expenseId) {
    const item = EXPENSES.find((e) => e.id === expenseId);
    if (!item) throw new Error(`Unknown expense ID: ${expenseId}`);

    if (this.state.money < item.cost) {
      return {
        success: false,
        reason: 'insufficient_funds',
        required: item.cost,
        available: this.state.money,
      };
    }

    const before = this.getSnapshot();

    this.state.money = Math.max(0, this.state.money - item.cost);
    if (item.energyGain) {
      this.state.energy = clampStat(this.state.energy + item.energyGain);
    }
    if (item.academicGain) {
      this.state.academicProgress = clampStat(this.state.academicProgress + item.academicGain);
    }
    if (item.trustGain) {
      this.state.relationshipTrust = clampStat(this.state.relationshipTrust + item.trustGain);
    }

    const after = this.getSnapshot();

    const historyEntry = {
      id: `expense_${item.id}`,
      option: 'purchased_expense',
      label: `Purchased ${item.name}`,
      description: `${item.description} (Cost: GH₵ ${item.cost.toFixed(2)})`,
      day: before.day,
      time: before.time,
      statusChanges: {
        minutes: 0,
        money: -item.cost,
        energy: item.energyGain || 0,
        academicProgress: item.academicGain || 0,
        relationshipTrust: item.trustGain || 0,
        employerTrust: 0,
      },
      resultingState: this.getSummaryStats(),
      timestamp: Date.now(),
    };
    this.state.history.push(historyEntry);
    this.save();

    return {
      success: true,
      item,
      resultingState: after,
    };
  }

  setObjective(newObjective) {
    if (!newObjective || !newObjective.id) return;
    this.state.objective = {
      id: newObjective.id,
      title: newObjective.title || '',
      description: newObjective.description || '',
      locationName: newObjective.locationName || '',
      completed: false,
      outcome: null,
    };
    this.save();
  }

  // -------------------------------------------------------------
  // PARTNER & RELATIONSHIPS SYSTEM (AKOSUA)
  // -------------------------------------------------------------
  getPartnerStatus() {
    const isLateForPromise =
      this.state.partnerPromise &&
      this.state.partnerPromise.state === 'promised' &&
      this.state.minutesOfDay > this.state.partnerPromise.meetMinutes + 30;

    return {
      partnerTrust: this.state.partnerTrust,
      promise: this.state.partnerPromise,
      talkCount: this.state.partnerTalkCount,
      isLateForPromise,
      hasActivePromise: !!(this.state.partnerPromise && this.state.partnerPromise.state === 'promised'),
    };
  }

  interactWithPartner(actionId, context = {}) {
    const before = this.getSnapshot();
    let result = null;

    if (actionId === 'make_promise') {
      // Mark promises to meet Akosua for lunch at 12:00 PM at the Quad Garden Bench
      this.state.partnerPromise = {
        state: 'promised',
        meetTimeStr: '12:00 PM',
        meetMinutes: 12 * 60,
        place: 'Quad Garden Bench',
        topic: 'Lunch & catching up after class',
      };
      this.state.partnerTrust = clampStat(this.state.partnerTrust + 5);
      this.state.partnerTalkCount += 1;

      this.state.objective = {
        id: 'meet_akosua_promise',
        title: 'Meet Akosua for Lunch (12:00 PM)',
        description: 'You promised Akosua you would meet her at the Quad Garden Bench at noon. Balance this with work and group projects.',
        locationName: 'Quad Garden Bench',
        completed: false,
        outcome: null,
      };

      const historyEntry = {
        id: `partner_promise_${Date.now()}`,
        option: 'made_promise',
        label: 'Promised to meet Akosua at 12:00 PM',
        description: 'Mark promised his partner Akosua that they would meet for lunch at the Quad Garden Bench at noon.',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 0, money: 0, energy: 0, academicProgress: 0, relationshipTrust: 0, employerTrust: 0, partnerTrust: 5 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'make_promise',
        message: 'You promised Akosua you will meet her at 12:00 PM at the Quad Garden Bench.',
        trustChange: +5,
      };
    } else if (actionId === 'keep_promise') {
      // Keeping the promise: spend 45 mins together, restore +15 partner trust, +10 energy
      this.advanceMinutes(45);
      this.state.partnerTrust = clampStat(this.state.partnerTrust + 15);
      this.state.energy = clampStat(this.state.energy + 10);
      if (this.state.partnerPromise) {
        this.state.partnerPromise.state = 'kept';
      }
      this.state.partnerTalkCount += 1;

      this.state.objective = {
        id: 'group_project_focus',
        title: 'Check In on CSC 201 Group Project',
        description: 'Had a wonderful lunch with Akosua! Now head to the East Pergola to check in on Esi and Kofi.',
        locationName: 'East Study Pergola',
        completed: false,
        outcome: 'kept_promise',
      };

      const historyEntry = {
        id: `partner_kept_${Date.now()}`,
        option: 'kept_promise',
        label: 'Kept Promise: Met Akosua for Lunch',
        description: 'Mark met Akosua as promised at the Quad Garden Bench. They shared waakye and talked through campus stress (+15 Partner Trust, +10 Energy).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 45, money: 0, energy: 10, academicProgress: 0, relationshipTrust: 5, employerTrust: 0, partnerTrust: 15 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'keep_promise',
        message: 'You kept your promise! Akosua is delighted (+15 Partner Trust, +10 Energy).',
        trustChange: +15,
      };
    } else if (actionId === 'reschedule_honestly') {
      // Honest communication: Mark explains his competing deadline or café shift
      this.state.partnerTrust = clampStat(this.state.partnerTrust + 3);
      if (this.state.partnerPromise) {
        this.state.partnerPromise.state = 'rescheduled';
      }
      this.state.partnerTalkCount += 1;

      const reason = context.reason || 'urgent group assignment and work commitments';

      this.state.objective = {
        id: 'handle_commitments',
        title: 'Focus on Group Assignment & Exam Prep',
        description: `Akosua understood your situation (${reason}). Make sure to manage your time wisely.`,
        locationName: 'East Study Pergola / Library',
        completed: false,
        outcome: 'rescheduled_honestly',
      };

      const historyEntry = {
        id: `partner_rescheduled_${Date.now()}`,
        option: 'rescheduled_honestly',
        label: 'Rescheduled with Akosua Honestly',
        description: `Mark explained his situation honestly to Akosua (${reason}). She appreciated the transparency (+3 Partner Trust).`,
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 10, money: 0, energy: 0, academicProgress: 0, relationshipTrust: 0, employerTrust: 0, partnerTrust: 3 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'reschedule_honestly',
        message: 'Akosua appreciated your honest communication. She wished you strength for your deadlines (+3 Partner Trust).',
        trustChange: +3,
      };
    } else if (actionId === 'break_promise') {
      // Missed without communication / flaked
      this.state.partnerTrust = clampStat(this.state.partnerTrust - 20);
      if (this.state.partnerPromise) {
        this.state.partnerPromise.state = 'broken';
      }

      const historyEntry = {
        id: `partner_broken_${Date.now()}`,
        option: 'broken_promise',
        label: 'Missed Meeting with Akosua without Communication',
        description: 'Mark did not show up or communicate when scheduled to meet Akosua. Relationship trust suffered (-20 Partner Trust).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 0, money: 0, energy: 0, academicProgress: 0, relationshipTrust: -5, employerTrust: 0, partnerTrust: -20 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'break_promise',
        message: 'Akosua was hurt that you didn’t show up or communicate (-20 Partner Trust).',
        trustChange: -20,
      };
    } else if (actionId === 'casual_chat') {
      this.advanceMinutes(15);
      this.state.partnerTrust = clampStat(this.state.partnerTrust + 5);
      this.state.partnerTalkCount += 1;

      result = {
        action: 'casual_chat',
        message: 'Shared a warm moment with Akosua (+5 Partner Trust).',
        trustChange: +5,
      };
    }

    return result;
  }

  // -------------------------------------------------------------
  // GROUP ASSIGNMENT SYSTEM (CSC 201 TERM PROJECT)
  // -------------------------------------------------------------
  getGroupProjectStatus() {
    const proj = this.state.groupProject;
    const isPastDeadline = this.state.minutesOfDay > proj.deadlineMinutes;
    return {
      ...proj,
      isPastDeadline,
      canSubmit: !proj.submitted && (proj.totalProgress >= 50 || isPastDeadline),
    };
  }

  interactGroupProject(actionId) {
    const proj = this.state.groupProject;
    const before = this.getSnapshot();
    let result = null;

    if (proj.submitted && actionId !== 'inspect') {
      throw new Error('Group project has already been submitted.');
    }

    if (actionId === 'work_my_section') {
      if (this.state.energy < 20) throw new Error('Not enough energy to work on backend code (need 20 energy).');
      this.advanceMinutes(90);
      this.state.energy = clampStat(this.state.energy - 20);
      proj.markProgress = Math.min(30, proj.markProgress + 30);
      proj.totalProgress = Math.min(100, proj.esiProgress + proj.kofiProgress + proj.markProgress);
      this.state.academicProgress = clampStat(this.state.academicProgress + 8);

      const historyEntry = {
        id: `group_work_mark_${Date.now()}`,
        option: 'work_my_section',
        label: 'Coded Backend Query Logic for Group Project',
        description: 'Mark implemented the SQL database schemas and Express endpoints for CSC 201 project (+30% Mark contribution, +8 Academics).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 90, money: 0, energy: -20, academicProgress: 8, relationshipTrust: 5, employerTrust: 0, partnerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'work_my_section',
        message: 'You implemented the database query engine! Group progress increased (+8 Academics, -20 Energy).',
        newProgress: proj.totalProgress,
      };
    } else if (actionId === 'remind_kofi') {
      if (this.state.energy < 5) throw new Error('Need at least 5 energy to meet and coordinate with Kofi.');
      this.advanceMinutes(30);
      this.state.energy = clampStat(this.state.energy - 5);
      proj.kofiStatus = 'reminded';
      proj.kofiProgress = Math.min(30, proj.kofiProgress + 20);
      proj.totalProgress = Math.min(100, proj.esiProgress + proj.kofiProgress + proj.markProgress);
      this.state.relationshipTrust = clampStat(this.state.relationshipTrust + 5);

      const historyEntry = {
        id: `group_remind_kofi_${Date.now()}`,
        option: 'remind_kofi',
        label: 'Reminded and Encouraged Teammate Kofi',
        description: 'Mark spoke patiently with Kofi, who was juggling a family trade. Kofi caught up on API documentation (+20% Kofi contribution, +5 Peer Trust).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 30, money: 0, energy: -5, academicProgress: 0, relationshipTrust: 5, employerTrust: 0, partnerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'remind_kofi',
        message: 'Kofi appreciated your patience and finished the API test cases! (+20% Kofi contribution, +5 Peer Trust).',
        newProgress: proj.totalProgress,
      };
    } else if (actionId === 'assist_kofi') {
      if (this.state.energy < 30) throw new Error('Taking over Kofi’s section requires 30 energy.');
      this.advanceMinutes(120);
      this.state.energy = clampStat(this.state.energy - 30);
      proj.kofiStatus = 'assisted';
      proj.kofiProgress = 30; // Mark completely finishes Kofi's portion
      proj.totalProgress = Math.min(100, proj.esiProgress + proj.kofiProgress + proj.markProgress);
      this.state.academicProgress = clampStat(this.state.academicProgress + 12);

      const historyEntry = {
        id: `group_assist_kofi_${Date.now()}`,
        option: 'assist_kofi',
        label: 'Mark Took Over Unfinished Testing Documentation',
        description: 'Mark spent 2 hours writing test suites and documentation to ensure the project does not fail (+12 Academics, -30 Energy).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 120, money: 0, energy: -30, academicProgress: 12, relationshipTrust: 0, employerTrust: 0, partnerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'assist_kofi',
        message: 'You completed the remaining test suites yourself! Project quality is secured at top tier (+12 Academics, -30 Energy).',
        newProgress: proj.totalProgress,
      };
    } else if (actionId === 'confront_kofi') {
      this.advanceMinutes(20);
      proj.kofiStatus = 'confronted';
      proj.kofiProgress = Math.min(30, proj.kofiProgress + 15);
      proj.totalProgress = Math.min(100, proj.esiProgress + proj.kofiProgress + proj.markProgress);
      this.state.relationshipTrust = clampStat(this.state.relationshipTrust - 10);

      const historyEntry = {
        id: `group_confront_kofi_${Date.now()}`,
        option: 'confront_kofi',
        label: 'Confronted Kofi Over Lack of Contribution',
        description: 'Mark called out Kofi sternly in front of Esi. Kofi submitted basic notes under duress, but team morale took a hit (-10 Peer Trust).',
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 20, money: 0, energy: 0, academicProgress: 0, relationshipTrust: -10, employerTrust: 0, partnerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'confront_kofi',
        message: 'Kofi scrambled to deliver basic notes under pressure, but group harmony was strained (-10 Peer Trust).',
        newProgress: proj.totalProgress,
      };
    } else if (actionId === 'submit_project') {
      proj.submitted = true;
      let grade = 'C';
      let acadBonus = 5;
      let peerBonus = 0;

      if (proj.totalProgress >= 90) {
        grade = 'A';
        acadBonus = 20;
        peerBonus = 10;
      } else if (proj.totalProgress >= 75) {
        grade = 'B+';
        acadBonus = 15;
        peerBonus = 5;
      } else if (proj.totalProgress >= 60) {
        grade = 'B';
        acadBonus = 10;
        peerBonus = 0;
      } else if (proj.totalProgress >= 45) {
        grade = 'C';
        acadBonus = 5;
        peerBonus = -5;
      } else {
        grade = 'D/F';
        acadBonus = -5;
        peerBonus = -15;
      }

      proj.groupGrade = grade;
      this.state.academicProgress = clampStat(this.state.academicProgress + acadBonus);
      this.state.relationshipTrust = clampStat(this.state.relationshipTrust + peerBonus);

      this.state.objective = {
        id: 'prepare_exam',
        title: 'Revise for CSC 201 Midterm Exam',
        description: `Project submitted (Grade: ${grade})! Head to Balme Library to revise before the 6:00 PM exam in the Great Hall.`,
        locationName: 'Campus Library Pavilion',
        completed: false,
        outcome: `project_${grade}`,
      };

      const historyEntry = {
        id: `group_submitted_${Date.now()}`,
        option: 'submit_project',
        label: `Submitted CSC 201 Group Project (Grade: ${grade})`,
        description: `Group project finalized at ${proj.totalProgress}% completion. Awarded Grade ${grade} (+${acadBonus} Academics).`,
        day: before.day,
        time: before.time,
        statusChanges: { minutes: 15, money: 0, energy: 0, academicProgress: acadBonus, relationshipTrust: peerBonus, employerTrust: 0, partnerTrust: 0 },
        resultingState: this.getSummaryStats(),
        timestamp: Date.now(),
      };
      this.state.history.push(historyEntry);
      this.save();

      result = {
        action: 'submit_project',
        message: `Project submitted successfully! Final Grade: ${grade} (${acadBonus >= 0 ? '+' : ''}${acadBonus} Academics).`,
        grade,
        progress: proj.totalProgress,
      };
    }

    return result;
  }

  // -------------------------------------------------------------
  // EXAM & REVISION SYSTEM (CSC 201 MIDTERM)
  // -------------------------------------------------------------
  getExamStatus() {
    const ex = this.state.examSystem;
    const canTakeExam = !ex.examTaken;
    return {
      ...ex,
      canTakeExam,
      academicProgress: this.state.academicProgress,
      energy: this.state.energy,
    };
  }

  studyInLibrary(sessionType) {
    if (this.state.examSystem.examTaken) {
      throw new Error('Midterm exam has already taken place.');
    }

    const before = this.getSnapshot();
    let duration = 60;
    let energyCost = 15;
    let revGain = 25;
    let acadGain = 2;

    if (sessionType === 'deep_study') {
      duration = 120;
      energyCost = 25;
      revGain = 45;
      acadGain = 6;
    }

    if (this.state.energy < energyCost) {
      throw new Error(`Not enough energy to study (need ${energyCost} energy). Eat a meal or rest first.`);
    }

    this.advanceMinutes(duration);
    this.state.energy = clampStat(this.state.energy - energyCost);
    this.state.examSystem.revisionProgress = Math.min(100, this.state.examSystem.revisionProgress + revGain);
    this.state.academicProgress = clampStat(this.state.academicProgress + acadGain);
    this.state.examSystem.studySessionsCompleted += 1;

    const historyEntry = {
      id: `study_session_${Date.now()}`,
      option: sessionType,
      label: sessionType === 'deep_study' ? 'Deep Revision Session in Library' : 'Quick Study Review in Library',
      description: `Mark reviewed algorithm complexity, sorting, and memory architecture in Balme Library (+${revGain}% Revision, -${energyCost} Energy).`,
      day: before.day,
      time: before.time,
      statusChanges: { minutes: duration, money: 0, energy: -energyCost, academicProgress: acadGain, relationshipTrust: 0, employerTrust: 0, partnerTrust: 0 },
      resultingState: this.getSummaryStats(),
      timestamp: Date.now(),
    };
    this.state.history.push(historyEntry);
    this.save();

    return {
      sessionType,
      revisionProgress: this.state.examSystem.revisionProgress,
      message: `Study session completed! Revision progress is now ${this.state.examSystem.revisionProgress}% (+${acadGain} Academics, -${energyCost} Energy).`,
    };
  }

  takeMidtermExam() {
    const ex = this.state.examSystem;
    if (ex.examTaken) {
      throw new Error('You have already taken the CSC 201 Midterm Exam.');
    }

    const before = this.getSnapshot();

    // Composite evaluation based on genuine game factors:
    // 1. Revision preparation (up to 40 pts)
    const revScore = (ex.revisionProgress / 100) * 40;

    // 2. Coursework/Project mastery (up to 30 pts)
    const projScore = this.state.groupProject.submitted
      ? (this.state.groupProject.totalProgress / 100) * 30
      : 12;

    // 3. Academic baseline (up to 20 pts)
    const acadScore = (this.state.academicProgress / 100) * 20;

    // 4. Energy & mental clarity (up to 10 pts)
    const staminaScore = this.state.energy >= 50 ? 10 : Math.round((this.state.energy / 50) * 10);

    const totalScore = Math.min(100, Math.round(revScore + projScore + acadScore + staminaScore));

    let grade = 'C';
    let acadChange = 5;
    let feedback = '';

    if (totalScore >= 85) {
      grade = 'A (Distinction)';
      acadChange = 25;
      feedback = 'Outstanding performance! Your deep revision and group work paid off brilliantly with top marks in Dr. Mensah’s exam.';
    } else if (totalScore >= 72) {
      grade = 'B+ (Commendable)';
      acadChange = 18;
      feedback = 'Solid, well-rounded paper. Your preparation carried you through the difficult architecture proof sections.';
    } else if (totalScore >= 60) {
      grade = 'B (Average Pass)';
      acadChange = 10;
      feedback = 'You passed the theoretical questions comfortably, though exam fatigue and gaps in query optimization cost you higher honors.';
    } else if (totalScore >= 50) {
      grade = 'C (Borderline)';
      acadChange = 4;
      feedback = 'Borderline result. You scraped through the threshold, but fatigue and rushed preparation left little margin for error.';
    } else {
      grade = 'D/F (Academic Warning)';
      acadChange = -10;
      feedback = 'Insufficient preparation and severe fatigue caused you to struggle with the algorithm implementation sections.';
    }

    this.advanceMinutes(90); // 1.5 hour exam
    this.state.energy = clampStat(this.state.energy - 25);
    this.state.academicProgress = clampStat(this.state.academicProgress + acadChange);

    ex.examTaken = true;
    ex.examScore = totalScore;
    ex.examGrade = grade;
    ex.examFeedback = feedback;

    this.state.objective = {
      id: 'term_wrap_up',
      title: 'Review Results & Reflect',
      description: `CSC 201 Midterm Exam finished with Grade: ${grade} (${totalScore}/100)! Every choice left its mark on your university journey.`,
      locationName: 'Campus Courtyard',
      completed: true,
      outcome: `exam_${grade}`,
    };

    const historyEntry = {
      id: `exam_completed_${Date.now()}`,
      option: 'sat_exam',
      label: `Sat CSC 201 Midterm Exam — Result: ${grade}`,
      description: `Mark sat the midterm in the Great Hall. Score: ${totalScore}/100. ${feedback} (${acadChange >= 0 ? '+' : ''}${acadChange} Academics).`,
      day: before.day,
      time: before.time,
      statusChanges: { minutes: 90, money: 0, energy: -25, academicProgress: acadChange, relationshipTrust: 0, employerTrust: 0, partnerTrust: 0 },
      resultingState: this.getSummaryStats(),
      timestamp: Date.now(),
    };
    this.state.history.push(historyEntry);
    this.save();

    return {
      score: totalScore,
      grade,
      feedback,
      revScore: Math.round(revScore),
      projScore: Math.round(projScore),
      staminaScore: Math.round(staminaScore),
      academicChange: acadChange,
    };
  }

  reset() {
    this.state = structuredClone(INITIAL_STATE);
    this.elapsedSeconds = 0;
    this.save();
  }
}
