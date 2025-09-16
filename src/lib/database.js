import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { hashPassword } from './auth.js';

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if admin user exists
    const adminQuery = query(collection(db, 'users'), where('email', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      // Create default admin user
      const hashedPassword = await hashPassword('admin_kyp@369');
      await addDoc(collection(db, 'users'), {
        name: 'Admin User',
        email: 'admin',
        password: hashedPassword,
        referralCode: 'ADMIN001',
        referredBy: null,
        createdAt: serverTimestamp(),
        isAdmin: true
      });
      console.log('Default admin user created');
    }

    // Check if questions exist
    const questionsSnapshot = await getDocs(collection(db, 'surveyQuestions'));
    
    if (questionsSnapshot.empty) {
      // Insert default survey questions
      const questions = [
        {
          text: "How do you usually decide what to eat at a restaurant?",
          type: "single_choice",
          options: ["Cravings", "Recommendations", "Price", "Health/nutritional value", "Offers or combos"],
          orderIndex: 1,
          isActive: true
        },
        {
          text: "Have you ever come across a QR based digital menu system in a restaurant?",
          type: "single_choice",
          options: ["Yes", "No"],
          orderIndex: 2,
          isActive: true
        },
        {
          text: "Would you prefer a QR Menu over a physical menu in a restaurant?",
          type: "single_choice",
          options: ["Yes", "Maybe", "No"],
          orderIndex: 3,
          isActive: true
        },
        {
          text: "What matters most to you when choosing food? (Multiple choice)",
          type: "multiple_choice",
          options: ["Taste", "Price", "Calories", "Ingredients", "Protein/Fitness", "Value", "Dietary preferences (Veg/Non-Veg/Vegan)"],
          orderIndex: 4,
          isActive: true
        },
        {
          text: "Do you look at ingredient lists or food labels when buying snacks/packaged food?",
          type: "single_choice",
          options: ["Always", "Sometimes", "Never"],
          orderIndex: 5,
          isActive: true
        },
        {
          text: "Do you usually check nutritional information (calories, protein etc.) before eating packaged or ordered food?",
          type: "single_choice",
          options: ["Yes, always", "Sometimes", "Never"],
          orderIndex: 6,
          isActive: true
        },
        {
          text: "Have you ever used a calorie tracking app (e.g. HealthifyMe, MyFitnessPal etc.)?",
          type: "single_choice",
          options: ["Yes", "No"],
          orderIndex: 7,
          isActive: true
        },
        {
          text: "On a scale of 1–5, how confident are you in estimating how many calories are in a regular chicken biryani plate? (1 = Least confident to 5 = Most confident)",
          type: "single_choice",
          options: ["1(Very confident)", "2(Confident)", "3(Mildly confident)", "4(Not confident)", "5(Absolutely not confident)"],
          orderIndex: 8,
          isActive: true
        },
        {
          text: "Would you use a feature where you scan a QR code to get a menu where you can view the calories, carbs, vitamins and other nutritional contents of every dish on the menu?",
          type: "single_choice",
          options: ["Definitely", "Maybe", "No"],
          orderIndex: 9,
          isActive: true
        },
        {
          text: "Would you like to get personalised order suggestions from the QR scanned digital menu based on your profile?",
          type: "single_choice",
          options: ["Yes", "Maybe", "No"],
          orderIndex: 10,
          isActive: true
        },
        {
          text: "Would you like to get notified about the allergens present in the meal you are about to order?",
          type: "single_choice",
          options: ["Yes", "Maybe", "No"],
          orderIndex: 11,
          isActive: true
        },
        {
          text: "Would you like your invoice/bill to be generated online and sent to you through SMS and WhatsApp?",
          type: "single_choice",
          options: ["Yes", "Maybe", "No"],
          orderIndex: 12,
          isActive: true
        },
        {
          text: "KnowYourPlate can provide you with features like QR Based Menu System, digital bill for your orders, detailed ingredients list of every dish, detailed nutritional information of every dish, personalised allergen warning for every dish based on your profile, personalised order suggestions based on your health and fitness goals, restaurant crowd tracking, seamless online payment and tipping system. Select 4 out of the 8 features which are the most important for you.",
          type: "multiple_choice_limited",
          options: ["QR Based Menu System", "Digital bill for your orders", "Detailed ingredients list of every dish", "Detailed nutritional information of every dish", "Personalised allergen warning for every dish based on your profile", "Personalised menu suggestions based on your health and fitness goals", "Restaurant crowd tracking", "Seamless online payment and tipping system"],
          orderIndex: 13,
          isActive: true
        },
        {
          text: "Which among these would be your top 3 reasons for using KnowYourPlate?",
          type: "multiple_choice_limited",
          options: ["Convenience of a QR Scanned Menu at your fingertips", "Food transparency and proper ingredients list", "Health and fitness", "Personalised order suggestions", "Smooth ordering and payment experience", "Saving paper used for making physical menus and bills, indirectly benefiting the ecosystem"],
          orderIndex: 14,
          isActive: true
        },
        {
          text: "Would you be willing to pay a small fee for a premium version of KnowYourPlate with advanced features (like health tracking, meal planning, personalised order suggestions based on your health and fitness goals, etc. )?",
          type: "single_choice",
          options: ["Yes", "Maybe", "No"],
          orderIndex: 15,
          isActive: true
        },
        {
          text: "What frustrates you most about the current restaurant dining or ordering experience?",
          type: "text",
          options: null,
          orderIndex: 16,
          isActive: true
        },
        {
          text: "Would you like to suggest any more features in KnowYourPlate to improve your dining experience at restaurants?",
          type: "text",
          options: null,
          orderIndex: 17,
          isActive: true
        }
      ];

      const batch = writeBatch(db);
      questions.forEach(question => {
        const docRef = doc(collection(db, 'surveyQuestions'));
        batch.set(docRef, question);
      });
      
      await batch.commit();
      console.log('Default survey questions created');
    }

    // Initialize timer settings if not exists
    const timerDoc = await getDoc(doc(db, 'timerSettings', 'main'));
    if (!timerDoc.exists()) {
      await setDoc(doc(db, 'timerSettings', 'main'), {
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isActive: true,
        updatedAt: serverTimestamp()
      });
      console.log('Default timer settings created');
    }

  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Initialize default data when the module is loaded
initializeDefaultData();

export { db };
export default db;
