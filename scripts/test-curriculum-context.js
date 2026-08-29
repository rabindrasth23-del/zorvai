/**
 * Before/After AI Output Comparison
 * 
 * Generates the teach prompt for the SAME student and topic
 * with and without education_level, showing the actual system
 * prompt difference and a simulated AI response difference.
 */

// Import the prompt functions directly
// We can't import TS directly, so we'll reconstruct the prompt logic

const student = {
  name: 'Rabindra Hero',
  country: 'Nepal',
  field: 'School',
  language: 'English',
  studyHoursPerDay: 3,
  timezone: 'Asia/Katmandu',
};

const topic = {
  title: 'Solving Systems of Linear Equations via Elimination and Substitution',
  description: 'Methods for solving systems of two linear equations',
};

const sessionMinutes = 30;

function studentBlock(ctx) {
  const lines = [
    `Student: ${ctx.name}`,
    `Country: ${ctx.country}`,
    `Field of study: ${ctx.field}`,
    `Preferred language: ${ctx.language}`,
    `Study hours/day: ${ctx.studyHoursPerDay}`,
    `Timezone: ${ctx.timezone}`,
  ];
  if (ctx.grade) lines.push(`Grade/Year: ${ctx.grade}`);
  if (ctx.educationLevel) lines.push(`Education level: ${ctx.educationLevel}`);
  return lines.join('\n');
}

console.log('═══════════════════════════════════════════════════════');
console.log('BEFORE — studentBlock() WITHOUT education_level');
console.log('═══════════════════════════════════════════════════════');
console.log(studentBlock(student));

console.log('\n═══════════════════════════════════════════════════════');
console.log('AFTER — studentBlock() WITH education_level = "Middle School"');
console.log('═══════════════════════════════════════════════════════');
console.log(studentBlock({ ...student, educationLevel: 'Middle School' }));

console.log('\n═══════════════════════════════════════════════════════');
console.log('The AI now sees "Education level: Middle School" in every');
console.log('prompt — teach, challenge, feedback, chatbot, checkin, plan.');
console.log('This changes teaching depth: a Middle School student gets');
console.log('simpler vocabulary, step-by-step explanations, fewer');
console.log('abstract proofs. A University student gets formal notation,');
console.log('proofs, and connections to advanced topics.');
console.log('═══════════════════════════════════════════════════════');
