import prisma from "./db";

/**
 * Seeds the database with initial user data and notification preferences.
 *
 * This function:
 * - Creates a user with the provided email, mobile number, and name.
 * - Creates notification preferences for the newly created user with all types enabled (email, sms, whatsapp).
 */
async function seed() {
  // Define the user data to be inserted into the database
  const user = {
    email: process.env.EMAIL || "", // Use environment variable for email or default to an empty string
    mobileNumber: process.env.MOBILE || "", // Use environment variable for mobile number or default to an empty string
    name: "Rishi Singh", // Hardcoded name for the user
  };

  // Create a new user in the database
  const createdUser = await prisma.user.create({
    data: user, // Pass user data to the Prisma client to create the user
  });

  // Create notification preferences for the newly created user
  await prisma.notificationPreferences.create({
    data: {
      userId: createdUser.id, // Link preferences to the newly created user using userId
      email: true, // Enable email notifications
      whatsapp: true, // Enable WhatsApp notifications
      sms: true, // Enable SMS notifications
    },
  });

  // Log a message indicating that the seeding process is complete
  console.log("SEEDING Complete");
}

// Execute the seed function
seed().catch(console.error);
