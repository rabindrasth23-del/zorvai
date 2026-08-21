const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

async function testInsert() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get a valid student ID to test with
  const { data: student } = await supabase.from('students').select('id').limit(1).single();
  if (!student) {
    console.log("No student found");
    return;
  }

  // 1. Create a plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({ student_id: student.id })
    .select()
    .single();

  if (planError) return console.error("Plan Error:", planError);

  // 2. Create a plan_topic
  const { data: topic, error: topicError } = await supabase
    .from("plan_topics")
    .insert({
      plan_id: plan.id,
      title: "Photosynthesis",
      description: "How plants make food using sunlight",
      day: 1,
      sort_order: 1
    })
    .select()
    .single();

  if (topicError) return console.error("Topic Error:", topicError);

  // 3. Create a session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      student_id: student.id,
      topic_id: topic.id,
      phase: "learn",
      status: "active"
    })
    .select()
    .single();

  if (sessionError) return console.error("Session Error:", sessionError);

  console.log("SUCCESS!");
  console.log("Topic ID created:", topic.id);
  console.log("Session ID created:", session.id);
}

testInsert();
