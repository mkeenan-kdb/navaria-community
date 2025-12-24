const {createClient} = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedIrishCourse() {
  console.log('🌱 Starting seed for "Tír na nÓg: The Journey"');

  const courseId = crypto.randomUUID();

  // 0. Clean up existing course
  const {error: deleteError} = await supabase
    .from('courses')
    .delete()
    .eq('title', 'Tír na nÓg: The Journey');

  if (deleteError)
    console.error('Warning: Failed to clean up existing course:', deleteError);
  else console.log('🧹 Cleaned up existing course');

  // 1. Create Course
  const {error: courseError} = await supabase.from('courses').insert({
    id: courseId,
    title: 'Tír na nÓg: The Journey',
    title_target: 'Tír na nÓg: An Turas',
    description:
      'Embark on a magical journey through Ireland to learn the language of the legends. Follow an ancient story while mastering Irish greetings, introductions, and basic conversations.',
    icon_name: 'castle',
    display_order: 1,
    is_available: true,
    language_id: 'irish_std',
    color: '#10B981', // Emerald Green
  });

  if (courseError)
    throw new Error(`Failed to create course: ${courseError.message}`);
  console.log('✅ Course created');

  // 2. Create Course Introduction Content Block
  console.log('📝 Creating course introduction...');
  await supabase.from('content_blocks').insert({
    parent_type: 'course',
    parent_id: courseId,
    block_type: 'text',
    display_order: 0,
    content: {
      text: `# Welcome to Tír na nÓg! 🍀

**Fáilte!** Welcome to your journey into Irish (Gaeilge).

## About This Course

This course tells the ancient tale of Tír na nÓg - the mythical Land of Youth. As you follow the story, you'll learn:

- **Greetings and farewells** - How to say hello, goodbye, and welcome visitors
- **Introducing yourself** - Telling people your name and where you're from
- **Basic conversation** - Asking questions and giving simple answers
- **Directions** - Finding your way through the Irish countryside
- **Numbers and counting** - Essential for your journey

## How It Works

Each lesson contains:
- 📖 **Story segments** that advance the tale
- 🎯 **Interactive exercises** to practice what you've learned
- 🔊 **Audio examples** for pronunciation (where available)
- 💡 **Grammar tips** to help you understand the structure

## Your Journey Begins

You wake up on a misty morning in the Irish countryside. An ancient voice calls to you from the Land of Eternal Youth. Will you answer the call?

---

*"Tír na nÓg, the land where nobody grows old..."*`,
      markdown: true,
    },
    is_available: true,
  });

  console.log('📝 Adding course introductory media...');
  await supabase.from('content_blocks').insert({
    parent_type: 'course',
    parent_id: courseId,
    block_type: 'image',
    display_order: 1,
    content: {
      url: 'https://www.journee-mondiale.com/en/wp-content/uploads/2025/05/2025-05-11-07-35-28_.webp',
      caption: 'The cliffs of Ireland',
      alt: 'Mist covered cliffs in Ireland',
      aspectRatio: 1.5,
      fullWidth: true,
    },
    is_available: true,
  });

  await supabase.from('content_blocks').insert({
    parent_type: 'course',
    parent_id: courseId,
    block_type: 'video',
    display_order: 2,
    content: {
      url: 'https://www.youtube.com/watch?v=cSp-ihnpJ64', // Placeholder
      caption: 'Welcome to Tír na nÓg',
      thumbnail: 'https://img.youtube.com/vi/cSp-ihnpJ64/maxresdefault.jpg',
      duration: 120,
      controls: true,
    },
    is_available: true,
  });

  await supabase.from('content_blocks').insert({
    parent_type: 'course',
    parent_id: courseId,
    block_type: 'audio',
    display_order: 3,
    content: {
      url: 'https://ojcvitaqbmchahetfunf.supabase.co/storage/v1/object/public/course_media/recording_1766575734403.wav',
      title: 'Pronunciation Guide Intro',
      description: 'Listen to how to pronounce the basic sounds',
    },
    is_available: true,
  });
  console.log('✅ Course introduction added');

  // --- LESSON 1: THE MIST (An Ceo) ---
  const lesson1Id = crypto.randomUUID();
  await createLesson({
    id: lesson1Id,
    courseId,
    title: 'The Mist',
    titleTarget: 'An Ceo',
    description:
      'You wake up in a mysterious mist. A stranger appears through the fog.',
    icon_name: 'cloud',
    displayOrder: 1,
    estimatedMinutes: 15,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 1: The Mist

> *"Ní hé lá na gaoithe lá na scoilte."*
> *(The day of the wind is not the day for thatching.)*
> — Irish Proverb

You find yourself standing on a green hill. The morning mist slowly clears, revealing rolling hills and ancient stone walls. In the distance, a figure approaches through the fog.

As they draw near, you see an old man with kind eyes and a weathered face. He raises his hand in greeting.`,
          markdown: true,
        },
      },
      {
        type: 'image',
        content: {
          url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWk_8oveXzlEwLc8y-e4GbW0PgV8LiLAjrlg&s',
          caption: 'A misty morning in the countryside',
          alt: 'Irish countryside with stone walls and mist',
          aspectRatio: 1.6,
        },
      },
      {
        type: 'audio',
        content: {
          url: 'https://ojcvitaqbmchahetfunf.supabase.co/storage/v1/object/public/course_media/recording_1766575734403.wav',
          title: 'Atmospheric Sounds',
          description: 'The sound of the wind through the stones',
        },
      },
      {
        type: 'exercise',
        title: 'First Greetings',
        description: 'Learn how to say hello in Irish',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Hello', target: 'Dia duit'},
                  {source: 'Hello to you too', target: 'Dia is Muire duit'},
                  {source: 'Welcome', target: 'Fáilte'},
                ],
              },
            },
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Good morning', target: 'Maidin mhaith'},
                  {source: 'Good night', target: 'Oíche mhaith'},
                  {source: 'See you later', target: 'Feicfidh mé thú'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `The old man smiles warmly. **"Dia duit,"** he says in a gentle voice.

His greeting literally means "God be with you" - the traditional Irish hello. You notice he's waiting for your response.`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Responding to Greetings',
        description: 'Practice the Irish responses',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {source: 'Hello', target: 'Dia duit'},
            },
            {
              unitType: 'sentence',
              content: {
                source: 'Hello to you too',
                target: 'Dia is Muire duit',
              },
            },
            {
              unitType: 'sentence',
              content: {source: 'Welcome', target: 'Fáilte'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Good morning', target: 'Maidin mhaith'},
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `**"Dia is Muire duit,"** you reply, remembering the proper response.

The old man's eyes light up with approval. "Ah, you know the old tongue! Come, walk with me. I have much to tell you about where you are..."`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'More Greetings',
        description: 'Practice additional greetings',
        exercise: {
          type: 'cloze',
          units: [
            {
              unitType: 'cloze',
              content: {
                source: 'Good morning',
                target: '[Maidin] mhaith',
              },
              metadata: {distractors: ['Oíche', 'Tráthnóna', 'Lá']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Good night',
                target: 'Oíche [mhaith]',
              },
              metadata: {distractors: ['duit', 'agat', 'leat']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Goodbye',
                target: '[Slán]',
              },
              metadata: {distractors: ['Fáilte', 'Dia', 'Tá']},
            },
          ],
        },
      },
    ],
  });

  // --- LESSON 2: THE OLD MAN (An Seanfhear) ---
  const lesson2Id = crypto.randomUUID();
  await createLesson({
    id: lesson2Id,
    courseId,
    title: 'The Old Man',
    titleTarget: 'An Seanfhear',
    description:
      'The mysterious stranger asks for your name. Who are you, really?',
    icon_name: 'account',
    displayOrder: 2,
    estimatedMinutes: 20,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 2: Introductions

As you walk together through the green fields, the old man turns to you with curiosity in his eyes.

**"Cad is ainm duit?"** he asks. "What is your name?"

In Irish, there are two main ways to introduce yourself:`,
          markdown: true,
        },
      },
      {
        type: 'text',
        content: {
          text: `### Introducing Yourself in Irish

| English | Irish | Literal Translation |
|---------|-------|---------------------|
| My name is... | Is mise... | I am... |
| What is your name? | Cad is ainm duit? | What is name to-you? |
| I am Michael | Is mise Mícheál | I am Michael |
| My name is Síle | Síle is ainm dom | My name is Síle |

**Note:** Irish uses different structures than English. "Is mise" literally means "I am" but is used for introductions.`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Learning Names',
        description: 'Match the Irish and English introductions',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'What is your name?', target: 'Cad is ainm duit?'},
                  {source: 'I am Seán', target: 'Is mise Seán'},
                  {source: 'I am Máire', target: 'Is mise Máire'},
                ],
              },
            },
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'What is his name?', target: 'Cad is ainm dó?'},
                  {source: 'Her name is Síle', target: 'Síle is ainm di'},
                  {source: 'His name is Pól', target: 'Pól is ainm dó'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'I am...',
        description: 'Practice introducing yourself',
        exercise: {
          type: 'cloze',
          units: [
            {
              unitType: 'cloze',
              content: {
                source: 'I am Michael',
                target: 'Is [mise] Mícheál',
              },
              metadata: {distractors: ['tú', 'sé', 'sí', 'ainm']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'I am Seán',
                target: '[Is] mise Seán',
              },
              metadata: {distractors: ['Tá', 'Bí', 'Níl', 'An']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'What is your name?',
                target: 'Cad is [ainm] duit?',
              },
              metadata: {distractors: ['mise', 'agat', 'leat', 'dó']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'I am Síle',
                target: 'Is mise [Síle]',
              },
              metadata: {distractors: ['Seán', 'duit', 'ainm', 'tú']},
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Full Introductions',
        description: 'Type out complete Irish sentences',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {
                source: 'What is your name?',
                target: 'Cad is ainm duit?',
              },
            },
            {
              unitType: 'sentence',
              content: {source: 'I am Seán', target: 'Is mise Seán'},
            },
            {
              unitType: 'sentence',
              content: {source: 'I am Máire', target: 'Is mise Máire'},
            },
            {
              unitType: 'sentence',
              content: {
                source: 'Nice to meet you',
                target: 'Deas bualadh leat',
              },
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `You tell the old man your name. He nods thoughtfully.

**"Is mise Fionn,"** he replies. "I am Fionn. I am the guardian of these lands, and I sense you are here for a reason. Come, there is something you must see at the crossroads ahead."`,
          markdown: true,
        },
      },
    ],
  });

  // --- LESSON 3: THE CROSSROADS (Na Crosbhóithre) ---
  const lesson3Id = crypto.randomUUID();
  await createLesson({
    id: lesson3Id,
    courseId,
    title: 'The Crossroads',
    titleTarget: 'Na Crosbhóithre',
    description:
      'You arrive at a magical crossroads. Which path will you choose?',
    icon_name: 'map',
    displayOrder: 3,
    estimatedMinutes: 18,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 3: The Crossroads

You and Fionn arrive at an ancient stone crossroads. Three paths diverge before you, each marked by weathered signs in Irish.

Fionn points to the signs. **"Léigh na comharthaí,"** he says. "Read the signs. You must choose your path wisely."`,
          markdown: true,
        },
      },
      {
        type: 'text',
        content: {
          text: `### Directions in Irish

| English | Irish |
|---------|-------|
| Left | Ar chlé |
| Right | Ar dheis |
| Straight ahead | Díreach |
| North | Ó thuaidh |
| South | Ó dheas |
| East | Soir |
| West | Siar |`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Reading the Signs',
        description: 'Match the directions',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Left', target: 'Ar chlé'},
                  {source: 'Right', target: 'Ar dheis'},
                  {source: 'Straight ahead', target: 'Díreach'},
                ],
              },
            },
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'North', target: 'Ó thuaidh'},
                  {source: 'South', target: 'Ó dheas'},
                  {source: 'East', target: 'Soir'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Which Way?',
        description: 'Practice giving directions',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {source: 'Turn left', target: 'Cas ar chlé'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Turn right', target: 'Cas ar dheis'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Go straight', target: 'Téigh díreach'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Go north', target: 'Téigh ó thuaidh'},
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `You study the three paths:

- **Ar chlé** (Left): The path to the ancient forest
- **Ar dheis** (Right): The path to the coastal cliffs
- **Díreach** (Straight): The path to the hidden valley

Fionn watches you carefully. "Choose wisely, young traveler. Each path leads to Tír na nÓg, but each teaches different lessons..."`,
          markdown: true,
        },
      },
      {
        type: 'video',
        content: {
          url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Me at the zoo
          caption: 'The Crossroads - Visual Guide',
          thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
          duration: 60,
          controls: true,
        },
      },
    ],
  });

  // --- LESSON 4: NUMBERS AND TIME (Uimhreacha agus Am) ---
  const lesson4Id = crypto.randomUUID();
  await createLesson({
    id: lesson4Id,
    courseId,
    title: 'Numbers and Time',
    titleTarget: 'Uimhreacha agus Am',
    description: 'Learn to count in Irish and tell the time.',
    icon_name: 'clock',
    displayOrder: 4,
    estimatedMinutes: 25,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 4: The Ancient Stones

You choose the middle path and walk deeper into the mystical landscape. Soon, you come upon a circle of standing stones, each carved with Irish numbers.

**"Áireamh,"** says Fionn. "Count them. Numbers hold great power in the old ways."`,
          markdown: true,
        },
      },
      {
        type: 'text',
        content: {
          text: `### Numbers 1-10 in Irish

| Number | Irish | Pronunciation Guide |
|--------|-------|---------------------|
| 1 | a haon | ah hane |
| 2 | a dó | ah doh |
| 3 | a trí | ah tree |
| 4 | a ceathair | ah kah-her |
| 5 | a cúig | ah koo-ig |
| 6 | a sé | ah shay |
| 7 | a seacht | ah shocked |
| 8 | a hocht | ah hucked |
| 9 | a naoi | ah nay |
| 10 | a deich | ah deh |`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Counting to Ten',
        description: 'Match the numbers with their Irish names',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'One', target: 'A haon'},
                  {source: 'Two', target: 'A dó'},
                  {source: 'Three', target: 'A trí'},
                  {source: 'Four', target: 'A ceathair'},
                  {source: 'Five', target: 'A cúig'},
                ],
              },
            },
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Six', target: 'A sé'},
                  {source: 'Seven', target: 'A seacht'},
                  {source: 'Eight', target: 'A hocht'},
                  {source: 'Nine', target: 'A naoi'},
                  {source: 'Ten', target: 'A deich'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Writing Numbers',
        description: 'Type the Irish numbers',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {source: 'One', target: 'A haon'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Two', target: 'A dó'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Three', target: 'A trí'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Four', target: 'A ceathair'},
            },
            {
              unitType: 'sentence',
              content: {source: 'Five', target: 'A cúig'},
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Higher Numbers',
        description: 'Complete the number sequence',
        exercise: {
          type: 'cloze',
          units: [
            {
              unitType: 'cloze',
              content: {
                source: 'Seven',
                target: 'A [seacht]',
              },
              metadata: {distractors: ['sé', 'hocht', 'naoi', 'deich']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Eight',
                target: 'A [hocht]',
              },
              metadata: {distractors: ['seacht', 'naoi', 'deich', 'sé']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Nine',
                target: 'A [naoi]',
              },
              metadata: {distractors: ['hocht', 'deich', 'seacht', 'sé']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Ten',
                target: 'A [deich]',
              },
              metadata: {distractors: ['naoi', 'hocht', 'seacht', 'haon']},
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `As you count the stones - **a haon, a dó, a trí** - they begin to glow with an ancient light. Fionn smiles.

**"Tá deich clocha ann,"** he says. "There are ten stones. You have awakened them with the old language. The way to Tír na nÓg grows clearer..."`,
          markdown: true,
        },
      },
    ],
  });

  // --- LESSON 5: QUESTIONS AND ANSWERS (Ceisteanna agus Freagraí) ---
  const lesson5Id = crypto.randomUUID();
  await createLesson({
    id: lesson5Id,
    courseId,
    title: 'Questions and Answers',
    titleTarget: 'Ceisteanna agus Freagraí',
    description: 'Learn to ask and answer basic questions in Irish.',
    icon_name: 'help-circle',
    displayOrder: 5,
    estimatedMinutes: 22,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 5: The Gate of Questions

Beyond the stone circle, you find an ornate gate blocking the path. Ancient writing shimmers on its surface.

Fionn reads it aloud: **"Freagair na ceisteanna"** - "Answer the questions."

"The gate will only open if you can understand the questions it asks," he explains.`,
          markdown: true,
        },
      },
      {
        type: 'text',
        content: {
          text: `### Basic Questions in Irish

| English | Irish |
|---------|-------|
| How are you? | Conas atá tú? |
| I am well | Tá mé go maith |
| What is this? | Cad é seo? |
| Where is...? | Cá bhfuil...? |
| Who is...? | Cé hé...? |
| Yes | Tá / Is ea |
| No | Níl / Ní hea |`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Common Questions',
        description: 'Match questions with their meanings',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'How are you?', target: 'Conas atá tú?'},
                  {source: 'What is this?', target: 'Cad é seo?'},
                  {source: 'Where is it?', target: 'Cá bhfuil sé?'},
                ],
              },
            },
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Who is he?', target: 'Cé hé?'},
                  {source: 'What is your name?', target: 'Cad is ainm duit?'},
                  {source: 'Who is she?', target: 'Cé hí?'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Asking Questions',
        description: 'Type the Irish questions',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {source: 'How are you?', target: 'Conas atá tú?'},
            },
            {
              unitType: 'sentence',
              content: {source: 'I am well', target: 'Tá mé go maith'},
            },
            {
              unitType: 'sentence',
              content: {source: 'What is this?', target: 'Cad é seo?'},
            },
            {
              unitType: 'sentence',
              content: {
                source: 'Where is the gate?',
                target: 'Cá bhfuil an geata?',
              },
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Answering Questions',
        description: 'Complete the responses',
        exercise: {
          type: 'cloze',
          units: [
            {
              unitType: 'cloze',
              content: {
                source: 'I am well',
                target: 'Tá [mé] go maith',
              },
              metadata: {distractors: ['tú', 'sé', 'sí', 'mise']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Yes (with tá)',
                target: '[Tá]',
              },
              metadata: {distractors: ['Níl', 'Is', 'Bí', 'An']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'No (with tá)',
                target: '[Níl]',
              },
              metadata: {distractors: ['Tá', 'Is', 'Ní', 'An']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'How are you?',
                target: '[Conas] atá tú?',
              },
              metadata: {distractors: ['Cad', 'Cá', 'Cé', 'An']},
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `The gate glows brighter with each correct answer. Finally, it swings open with a melodious chime.

**"Maith thú!"** says Fionn proudly. "Well done! You are ready now. Through this gate lies Tír na nÓg - the Land of Eternal Youth. Are you prepared to enter?"

The path ahead shimmers with golden light...`,
          markdown: true,
        },
      },
    ],
  });

  // --- LESSON 6: THE ARRIVAL (An Teacht) ---
  const lesson6Id = crypto.randomUUID();
  await createLesson({
    id: lesson6Id,
    courseId,
    title: 'The Arrival',
    titleTarget: 'An Teacht',
    description:
      'You have reached Tír na nÓg! Practice everything you have learned.',
    icon_name: 'star',
    displayOrder: 6,
    estimatedMinutes: 20,
    contentBlocks: [
      {
        type: 'text',
        content: {
          text: `## Chapter 6: Tír na nÓg

You step through the gateway and find yourself in a land of impossible beauty. The sky shimmers with colors you have never seen. Flowers bloom that exist in no earthly garden.

A group of people approaches, speaking Irish amongst themselves. This is your chance to use everything you have learned!`,
          markdown: true,
        },
      },
      {
        type: 'exercise',
        title: 'Meeting the People',
        description: 'Greet the inhabitants of Tír na nÓg',
        exercise: {
          type: 'standard',
          units: [
            {
              unitType: 'sentence',
              content: {source: 'Hello', target: 'Dia duit'},
            },
            {
              unitType: 'sentence',
              content: {source: 'I am Michael', target: 'Is mise Mícheál'},
            },
            {
              unitType: 'sentence',
              content: {source: 'How are you?', target: 'Conas atá tú?'},
            },
            {
              unitType: 'sentence',
              content: {
                source: 'Nice to meet you',
                target: 'Deas bualadh leat',
              },
            },
            {
              unitType: 'sentence',
              content: {source: 'Thank you', target: 'Go raibh maith agat'},
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Complete Conversations',
        description: 'Fill in the missing words',
        exercise: {
          type: 'cloze',
          units: [
            {
              unitType: 'cloze',
              content: {
                source: 'What is your name?',
                target: '[Cad] is ainm duit?',
              },
              metadata: {distractors: ['Conas', 'Cá', 'Cé', 'An']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'Welcome to Tír na nÓg',
                target: 'Fáilte go [Tír] na nÓg',
              },
              metadata: {distractors: ['An', 'Na', 'Go', 'Ar']},
            },
            {
              unitType: 'cloze',
              content: {
                source: 'I am well, thank you',
                target: 'Tá mé go maith, go raibh [maith] agat',
              },
              metadata: {distractors: ['duit', 'leat', 'agam', 'orm']},
            },
          ],
        },
      },
      {
        type: 'exercise',
        title: 'Review: Everything Together',
        description: 'Match all the phrases you have learned',
        exercise: {
          type: 'matching_pairs',
          units: [
            {
              unitType: 'matching_group',
              content: {
                pairs: [
                  {source: 'Good morning', target: 'Maidin mhaith'},
                  {source: 'Goodbye', target: 'Slán'},
                  {source: 'Please', target: 'Le do thoil'},
                  {source: 'Thank you', target: 'Go raibh maith agat'},
                  {source: 'You are welcome', target: 'Tá fáilte romhat'},
                  {source: 'Excuse me', target: 'Gabh mo leithscéal'},
                ],
              },
            },
          ],
        },
      },
      {
        type: 'text',
        content: {
          text: `## Comhghairdeas! Congratulations!

You have completed your journey to Tír na nÓg!

The inhabitants welcome you warmly. **"Tá fáilte romhat,"** they say. "You are welcome here."

Fionn places a hand on your shoulder. **"Rinne tú é!"** - "You did it! You have learned the ancient tongue and earned your place in the Land of Youth."

---

### What You Have Learned

In this course, you have mastered:

✅ **Greetings and farewells** - Dia duit, Slán, Fáilte
✅ **Introductions** - Is mise..., Cad is ainm duit?
✅ **Directions** - Ar chlé, Ar dheis, Díreach
✅ **Numbers 1-10** - A haon, a dó, a trí...
✅ **Questions and answers** - Conas atá tú? Cad é seo?
✅ **Polite phrases** - Go raibh maith agat, Le do thoil

### Your Journey Continues...

This is just the beginning. The Irish language holds countless more treasures. Keep practicing, keep learning, and **go n-éirí an bóthar leat** - may the road rise with you!

---

*"Tír na nÓg - where the stories never end, and the language lives forever..."*`,
          markdown: true,
        },
      },
    ],
  });

  // 3. Link Lessons to Course via Content Blocks
  console.log('🔗 Linking lessons to course content blocks...');

  const lessons = [
    {id: lesson1Id, order: 4},
    {id: lesson2Id, order: 5},
    {id: lesson3Id, order: 6},
    {id: lesson4Id, order: 7},
    {id: lesson5Id, order: 8},
    {id: lesson6Id, order: 9},
  ];

  for (const lesson of lessons) {
    await supabase.from('content_blocks').insert({
      parent_type: 'course',
      parent_id: courseId,
      block_type: 'lesson',
      display_order: lesson.order,
      content: {lessonId: lesson.id},
      is_available: true,
    });
  }

  console.log('✨ Seed completed successfully!');
  console.log(`📚 Created course with ${lessons.length} comprehensive lessons`);
  console.log('🎯 Features showcased:');
  console.log('   - Course introduction text block');
  console.log('   - Story-driven narrative content');
  console.log('   - All 3 exercise types (standard, cloze, matching_pairs)');
  console.log('   - Multiple units per exercise (3-6 units each)');
  console.log('   - Grammar tables and explanations');
  console.log('   - Progressive difficulty');
}

async function createLesson({
  id,
  courseId,
  title,
  titleTarget,
  description,
  icon_name,
  displayOrder,
  estimatedMinutes,
  contentBlocks,
}) {
  // 1. Create Lesson
  const {error} = await supabase.from('lessons').insert({
    id,
    course_id: courseId,
    title,
    title_target: titleTarget,
    description,
    icon_name,
    display_order: displayOrder,
    estimated_minutes: estimatedMinutes,
    is_available: true,
    requires_prerequisites: false,
  });
  if (error)
    throw new Error(`Failed to create lesson ${title}: ${error.message}`);
  console.log(
    `  ✅ Lesson created: ${title} (${contentBlocks.length} content blocks)`,
  );

  // 2. Create Content Blocks & Exercises
  for (let i = 0; i < contentBlocks.length; i++) {
    const block = contentBlocks[i];
    const blockId = crypto.randomUUID();

    if (block.type === 'exercise') {
      // Create Exercise & exercise block
      const exerciseId = crypto.randomUUID();
      const {error: exError} = await supabase.from('exercises').insert({
        id: exerciseId,
        lesson_id: id,
        title: block.title,
        type: block.exercise.type,
        display_order: i,
        estimated_minutes: 5,
        is_available: true,
      });
      if (exError)
        throw new Error(
          `Failed to create exercise ${block.title}: ${exError.message}`,
        );

      // Create Units
      for (let j = 0; j < block.exercise.units.length; j++) {
        const unit = block.exercise.units[j];
        const {error: unitError} = await supabase
          .from('exercise_units')
          .insert({
            exercise_id: exerciseId,
            unit_type: unit.unitType,
            content: unit.content,
            metadata: unit.metadata || {},
            display_order: j,
          });
        if (unitError)
          throw new Error(`Failed unit insert: ${unitError.message}`);
      }

      // Create the content block for this exercise
      const {error: exBlockError} = await supabase
        .from('content_blocks')
        .insert({
          id: blockId,
          parent_type: 'lesson',
          parent_id: id,
          block_type: 'exercise',
          display_order: i,
          content: {
            exerciseId,
            title: block.title,
            description: block.description,
          },
          is_available: true,
        });

      if (exBlockError) {
        console.error(
          `❌ Failed to insert exercise content block for lesson ${id}:`,
          exBlockError,
        );
        throw new Error(
          `Exercise block insert failed: ${exBlockError.message}`,
        );
      }
    } else {
      // Standard content block (text, audio, image, etc.)
      const {error: blockError} = await supabase.from('content_blocks').insert({
        id: blockId,
        parent_type: 'lesson',
        parent_id: id,
        block_type: block.type,
        display_order: i,
        content: block.content,
        is_available: true,
      });

      if (blockError) {
        console.error(
          `❌ Failed to insert content block ${blockId} for lesson ${id}:`,
          blockError,
        );
        throw new Error(`Content block insert failed: ${blockError.message}`);
      }
    }
  }
}

seedIrishCourse().catch(console.error);
