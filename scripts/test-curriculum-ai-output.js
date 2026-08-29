/**
 * REAL Before/After AI Output — Curriculum Context Fix
 * 
 * Calls the actual AI through the teach prompt to show how
 * education_level changes the teaching output for the SAME topic.
 * 
 * Uses the runAICall pathway indirectly by calling the OpenRouter API
 * with the same prompt structure that teach uses.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !openrouterKey) {
  console.error('Missing env vars');
  process.exit(1);
}

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

function buildTeachPrompt(studentCtx, topic, sessionMinutes) {
  return `You are Zorvai, a Socratic tutor. Deliver a ${sessionMinutes}-minute lesson.

${studentBlock(studentCtx)}

Topic: ${topic.title}
${topic.description ? `Description: ${topic.description}` : ''}

Respond with a JSON object: { "content": "<lesson in markdown>", "key_concepts": ["concept1", "concept2", ...] }

Teaching rules:
- Teach at the student's level — age-appropriate vocabulary and examples
- Use the Socratic method: ask questions, guide discovery
- Include worked examples relevant to their country/curriculum
- Keep it conversational and encouraging`;
}

async function callAI(systemPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Teach me this topic.' },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function run() {
  const topic = {
    title: 'Solving Systems of Linear Equations via Elimination and Substitution',
    description: 'Methods for solving systems of two linear equations',
  };

  const baseStudent = {
    name: 'Rabindra Hero',
    country: 'Nepal',
    field: 'School',
    language: 'English',
    studyHoursPerDay: 3,
    timezone: 'Asia/Katmandu',
  };

  // BEFORE: No education level
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('BEFORE — Same student, NO education_level in prompt');
  console.log('═══════════════════════════════════════════════════════════════');
  const promptBefore = buildTeachPrompt(baseStudent, topic, 30);
  console.log('--- System prompt student block ---');
  console.log(studentBlock(baseStudent));
  console.log('\n--- Calling AI... ---\n');
  const responseBefore = await callAI(promptBefore);
  // Extract just the first ~500 chars of content for comparison
  console.log(responseBefore.substring(0, 800));

  console.log('\n\n');

  // AFTER: With education_level = Middle School
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AFTER — Same student, education_level = "Middle School"');
  console.log('═══════════════════════════════════════════════════════════════');
  const studentWithLevel = { ...baseStudent, educationLevel: 'Middle School' };
  const promptAfter = buildTeachPrompt(studentWithLevel, topic, 30);
  console.log('--- System prompt student block ---');
  console.log(studentBlock(studentWithLevel));
  console.log('\n--- Calling AI... ---\n');
  const responseAfter = await callAI(promptAfter);
  console.log(responseAfter.substring(0, 800));

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('Compare the two responses above. The "Middle School" version');
  console.log('should use simpler language, more guided steps, and concrete');
  console.log('number examples rather than abstract variable manipulation.');
  console.log('═══════════════════════════════════════════════════════════════');
}

run().catch(console.error);
