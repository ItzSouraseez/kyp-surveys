const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'survey.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
  )`);

  // Survey responses table
  db.run(`CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Survey questions table
  db.run(`CREATE TABLE IF NOT EXISTS survey_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    options TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER NOT NULL
  )`);

  // Survey submissions table
  db.run(`CREATE TABLE IF NOT EXISTS survey_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_eligible_for_draw BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Timer settings table
  db.run(`CREATE TABLE IF NOT EXISTS timer_settings (
    id INTEGER PRIMARY KEY,
    end_date TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin user
  db.run(`INSERT OR IGNORE INTO users (name, email, password, referral_code, is_admin) 
          VALUES ('Admin User', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN001', TRUE)`);

  // Insert default survey questions
  const questions = [
    {
      text: "How do you usually decide what to eat at a restaurant?",
      type: "single_choice",
      options: JSON.stringify(["Cravings", "Recommendations", "Price", "Health/nutritional value", "Offers or combos"]),
      order: 1
    },
    {
      text: "Have you ever come across a QR based digital menu system in a restaurant?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "No"]),
      order: 2
    },
    {
      text: "Would you prefer a QR Menu over a physical menu in a restaurant?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "Maybe", "No"]),
      order: 3
    },
    {
      text: "What matters most to you when choosing food? (Multiple choice)",
      type: "multiple_choice",
      options: JSON.stringify(["Taste", "Price", "Calories", "Ingredients", "Protein/Fitness", "Value", "Dietary preferences (Veg/Non-Veg/Vegan)"]),
      order: 4
    },
    {
      text: "Do you look at ingredient lists or food labels when buying snacks/packaged food?",
      type: "single_choice",
      options: JSON.stringify(["Always", "Sometimes", "Never"]),
      order: 5
    },
    {
      text: "Do you usually check nutritional information (calories, protein etc.) before eating packaged or ordered food?",
      type: "single_choice",
      options: JSON.stringify(["Yes, always", "Sometimes", "Never"]),
      order: 6
    },
    {
      text: "Have you ever used a calorie tracking app (e.g. HealthifyMe, MyFitnessPal etc.)?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "No"]),
      order: 7
    },
    {
      text: "On a scale of 1–5, how confident are you in estimating how many calories are in a regular chicken biryani plate? (1 = Least confident to 5 = Most confident)",
      type: "single_choice",
      options: JSON.stringify(["1(Very confident)", "2(Confident)", "3(Mildly confident)", "4(Not confident)", "5(Absolutely not confident)"]),
      order: 8
    },
    {
      text: "Would you use a feature where you scan a QR code to get a menu where you can view the calories, carbs, vitamins and other nutritional contents of every dish on the menu?",
      type: "single_choice",
      options: JSON.stringify(["Definitely", "Maybe", "No"]),
      order: 9
    },
    {
      text: "Would you like to get personalised order suggestions from the QR scanned digital menu based on your profile?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "Maybe", "No"]),
      order: 10
    },
    {
      text: "Would you like to get notified about the allergens present in the meal you are about to order?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "Maybe", "No"]),
      order: 11
    },
    {
      text: "Would you like your invoice/bill to be generated online and sent to you through SMS and WhatsApp?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "Maybe", "No"]),
      order: 12
    },
    {
      text: "KnowYourPlate can provide you with features like QR Based Menu System, digital bill for your orders, detailed ingredients list of every dish, detailed nutritional information of every dish, personalised allergen warning for every dish based on your profile, personalised order suggestions based on your health and fitness goals, restaurant crowd tracking, seamless online payment and tipping system. Select 4 out of the 8 features which are the most important for you.",
      type: "multiple_choice_limited",
      options: JSON.stringify(["QR Based Menu System", "Digital bill for your orders", "Detailed ingredients list of every dish", "Detailed nutritional information of every dish", "Personalised allergen warning for every dish based on your profile", "Personalised menu suggestions based on your health and fitness goals", "Restaurant crowd tracking", "Seamless online payment and tipping system"]),
      order: 13
    },
    {
      text: "Which among these would be your top 3 reasons for using KnowYourPlate?",
      type: "multiple_choice_limited",
      options: JSON.stringify(["Convenience of a QR Scanned Menu at your fingertips", "Food transparency and proper ingredients list", "Health and fitness", "Personalised order suggestions", "Smooth ordering and payment experience", "Saving paper used for making physical menus and bills, indirectly benefiting the ecosystem"]),
      order: 14
    },
    {
      text: "Would you be willing to pay a small fee for a premium version of KnowYourPlate with advanced features (like health tracking, meal planning, personalised order suggestions based on your health and fitness goals, etc. )?",
      type: "single_choice",
      options: JSON.stringify(["Yes", "Maybe", "No"]),
      order: 15
    },
    {
      text: "What frustrates you most about the current restaurant dining or ordering experience?",
      type: "text",
      options: null,
      order: 16
    },
    {
      text: "Would you like to suggest any more features in KnowYourPlate to improve your dining experience at restaurants?",
      type: "text",
      options: null,
      order: 17
    }
  ];

  // Check if questions already exist before inserting
  db.get('SELECT COUNT(*) as count FROM survey_questions', (err, row) => {
    if (err) {
      console.error('Error checking questions count:', err);
      return;
    }
    
    // Only insert if no questions exist
    if (row.count === 0) {
      questions.forEach(q => {
        db.run(`INSERT INTO survey_questions (question_text, question_type, options, order_index) 
                VALUES (?, ?, ?, ?)`, [q.text, q.type, q.options, q.order]);
      });
    }
  });
});

module.exports = db;
