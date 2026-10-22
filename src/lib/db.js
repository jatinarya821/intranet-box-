import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'intranet.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      status TEXT NOT NULL DEFAULT 'safe',
      location TEXT,
      contact TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'units',
      location TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bulletin_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL DEFAULT 'Anonymous',
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedIfEmpty();
}

function seedIfEmpty() {
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
  if (articleCount.count > 0) return;

  const insertArticle = db.prepare(
    'INSERT INTO articles (category, title, content) VALUES (?, ?, ?)'
  );

  const articles = [
    // First Aid
    ['First Aid', 'CPR Basics', `**Cardiopulmonary Resuscitation (CPR)**

**When to use:** Person is unresponsive and not breathing normally.

**Steps:**
1. Call for help / send someone to get help
2. Lay the person on their back on a firm surface
3. Place the heel of your hand on the center of their chest
4. Push hard and fast — at least 2 inches deep, 100–120 compressions/minute
5. Give 2 rescue breaths after every 30 compressions (if trained)
6. Continue until help arrives or person recovers

**Key points:**
- Push hard — don't worry about breaking ribs, it's better than death
- Minimize interruptions to compressions
- Rotate rescuers every 2 minutes to avoid fatigue`],

    ['First Aid', 'Treating Bleeding Wounds', `**Controlling Bleeding**

**Steps:**
1. Apply direct pressure with a clean cloth or bandage
2. Do NOT remove the cloth — add more on top if soaked through
3. Elevate the injured limb above the heart if possible
4. Apply a tourniquet for severe limb bleeding (2–3 inches above wound)
5. Mark the time the tourniquet was applied on the patient's forehead

**For embedded objects:**
- Do NOT remove — stabilize in place with padding around it
- Never pull out an impaled object

**Signs of shock:**
- Pale, cold, clammy skin
- Rapid weak pulse
- Confusion
→ Lay flat, elevate legs, keep warm`],

    ['First Aid', 'Heat Stroke & Dehydration', `**Heat Stroke (Medical Emergency)**

**Signs:** High body temp (>40°C), no sweating, confusion, unconsciousness

**Treatment:**
1. Move to cool/shaded area immediately
2. Remove excess clothing
3. Cool rapidly with wet cloths, fanning, or ice packs on neck/armpits/groin
4. Give cool water if conscious and able to swallow
5. Do NOT give aspirin or paracetamol

**Dehydration:**
- Signs: dry mouth, dark urine, dizziness, fatigue
- Give ORS (Oral Rehydration Solution): 1L water + 6 tsp sugar + 1/2 tsp salt
- Small frequent sips, not large amounts at once`],

    ['First Aid', 'Snake Bite Protocol', `**Snake Bite First Aid**

**Do:**
1. Keep the person calm and still — movement spreads venom
2. Remove tight clothing/jewelry near the bite
3. Keep bitten limb below heart level
4. Clean wound gently with soap and water
5. Immobilize the limb with a splint
6. Get to medical help as fast as possible
7. Note the snake's appearance for medical staff

**Do NOT:**
- Cut and suck the wound
- Apply ice or cold packs
- Apply tourniquet
- Give alcohol or aspirin`],

    // Agriculture
    ['Agriculture', 'Post-Flood Crop Recovery', `**Restoring Crops After Flooding**

**Immediate Actions (0–3 days):**
- Drain standing water as quickly as possible
- Do not apply fertilizers to waterlogged soil
- Remove damaged plant material to prevent disease

**Recovery Steps (1–2 weeks):**
1. Test soil for compaction and nutrient depletion
2. Apply lime if soil is acidic after flooding
3. Replant with flood-tolerant varieties where possible
4. Use short-duration crop varieties for faster recovery

**Pest & Disease Watch:**
- Flooding increases fungal diseases
- Monitor for root rot, stem blight
- Reduce irrigation for replanted crops

**Seed Storage After Floods:**
- Dry seeds immediately in shade (not direct sun)
- Store in airtight containers with silica gel`],

    ['Agriculture', 'Emergency Water Conservation', `**Water-Saving Techniques During Drought/Scarcity**

**Immediate:**
- Mulch crops to reduce evaporation (straw, leaves, plastic)
- Water at dawn or dusk, never midday
- Use drip irrigation or clay pot (pitcher) irrigation

**Prioritization:**
1. Drinking water for humans — highest priority
2. Livestock water
3. Critical food crops
4. Other crops

**Rainwater Harvesting:**
- Collect roof runoff in drums/tanks
- Dig small farm ponds in natural depressions
- Use plant litter to slow runoff

**Drought-tolerant crops:** Sorghum, millet, cowpea, cassava`],

    // Health
    ['Health', 'Waterborne Disease Prevention', `**Preventing Cholera, Typhoid & Diarrheal Diseases**

**Safe Water:**
- Boil water for 1 minute (3 minutes at high altitude)
- Add 2 drops of chlorine bleach (5%) per liter, wait 30 minutes
- Use water purification tablets if available

**Sanitation:**
- Wash hands with soap before eating and after toilet use
- Dispose of human waste at least 30m from water sources
- Cover food to protect from flies

**ORS Recipe (Diarrhea treatment):**
- 1 liter clean water
- 6 level teaspoons of sugar
- 1/2 teaspoon of salt
- Give small sips frequently

**Warning Signs — Seek help immediately:**
- Blood in stool
- Unconsciousness or confusion
- Unable to keep any fluid down for 6+ hours`],

    ['Health', 'Wound Infection Prevention', `**Preventing & Identifying Wound Infections**

**Cleaning a Wound:**
1. Wash hands first
2. Rinse wound with clean water for 5 minutes
3. Remove visible dirt gently with clean cloth
4. Apply antiseptic if available (povidone-iodine, hydrogen peroxide)
5. Cover with clean bandage
6. Change dressing daily or when wet/dirty

**Signs of Infection:**
- Increasing redness spreading from wound
- Warmth and swelling
- Pus or foul smell
- Fever
- Red streaks spreading from wound (SERIOUS — seek help)

**Tetanus Risk:**
- Deep puncture wounds, animal bites, wounds contaminated with soil
- If not vaccinated in last 5 years — seek tetanus shot`],

    // Disaster SOPs
    ['Disaster SOPs', 'Earthquake Safety Protocol', `**During an Earthquake:**

**DROP – COVER – HOLD ON**
1. DROP to hands and knees
2. Take COVER under sturdy desk/table, or against interior wall
3. HOLD ON and protect your head with your arms

**If outdoors:** Move away from buildings, power lines, trees

**If in a vehicle:** Pull over away from bridges/overpasses, stay inside

**After the earthquake:**
1. Expect aftershocks — be ready to Drop/Cover/Hold again
2. Check for injuries — treat life-threatening ones first
3. Check for gas leaks (smell) — open windows, leave if suspected
4. Do NOT use elevators
5. Check building for structural damage before re-entering

**At shelter:**
- Register with person registry
- Report missing persons to authorities`],

    ['Disaster SOPs', 'Flood Evacuation Checklist', `**Flood Evacuation Checklist**

**Before leaving:**
☐ Turn off electricity at main switch
☐ Turn off gas at main valve
☐ Pack emergency kit (below)
☐ Take important documents (ID, land papers) in waterproof bag
☐ Inform a neighbor/family member of your destination
☐ Register at the nearest evacuation shelter

**Emergency Kit (72-hour bag):**
- Water: 3 liters per person
- Food: non-perishable, no-cook items
- First aid kit
- Flashlight + extra batteries
- Whistle (to signal for help)
- Warm clothing + rain poncho
- Medications (at least 7-day supply)
- Phone + portable charger
- Cash (ATMs may be offline)
- Emergency contact list (written, not just in phone)

**Do NOT:**
- Walk through moving water (6 inches can knock you down)
- Drive through flooded roads
- Return home until authorities declare it safe`],

    ['Disaster SOPs', 'Setting Up a Relief Camp', `**Basic Relief Camp Setup Guide**

**Site Selection:**
- On high ground, away from flood zones
- Near water source (but not flood-prone)
- Accessible by vehicles
- Away from industrial areas

**Essential Zones:**
1. **Registration & Information** — camp entry point
2. **Sleeping Area** — separate male/female sections
3. **Food Distribution** — downwind from toilets
4. **Medical Area** — easily accessible, near entrance
5. **Water & Sanitation** — minimum 20L/person/day
6. **Child-Friendly Space** — safe area for children

**Latrine Standards:**
- 1 toilet per 20 people
- At least 30m from water source
- Separate male/female facilities

**Daily Checklist:**
☐ Morning headcount
☐ Food distribution (3 meals)
☐ Medical rounds
☐ Security check
☐ Update resource inventory`],
  ];

  const insertMany = db.transaction((items) => {
    for (const [category, title, content] of items) {
      insertArticle.run(category, title, content);
    }
  });
  insertMany(articles);

  // Seed some sample resources
  const insertResource = db.prepare(
    'INSERT INTO resources (name, category, quantity, unit, location) VALUES (?, ?, ?, ?, ?)'
  );
  const resources = [
    ['Drinking Water', 'Water', 500, 'liters', 'Main Storage'],
    ['Rice', 'Food', 200, 'kg', 'Food Store'],
    ['ORS Packets', 'Medicine', 100, 'packets', 'Medical Bay'],
    ['Paracetamol', 'Medicine', 300, 'tablets', 'Medical Bay'],
    ['Blankets', 'Shelter', 80, 'pieces', 'Supply Room'],
    ['Tarpaulins', 'Shelter', 30, 'pieces', 'Supply Room'],
    ['Flashlights', 'Equipment', 20, 'units', 'Equipment Store'],
    ['First Aid Kits', 'Medicine', 15, 'kits', 'Medical Bay'],
  ];
  const insertResourcesMany = db.transaction((items) => {
    for (const [name, category, quantity, unit, location] of items) {
      insertResource.run(name, category, quantity, unit, location);
    }
  });
  insertResourcesMany(resources);

  // Seed a sample alert
  db.prepare(
    'INSERT INTO alerts (title, severity, body) VALUES (?, ?, ?)'
  ).run(
    'System Online',
    'info',
    'The Offline Intranet is now active. All residents in this area can access emergency information, maps, and resources through this portal. Stay safe.'
  );
}

export default getDb;
