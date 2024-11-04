import initAccountContainer from "./initAccountContainer.js";



(async () => {
  try {
    const accountContainer = await initAccountContainer();
   const accounts = await accountContainer.getAllAccounts();//ReferenceError: getAllAccounts is not defined
    console.log(accounts);
    process.exit(0); // Exit process after successful execution
  } catch (error) {
    console.error(error);
    process.exit(1); // Exit process with an error code
  }
})();

// This script initializes the account container and retrieves all accounts.
// It logs the accounts to the console and exits the process.
// If there is an error during the execution, it logs the error and exits the process with an error code.
// The script is designed to be run as a standalone script and not as part of a larger application.

